// @ts-check

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

import { createProcessRunner } from "./process-runner.mjs";
import { failed, passed } from "./result.mjs";

const taskStatePath = "test-results/task-state.json";
const contractPaths = Object.freeze([
  "src/contracts/example-api/openapi.yaml",
  "src/contracts/example-api/generated.ts",
  "src/contracts/example-api/runtime.generated.ts",
  "src/contracts/example-api/provenance.json",
]);

/** @typedef {{ severity: "blocker" | "warning", code: string, message: string, remediation: string }} DoctorFinding */
/** @typedef {{ relativePath: string, source: string }} ActivePlan */

/**
 * @param {{ root?: string, nodeVersion?: string, runProcess?: ReturnType<typeof createProcessRunner>, browserPath?: () => string | null }} [options]
 */
export function runDoctor({
  root = process.cwd(),
  nodeVersion = process.versions.node,
  runProcess = createProcessRunner(),
  browserPath = defaultBrowserPath,
} = {}) {
  /** @type {DoctorFinding[]} */
  const findings = [];
  const requiredNode = readText(path.join(root, ".nvmrc"));
  const packageJson = readJson(path.join(root, "package.json"));
  const requiredPnpm = packageManagerVersion(packageJson?.packageManager);
  const pnpm = runProcess("pnpm", ["--version"], { cwd: root });

  if (!requiredNode || nodeVersion !== requiredNode) {
    findings.push(
      finding(
        "blocker",
        "toolchain.node-version",
        `Node ${nodeVersion} does not match required ${requiredNode ?? "version"}.`,
        "Activate the exact Node version from .nvmrc.",
      ),
    );
  }
  const actualPnpm = pnpm.status === 0 ? pnpm.stdout.trim() : null;
  if (!requiredPnpm || actualPnpm !== requiredPnpm) {
    findings.push(
      finding(
        "blocker",
        "toolchain.pnpm-version",
        "The active pnpm version does not match packageManager.",
        "Activate the exact pnpm version declared in package.json.",
      ),
    );
  }

  const git = runProcess("git", ["rev-parse", "--show-toplevel"], {
    cwd: root,
  });
  if (
    git.status !== 0 ||
    path.resolve(git.stdout.trim()) !== path.resolve(root)
  ) {
    findings.push(
      finding(
        "blocker",
        "repository.worktree",
        "The current directory is not the expected Git worktree root.",
        "Run frontendkit from the repository root.",
      ),
    );
  }

  const activePlans = listActivePlans(root);
  if (activePlans.length !== 1) {
    findings.push(
      finding(
        "blocker",
        "plan.active-count",
        `Expected one active plan and found ${activePlans.length}.`,
        "Keep exactly one valid plan under docs/exec-plans/active/.",
      ),
    );
  }
  const knowledge = runProcess(
    "node",
    ["scripts/harness/check-knowledge.mjs"],
    { cwd: root },
  );
  if (knowledge.status !== 0) {
    findings.push(
      finding(
        "blocker",
        "knowledge.invalid",
        "Repository knowledge validation failed.",
        "Run pnpm knowledge:check directly and repair the reported knowledge boundary.",
      ),
    );
  }

  inspectTaskState({ root, activePlan: activePlans[0], findings });
  inspectIgnorePolicy({ root, runProcess, findings });
  inspectBrowser({ root, activePlan: activePlans[0], browserPath, findings });
  inspectContracts({ root, findings });

  const blockerCount = findings.filter(
    (candidate) => candidate.severity === "blocker",
  ).length;
  const warningCount = findings.length - blockerCount;
  const details = [
    { name: "blockers", value: blockerCount },
    { name: "warnings", value: warningCount },
    ...findings.map((candidate, index) => ({
      name: `finding-${index + 1}`,
      value: `${candidate.severity}:${candidate.code}: ${candidate.message} Remediation: ${candidate.remediation}`,
    })),
  ];

  return blockerCount === 0
    ? passed({
        command: "doctor",
        summary: "Frontendkit doctor found no blockers.",
        details,
      })
    : failed({
        command: "doctor",
        summary: `Frontendkit doctor found ${blockerCount} blocker(s).`,
        details,
      });
}

