import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertRepairBudget,
  evaluateTaskScope,
  initializeTaskState,
  recordTaskFailure,
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

    assert.deepEqual(
      recordTaskFailure({
        root,
        state,
        failureCode: "lane-full-failed",
        scope,
      }),
      { repeatCount: 1, remaining: 1 },
    );
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
      () => assertRepairBudget(state, scope),
      failureWithCode("repair-budget-exhausted"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stops when the plan boundary changes after task start", () => {
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

    assert.throws(
      () =>
        evaluateTaskScope({
          root,
          state,
          activePlan: {
            ...activePlan,
            source: `${activePlan.source}\nChanged.`,
          },
          changes: changes([]),
        }),
      failureWithCode("task-boundaries-changed"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "lamara-task-state-"));
}

function plan() {
  return {
    path: "docs/exec-plans/active/task.md",
    source: "# Task\n\n**Allowed paths:** docs/\n",
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
