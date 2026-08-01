import fs from "node:fs";
import path from "node:path";

const planFolders = ["active", "queued", "completed"];
const requiredPlanSections = [
  "Objective",
  "Current Evidence",
  "Decisions And Invariants",
  "Non-Goals",
  "Acceptance Scenarios",
  "Risk And Authority",
  "Impact Areas",
  "Verification Matrix",
  "Checklist",
  "Rollout And Rollback",
  "Decision And Deviation Log",
  "Verification",
  "Runtime Evidence",
  "Follow-Up Debt",
];
const validRisks = new Set(["low", "medium", "high"]);
const legacyCompletedPlans = new Set([
  "2026-07-28_api-contract-foundation.md",
  "2026-07-28_password-login-api-client.md",
  "2026-07-29_generated-runtime-contracts-node24.md",
  "2026-07-30_generic-auth-session-foundation.md",
]);

export function collectKnowledgeViolations(root) {
  return [
    ...checkMarkdownLinks(root),
    ...checkExecutionPlans(root),
    ...checkPlanningIndex(root),
  ].toSorted();
}

function checkMarkdownLinks(root) {
  const docsRoot = path.join(root, "docs");
  if (!fs.existsSync(docsRoot)) {
    return [
      "docs/ is missing; repository knowledge has no source-of-truth root.",
    ];
  }

  const violations = [];
  for (const filePath of markdownFiles(docsRoot)) {
    const source = fs.readFileSync(filePath, "utf8");
    const searchable = stripFencedCode(source);
    const relativeFile = relative(root, filePath);

    for (const match of searchable.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g)) {
      const target = normalizeLinkTarget(match[1]);
      if (!target || isExternalTarget(target)) continue;

      const targetWithoutFragment = target.split(/[?#]/, 1)[0];
      if (!targetWithoutFragment) continue;

      let decodedTarget;
      try {
        decodedTarget = decodeURIComponent(targetWithoutFragment);
      } catch {
        violations.push(
          `${relativeFile}:${lineNumber(searchable, match.index)} has an invalid encoded link target "${target}".`,
        );
        continue;
      }

      const resolved = path.resolve(path.dirname(filePath), decodedTarget);
      if (!isWithinRoot(root, resolved) || !fs.existsSync(resolved)) {
        violations.push(
          `${relativeFile}:${lineNumber(searchable, match.index)} links to missing local target "${target}". Update or remove the link.`,
        );
      }
    }
  }

  return violations;
}

function checkExecutionPlans(root) {
  const plansRoot = path.join(root, "docs/exec-plans");
  const violations = [];

  for (const folder of planFolders) {
    const directory = path.join(plansRoot, folder);
    if (!fs.existsSync(directory)) {
      violations.push(
        `docs/exec-plans/${folder}/ is missing. Restore the execution-plan lifecycle folder.`,
      );
      continue;
    }

    for (const filePath of directMarkdownFiles(directory)) {
      const source = fs.readFileSync(filePath, "utf8");
      const relativeFile = relative(root, filePath);

      if (folder === "completed" && /^- \[ \]/m.test(source)) {
        violations.push(
          `${relativeFile} is completed but contains an unresolved required checkbox. Complete it or move the plan out of completed/.`,
        );
      }

      const version = metadataValue(source, "Plan version");
      if (version === null) {
        if (
          folder !== "completed" ||
          !legacyCompletedPlans.has(path.basename(filePath))
        ) {
          violations.push(
            `${relativeFile} is missing required metadata "**Plan version:**". Copy the current execution-plan template.`,
          );
        }
        continue;
      }

      if (version !== "1") {
        violations.push(
          `${relativeFile} declares unsupported plan version "${version}"; expected "1".`,
        );
        continue;
      }

      validateV1Plan({ folder, relativeFile, source, violations });
    }
  }

  return violations;
}

function validateV1Plan({ folder, relativeFile, source, violations }) {
  const status = requiredMetadata(source, "Status", relativeFile, violations);
  const owner = requiredMetadata(source, "Owner", relativeFile, violations);
  const risk = requiredMetadata(source, "Risk", relativeFile, violations);
  const authority = requiredMetadata(
    source,
    "Authority",
    relativeFile,
    violations,
  );

  if (status && status !== folder) {
    violations.push(
      `${relativeFile} declares status "${status}" but lives in ${folder}/; make the status and folder agree.`,
    );
  }
  if (risk && !validRisks.has(risk)) {
    violations.push(
      `${relativeFile} declares invalid risk "${risk}"; expected low, medium, or high.`,
    );
  }
  if (owner && isPlaceholder(owner)) {
    violations.push(
      `${relativeFile} has placeholder owner "${owner}"; assign an accountable owner.`,
    );
  }
  if (authority && isPlaceholder(authority)) {
    violations.push(
      `${relativeFile} has placeholder authority "${authority}"; state the permitted actions explicitly.`,
    );
  }

  const headings = new Set(
    Array.from(source.matchAll(/^## ([^\n]+)$/gm), (match) => match[1].trim()),
  );
  for (const section of requiredPlanSections) {
    if (!headings.has(section)) {
      violations.push(
        `${relativeFile} is missing required section "## ${section}". Copy the current execution-plan template.`,
      );
    } else if (!sectionContents(source, section).trim()) {
      violations.push(
        `${relativeFile} has an empty required section "## ${section}". Record the applicable intent or evidence.`,
      );
    }
  }

  if (
    folder === "completed" &&
    /\b(?:not run yet|pending|not required yet)\b/i.test(
      sections(source, ["Verification", "Runtime Evidence"]),
    )
  ) {
    violations.push(
      `${relativeFile} is completed but verification evidence still contains a placeholder. Record the outcome or move the plan out of completed/.`,
    );
  }
}

function checkPlanningIndex(root) {
  const planningRoot = path.join(root, "docs/planning");
  const indexPath = path.join(planningRoot, "README.md");
  if (!fs.existsSync(planningRoot)) return [];
  if (!fs.existsSync(indexPath)) {
    return ["docs/planning/README.md is missing; proposals must be indexed."];
  }

  const index = fs.readFileSync(indexPath, "utf8");
  const violations = [];
  for (const filePath of directMarkdownFiles(planningRoot)) {
    if (path.basename(filePath) === "README.md") continue;
    const fileName = path.basename(filePath);
    if (!index.includes(`(${fileName})`)) {
      violations.push(
        `docs/planning/${fileName} is not linked from docs/planning/README.md. Add it under the correct proposal status.`,
      );
    }
  }
  return violations;
}

function requiredMetadata(source, name, relativeFile, violations) {
  const value = metadataValue(source, name);
  if (value === null || value.length === 0) {
    violations.push(
      `${relativeFile} is missing required metadata "**${name}:**". Copy the current execution-plan template.`,
    );
    return null;
  }
  return value;
}

function metadataValue(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(
    new RegExp(`^\\*\\*${escapedName}:\\*\\*\\s*(.+)$`, "m"),
  );
  return match?.[1]?.trim() ?? null;
}

function sections(source, names) {
  const wanted = new Set(names);
  return source
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const newline = section.indexOf("\n");
      const heading = (
        newline === -1 ? section : section.slice(0, newline)
      ).trim();
      return wanted.has(heading) ? section.slice(newline + 1) : "";
    })
    .filter(Boolean)
    .join("\n");
}

function sectionContents(source, name) {
  return sections(source, [name]);
}

function isPlaceholder(value) {
  return /^(?:tbd|todo|none|unassigned|unknown|pending)$/i.test(value.trim());
}

function normalizeLinkTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed.split(/\s+["']/u, 1)[0];
}

function isExternalTarget(target) {
  return (
    target.startsWith("#") ||
    target.startsWith("/") ||
    /^[a-z][a-z\d+.-]*:/i.test(target)
  );
}

function isWithinRoot(root, target) {
  const relativeTarget = path.relative(root, target);
  return (
    relativeTarget === "" ||
    (!relativeTarget.startsWith(`..${path.sep}`) && relativeTarget !== "..")
  );
}

function stripFencedCode(source) {
  return source.replace(/^```[\s\S]*?^```\s*$/gm, "");
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function directMarkdownFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(directory, entry.name))
    .toSorted();
}

function* markdownFiles(directory) {
  for (const entry of fs
    .readdirSync(directory, { withFileTypes: true })
    .toSorted((left, right) => left.name.localeCompare(right.name))) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* markdownFiles(filePath);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield filePath;
    }
  }
}

function relative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}
