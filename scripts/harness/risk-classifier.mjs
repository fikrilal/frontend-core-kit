import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const riskOrder = Object.freeze({ low: 0, medium: 1, high: 2 });
const validRisks = new Set(Object.keys(riskOrder));

const highRiskRules = [
  rule("CI or automation policy", (file) => file.startsWith(".github/")),
  rule("harness implementation", (file) => file.startsWith("scripts/harness/")),
  rule("API contract", (file) => file.startsWith("src/contracts/")),
  rule("contract tooling", (file) => file.startsWith("scripts/contracts/")),
  rule("authentication", (file) => file.startsWith("src/features/auth/")),
  rule("authentication route", (file) => /^src\/app\/\(auth/.test(file)),
  rule("authenticated route", (file) =>
    /^src\/app\/\(authenticated/.test(file),
  ),
  rule("server boundary", (file) => file.startsWith("src/server/")),
  rule(
    "dependency or runtime lock",
    (file) =>
      file === "package.json" ||
      file === "pnpm-lock.yaml" ||
      file === "pnpm-workspace.yaml" ||
      file === ".nvmrc",
  ),
  rule(
    "environment or deployment configuration",
    (file) =>
      /^\.env(?:\.|$)/.test(file) ||
      /(?:^|\/)(?:Dockerfile|compose\.ya?ml)$/.test(file) ||
      file.startsWith("infra/") ||
      file.startsWith("deploy/") ||
      file === "next.config.ts" ||
      file === "next.config.mjs",
  ),
];

const mediumRiskRules = [
  rule("application source", (file) => file.startsWith("src/")),
  rule("browser behavior", (file) => file.startsWith("tests/")),
  rule("repository script", (file) => file.startsWith("scripts/")),
  rule("public asset", (file) => file.startsWith("public/")),
  rule(
    "build or test configuration",
    (file) =>
      /^(?:eslint|playwright|postcss|prettier|tailwind|tsconfig|vitest)(?:\.|$)/.test(
        file,
      ) || file === "components.json",
  ),
  rule("agent policy", (file) => file === "AGENTS.md"),
];

const lowRiskRules = [
  rule("documentation", (file) => file.startsWith("docs/")),
  rule("repository documentation", (file) => file === "README.md"),
  rule("repository metadata", (file) => file === ".gitignore"),
];

export function classifyRisk({ changedPaths, planDocuments = [] }) {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) {
    throw new Error(
      "No changed paths were provided; risk cannot be classified.",
    );
  }

  const normalizedPaths = [
    ...new Set(changedPaths.map(normalizePath)),
  ].toSorted();
  const pathResults = normalizedPaths.map(classifyPath);
  const pathRisk = maximumRisk(pathResults.map((result) => result.risk));
  const declared = declaredPlanRisk(normalizedPaths, planDocuments);
  const risk = maximumRisk([pathRisk, declared.risk].filter(Boolean));
  const allReasons = [...pathResults, ...declared.reasons];

  return {
    risk,
    pathRisk,
    declaredRisk: declared.risk,
    changedPaths: normalizedPaths,
    reasons: allReasons.filter((reason) => reason.risk === risk),
  };
}

export function evaluateRequiredCi({
  risk,
  riskResult,
  verifyResult,
  runtimeResult,
}) {
  if (!validRisks.has(risk)) {
    return { passed: false, reason: `invalid effective risk "${risk}"` };
  }
  if (riskResult !== "success") {
    return { passed: false, reason: `risk job was ${riskResult}` };
  }
  if (verifyResult !== "success") {
    return { passed: false, reason: `verify job was ${verifyResult}` };
  }
  if (risk === "low" && runtimeResult !== "skipped") {
    return {
      passed: false,
      reason: `low-risk runtime job must be skipped, received ${runtimeResult}`,
    };
  }
  if (risk !== "low" && runtimeResult !== "success") {
    return { passed: false, reason: `runtime job was ${runtimeResult}` };
  }
  return { passed: true, reason: "all required CI jobs passed" };
}

export function classifyPath(filePath) {
  const normalized = normalizePath(filePath);
  for (const [risk, rules] of [
    ["high", highRiskRules],
    ["medium", mediumRiskRules],
    ["low", lowRiskRules],
  ]) {
    const matched = rules.find((candidate) => candidate.matches(normalized));
    if (matched) {
      return { path: normalized, risk, rule: matched.name };
    }
  }

  return { path: normalized, risk: "medium", rule: "unknown path" };
}

export function gitChangedPaths({ root, base, head }) {
  validateRevision(base, "base");
  validateRevision(head, "head");

  const allZeroBase = /^0+$/.test(base);
  const args = allZeroBase
    ? ["ls-tree", "-r", "--name-only", "-z", head]
    : ["diff", "--name-only", "--diff-filter=ACMRDT", "-z", base, head, "--"];
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "buffer",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const message = result.stderr.toString("utf8").trim();
    throw new Error(
      `Unable to determine changed paths for ${base}..${head}: ${message || "git failed without diagnostics"}`,
    );
  }

  return result.stdout.toString("utf8").split("\0").filter(Boolean);
}

