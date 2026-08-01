#!/usr/bin/env node

import process from "node:process";

import {
  parseTaskHandoffArguments,
  runTaskHandoff,
  TaskHandoffFailure,
} from "./task-handoff.mjs";

try {
  const options = parseTaskHandoffArguments(process.argv.slice(2));
  const result = runTaskHandoff({ root: process.cwd(), ...options });
  console.log(
    result.dryRun
      ? `Task handoff is ready for ${result.head} -> ${result.base}; no remote mutation was made.`
      : `Draft pull request created for ${result.head} -> ${result.base}.`,
  );
} catch (error) {
  if (error instanceof TaskHandoffFailure) {
    console.error(`Task handoff stopped: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    process.exit(1);
  }
  console.error("Task handoff stopped: unexpected local failure.");
  process.exit(1);
}
