import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { findScopeViolations } from "./task-boundaries.mjs";

const stateRelativePath = "test-results/task-state.json";
const archiveRelativePath = "test-results/task-archive";
const terminalStates = new Set(["handed_off", "escalated", "failed"]);
const transitions = Object.freeze({
  authorized: new Set(["verifying", "failed"]),
  verifying: new Set(["repairing", "ready_for_review", "escalated", "failed"]),
  repairing: new Set(["verifying", "escalated", "failed"]),
  ready_for_review: new Set(["verifying", "handed_off", "failed"]),
  handed_off: new Set(),
  escalated: new Set(),
  failed: new Set(),
});

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
      "Complete or recover the current terminal task before starting another baseline.",
    );
  }

  const occurredAt = now();
  const state = {
    schemaVersion: 2,
    startedAt: occurredAt,
    base,
    revision,
    activePlan: activePlan.path,
    planFingerprint: fingerprintBoundaries(boundaries),
    boundaries,
    preexistingChanges: changes,
    lifecycle: "authorized",
    candidateFingerprint: null,
    candidatePaths: [],
    transitions: [
      transitionRecord({
        from: null,
        to: "authorized",
        reason: "task-begin",
        occurredAt,
        planFingerprint: fingerprintBoundaries(boundaries),
        candidateFingerprint: null,
      }),
    ],
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
      "Preserve the invalid file for diagnosis before manual recovery.",
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
  if (state.planFingerprint !== fingerprintBoundaries(activePlan.boundaries)) {
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
    taskFingerprint: fingerprintCandidate(root, taskPaths),
  };
}

export function beginVerification({ root, state, scope, now }) {
  state.candidateFingerprint = scope.taskFingerprint;
  state.candidatePaths = [...scope.taskPaths];
  return transitionTaskState({
    root,
    state,
    to: "verifying",
    reason: "verification-started",
    candidateFingerprint: scope.taskFingerprint,
    now,
  });
}

export function markReadyForReview({ root, state, scope, now }) {
  return transitionTaskState({
    root,
    state,
    to: "ready_for_review",
    reason: "verification-passed",
    candidateFingerprint: scope.taskFingerprint,
    now,
  });
}

