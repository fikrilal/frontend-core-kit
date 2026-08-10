import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertRepairBudget,
  beginVerification,
  completeTaskState,
  evaluateTaskScope,
  initializeTaskState,
  markReadyForReview,
  readTaskState,
  recordTaskFailure,
  recoverTaskState,
  TaskStateFailure,
} from "./task-state.mjs";

test("preserves pre-existing paths while rejecting new scope violations", () => {
  const root = createRoot();
  try {
    write(root, "docs/pre-existing.md", "before\n");
    const activePlan = plan();
    const state = initializeTaskState({
      root,
      base: "HEAD",
      revision: "revision",
      activePlan,
      changes: changes(["docs/pre-existing.md"]),
      boundaries: boundaries(),
      now: () => "2026-08-01T00:00:00.000Z",
    });
    write(root, "src/outside.ts", "new\n");

    assert.throws(
      () =>
        evaluateTaskScope({
          root,
          state,
          activePlan,
          changes: changes(["docs/pre-existing.md", "src/outside.ts"]),
        }),
      failureWithCode("scope-violation"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stops repeated unchanged failures at the configured repair limit", () => {
  const root = createRoot();
  try {
    write(root, "docs/task.md", "task\n");
    const activePlan = plan();
    const state = initializeTaskState({
      root,
      base: "HEAD",
      revision: "revision",
      activePlan,
      changes: changes([]),
      boundaries: boundaries(),
    });
    const scope = evaluateTaskScope({
      root,
      state,
      activePlan,
      changes: changes(["docs/task.md"]),
    });

    beginVerification({ root, state, scope });

    assert.deepEqual(
      recordTaskFailure({
        root,
        state,
        failureCode: "lane-full-failed",
        scope,
      }),
      { repeatCount: 1, remaining: 1 },
    );
    beginVerification({ root, state, scope });
    assert.deepEqual(
      recordTaskFailure({
        root,
        state,
        failureCode: "lane-full-failed",
        scope,
      }),
      { repeatCount: 2, remaining: 0 },
    );
    assert.throws(
      () => assertRepairBudget({ root, state, scope }),
      failureWithCode("repair-budget-exhausted"),
    );
    assert.equal(readTaskState(root).lifecycle, "escalated");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("allows plan progress edits but stops structured boundary changes", () => {
  const root = createRoot();
  try {
    const activePlan = plan();
    const state = initializeTaskState({
      root,
      base: "HEAD",
      revision: "revision",
      activePlan,
      changes: changes([]),
      boundaries: boundaries(),
    });

    assert.doesNotThrow(() =>
      evaluateTaskScope({
        root,
        state,
        activePlan: { ...activePlan, source: `${activePlan.source}\nChanged.` },
        changes: changes([]),
      }),
    );
    assert.throws(
      () =>
        evaluateTaskScope({
          root,
          state,
          activePlan: {
            ...activePlan,
            boundaries: { ...activePlan.boundaries, allowedPaths: ["src/"] },
          },
          changes: changes([]),
        }),
      failureWithCode("task-boundaries-changed"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("candidate identity uses contents rather than mtimes", () => {
  const root = createRoot();
  try {
    write(root, "docs/task.md", "same\n");
    const activePlan = plan();
    const state = initializeTaskState({
      root,
      base: "HEAD",
      revision: "revision",
      activePlan,
      changes: changes([]),
      boundaries: boundaries(),
    });
    const first = evaluateTaskScope({
      root,
      state,
      activePlan,
      changes: changes(["docs/task.md"]),
    });
    fs.utimesSync(path.join(root, "docs/task.md"), new Date(), new Date());
    const touched = evaluateTaskScope({
      root,
      state,
      activePlan,
      changes: changes(["docs/task.md"]),
    });
    write(root, "docs/task.md", "changed\n");
    const changed = evaluateTaskScope({
      root,
      state,
      activePlan,
      changes: changes(["docs/task.md"]),
    });

    assert.equal(first.taskFingerprint, touched.taskFingerprint);
    assert.notEqual(first.taskFingerprint, changed.taskFingerprint);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("completes verified state and recovers only changed terminal escalation", () => {
  const root = createRoot();
  try {
    write(root, "docs/task.md", "candidate\n");
    const activePlan = plan();
    let state = initializeTaskState({
      root,
      base: "HEAD",
      revision: "revision",
      activePlan,
      changes: changes([]),
      boundaries: boundaries(),
    });
    let scope = evaluateTaskScope({
      root,
      state,
      activePlan,
      changes: changes(["docs/task.md"]),
    });
    beginVerification({ root, state, scope });
    markReadyForReview({ root, state, scope });
    write(root, "docs/task.md", "stale after verification\n");
    assert.throws(
      () => completeTaskState({ root }),
      failureWithCode("task-candidate-changed"),
    );
    write(root, "docs/task.md", "candidate\n");
    const completed = completeTaskState({ root });
    assert.equal(completed.lifecycle, "handed_off");
    assert.equal(
      fs.existsSync(path.join(root, "test-results/task-state.json")),
      false,
    );

    state = initializeTaskState({
      root,
      base: "HEAD",
      revision: "revision",
      activePlan,
      changes: changes([]),
      boundaries: boundaries(),
      now: () => "2026-08-12T00:00:00.000Z",
    });
    scope = evaluateTaskScope({
      root,
      state,
      activePlan,
      changes: changes(["docs/task.md"]),
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      beginVerification({ root, state, scope });
      recordTaskFailure({
        root,
        state,
        failureCode: "lane-full-failed",
        scope,
      });
    }
    assert.throws(
      () => assertRepairBudget({ root, state, scope }),
      failureWithCode("repair-budget-exhausted"),
    );
    assert.throws(
      () => recoverTaskState({ root }),
      failureWithCode("task-recovery-unchanged"),
    );
    write(root, "docs/task.md", "meaningful repair\n");
    assert.equal(recoverTaskState({ root }).lifecycle, "escalated");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "frontend-core-task-state-"));
}

function plan() {
  return {
    path: "docs/exec-plans/active/task.md",
    source: "# Task\n\n**Allowed paths:** docs/\n",
    boundaries: boundaries(),
  };
}

function boundaries() {
  return {
    allowedPaths: ["docs/"],
    allowedActions: ["edit", "verify"],
    maximumRisk: "high",
    repairLimit: 2,
  };
}

function changes(changedPaths) {
  return {
    committed: [],
    staged: [],
    unstaged: [],
    untracked: changedPaths,
    changedPaths,
  };
}

function failureWithCode(code) {
  return (error) =>
    error instanceof TaskStateFailure && error.failure.code === code;
}

function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}
