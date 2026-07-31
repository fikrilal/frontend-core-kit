#!/usr/bin/env node

import process from "node:process";

import {
  evaluateOperatingProof,
  OperatingEvidenceFailure,
  readOperatingEvidence,
  renderOperatingReport,
  summarizeOperatingEvidence,
} from "./operating-evidence.mjs";

try {
  if (process.argv.length > 2) {
    throw new Error("This command accepts no arguments.");
  }
  const evidence = readOperatingEvidence(process.cwd());
  const summary = summarizeOperatingEvidence(evidence);
  const assessment = evaluateOperatingProof(summary);
  console.log(renderOperatingReport({ summary, assessment }));
} catch (error) {
  if (error instanceof OperatingEvidenceFailure) {
    console.error(`Operating evidence failed: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    process.exit(1);
  }
  console.error("Operating evidence failed: invalid local command arguments.");
  process.exit(1);
}