/** @param {{ root: string, activePlan: ActivePlan | undefined, findings: DoctorFinding[] }} input */
function inspectTaskState({ root, activePlan, findings }) {
  const absolutePath = path.join(root, taskStatePath);
  if (!fs.existsSync(absolutePath)) {
    findings.push(
      finding(
        "warning",
        "task-state.missing",
        "No private task baseline is present.",
        "Run the task begin command before task-owned edits.",
      ),
    );
    return;
  }
  const state = readJson(absolutePath);
  if (
    !state ||
    (state.schemaVersion !== 1 && state.schemaVersion !== 2) ||
    typeof state.activePlan !== "string" ||
    typeof state.planFingerprint !== "string"
  ) {
    findings.push(
      finding(
        "warning",
        "task-state.invalid",
        "Private task state is malformed.",
        "Use task recovery after confirming the state is stale.",
      ),
    );
    return;
  }
  if (state.schemaVersion === 1) {
    findings.push(
      finding(
        "warning",
        "task-state.legacy",
        "Private task state uses the diagnostic-only legacy schema.",
        "Preserve it for diagnosis, then begin a new schema-v2 task baseline.",
      ),
    );
    return;
  }
  if (!activePlan || state.activePlan !== activePlan.relativePath) {
    findings.push(
      finding(
        "warning",
        "task-state.plan-mismatch",
        "Private task state targets a different active plan.",
        "Recover the stale task state or restore its active plan.",
      ),
    );
    return;
  }
  const boundaries = planBoundaries(activePlan.source);
  if (
    !boundaries ||
    state.planFingerprint !== fingerprint(JSON.stringify(boundaries))
  ) {
    findings.push(
      finding(
        "warning",
        "task-state.fingerprint-mismatch",
        "The active-plan fingerprint changed after task begin.",
        "Start a new task baseline after approved plan changes.",
      ),
    );
  }
}

/** @param {string} source */
function planBoundaries(source) {
  const allowedPaths = metadata(source, "Allowed paths");
  const allowedActions = metadata(source, "Allowed actions");
  const maximumRisk = metadata(source, "Maximum risk")?.toLowerCase();
  const repairLimit = Number(metadata(source, "Repair limit"));
  if (
    !allowedPaths ||
    !allowedActions ||
    !maximumRisk ||
    !Number.isInteger(repairLimit)
  ) {
    return null;
  }
  return {
    allowedPaths: allowedPaths
      .split(",")
      .map((value) => value.trim().replaceAll("\\", "/")),
    allowedActions: allowedActions.split(",").map((value) => value.trim()),
    maximumRisk,
    repairLimit,
  };
}

/** @param {string} source @param {string} name */
function metadata(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source
      .match(new RegExp(`^\\*\\*${escaped}:\\*\\*\\s*(.+)$`, "m"))?.[1]
      ?.trim() ?? null
  );
}

/** @param {{ root: string, runProcess: ReturnType<typeof createProcessRunner>, findings: DoctorFinding[] }} input */
function inspectIgnorePolicy({ root, runProcess, findings }) {
  const ignored = runProcess(
    "git",
    ["check-ignore", "--quiet", taskStatePath],
    {
      cwd: root,
    },
  );
  if (ignored.status !== 0) {
    findings.push(
      finding(
        "blocker",
        "task-state.not-ignored",
        "Private task state is not covered by Git ignore policy.",
        "Ignore test-results/ before creating task state.",
      ),
    );
  }
}

/** @param {{ root: string, activePlan: ActivePlan | undefined, browserPath: () => string | null, findings: DoctorFinding[] }} input */
function inspectBrowser({ root, activePlan, browserPath, findings }) {
  if (
    !activePlan ||
    !/\*\*Risk:\*\*\s*(?:medium|high)\s*$/im.test(activePlan.source)
  ) {
    return;
  }
  const executable = browserPath();
  if (!executable || !fs.existsSync(path.resolve(root, executable))) {
    findings.push(
      finding(
        "blocker",
        "runtime.browser-missing",
        "The active plan requires runtime evidence but Chromium is unavailable.",
        "Run pnpm exec playwright install chromium.",
      ),
    );
  }
}

/** @param {{ root: string, findings: DoctorFinding[] }} input */
function inspectContracts({ root, findings }) {
  const missing = contractPaths.filter(
    (relativePath) => !fs.existsSync(path.join(root, relativePath)),
  );
  if (missing.length > 0) {
    findings.push(
      finding(
        "blocker",
        "contract.prerequisite-missing",
        `Contract prerequisites are incomplete (${missing.length} missing).`,
        "Restore the committed contract snapshot and generated artifacts.",
      ),
    );
  }
}

/** @param {string} root @returns {ActivePlan[]} */
function listActivePlans(root) {
  const directory = path.join(root, "docs/exec-plans/active");
  try {
    return fs
      .readdirSync(directory)
      .filter((name) => name.endsWith(".md"))
      .toSorted()
      .map((name) => {
        const relativePath = `docs/exec-plans/active/${name}`;
        return {
          relativePath,
          source: fs.readFileSync(path.join(root, relativePath), "utf8"),
        };
      });
  } catch {
    return [];
  }
}

function defaultBrowserPath() {
  const executable = chromium.executablePath();
  return fs.existsSync(executable) ? executable : null;
}

/** @param {unknown} value */
function packageManagerVersion(value) {
  return typeof value === "string"
    ? (/^pnpm@(.+)$/.exec(value)?.[1] ?? null)
    : null;
}

/** @param {string} filePath */
function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
}

/** @param {string} filePath @returns {Record<string, unknown> | null} */
function readJson(filePath) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

/** @param {string} value */
function fingerprint(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** @param {DoctorFinding["severity"]} severity @param {string} code @param {string} message @param {string} remediation @returns {DoctorFinding} */
function finding(severity, code, message, remediation) {
  return { severity, code, message, remediation };
}
