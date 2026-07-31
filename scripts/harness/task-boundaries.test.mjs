import assert from "node:assert/strict";
import test from "node:test";

import {
  assertActionAllowed,
  assertRiskAllowed,
  findScopeViolations,
  parseTaskBoundaries,
  TaskBoundaryFailure,
} from "./task-boundaries.mjs";

test("parses narrow structured task boundaries", () => {
  const boundaries = parseTaskBoundaries(plan());

  assert.deepEqual(boundaries, {
    allowedPaths: ["docs/", "scripts/harness/", "package.json"],
    allowedActions: ["edit", "verify"],
    maximumRisk: "high",
    repairLimit: 2,
  });
});

test("rejects ambiguous paths, unsupported actions, and invalid limits", () => {
  assert.throws(
    () => parseTaskBoundaries(plan({ paths: "./, scripts/**" })),
    failureWithCode("allowed-path-invalid"),
  );
  assert.throws(
    () => parseTaskBoundaries(plan({ actions: "edit, erase" })),
    failureWithCode("allowed-action-invalid"),
  );
  assert.throws(
    () => parseTaskBoundaries(plan({ repairLimit: "two" })),
    failureWithCode("repair-limit-invalid"),
  );
});

test("enforces verify authority and maximum risk", () => {
  const boundaries = parseTaskBoundaries(
    plan({ actions: "edit", risk: "medium" }),
  );

  assert.throws(
    () => assertActionAllowed(boundaries, "verify"),
    failureWithCode("action-not-authorized"),
  );
  assert.throws(
    () => assertRiskAllowed(boundaries, "high"),
    failureWithCode("risk-escalation"),
  );
});

test("separates in-scope files from scope violations", () => {
  const boundaries = parseTaskBoundaries(plan());

  assert.deepEqual(
    findScopeViolations(
      [
        "docs/engineering/harness.md",
        "scripts/harness/task-state.mjs",
        "src/app/page.tsx",
        "package.json",
      ],
      boundaries.allowedPaths,
    ),
    ["src/app/page.tsx"],
  );
});

function plan({
  paths = "docs/, scripts/harness/, package.json",
  actions = "edit, verify",
  risk = "high",
  repairLimit = "2",
} = {}) {
  return `# Plan\n\n**Allowed paths:** ${paths}\n**Allowed actions:** ${actions}\n**Maximum risk:** ${risk}\n**Repair limit:** ${repairLimit}\n`;
}

function failureWithCode(code) {
  return (error) =>
    error instanceof TaskBoundaryFailure && error.failure.code === code;
}