export function assertRepairBudget({ root, state, scope, now }) {
  const previous = state.failures.at(-1);
  if (
    previous &&
    previous.candidateFingerprint === scope.taskFingerprint &&
    previous.repeatCount >= state.boundaries.repairLimit
  ) {
    if (state.lifecycle !== "escalated") {
      transitionTaskState({
        root,
        state,
        to: "escalated",
        reason: "repair-budget-exhausted",
        candidateFingerprint: scope.taskFingerprint,
        now,
      });
    }
    throw stateError(
      "repair-budget-exhausted",
      "The task reached its repair limit without a meaningful content change.",
      "Change the candidate meaningfully or request human direction before recovery.",
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
    previous.candidateFingerprint === scope.taskFingerprint
      ? previous.repeatCount + 1
      : 1;
  state.failures.push({
    occurredAt: now(),
    failureCode,
    candidateFingerprint: scope.taskFingerprint,
    repeatCount,
  });
  transitionTaskState({
    root,
    state,
    to: "repairing",
    reason: failureCode,
    candidateFingerprint: scope.taskFingerprint,
    now,
  });
  return {
    repeatCount,
    remaining: Math.max(0, state.boundaries.repairLimit - repeatCount),
  };
}

export function taskStatus(root) {
  const state = readTaskState(root);
  return {
    lifecycle: state.lifecycle,
    activePlan: state.activePlan,
    repairCount: state.failures.length,
    candidateFingerprint: state.candidateFingerprint,
  };
}

export function completeTaskState({
  root,
  now = () => new Date().toISOString(),
}) {
  const state = readTaskState(root);
  if (state.lifecycle !== "ready_for_review") {
    throw stateError(
      "task-not-ready",
      "Only a verified ready_for_review task can be completed.",
      "Run task verification successfully before task completion.",
    );
  }
  if (
    state.candidateFingerprint !==
    fingerprintCandidate(root, state.candidatePaths)
  ) {
    throw stateError(
      "task-candidate-changed",
      "The verified candidate changed after reaching ready_for_review.",
      "Rerun task verification for the current candidate before completion.",
    );
  }
  transitionTaskState({
    root,
    state,
    to: "handed_off",
    reason: "task-completed",
    candidateFingerprint: state.candidateFingerprint,
    now,
  });
  return archiveTerminalState({ root, state });
}

export function recoverTaskState({
  root,
  now = () => new Date().toISOString(),
}) {
  const state = readTaskState(root);
  if (!terminalStates.has(state.lifecycle)) {
    throw stateError(
      "task-recovery-active",
      "Recovery refuses to archive active or ambiguous task state.",
      "Verify, complete, or explicitly escalate the task before recovery.",
    );
  }
  if (
    state.lifecycle === "escalated" &&
    state.candidateFingerprint ===
      fingerprintCandidate(root, state.candidatePaths)
  ) {
    throw stateError(
      "task-recovery-unchanged",
      "Recovery cannot reset the repair budget for an unchanged candidate.",
      "Make a meaningful candidate change or retain the escalation for human direction.",
    );
  }
  return archiveTerminalState({ root, state, now });
}

function transitionTaskState({
  root,
  state,
  to,
  reason,
  candidateFingerprint,
  now = () => new Date().toISOString(),
}) {
  if (!transitions[state.lifecycle]?.has(to)) {
    throw stateError(
      "task-transition-invalid",
      `Task lifecycle cannot transition from ${state.lifecycle} to ${to}.`,
      "Use only the explicit task lifecycle commands for state changes.",
    );
  }
  const occurredAt = now();
  state.transitions.push(
    transitionRecord({
      from: state.lifecycle,
      to,
      reason,
      occurredAt,
      planFingerprint: state.planFingerprint,
      candidateFingerprint,
    }),
  );
  state.lifecycle = to;
  state.candidateFingerprint = candidateFingerprint;
  writeState(taskStatePath(root), state);
  return state;
}

function archiveTerminalState({ root, state }) {
  if (!terminalStates.has(state.lifecycle)) {
    throw stateError(
      "task-archive-nonterminal",
      "Only exact terminal task state can be archived.",
      "Move the task through an explicit terminal transition first.",
    );
  }
  const directory = path.join(root, archiveRelativePath);
  fs.mkdirSync(directory, { recursive: true });
  const archiveName = `${state.startedAt.replaceAll(":", "-")}-${state.planFingerprint.slice(0, 12)}.json`;
  const archivePath = path.join(directory, archiveName);
  if (fs.existsSync(archivePath)) {
    throw stateError(
      "task-archive-exists",
      "The exact task archive already exists.",
      "Inspect the existing archive before changing task state.",
    );
  }
  writeState(archivePath, state);
  fs.unlinkSync(taskStatePath(root));
  return {
    archivePath: path.relative(root, archivePath).replaceAll("\\", "/"),
    lifecycle: state.lifecycle,
  };
}

function validateState(state) {
  if (state?.schemaVersion === 1) {
    throw stateError(
      "task-state-legacy",
      "Legacy task state is diagnostic-only and cannot be migrated safely.",
      "Preserve it for diagnosis, then begin a new schema-v2 task baseline.",
    );
  }
  if (
    !state ||
    state.schemaVersion !== 2 ||
    typeof state.activePlan !== "string" ||
    typeof state.planFingerprint !== "string" ||
    !Object.hasOwn(transitions, state.lifecycle) ||
    !state.boundaries ||
    !Array.isArray(state.preexistingChanges?.changedPaths) ||
    !Array.isArray(state.candidatePaths) ||
    !Array.isArray(state.transitions) ||
    !Array.isArray(state.failures)
  ) {
    throw stateError(
      "task-state-invalid",
      "Task verification found an invalid task baseline.",
      "Preserve the invalid state for diagnosis before manual recovery.",
    );
  }
  return state;
}

function fingerprintBoundaries(boundaries) {
  return fingerprint(JSON.stringify(boundaries));
}

function fingerprintCandidate(root, paths) {
  const hash = crypto.createHash("sha256");
  for (const filePath of [...paths].toSorted()) {
    hash.update(filePath).update("\0");
    try {
      const contents = fs.readFileSync(path.join(root, filePath));
      hash.update("file\0").update(contents).update("\0");
    } catch {
      hash.update("missing\0");
    }
  }
  return hash.digest("hex");
}

function transitionRecord(input) {
  return input;
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

function fingerprint(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
