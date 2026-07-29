#!/usr/bin/env node

import process from "node:process";

import {
  generateContractSource,
  generateRuntimeContractSource,
  generatedPath,
  runtimeGeneratedPath,
  writeFileAtomic,
} from "./contract-tools.mjs";

try {
  const [typeSource, runtimeSource] = await Promise.all([
    generateContractSource(),
    generateRuntimeContractSource(),
  ]);
  await Promise.all([
    writeFileAtomic(generatedPath, typeSource),
    writeFileAtomic(runtimeGeneratedPath, runtimeSource),
  ]);
  console.log("Generated Lamara API TypeScript types and Zod schemas.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
