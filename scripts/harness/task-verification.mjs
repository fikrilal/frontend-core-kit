import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

import { collectKnowledgeViolations } from "./knowledge-tools.mjs";
import { classifyRisk, loadChangedPlanDocuments } from "./risk-classifier.mjs";
import {
  assertActionAllowed,
  assertRiskAllowed,
  parseTaskBoundaries,
} from "./task-boundaries.mjs";
import {
  assertRepairBudget,
  evaluateTaskScope,
  initializeTaskState,
  readTaskState,
  recordTaskFailure,
} from "./task-state.mjs";

const validRisks = new Set(["low", "medium", "high"]);

export function parseTaskVerificationArguments(args) {
  const options = { base: "HEAD", summaryPath: null };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") continue;
    if (!["--base", "--summary"].includes(argument)) {
      throw taskError(
        "invalid-arguments",
        "Task verification arguments are invalid.",
        'Use only "--base <revision>" and "--summary <ignored-path>".',
      );
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw taskError(
        "invalid-arguments",
        `Task verification requires a value for ${argument}.`,
        `Provide a value after ${argument}.`,
      );
    }
    if (argument === "--base") options.base = value;
    if (argument === "--summary") options.summaryPath = value;
    index += 1;
  }

  return options;
}

export function runTaskVerification({
  root,
  base = "HEAD",
  summaryPath = null,
  nodeVersion = process.versions.node,
  pnpmVersion = readPnpmVersion,
  browserPath = defaultBrowserPath,
  execute = executeCommand,
  now = () => Date.now(),
}) {
  const startedAt = now();
  const summary = createSummary({ base });

  try {
    validateRuntime({ root, nodeVersion, pnpmVersion });
    validateKnowledge(root);
    const changes = discoverTaskChanges({ root, base, execute });
    const activePlan = loadActivePlan(root);
    assertActionAllowed(activePlan.boundaries, "verify");
    const classification = classifyRisk({
      changedPaths: changes.changedPaths,
      planDocuments: loadChangedPlanDocuments(root, changes.changedPaths),
      activePlanDocument: activePlan,
    });
    assertRiskAllowed(activePlan.boundaries, classification.risk);
    const lanes = selectVerificationLanes(classification.risk);
    const state = readTaskState(root);
    const scope = evaluateTaskScope({ root, state, activePlan, changes });
    assertRepairBudget(state, scope);

    summary.status = "running";
    summary.risk = classification;
    summary.activePlan = activePlan.path;
    summary.changes = changes;
    summary.scope = scope;
    summary.lanes = [];

    validateBrowserIfRequired({ risk: classification.risk, browserPath });

    for (const lane of lanes) {
      const laneStartedAt = now();
      const result = execute(lane.command, lane.args, { cwd: root });
      const laneSummary = {
        id: lane.id,
        command: formatCommand(lane.command, lane.args),
        durationMs: Math.max(0, now() - laneStartedAt),
        status: result.status === 0 ? "passed" : "failed",
      };
      summary.lanes.push(laneSummary);

      if (result.status !== 0) {
        const failure = taskError(
          `lane-${lane.id}-failed`,
          `${lane.label} failed.`,
          `Run ${laneSummary.command} directly, repair the reported invariant, then rerun task verification.`,
        );
        summary.repair = recordTaskFailure({
          root,
          state,
          failureCode: failure.failure.code,
          scope,
        });
        throw failure;
      }
    }

    summary.status = "passed";
    summary.durationMs = Math.max(0, now() - startedAt);
    writeSummaryIfRequested(root, summaryPath, summary);
    return summary;
  } catch (error) {
    const normalized = normalizeTaskError(error);
    summary.status = "failed";
    summary.durationMs = Math.max(0, now() - startedAt);
    summary.failure = normalized;
    writeSummaryIfRequested(root, summaryPath, summary);
    throw new TaskVerificationFailure(normalized, summary);
  }
}

export function beginTask({
  root,
  base = "HEAD",
  nodeVersion = process.versions.node,
  pnpmVersion = readPnpmVersion,
  execute = executeCommand,
  now = () => new Date().toISOString(),
}) {
  validateRuntime({ root, nodeVersion, pnpmVersion });
  validateKnowledge(root);
  const changes = discoverTaskChanges({
    root,
    base,
    execute,
    allowEmpty: true,
  });
  const activePlan = loadActivePlan(root);
  assertActionAllowed(activePlan.boundaries, "verify");
  const classificationPaths =
    changes.changedPaths.length > 0 ? changes.changedPaths : [activePlan.path];
  const classification = classifyRisk({
    changedPaths: classificationPaths,
    planDocuments: loadChangedPlanDocuments(root, [
      ...changes.changedPaths,
      activePlan.path,
    ]),
    activePlanDocument: activePlan,
  });
  assertRiskAllowed(activePlan.boundaries, classification.risk);
  const revision = resolveRevision({ root, revision: "HEAD", execute });
  const state = initializeTaskState({
    root,
    base,
    revision,
    activePlan,
    changes,
    boundaries: activePlan.boundaries,
    now,
  });

  return {
    activePlan: activePlan.path,
    preexistingPathCount: changes.changedPaths.length,
    risk: classification.risk,
    startedAt: state.startedAt,
  };
}

