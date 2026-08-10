// @ts-check

import process from "node:process";

import { createProcessRunner } from "./process-runner.mjs";
import { failed, passed } from "./result.mjs";

const owners = Object.freeze({
  knowledge: owner(
    "knowledge:check",
    "scripts/harness/check-knowledge.mjs",
    "Repository knowledge is valid.",
    "Run pnpm knowledge:check directly for native diagnostics.",
  ),
  contracts: owner(
    "contracts:check",
    "scripts/contracts/check-openapi.mjs",
    "Generated API contracts are current.",
    "Run pnpm contracts:check directly for native diagnostics.",
  ),
  risk: owner(
    "risk:classify",
    "scripts/harness/classify-risk.mjs",
    "Change risk was classified.",
    "Run pnpm risk:classify directly for native diagnostics.",
    [],
    true,
  ),
  evidence: owner(
    "evidence:report",
    "scripts/harness/operating-evidence-cli.mjs",
    "Operating evidence is valid and was summarized.",
    "Run pnpm harness:evidence directly for native diagnostics.",
    ["--summary-json"],
    true,
  ),
  "task-begin": owner(
    "task:begin",
    "scripts/harness/task-begin.mjs",
    "Task baseline was authorized.",
    "Run the native task-begin script for focused diagnostics.",
  ),
  "task-verify": owner(
    "task:verify",
    "scripts/harness/task-verify.mjs",
    "Task candidate is ready for review.",
    "Run the native task-verify script for focused diagnostics.",
  ),
  "task-status": taskControl("status", "Task status was read."),
  "task-complete": taskControl(
    "complete",
    "Task state was completed and archived.",
  ),
  "task-recover": taskControl(
    "recover",
    "Terminal task state was recovered and archived.",
  ),
  handoff: owner(
    "handoff",
    "scripts/harness/task-handoff-cli.mjs",
    "Task handoff preflight or publication completed.",
    "Run the native task-handoff script for focused diagnostics.",
  ),
  "improve-check": improvement("check", "Improvement ledger is valid."),
  "improve-analyze": improvement(
    "analyze",
    "Improvement eligibility was analyzed.",
  ),
  "improve-shadow": improvement(
    "shadow",
    "Improvement shadow evidence was analyzed.",
  ),
});

/** @typedef {keyof typeof owners} CommandOwner */
/** @typedef {{ id: string, script: string, success: string, remediation: string, prefixArgs: readonly string[], structured: boolean }} OwnerDefinition */

/**
 * @param {CommandOwner} ownerName
 * @param {readonly string[]} args
 * @param {{ root?: string, runProcess?: ReturnType<typeof createProcessRunner> }} [options]
 */
export function runOwnedCommand(
  ownerName,
  args,
  { root = process.cwd(), runProcess = createProcessRunner() } = {},
) {
  const definition = owners[ownerName];
  const result = runProcess(
    "node",
    [definition.script, ...definition.prefixArgs, ...args],
    { cwd: root },
  );
  const details = [
    { name: "owner", value: ownerName },
    { name: "duration-ms", value: result.durationMs },
    ...(definition.structured && result.status === 0
      ? structuredDetails(result.stdout)
      : []),
  ];

  return result.status === 0
    ? passed({ command: definition.id, summary: definition.success, details })
    : failed({
        command: definition.id,
        summary: `${definition.id} failed at its native owner.`,
        details: [
          ...details,
          ...failureDetails(result.stderr),
          { name: "exit-code", value: result.status },
          { name: "remediation", value: definition.remediation },
        ],
      });
}

/**
 * @param {string} id
 * @param {string} script
 * @param {string} success
 * @param {string} remediation
 * @param {readonly string[]} [prefixArgs]
 * @param {boolean} [structured]
 * @returns {Readonly<OwnerDefinition>}
 */
function owner(
  id,
  script,
  success,
  remediation,
  prefixArgs = [],
  structured = false,
) {
  return Object.freeze({
    id,
    script,
    success,
    remediation,
    prefixArgs: Object.freeze(prefixArgs),
    structured,
  });
}

/** @param {"status" | "complete" | "recover"} command @param {string} success */
function taskControl(command, success) {
  return owner(
    `task:${command}`,
    "scripts/harness/task-control-cli.mjs",
    success,
    `Run the native task-control script with ${command} for focused diagnostics.`,
    [command],
    true,
  );
}

/** @param {"check" | "analyze" | "shadow"} command @param {string} success */
function improvement(command, success) {
  return owner(
    `improve:${command}`,
    "scripts/harness/improvement-cli.mjs",
    success,
    `Run the native improvement analyzer with ${command} for focused diagnostics.`,
    [command],
    true,
  );
}

/** @param {string} source @returns {import("./result.mjs").CommandDetail[]} */
function structuredDetails(source) {
  try {
    const value = JSON.parse(source);
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return Object.entries(value).flatMap(([name, detail]) => {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) return [];
      if (Array.isArray(detail)) {
        return [{ name: detailName(`${name}Count`), value: detail.length }];
      }
      return typeof detail === "string" ||
        typeof detail === "number" ||
        typeof detail === "boolean" ||
        detail === null
        ? [
            {
              name: detailName(name),
              value: detail,
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}

/** @param {string} source @returns {import("./result.mjs").CommandDetail[]} */
function failureDetails(source) {
  const code = source.match(/^Failure code: ([a-z0-9.-]+)$/m)?.[1];
  return code ? [{ name: "failure-code", value: code }] : [];
}

/** @param {string} name */
function detailName(name) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
