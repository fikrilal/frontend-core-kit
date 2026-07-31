import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  discoverTaskChanges,
  parseTaskVerificationArguments,
  runTaskVerification,
  selectVerificationLanes,
  TaskVerificationFailure,
  validateRuntime,
} from "./task-verification.mjs";

test("discovers committed, staged, unstaged, and untracked paths", () => {
  const root = createRepository();
  try {
    write(root, "src/committed.ts", "export {};\n");
    git(root, "add", "src/committed.ts");
    git(root, "commit", "-m", "committed change");
    write(root, "src/staged.ts", "export {};\n");
    git(root, "add", "src/staged.ts");
    write(root, "README.md", "unstaged\n");
    write(root, "docs/untracked.md", "untracked\n");

    const changes = discoverTaskChanges({ root, base: "HEAD~1" });

    assert.deepEqual(changes.committed, ["src/committed.ts"]);
    assert.deepEqual(changes.staged, ["src/staged.ts"]);
    assert.deepEqual(changes.unstaged, ["README.md"]);
    assert.deepEqual(changes.untracked, ["docs/untracked.md"]);
    assert.deepEqual(changes.changedPaths, [
      "README.md",
      "docs/untracked.md",
      "src/committed.ts",
      "src/staged.ts",
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("requires an exact Node and pnpm runtime", () => {
  const root = createRepository();
  try {
    assert.throws(
      () =>
        validateRuntime({
          root,
          nodeVersion: "22.0.0",
          pnpmVersion: () => "11.15.0",
        }),
      failureWithCode("node-version"),
    );
    assert.throws(
      () =>
        validateRuntime({
          root,
          nodeVersion: "24.18.0",
          pnpmVersion: () => "10.0.0",
        }),
      failureWithCode("pnpm-version"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("selects fast verification only for low risk", () => {
  assert.deepEqual(
    selectVerificationLanes("low").map((lane) => lane.command),
    ["pnpm"],
  );
  assert.deepEqual(
    selectVerificationLanes("medium").map((lane) => lane.args.join(" ")),
    ["verify", "verify:runtime"],
  );
  assert.deepEqual(
    selectVerificationLanes("high").map((lane) => lane.args.join(" ")),
    ["verify", "verify:runtime"],
  );
});

test("runs only the fast lane for a low-risk active task", () => {
  const root = createRepository({ activePlanRisk: "low" });
  try {
    write(root, "docs/change.md", "change\n");
    const laneCalls = [];
    const summary = runTaskVerification({
      root,
      nodeVersion: "24.18.0",
      pnpmVersion: () => "11.15.0",
      browserPath: () => null,
      execute: taskExecutor(root, laneCalls),
    });

    assert.equal(summary.risk.risk, "low");
    assert.deepEqual(laneCalls, ["pnpm verify:fast"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("runs high-risk lanes in order and writes a sanitized summary", () => {
  const root = createRepository({ activePlanRisk: "high" });
  try {
    write(root, "src/server/task.ts", "export {};\n");
    const laneCalls = [];
    const summary = runTaskVerification({
      root,
      nodeVersion: "24.18.0",
      pnpmVersion: () => "11.15.0",
      browserPath: () => "/chromium",
      execute: taskExecutor(root, laneCalls),
      summaryPath: "test-results/task-verification.json",
      now: incrementingClock(),
    });

    assert.equal(summary.status, "passed");
    assert.equal(summary.risk.risk, "high");
    assert.deepEqual(laneCalls, ["pnpm verify", "pnpm verify:runtime"]);
    assert.deepEqual(summary.changes.untracked, ["src/server/task.ts"]);
    const output = fs.readFileSync(
      path.join(root, "test-results/task-verification.json"),
      "utf8",
    );
    assert.match(output, /"schemaVersion": 1/);
    assert.doesNotMatch(output, /sensitive-value/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stops after the first failed lane and records remediation", () => {
  const root = createRepository({ activePlanRisk: "medium" });
  try {
    write(root, "src/task.ts", "export {};\n");
    const laneCalls = [];
    assert.throws(
      () =>
        runTaskVerification({
          root,
          nodeVersion: "24.18.0",
          pnpmVersion: () => "11.15.0",
          browserPath: () => "/chromium",
          execute: taskExecutor(root, laneCalls, { "pnpm verify": 1 }),
          summaryPath: "test-results/task-verification.json",
          now: incrementingClock(),
        }),
      failureWithCode("lane-full-failed"),
    );
    assert.deepEqual(laneCalls, ["pnpm verify"]);
    const summary = JSON.parse(
      fs.readFileSync(
        path.join(root, "test-results/task-verification.json"),
        "utf8",
      ),
    );
    assert.equal(summary.status, "failed");
    assert.equal(summary.failure.code, "lane-full-failed");
    assert.match(summary.failure.remediation, /pnpm verify/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stops before lanes when required Chromium is unavailable", () => {
  const root = createRepository({ activePlanRisk: "medium" });
  try {
    write(root, "src/task.ts", "export {};\n");
    const laneCalls = [];
    assert.throws(
      () =>
        runTaskVerification({
          root,
          nodeVersion: "24.18.0",
          pnpmVersion: () => "11.15.0",
          browserPath: () => null,
          execute: taskExecutor(root, laneCalls),
        }),
      failureWithCode("browser-missing"),
    );
    assert.deepEqual(laneCalls, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("stops before lanes for an unresolved base or missing active plan", () => {
  const root = createRepository();
  try {
    write(root, "docs/change.md", "change\n");
    const laneCalls = [];
    const options = {
      root,
      nodeVersion: "24.18.0",
      pnpmVersion: () => "11.15.0",
      browserPath: () => "/chromium",
      execute: taskExecutor(root, laneCalls),
    };
    assert.throws(
      () => runTaskVerification({ ...options, base: "missing-revision" }),
      failureWithCode("git-revision"),
    );
    assert.throws(
      () => runTaskVerification(options),
      failureWithCode("active-plan-count"),
    );
    assert.deepEqual(laneCalls, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects unsafe summary paths and unsupported arguments", () => {
  const root = createRepository({ activePlanRisk: "low" });
  try {
    write(root, "docs/change.md", "change\n");
    assert.throws(
      () =>
        runTaskVerification({
          root,
          nodeVersion: "24.18.0",
          pnpmVersion: () => "11.15.0",
          execute: taskExecutor(root, []),
          summaryPath: "docs/task-summary.json",
        }),
      failureWithCode("summary-path"),
    );
    assert.throws(
      () => parseTaskVerificationArguments(["--unsafe"]),
      failureWithCode("invalid-arguments"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("leaves the Git-visible task state unchanged", () => {
  const root = createRepository({ activePlanRisk: "low" });
  try {
    write(root, "docs/change.md", "change\n");
    const before = git(root, "status", "--short");
    runTaskVerification({
      root,
      nodeVersion: "24.18.0",
      pnpmVersion: () => "11.15.0",
      execute: taskExecutor(root, []),
      summaryPath: "test-results/task-verification.json",
    });
    assert.equal(git(root, "status", "--short"), before);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createRepository({ activePlanRisk = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lamara-task-verify-"));
  git(root, "init");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "Test User");
  write(root, ".nvmrc", "24.18.0\n");
  write(root, ".gitignore", "/test-results\n");
  write(
    root,
    "package.json",
    JSON.stringify({ packageManager: "pnpm@11.15.0" }),
  );
  write(root, "README.md", "baseline\n");
  write(root, "docs/README.md", "# Docs\n");
  write(root, "docs/planning/README.md", "# Planning\n");
  write(root, "docs/exec-plans/active/.gitkeep", "");
  write(root, "docs/exec-plans/queued/.gitkeep", "");
  write(root, "docs/exec-plans/completed/.gitkeep", "");
  if (activePlanRisk) {
    write(root, "docs/exec-plans/active/task.md", validPlan(activePlanRisk));
  }
  git(root, "add", ".");
  git(root, "commit", "-m", "baseline");
  return root;
}

function validPlan(risk) {
  const sections = [
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
  return `# Task\n\n**Plan version:** 1\n**Status:** active\n**Owner:** test owner\n**Risk:** ${risk}\n**Authority:** test only\n\n${sections.map((section) => `## ${section}\n\nRecorded evidence.\n`).join("\n")}`;
}

function taskExecutor(root, laneCalls, outcomes = {}) {
  return (command, args, options) => {
    if (command === "pnpm") {
      const name = `${command} ${args.join(" ")}`;
      laneCalls.push(name);
      return { status: outcomes[name] ?? 0, stdout: "sensitive-value" };
    }
    const result = spawnSync(command, args, {
      ...options,
      cwd: root,
      encoding: "utf8",
    });
    return { status: result.status ?? 1, stdout: result.stdout ?? "" };
  };
}

function incrementingClock() {
  let value = 0;
  return () => {
    value += 10;
    return value;
  };
}

function failureWithCode(code) {
  return (error) =>
    error instanceof TaskVerificationFailure && error.failure.code === code;
}

function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function git(root, ...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  }
  return result.stdout;
}
