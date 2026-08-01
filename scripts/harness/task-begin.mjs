#!/usr/bin/env node

import process from "node:process";

import {
  beginTask,
  parseTaskVerificationArguments,
  TaskVerificationFailure,
} from "./task-verification.mjs";

try {
  const options = parseTaskVerificationArguments(process.argv.slice(2));
  if (options.summaryPath) {
    throw new Error("task:begin does not accept --summary.");
  }
  const result = beginTask({ root: process.cwd(), ...options });
  console.log(
    `Task baseline created: ${result.activePlan}; ${result.preexistingPathCount} pre-existing paths; ${result.risk} risk.`,
  );
} catch (error) {
  if (
    error instanceof TaskVerificationFailure ||
    (error && typeof error === "object" && "failure" in error)
  ) {
    console.error(`Task start failed: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    process.exit(1);
  }
  console.error("Task start failed: invalid local command arguments.");
  process.exit(1);
}
