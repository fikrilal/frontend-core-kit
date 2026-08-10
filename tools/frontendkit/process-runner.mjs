// @ts-check

import { spawnSync } from "node:child_process";

const defaultMaximumOutputBytes = 64 * 1024;
const defaultTimeoutMs = 15 * 60 * 1_000;

/**
 * @typedef {object} ProcessResult
 * @property {number | null} status
 * @property {NodeJS.Signals | null} signal
 * @property {number} durationMs
 * @property {string} stdout
 * @property {string} stderr
 * @property {boolean} outputTruncated
 * @property {string | null} errorCode
 */

/**
 * @param {{ spawn?: typeof spawnSync, now?: () => number }} [dependencies]
 */
export function createProcessRunner({
  spawn = spawnSync,
  now = Date.now,
} = {}) {
  /**
   * @param {string} command
   * @param {readonly string[]} args
   * @param {{ cwd: string, env?: NodeJS.ProcessEnv, timeoutMs?: number, maximumOutputBytes?: number }} options
   * @returns {ProcessResult}
   */
  return function runProcess(command, args, options) {
    validateInvocation(command, args, options);
    const startedAt = now();
    const maximumOutputBytes =
      options.maximumOutputBytes ?? defaultMaximumOutputBytes;
    const execution = spawn(command, [...args], {
      cwd: options.cwd,
      encoding: "utf8",
      env: options.env,
      maxBuffer: maximumOutputBytes * 2,
      shell: false,
      timeout: options.timeoutMs ?? defaultTimeoutMs,
    });
    const stdout = bounded(execution.stdout ?? "", maximumOutputBytes);
    const stderr = bounded(execution.stderr ?? "", maximumOutputBytes);

    return {
      status: execution.status,
      signal: execution.signal,
      durationMs: Math.max(0, now() - startedAt),
      stdout: stdout.value,
      stderr: stderr.value,
      outputTruncated: stdout.truncated || stderr.truncated,
      errorCode:
        execution.error && "code" in execution.error
          ? String(execution.error.code)
          : null,
    };
  };
}

/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {{ cwd: string, timeoutMs?: number, maximumOutputBytes?: number }} options
 */
function validateInvocation(command, args, options) {
  if (
    typeof command !== "string" ||
    command.length === 0 ||
    command.includes("\0")
  ) {
    throw new Error("Frontendkit process command is invalid.");
  }
  if (
    !Array.isArray(args) ||
    args.some((argument) => typeof argument !== "string")
  ) {
    throw new Error("Frontendkit process arguments are invalid.");
  }
  if (typeof options.cwd !== "string" || options.cwd.length === 0) {
    throw new Error("Frontendkit process working directory is invalid.");
  }
  for (const value of [options.timeoutMs, options.maximumOutputBytes]) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0)) {
      throw new Error("Frontendkit process limit is invalid.");
    }
  }
}

/** @param {string} value @param {number} maximumBytes */
function bounded(value, maximumBytes) {
  if (Buffer.byteLength(value, "utf8") <= maximumBytes) {
    return { value, truncated: false };
  }
  const suffix = "\n[output truncated]\n";
  const buffer = Buffer.from(value, "utf8");
  return {
    value: `${buffer.subarray(0, Math.max(0, maximumBytes - Buffer.byteLength(suffix))).toString("utf8")}${suffix}`,
    truncated: true,
  };
}
