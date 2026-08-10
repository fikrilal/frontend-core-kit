// @ts-check

import process from "node:process";

import { createProcessRunner } from "./process-runner.mjs";
import { failed, passed } from "./result.mjs";

const owners = Object.freeze({
  knowledge: Object.freeze({
    id: "knowledge:check",
    script: "scripts/harness/check-knowledge.mjs",
    success: "Repository knowledge is valid.",
    remediation: "Run pnpm knowledge:check directly for native diagnostics.",
  }),
  contracts: Object.freeze({
    id: "contracts:check",
    script: "scripts/contracts/check-openapi.mjs",
    success: "Generated API contracts are current.",
    remediation: "Run pnpm contracts:check directly for native diagnostics.",
  }),
  risk: Object.freeze({
    id: "risk:classify",
    script: "scripts/harness/classify-risk.mjs",
    success: "Change risk was classified.",
    remediation: "Run pnpm risk:classify directly for native diagnostics.",
  }),
  evidence: Object.freeze({
    id: "evidence:report",
    script: "scripts/harness/operating-evidence-cli.mjs",
    success: "Operating evidence is valid and was summarized.",
    remediation: "Run pnpm harness:evidence directly for native diagnostics.",
  }),
});

/** @typedef {keyof typeof owners} ReadOnlyOwner */

/**
 * @param {ReadOnlyOwner} owner
 * @param {readonly string[]} args
 * @param {{ root?: string, runProcess?: ReturnType<typeof createProcessRunner> }} [options]
 */
export function runOwnedCommand(
  owner,
  args,
  { root = process.cwd(), runProcess = createProcessRunner() } = {},
) {
  const definition = owners[owner];
  const result = runProcess("node", [definition.script, ...args], {
    cwd: root,
  });
  const details = [
    { name: "owner", value: owner },
    { name: "duration-ms", value: result.durationMs },
  ];

  return result.status === 0
    ? passed({ command: definition.id, summary: definition.success, details })
    : failed({
        command: definition.id,
        summary: `${definition.id} failed at its native owner.`,
        details: [
          ...details,
          { name: "exit-code", value: result.status },
          { name: "remediation", value: definition.remediation },
        ],
      });
}
