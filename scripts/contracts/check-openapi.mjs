#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import {
  generateContractSource,
  generateRuntimeContractSource,
  generatedPath,
  hasContractDrift,
  runtimeGeneratedPath,
} from "./contract-tools.mjs";

let temporaryDirectory;

try {
  temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "lamara-contract-check-"),
  );
  const temporaryTypePath = path.join(temporaryDirectory, "generated.ts");
  const temporaryRuntimePath = path.join(
    temporaryDirectory,
    "runtime.generated.ts",
  );
  const [typeSource, runtimeSource] = await Promise.all([
    generateContractSource(),
    generateRuntimeContractSource(),
  ]);
  await Promise.all([
    fs.writeFile(temporaryTypePath, typeSource),
    fs.writeFile(temporaryRuntimePath, runtimeSource),
  ]);

  const [committedTypes, generatedTypes, committedRuntime, generatedRuntime] =
    await Promise.all([
      fs.readFile(generatedPath),
      fs.readFile(temporaryTypePath),
      fs.readFile(runtimeGeneratedPath),
      fs.readFile(temporaryRuntimePath),
    ]);

  if (
    hasContractDrift(committedTypes, generatedTypes) ||
    hasContractDrift(committedRuntime, generatedRuntime)
  ) {
    throw new Error(
      "Generated API contracts are out of date. Run: pnpm contracts:generate",
    );
  }

  console.log("Generated API TypeScript types and Zod schemas are current.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (temporaryDirectory) {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}
