#!/usr/bin/env node

import process from "node:process";

import { evaluateRequiredCi } from "./risk-classifier.mjs";

const outcome = evaluateRequiredCi({
  risk: process.env.CI_EFFECTIVE_RISK,
  riskResult: process.env.CI_RISK_RESULT,
  verifyResult: process.env.CI_VERIFY_RESULT,
  runtimeResult: process.env.CI_RUNTIME_RESULT,
});

console.log(outcome.reason);
if (!outcome.passed) {
  process.exit(1);
}
