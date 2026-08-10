#!/usr/bin/env node

import process from "node:process";

import {
  parseTaskVerificationArguments,
  runTaskVerification,
  TaskVerificationFailure,
} from "./task-verification.mjs";

try {
  const options = parseTaskVerificationArguments(process.argv.slice(2));
  const summary = runTaskVerification({ root: process.cwd(), ...options });
  console.log(formatTerminalSummary(summary));
} catch (error) {
  if (error instanceof TaskVerificationFailure) {
    console.error(`Task verification failed: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    console.error(`Failure code: ${error.failure.code}`);
    process.exit(1);
  }
  console.error("Task verification failed: unexpected local failure.");
  process.exit(1);
}

function formatTerminalSummary(summary) {
  const commands = summary.lanes.map((lane) => lane.command).join(", ");
  return `Task verification passed: ${summary.risk.risk} risk; ${commands}.`;
}
