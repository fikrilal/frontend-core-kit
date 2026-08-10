import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runOwnedCommand } from "./owned-commands.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("delegates read-only controls to their native owners", () => {
  const calls = [];
  const result = runOwnedCommand("risk", ["--base", "A", "--head", "B"], {
    root: "/fixture",
    runProcess: (command, args, options) => {
      calls.push({ command, args, options });
      return processResult(0);
    },
  });

  assert.equal(result.status, "passed");
  assert.deepEqual(calls, [
    {
      command: "node",
      args: ["scripts/harness/classify-risk.mjs", "--base", "A", "--head", "B"],
      options: { cwd: "/fixture" },
    },
  ]);
});

test("reports native-owner failure without returning raw output", () => {
  const result = runOwnedCommand("contracts", [], {
    root: "/fixture",
    runProcess: () => processResult(7, "secret response body"),
  });

  assert.equal(result.status, "failed");
  assert.match(result.summary, /native owner/);
  assert.doesNotMatch(JSON.stringify(result), /secret response body/);
});

test("keeps read-only compatibility aliases as frontendkit delegates", () => {
  const scripts = JSON.parse(
    fs.readFileSync(path.join(root, "package.json")),
  ).scripts;
  assert.equal(
    scripts["knowledge:check"],
    "pnpm frontendkit -- knowledge check",
  );
  assert.equal(
    scripts["contracts:check"],
    "pnpm frontendkit -- contracts check",
  );
  assert.equal(scripts["risk:classify"], "pnpm frontendkit -- risk classify");
  assert.equal(
    scripts["harness:evidence"],
    "pnpm frontendkit -- evidence report",
  );
  assert.equal(scripts["task:begin"], "pnpm frontendkit -- task begin");
  assert.equal(scripts["task:verify"], "pnpm frontendkit -- task verify");
  assert.equal(scripts["task:complete"], "pnpm frontendkit -- task complete");
  assert.equal(scripts["task:handoff"], "pnpm frontendkit -- handoff");
  assert.equal(scripts["improve:check"], "pnpm frontendkit -- improve check");
  assert.equal(
    scripts["improve:analyze"],
    "pnpm frontendkit -- improve analyze",
  );
  assert.equal(scripts["improve:shadow"], "pnpm frontendkit -- improve shadow");
});

function processResult(status, stderr = "") {
  return {
    status,
    signal: null,
    durationMs: 3,
    stdout: "",
    stderr,
    outputTruncated: false,
    errorCode: null,
  };
}