export function discoverTaskChanges({
  root,
  base,
  execute = executeCommand,
  allowEmpty = false,
}) {
  validateRevision(base, "base");
  verifyRepository({ root, execute });
  verifyRevision({ root, revision: base, label: "base", execute });
  ensureNoMergeConflicts({ root, execute });

  const groups = {
    committed: gitPaths({
      root,
      args: [
        "diff",
        "--name-only",
        "--diff-filter=ACMRDT",
        "-z",
        base,
        "HEAD",
        "--",
      ],
      execute,
    }),
    staged: gitPaths({
      root,
      args: [
        "diff",
        "--cached",
        "--name-only",
        "--diff-filter=ACMRDT",
        "-z",
        "HEAD",
        "--",
      ],
      execute,
    }),
    unstaged: gitPaths({
      root,
      args: ["diff", "--name-only", "--diff-filter=ACMRDT", "-z", "--"],
      execute,
    }),
    untracked: gitPaths({
      root,
      args: ["ls-files", "--others", "--exclude-standard", "-z"],
      execute,
    }),
  };

  const changedPaths = Object.values(groups).flat().toSorted();
  const uniquePaths = [...new Set(changedPaths)].toSorted();
  if (!allowEmpty && uniquePaths.length === 0) {
    throw taskError(
      "no-changes",
      "Task verification found no changed paths.",
      "Make a task change or provide --base for committed task history.",
    );
  }

  return { ...groups, changedPaths: uniquePaths };
}

export function selectVerificationLanes(risk) {
  if (!validRisks.has(risk)) {
    throw taskError(
      "invalid-risk",
      "Task verification could not determine a valid risk level.",
      "Fix the execution plan risk metadata and changed-path classification.",
    );
  }
  if (risk === "low") {
    return [
      lane("fast", "Fast deterministic verification", "pnpm", ["verify:fast"]),
    ];
  }
  return [
    lane("full", "Full deterministic verification", "pnpm", ["verify"]),
    lane("runtime", "Browser runtime verification", "pnpm", ["verify:runtime"]),
  ];
}

function loadActivePlan(root) {
  const directory = path.join(root, "docs/exec-plans/active");
  if (!fs.existsSync(directory)) {
    throw taskError(
      "missing-active-plan",
      "Task verification requires an active execution plan.",
      "Move the approved task plan into docs/exec-plans/active/ before running verification.",
    );
  }

  const plans = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .toSorted();

  if (plans.length !== 1) {
    throw taskError(
      "active-plan-count",
      "Task verification requires exactly one active execution plan.",
      "Keep one current task plan in docs/exec-plans/active/ and move other plans to queued/ or completed/.",
    );
  }

  const relativePath = `docs/exec-plans/active/${plans[0]}`;
  const source = fs.readFileSync(path.join(directory, plans[0]), "utf8");
  const version = metadataValue(source, "Plan version");
  const status = metadataValue(source, "Status");
  const risk = metadataValue(source, "Risk")?.toLowerCase();

  if (
    version !== "2" ||
    status !== "active" ||
    !risk ||
    !validRisks.has(risk)
  ) {
    throw taskError(
      "invalid-active-plan",
      "The active execution plan has invalid lifecycle or risk metadata.",
      "Run pnpm knowledge:check and correct the active plan before task verification.",
    );
  }

  return {
    path: relativePath,
    source,
    boundaries: parseTaskBoundaries(source),
  };
}

export function validateRuntime({ root, nodeVersion, pnpmVersion }) {
  const requiredNode = fs
    .readFileSync(path.join(root, ".nvmrc"), "utf8")
    .trim();
  const packageManager = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  ).packageManager;
  const requiredPnpm = parsePnpmVersion(packageManager);

  if (nodeVersion !== requiredNode) {
    throw taskError(
      "node-version",
      "The active Node.js runtime does not match the repository requirement.",
      `Use Node ${requiredNode}, then rerun task verification.`,
    );
  }
  if (pnpmVersion() !== requiredPnpm) {
    throw taskError(
      "pnpm-version",
      "The active pnpm version does not match the repository requirement.",
      `Use pnpm ${requiredPnpm}, then rerun task verification.`,
    );
  }
}

function validateKnowledge(root) {
  if (collectKnowledgeViolations(root).length > 0) {
    throw taskError(
      "knowledge",
      "Repository knowledge or execution-plan lifecycle is invalid.",
      "Run pnpm knowledge:check and correct the reported documentation before task verification.",
    );
  }
}

function validateBrowserIfRequired({ risk, browserPath }) {
  if (risk === "low") return;
  if (!browserPath()) {
    throw taskError(
      "browser-missing",
      "Browser runtime verification requires installed Chromium.",
      "Run pnpm exec playwright install chromium, then rerun task verification.",
    );
  }
}

function verifyRepository({ root, execute }) {
  const result = execute("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: root,
  });
  if (result.status !== 0 || result.stdout.trim() !== "true") {
    throw taskError(
      "git-repository",
      "Task verification must run inside a Git worktree.",
      "Run the command from the Lamara repository checkout.",
    );
  }
}

