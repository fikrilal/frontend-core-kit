import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { findScopeViolations } from "./task-boundaries.mjs";

const stateRelativePath = "test-results/task-state.json";

export function initializeTaskState({
  root,
  base,
  revision,
  activePlan,
  changes,
  boundaries,
  now = () => new Date().toISOString(),
}) {
  const statePath = taskStatePath(root);
  if (fs.existsSync(statePath)) {
    throw stateError(
      "task-state-exists",
      "A task baseline already exists for this repository worktree.",
      "Complete or explicitly archive the current task before starting another baseline.",
    );
  }

  const state = {
    schemaVersion: 1,
    startedAt: now(),
    base,
    revision,
    activePlan: activePlan.path,
    planFingerprint: fingerprint(activePlan.source),
    boundaries,
    preexistingChanges: changes,
    failures: [],
  };
  writeState(statePath, state);
  return state;
}

export function readTaskState(root) {
  const statePath = taskStatePath(root);
  if (!fs.existsSync(statePath)) {
    throw stateError(
      "task-state-missing",
      "Task verification requires a task baseline.",
      "Run pnpm task:begin before editing task-owned files.",
    );
  }
  try {
    return validateState(JSON.parse(fs.readFileSync(statePath, "utf8")));
  } catch (error) {
    if (error instanceof TaskStateFailure) throw error;
    throw stateError(
      "task-state-invalid",
      "Task verification found an unreadable task baseline.",
      "Archive the invalid test-results/task-state.json and start the task again.",
    );
  }
}

export function evaluateTaskScope({ root, state, activePlan, changes }) {
  if (state.activePlan !== activePlan.path) {
    throw stateError(
      "task-plan-changed",
      "The active plan does not match the task baseline.",
      "Start a new task baseline after changing the active execution plan.",
    );
  }
  if (state.planFingerprint !== fingerprint(activePlan.source)) {
    throw stateError(
      "task-boundaries-changed",
      "Structured task boundaries changed after the task baseline was captured.",
      "Start a new task baseline after approved boundary changes.",
    );
  }

  const preexistingPaths = new Set(state.preexistingChanges.changedPaths);
  const taskPaths = changes.changedPaths.filter(
    (filePath) => !preexistingPaths.has(filePath),
  );
  const violations = findScopeViolations(
    taskPaths,
    state.boundaries.allowedPaths,
  );
  if (violations.length > 0) {
    throw stateError(
      "scope-violation",
      `Task changes include paths outside the active plan boundary: ${violations.join(", ")}.`,
      "Obtain an approved plan-boundary change before modifying those paths.",
    );
  }

  return {
    preexistingPaths: [...preexistingPaths].toSorted(),
    taskPaths,
    taskFingerprint: fingerprintTaskPaths(root, taskPaths),
  };
}

export function assertRepairBudget(state, scope) {
  const previous = state.failures.at(-1);
  if (
    previous &&
    previous.taskFingerprint === scope.taskFingerprint &&
    previous.repeatCount >= state.boundaries.repairLimit
  ) {
    throw stateError(
      "repair-budget-exhausted",
      "The task reached its repair limit without a meaningful task change.",
      "Change the task evidence meaningfully or request human direction before retrying.",
    );
  }
}

export function recordTaskFailure({
  root,
  state,
  failureCode,
  scope,
  now = () => new Date().toISOString(),
}) {
  const previous = state.failures.at(-1);
  const repeatCount =
    previous &&
    previous.failureCode === failureCode &&
    previous.taskFingerprint === scope.taskFingerprint
      ? previous.repeatCount + 1
      : 1;
  const record = {
    occurredAt: now(),
    failureCode,
    taskFingerprint: scope.taskFingerprint,
    repeatCount,
  };
  state.failures.push(record);
  writeState(taskStatePath(root), state);
  return {
    repeatCount,
    remaining: Math.max(0, state.boundaries.repairLimit - repeatCount),
  };
}

function taskStatePath(root) {
  return path.join(root, stateRelativePath);
}

function stateError(code, invariant, remediation) {
  return new TaskStateFailure({ code, invariant, remediation });
}

export class TaskStateFailure extends Error {
  constructor(failure) {
    super(failure.invariant);
    this.failure = failure;
  }
}

function validateState(state) {
  if (
    !state ||
    state.schemaVersion !== 1 ||
    typeof state.activePlan !== "string" ||
    typeof state.planFingerprint !== "string" ||
    !state.boundaries ||
    !Array.isArray(state.preexistingChanges?.changedPaths) ||
    !Array.isArray(state.failures)
  ) {
    throw stateError(
      "task-state-invalid",
      "Task verification found an invalid task baseline.",
      "Archive the invalid test-results/task-state.json and start the task again.",
    );
  }
  return state;
}

function fingerprintTaskPaths(root, paths) {
  const states = paths.map((filePath) => {
    const absolutePath = path.join(root, filePath);
    try {
      const stats = fs.statSync(absolutePath);
      return [filePath, stats.size, Math.trunc(stats.mtimeMs)];
    } catch {
      return [filePath, "missing"];
    }
  });
  return fingerprint(JSON.stringify(states));
}

function fingerprint(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
