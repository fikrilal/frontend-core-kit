#!/usr/bin/env node

import process from "node:process";

import { readOperatingEvidence } from "./operating-evidence.mjs";
import {
  analyzeImprovement,
  ImprovementFailure,
  readImprovementLedger,
} from "./improvement.mjs";

try {
  const [command, ...rest] = process.argv
    .slice(2)
    .filter((value) => value !== "--");
  if (
    !command ||
    rest.length > 0 ||
    !["check", "analyze", "shadow"].includes(command)
  ) {
    throw new Error("invalid arguments");
  }
  const root = process.cwd();
  const evidence = readOperatingEvidence(root);
  const ledger = readImprovementLedger(root, evidence);
  const result =
    command === "check"
      ? { status: "valid", hypotheses: ledger.hypotheses.length }
      : analyzeImprovement({ evidence, ledger, shadow: command === "shadow" });
  console.log(JSON.stringify(result));
} catch (error) {
  if (error instanceof ImprovementFailure || error?.failure) {
    console.error(`Improvement analysis failed: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    console.error(`Failure code: ${error.failure.code}`);
    process.exit(1);
  }
  console.error(
    "Improvement analysis failed: invalid local command arguments.",
  );
  process.exit(1);
}
