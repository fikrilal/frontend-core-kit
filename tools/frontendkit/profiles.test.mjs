import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runVerificationProfile, verificationProfiles } from "./profiles.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("defines stable ordered verification profiles in one registry", () => {
  assert.deepEqual(Object.keys(verificationProfiles), [
    "fast",
    "full",
    "runtime",
    "ci",
  ]);
  assert.deepEqual(
    verificationProfiles.fast.map((step) => step.id),
    [
      "format",
      "contracts",
      "lint",
      "typecheck",
      "frontendkit-typecheck",
      "test",
      "harness",
    ],
  );
  assert.deepEqual(
    verificationProfiles.full.map((step) => step.id),
    [
      ...verificationProfiles.fast.slice(0, -1).map((step) => step.id),
      "build",
      "harness",
    ],
  );
  assert.equal(verificationProfiles.ci, verificationProfiles.full);
  assert.deepEqual(
    verificationProfiles.runtime.map((step) => step.id),
    ["runtime"],
  );
});

test("runs profile steps in order and reports bounded success", () => {
  const calls = [];
  const result = runVerificationProfile("runtime", {
    root: "/fixture",
    runProcess: (command, args, options) => {
      calls.push({ command, args, options });
      return processResult(0, 17);
    },
  });

  assert.equal(result.status, "passed");
  assert.deepEqual(calls, [
    {
      command: "pnpm",
      args: ["test:e2e"],
      options: { cwd: "/fixture" },
    },
  ]);
  assert.doesNotMatch(JSON.stringify(result), /stdout|stderr/);
});

test("stops at the first failed owned boundary without raw output", () => {
  const calls = [];
  const result = runVerificationProfile("fast", {
    root: "/fixture",
    runProcess: (_command, args) => {
      calls.push(args[0]);
      return args[0] === "lint"
        ? processResult(9, 5, "private raw output")
        : processResult(0, 5);
    },
  });

  assert.deepEqual(calls, ["format:check", "contracts:check", "lint"]);
  assert.equal(result.status, "failed");
  assert.deepEqual(
    result.details.find((detail) => detail.name === "failed-step"),
    { name: "failed-step", value: "lint" },
  );
  assert.doesNotMatch(JSON.stringify(result), /private raw output/);
});

test("keeps pnpm aliases and CI as delegates to canonical profiles", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  assert.equal(
    packageJson.scripts["verify:fast"],
    "pnpm frontendkit -- verify --profile fast",
  );
  assert.equal(
    packageJson.scripts.verify,
    "pnpm frontendkit -- verify --profile full",
  );
  assert.equal(
    packageJson.scripts["verify:runtime"],
    "pnpm frontendkit -- verify --profile runtime",
  );

  const ci = fs.readFileSync(
    path.join(root, ".github/workflows/ci.yml"),
    "utf8",
  );
  assert.match(ci, /run: pnpm frontendkit -- verify --profile ci/);
  assert.match(ci, /run: pnpm frontendkit -- verify --profile runtime/);
});

function processResult(status, durationMs, stderr = "") {
  return {
    status,
    signal: null,
    durationMs,
    stdout: "",
    stderr,
    outputTruncated: false,
    errorCode: null,
  };
}
