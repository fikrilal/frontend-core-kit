// @ts-check

import process from "node:process";

import { createProcessRunner } from "./process-runner.mjs";
import { failed, passed } from "./result.mjs";

const format = step("format", "formatting", "pnpm", ["format:check"]);
const contracts = step("contracts", "API contracts", "pnpm", [
  "contracts:check",
]);
const lint = step("lint", "linting", "pnpm", ["lint"]);
const typecheck = step("typecheck", "application types", "pnpm", ["typecheck"]);
const frontendkitTypecheck = step(
  "frontendkit-typecheck",
  "frontendkit types",
  "pnpm",
  ["typecheck:frontendkit"],
);
const tests = step("test", "automated tests", "pnpm", ["test"]);
const build = step("build", "production build", "pnpm", ["build"]);
const harness = step("harness", "repository harness", "pnpm", [
  "harness:check",
]);
const runtime = step("runtime", "browser runtime", "pnpm", ["test:e2e"]);

const fastSteps = freezeSteps([
  format,
  contracts,
  lint,
  typecheck,
  frontendkitTypecheck,
  tests,
  harness,
]);
const fullSteps = freezeSteps([
  format,
  contracts,
  lint,
  typecheck,
  frontendkitTypecheck,
  tests,
  build,
  harness,
]);

export const verificationProfiles = Object.freeze({
  fast: fastSteps,
  full: fullSteps,
  runtime: freezeSteps([runtime]),
  ci: fullSteps,
});

/** @typedef {keyof typeof verificationProfiles} VerificationProfile */

/**
 * @typedef {object} VerificationStep
 * @property {string} id
 * @property {string} owner
 * @property {string} command
 * @property {readonly string[]} args
 */

/**
 * @param {VerificationProfile} profile
 * @param {{ root?: string, runProcess?: ReturnType<typeof createProcessRunner> }} [options]
 */
export function runVerificationProfile(
  profile,
  { root = process.cwd(), runProcess = createProcessRunner() } = {},
) {
  const steps = verificationProfiles[profile];
  let durationMs = 0;

  for (const current of steps) {
    const result = runProcess(current.command, current.args, { cwd: root });
    durationMs += result.durationMs;
    if (result.status !== 0) {
      return failed({
        command: `verify:${profile}`,
        summary: `Verification stopped at ${current.id}.`,
        details: [
          { name: "profile", value: profile },
          { name: "failed-step", value: current.id },
          { name: "owner", value: current.owner },
          { name: "command-line", value: commandLine(current) },
          { name: "exit-code", value: result.status },
          { name: "duration-ms", value: durationMs },
          {
            name: "remediation",
            value: `Run ${commandLine(current)} directly for native diagnostics.`,
          },
        ],
      });
    }
  }

  return passed({
    command: `verify:${profile}`,
    summary: `Verification profile ${profile} passed.`,
    details: [
      { name: "profile", value: profile },
      { name: "steps", value: steps.length },
      { name: "duration-ms", value: durationMs },
    ],
  });
}

/**
 * @param {string} id
 * @param {string} owner
 * @param {string} command
 * @param {readonly string[]} args
 * @returns {Readonly<VerificationStep>}
 */
function step(id, owner, command, args) {
  return Object.freeze({ id, owner, command, args: Object.freeze([...args]) });
}

/** @param {readonly Readonly<VerificationStep>[]} steps */
function freezeSteps(steps) {
  return Object.freeze([...steps]);
}

/** @param {VerificationStep} value */
function commandLine(value) {
  return [value.command, ...value.args].join(" ");
}
