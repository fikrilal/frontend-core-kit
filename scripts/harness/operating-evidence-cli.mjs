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
  const summaryJson = process.argv.slice(2).includes("--summary-json");
  if (
    process.argv.slice(2).some((argument) => argument !== "--summary-json") ||
    process.argv.slice(2).filter((argument) => argument === "--summary-json")
      .length > 1
  ) {
    throw new Error("This command accepts no arguments.");
  }
  const evidence = readOperatingEvidence(process.cwd());
  const summary = summarizeOperatingEvidence(evidence);
  const assessment = evaluateOperatingProof(summary);
  console.log(
    summaryJson
      ? JSON.stringify({
          status: assessment.status,
          records: summary.recordCount,
          reviewed: summary.reviewedCount,
          riskClasses: Object.keys(summary.riskCounts).length,
          repairs: summary.eventCounts.repair ?? 0,
          falsePositives: summary.falsePositiveCount,
          gaps: assessment.gaps.length,
        })
      : renderOperatingReport({ summary, assessment }),
  );
} catch (error) {
  if (error instanceof OperatingEvidenceFailure) {
    console.error(`Operating evidence failed: ${error.failure.invariant}`);
    console.error(`Remediation: ${error.failure.remediation}`);
    console.error(`Failure code: ${error.failure.code}`);
    process.exit(1);
  }
  console.error("Operating evidence failed: invalid local command arguments.");
  process.exit(1);
}
