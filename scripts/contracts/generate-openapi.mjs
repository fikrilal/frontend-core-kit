#!/usr/bin/env node

import process from "node:process";

import {
  generateContractSource,
  generatedPath,
  writeFileAtomic,
} from "./contract-tools.mjs";

try {
  const source = await generateContractSource();
  await writeFileAtomic(generatedPath, source);
  console.log("Generated src/contracts/lamara-api/generated.ts.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