export function loadChangedPlanDocuments(root, changedPaths) {
  const planPaths = changedPaths.filter((file) =>
    /^docs\/exec-plans\/(?:active|queued|completed)\/[^/]+\.md$/.test(file),
  );
  const documents = planPaths.flatMap((file) => {
    const absolutePath = path.join(root, file);
    return fs.existsSync(absolutePath)
      ? [{ path: file, source: fs.readFileSync(absolutePath, "utf8") }]
      : [];
  });

  if (planPaths.length > 0 && documents.length === 0) {
    throw new Error(
      "Changed execution plans are missing at the target revision; retain a v1 plan that declares risk.",
    );
  }

  return documents;
}

export function formatRiskSummary(classification) {
  const declaredRisk = classification.declaredRisk ?? "none";
  const reasons = classification.reasons
    .slice(0, 20)
    .map(
      (reason) =>
        `| \`${escapeMarkdown(reason.path)}\` | ${reason.risk} | ${escapeMarkdown(reason.rule)} |`,
    )
    .join("\n");

  return `## CI risk classification

| Effective | Path-derived | Plan-declared | Changed paths |
| --------- | ------------ | ------------- | ------------: |
| ${classification.risk} | ${classification.pathRisk} | ${declaredRisk} | ${classification.changedPaths.length} |

### Reasons at the controlling risk

| Source | Risk | Rule |
| ------ | ---- | ---- |
${reasons}
`;
}

function declaredPlanRisk(changedPaths, planDocuments) {
  const changedPlanPaths = new Set(
    changedPaths.filter((file) =>
      /^docs\/exec-plans\/(?:active|queued|completed)\/[^/]+\.md$/.test(file),
    ),
  );
  const relevantDocuments = planDocuments.filter((document) =>
    changedPlanPaths.has(normalizePath(document.path)),
  );

  if (changedPlanPaths.size > 0 && relevantDocuments.length === 0) {
    throw new Error(
      "A changed execution plan must exist at the target revision and declare v1 risk metadata.",
    );
  }

  const reasons = relevantDocuments.map((document) => {
    const planPath = normalizePath(document.path);
    const version = metadataValue(document.source, "Plan version");
    const risk = metadataValue(document.source, "Risk")?.toLowerCase();
    if (version !== "1") {
      throw new Error(
        `${planPath} must declare "**Plan version:** 1" for risk classification.`,
      );
    }
    if (!risk || !validRisks.has(risk)) {
      throw new Error(
        `${planPath} must declare a valid "**Risk:**" value: low, medium, or high.`,
      );
    }
    return { path: planPath, risk, rule: "execution-plan declaration" };
  });

  return {
    risk:
      reasons.length > 0
        ? maximumRisk(reasons.map((reason) => reason.risk))
        : null,
    reasons,
  };
}

function normalizePath(filePath) {
  if (typeof filePath !== "string" || filePath.trim().length === 0) {
    throw new Error("Changed paths must be non-empty strings.");
  }
  const normalized = filePath.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    path.posix.isAbsolute(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(
      `Changed path must stay inside the repository: "${filePath}".`,
    );
  }
  return normalized;
}

function validateRevision(revision, label) {
  if (
    typeof revision !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._~^/-]*$/.test(revision)
  ) {
    throw new Error(`Invalid ${label} revision "${String(revision)}".`);
  }
}

function maximumRisk(risks) {
  return risks.reduce((highest, risk) =>
    riskOrder[risk] > riskOrder[highest] ? risk : highest,
  );
}

function metadataValue(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source
      .match(new RegExp(`^\\*\\*${escapedName}:\\*\\*\\s*(.+)$`, "m"))?.[1]
      ?.trim() ?? null
  );
}

function rule(name, matches) {
  return { name, matches };
}

function escapeMarkdown(value) {
  return value.replaceAll("|", "\\|").replaceAll("`", "\\`");
}
