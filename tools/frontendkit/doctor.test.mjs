import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runDoctor } from "./doctor.mjs";

test("reports a stable blocker for the wrong Node version", () => {
  const fixture = createFixture();
  const result = runDoctor({
    root: fixture.root,
    nodeVersion: "22.0.0",
    runProcess: fixture.runProcess,
    browserPath: () => fixture.browser,
  });

  assert.equal(result.status, "failed");
  assert.match(JSON.stringify(result), /toolchain\.node-version/);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_VALUE/);
});

test("allows warnings while all required local controls are ready", () => {
  const fixture = createFixture();
  const result = runDoctor({
    root: fixture.root,
    nodeVersion: "24.18.0",
    runProcess: fixture.runProcess,
    browserPath: () => fixture.browser,
  });

  assert.equal(result.status, "passed");
  assert.deepEqual(result.details.slice(0, 2), [
    { name: "blockers", value: 0 },
    { name: "warnings", value: 1 },
  ]);
  assert.match(JSON.stringify(result), /task-state\.missing/);
});

test("reports malformed private state without modifying it", () => {
  const fixture = createFixture();
  write(fixture.root, "test-results/task-state.json", "PRIVATE_VALUE\n");
  const before = snapshot(fixture.root);

  const result = runDoctor({
    root: fixture.root,
    nodeVersion: "24.18.0",
    runProcess: fixture.runProcess,
    browserPath: () => fixture.browser,
  });

  assert.equal(result.status, "passed");
  assert.match(JSON.stringify(result), /task-state\.invalid/);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_VALUE/);
  assert.deepEqual(snapshot(fixture.root), before);
});

test("accepts matching private task state and plan fingerprint", () => {
  const fixture = createFixture();
  write(
    fixture.root,
    "test-results/task-state.json",
    `${JSON.stringify({
      schemaVersion: 1,
      activePlan: fixture.planPath,
      planFingerprint: crypto
        .createHash("sha256")
        .update(fixture.plan)
        .digest("hex"),
    })}\n`,
  );
  const result = runDoctor({
    root: fixture.root,
    nodeVersion: "24.18.0",
    runProcess: fixture.runProcess,
    browserPath: () => fixture.browser,
  });

  assert.equal(result.status, "passed");
  assert.deepEqual(result.details.slice(0, 2), [
    { name: "blockers", value: 0 },
    { name: "warnings", value: 0 },
  ]);
});

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "frontendkit-doctor-"));
  const planPath = "docs/exec-plans/active/task.md";
  const plan = "# Task\n\n**Risk:** high\n";
  write(root, ".nvmrc", "24.18.0\n");
  write(root, "package.json", '{"packageManager":"pnpm@11.15.0"}\n');
  write(root, planPath, plan);
  for (const contractPath of [
    "src/contracts/example-api/openapi.yaml",
    "src/contracts/example-api/generated.ts",
    "src/contracts/example-api/runtime.generated.ts",
    "src/contracts/example-api/provenance.json",
  ]) {
    write(root, contractPath, "fixture\n");
  }
  const browser = path.join(root, "chromium");
  fs.writeFileSync(browser, "fixture\n");

  return {
    root,
    browser,
    plan,
    planPath,
    runProcess: (command, args) => {
      if (command === "pnpm") return processResult(0, "11.15.0\n");
      if (command === "node") return processResult(0);
      if (args[0] === "rev-parse") return processResult(0, `${root}\n`);
      if (args[0] === "check-ignore") return processResult(0);
      return processResult(1);
    },
  };
}

function processResult(status, stdout = "") {
  return {
    status,
    signal: null,
    durationMs: 1,
    stdout,
    stderr: "",
    outputTruncated: false,
    errorCode: null,
  };
}

function write(root, relativePath, source) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}

function snapshot(root) {
  return fs
    .readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const absolutePath = path.join(entry.parentPath, entry.name);
      return [path.relative(root, absolutePath), fs.readFileSync(absolutePath)];
    });
}
