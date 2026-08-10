// @ts-check

import process from "node:process";

import { createProcessRunner } from "./process-runner.mjs";
import { failed, passed } from "./result.mjs";

const format = step("format", "code owner", "maintainability.format", "pnpm", [
  "format:check",
]);
const contracts = step(
  "contracts",
  "API boundary owner",
  "contract.generated",
  "pnpm",
  ["contracts:check"],
);
const lint = step("lint", "code owner", "maintainability.lint", "pnpm", [
  "lint",
]);
const typecheck = step(
  "typecheck",
  "application owner",
  "build.typecheck",
  "pnpm",
  ["typecheck"],
);
const frontendkitTypecheck = step(
  "frontendkit-typecheck",
  "harness maintainer",
  "build.frontendkit-types",
  "pnpm",
  ["typecheck:frontendkit"],
);
const tests = step("test", "feature owner", "behavior.tests", "pnpm", ["test"]);
const build = step("build", "application owner", "build.production", "pnpm", [
  "build",
]);
const knowledge = step(
  "knowledge",
  "plan owner",
  "knowledge.repository",
  "pnpm",
  ["knowledge:check"],
);
const architecture = step(
  "architecture",
  "architecture owner",
  "architecture.boundary",
  "pnpm",
  ["architecture:check"],
);
const maintainability = step(
  "maintainability",
  "code owner",
  "maintainability.dead-code",
  "pnpm",
  ["maintainability:check"],
);
const publicPages = step(
  "public-pages",
  "feature owner",
  "behavior.public-pages",
  "pnpm",
  ["public-pages:check"],
);
const runtime = step("runtime", "feature/UX owner", "runtime.browser", "pnpm", [
  "test:e2e",
]);

const harnessSteps = [knowledge, architecture, maintainability, publicPages];
const fastSteps = freezeSteps([
  format,
  contracts,
  lint,
  typecheck,
  frontendkitTypecheck,
  tests,
  ...harnessSteps,
]);
const fullSteps = freezeSteps([
  format,
  contracts,
  lint,
  typecheck,
  frontendkitTypecheck,
  tests,
  build,
  ...harnessSteps,
]);

export const verificationProfiles = Object.freeze({
  fast: fastSteps,
  full: fullSteps,
  runtime: freezeSteps([runtime]),
  ci: fullSteps,
});

/** @typedef {keyof typeof verificationProfiles} VerificationProfile */
/** @typedef {{ id: string, owner: string, failureCode: string, command: string, args: readonly string[] }} VerificationStep */

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
          { name: "failure-code", value: current.failureCode },
          { name: "owner", value: current.owner },
          { name: "repairable", value: true },
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

/** @param {string} id @param {string} owner @param {string} failureCode @param {string} command @param {readonly string[]} args @returns {Readonly<VerificationStep>} */
function step(id, owner, failureCode, command, args) {
  return Object.freeze({
    id,
    owner,
    failureCode,
    command,
    args: Object.freeze([...args]),
  });
}

/** @param {readonly Readonly<VerificationStep>[]} steps */
function freezeSteps(steps) {
  return Object.freeze([...steps]);
}

/** @param {VerificationStep} value */
function commandLine(value) {
  return [value.command, ...value.args].join(" ");
}
