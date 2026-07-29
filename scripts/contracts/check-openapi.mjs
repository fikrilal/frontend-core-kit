#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import {
  generateContractSource,
  generatedPath,
  hasContractDrift,
} from "./contract-tools.mjs";

let temporaryDirectory;

try {
  temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "lamara-contract-check-"),
  );
  const temporaryGeneratedPath = path.join(temporaryDirectory, "generated.ts");
  await fs.writeFile(temporaryGeneratedPath, await generateContractSource());

  const [committed, generated] = await Promise.all([
    fs.readFile(generatedPath),
    fs.readFile(temporaryGeneratedPath),
  ]);

  if (hasContractDrift(committed, generated)) {
    throw new Error(
      "Generated API contract is out of date. Run: pnpm contracts:generate",
    );
  }

  console.log("Generated API contract is current.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (temporaryDirectory) {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}
