#!/usr/bin/env node

import process from "node:process";

import {
  completeTaskState,
  recoverTaskState,
  taskStatus,
  TaskStateFailure,
} from "./task-state.mjs";

try {
  const [command, ...rest] = process.argv
    .slice(2)
    .filter((value) => value !== "--");
  if (
    !command ||
    rest.length > 0 ||
    !["status", "complete", "recover"].includes(command)
  ) {
    throw new Error("invalid arguments");
  }
  const root = process.cwd();
  const result =
    command === "status"
      ? taskStatus(root)
      : command === "complete"
        ? completeTaskState({ root })
        : recoverTaskState({ root });
  console.log(JSON.stringify(result));
} catch (error) {
  if (error instanceof TaskStateFailure) {
    console.error(`Task control failed: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    console.error(`Failure code: ${error.failure.code}`);
    process.exit(1);
  }
  console.error("Task control failed: invalid local command arguments.");
  process.exit(1);
}
