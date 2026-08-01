#!/usr/bin/env node

import process from "node:process";

import { collectKnowledgeViolations } from "./knowledge-tools.mjs";

const violations = collectKnowledgeViolations(process.cwd());

if (violations.length > 0) {
  console.error("Knowledge check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Knowledge check passed.");