function verifyRevision({ root, revision, label, execute }) {
  const result = revisionResult({ root, revision, execute });
  if (result.status !== 0) {
    throw taskError(
      "git-revision",
      `Task verification could not resolve the ${label} revision.`,
      `Provide a valid Git revision with --${label}.`,
    );
  }
}

function resolveRevision({ root, revision, execute }) {
  const result = revisionResult({ root, revision, execute });
  if (result.status !== 0) {
    throw taskError(
      "git-revision",
      "Task verification could not resolve the current revision.",
      "Resolve the Git worktree state and rerun task verification.",
    );
  }
  return result.stdout.trim();
}

function revisionResult({ root, revision, execute }) {
  return execute("git", ["rev-parse", "--verify", `${revision}^{commit}`], {
    cwd: root,
  });
}

function ensureNoMergeConflicts({ root, execute }) {
  const result = execute("git", ["ls-files", "-u", "-z"], { cwd: root });
  if (result.status !== 0) {
    throw taskError(
      "git-status",
      "Task verification could not inspect Git conflict state.",
      "Resolve the Git worktree state, then rerun task verification.",
    );
  }
  if (result.stdout.length > 0) {
    throw taskError(
      "git-conflict",
      "Task verification cannot run with unresolved merge conflicts.",
      "Resolve conflicts first, then rerun task verification.",
    );
  }
}

function gitPaths({ root, args, execute }) {
  const result = execute("git", args, { cwd: root });
  if (result.status !== 0) {
    throw taskError(
      "git-changes",
      "Task verification could not discover the complete change set.",
      "Resolve the Git worktree state and rerun task verification.",
    );
  }
  return result.stdout
    .split("\0")
    .filter(Boolean)
    .map(normalizePath)
    .toSorted();
}

function writeSummaryIfRequested(root, summaryPath, summary) {
  if (!summaryPath) return;
  const absolutePath = resolveSummaryPath(root, summaryPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(
    absolutePath,
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
}

function resolveSummaryPath(root, summaryPath) {
  const resolved = path.resolve(root, summaryPath);
  const relative = path.relative(root, resolved);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative) ||
    !relative.startsWith(`test-results${path.sep}`)
  ) {
    throw taskError(
      "summary-path",
      "Task verification summary path must stay inside the repository.",
      "Write summaries under the ignored test-results/ directory.",
    );
  }
  return resolved;
}

function createSummary({ base }) {
  return {
    schemaVersion: 1,
    status: "preflight",
    base,
    activePlan: null,
    risk: null,
    changes: null,
    scope: null,
    lanes: [],
    repair: null,
    failure: null,
    durationMs: 0,
  };
}

function lane(id, label, command, args) {
  return { id, label, command, args };
}

function executeCommand(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    stdio: "pipe",
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
  };
}

function readPnpmVersion() {
  const result = executeCommand("pnpm", ["--version"], { cwd: process.cwd() });
  return result.status === 0 ? result.stdout.trim() : "";
}

function defaultBrowserPath() {
  const executablePath = chromium.executablePath();
  return fs.existsSync(executablePath) ? executablePath : null;
}

function parsePnpmVersion(packageManager) {
  const match =
    typeof packageManager === "string"
      ? /^pnpm@(.+)$/.exec(packageManager)
      : null;
  if (!match) {
    throw taskError(
      "package-manager",
      "The repository does not declare a valid pnpm packageManager version.",
      "Set packageManager to the approved pnpm version before task verification.",
    );
  }
  return match[1];
}

function validateRevision(revision, label) {
  if (
    typeof revision !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._~^/-]*$/.test(revision)
  ) {
    throw taskError(
      "git-revision",
      `Task verification received an invalid ${label} revision.`,
      `Provide a valid Git revision with --${label}.`,
    );
  }
}

function normalizePath(filePath) {
  const normalized = filePath.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    !normalized ||
    path.posix.isAbsolute(normalized) ||
    normalized.split("/").includes("..")
  ) {
    throw taskError(
      "git-path",
      "Task verification found an invalid repository path.",
      "Resolve the Git worktree path state before retrying.",
    );
  }
  return normalized;
}

function metadataValue(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source
      .match(new RegExp(`^\\*\\*${escapedName}:\\*\\*\\s*(.+)$`, "m"))?.[1]
      ?.trim() ?? null
  );
}

function formatCommand(command, args) {
  return [command, ...args].join(" ");
}

function normalizeTaskError(error) {
  if (error instanceof TaskVerificationFailure) return error.failure;
  if (error && typeof error === "object" && "failure" in error) {
    return error.failure;
  }
  return {
    code: "unexpected",
    invariant: "Task verification encountered an unexpected local failure.",
    remediation:
      "Inspect the task verifier implementation and rerun the relevant gate directly.",
  };
}

function taskError(code, invariant, remediation) {
  return new TaskVerificationFailure({ code, invariant, remediation });
}

export class TaskVerificationFailure extends Error {
  constructor(failure, summary = null) {
    super(failure.invariant);
    this.failure = failure;
    this.summary = summary;
  }
}
