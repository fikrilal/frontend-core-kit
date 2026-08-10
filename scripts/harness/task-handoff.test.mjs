import assert from "node:assert/strict";
import test from "node:test";

import {
  parseTaskHandoffArguments,
  runTaskHandoff,
  TaskHandoffFailure,
} from "./task-handoff.mjs";

test("stops before verification or mutation without every publication authority", () => {
  const calls = [];

  assert.throws(
    () =>
      handoff({
        calls,
        boundaries: boundaries("edit, verify, commit, push"),
      }),
    failureWithCode("action-not-authorized"),
  );
  assert.deepEqual(calls, []);
});

test("dry run verifies scope and renders a sanitized handoff without mutation", () => {
  const calls = [];
  const result = handoff({ calls, dryRun: true });

  assert.equal(result.status, "ready");
  assert.equal(result.dryRun, true);
  assert.match(result.body, /\[redacted\]/);
  assert.match(result.body, /pnpm verify/);
  assert.deepEqual(
    calls.map((call) => call.join(" ")),
    ["git branch --show-current", "git remote get-url origin"],
  );
});

test("publishes only the authorized commit, normal push, and draft PR sequence", () => {
  const calls = [];
  const result = handoff({ calls });

  assert.equal(result.status, "published");
  assert.deepEqual(
    calls.map((call) => call.join(" ")),
    [
      "git branch --show-current",
      "git remote get-url origin",
      "git add -- scripts/harness/task-handoff.mjs",
      "git diff --cached --quiet",
      "git commit -m feat(harness): add task handoff",
      "git push origin feat/harness-handoff",
      "gh pr create --draft --base main --head feat/harness-handoff --title feat(harness): add task handoff --body ## Task handoff\n\n**Risk:** high\n**Target branch:** main\n\n### Objective\nCreate a safe handoff. [redacted]\n\n### Verification\n- `pnpm verify`\n- `pnpm verify:runtime`\n\n### Runtime evidence\nBrowser runtime verification passed.\n\n### Rollback\nRevert the task commit.\n\n### Remaining human gates\nHuman review is required.",
    ],
  );
  assert.equal(calls.flat().includes("--force"), false);
});

test("repairs only the matching open draft PR with separate update authority", () => {
  const calls = [];
  const result = handoff({
    calls,
    pullRequest: "42",
    boundaries: boundaries("edit, verify, commit, push, update-pr"),
  });

  assert.equal(result.pullRequest, "42");
  assert.equal(
    calls.some((call) => call.join(" ").startsWith("gh pr create")),
    false,
  );
  assert.equal(
    calls.some((call) => call.join(" ").startsWith("gh pr edit 42")),
    true,
  );
});

test("stops before mutation when verification evidence is stale or unowned", () => {
  const calls = [];
  assert.throws(
    () =>
      handoff({
        calls,
        verification: verification({ taskPaths: ["docs/old.md"] }),
      }),
    failureWithCode("verification-stale"),
  );
  assert.deepEqual(calls, []);

  assert.throws(
    () =>
      handoff({
        calls: [],
        state: { preexistingChanges: { changedPaths: ["docs/user.md"] } },
      }),
    failureWithCode("unowned-changes"),
  );
});

test("validates explicit CLI arguments without shell-like branch syntax", () => {
  assert.deepEqual(
    parseTaskHandoffArguments([
      "--base",
      "main",
      "--title",
      "feat(harness): add task handoff",
      "--dry-run",
    ]),
    {
      base: "main",
      head: null,
      title: "feat(harness): add task handoff",
      pullRequest: null,
      dryRun: true,
    },
  );
  assert.throws(
    () =>
      parseTaskHandoffArguments([
        "--base",
        "main;push",
        "--title",
        "safe title",
      ]),
    failureWithCode("invalid-branch"),
  );
});

function handoff({
  calls,
  dryRun = false,
  pullRequest = null,
  boundaries: taskBoundaries = boundaries(),
  state = { preexistingChanges: { changedPaths: [] } },
  verification: taskVerification = verification(),
} = {}) {
  return runTaskHandoff({
    root: "/fixture",
    base: "main",
    title: "feat(harness): add task handoff",
    dryRun,
    pullRequest,
    execute: executor(calls),
    loadPlan: () => ({
      path: "docs/exec-plans/active/task.md",
      source: planSource(),
      boundaries: taskBoundaries,
    }),
    verifyTask: () => taskVerification,
    discoverChanges: () => changes(),
    readState: () => state,
  });
}

function boundaries(actions = "edit, verify, commit, push, draft-pr") {
  return { allowedActions: actions.split(", ") };
}

function verification({
  taskPaths = ["scripts/harness/task-handoff.mjs"],
} = {}) {
  return {
    status: "passed",
    activePlan: "docs/exec-plans/active/task.md",
    risk: { risk: "high" },
    scope: { taskPaths },
    lanes: [
      { id: "full", command: "pnpm verify", status: "passed" },
      { id: "runtime", command: "pnpm verify:runtime", status: "passed" },
    ],
  };
}

function changes() {
  return {
    committed: [],
    staged: [],
    unstaged: ["scripts/harness/task-handoff.mjs"],
    untracked: [],
    changedPaths: ["scripts/harness/task-handoff.mjs"],
  };
}

function planSource() {
  return `# Task

## Objective

Create a safe handoff. PASSWORD=should-not-appear

## Rollout And Rollback

Revert the task commit.

## Follow-Up Debt

Human review is required.
`;
}

function executor(calls) {
  return (command, args) => {
    calls.push([command, ...args]);
    if (command === "git" && args.join(" ") === "branch --show-current") {
      return { status: 0, stdout: "feat/harness-handoff\n" };
    }
    if (command === "git" && args.join(" ") === "remote get-url origin") {
      return {
        status: 0,
        stdout: "git@github.com:fikrilal/frontend-core-kit.git\n",
      };
    }
    if (command === "git" && args.join(" ") === "diff --cached --quiet") {
      return { status: 1, stdout: "" };
    }
    if (command === "gh" && args.slice(0, 2).join(" ") === "pr view") {
      return {
        status: 0,
        stdout:
          '{"state":"OPEN","isDraft":true,"headRefName":"feat/harness-handoff","baseRefName":"main"}',
      };
    }
    return { status: 0, stdout: "" };
  };
}

function failureWithCode(code) {
  return (error) =>
    error instanceof TaskHandoffFailure && error.failure.code === code;
}
