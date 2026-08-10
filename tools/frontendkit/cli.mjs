#!/usr/bin/env node
// @ts-check

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { executeCommand, parseCommand } from "./command.mjs";
import {
  CliUsageError,
  exitCodes,
  failed,
  renderHuman,
  renderJson,
} from "./result.mjs";

/**
 * @param {{ args?: readonly string[], stdout?: (value: string) => void, stderr?: (value: string) => void }} [options]
 */
export function runCli({
  args = process.argv.slice(2),
  stdout = (value) => process.stdout.write(value),
  stderr = (value) => process.stderr.write(value),
} = {}) {
  const json = args.includes("--json");
  try {
    const command = parseCommand(args);
    const result = executeCommand(command);
    stdout(
      command.format === "json" ? renderJson(result) : renderHuman(result),
    );
    return result.status === "passed" ? exitCodes.success : exitCodes.failure;
  } catch (error) {
    const usage = error instanceof CliUsageError;
    const result = failed({
      command: "cli",
      summary: usage ? error.message : "Frontendkit failed unexpectedly.",
      details: usage
        ? [{ name: "remediation", value: "Run frontendkit help." }]
        : [],
    });
    stderr(json ? renderJson(result) : renderHuman(result));
    return usage ? exitCodes.usage : exitCodes.failure;
  }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = runCli();
