#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";

import {
  assertOpenApiSnapshot,
  parseSyncArguments,
  provenancePath,
  readSourceProvenance,
  snapshotPath,
  writeFileAtomic,
} from "./contract-tools.mjs";

try {
  const { sourcePath } = parseSyncArguments(process.argv.slice(2));
  const contents = await fs.readFile(sourcePath);
  assertOpenApiSnapshot(contents);

  const provenance = await readSourceProvenance(sourcePath, contents);
  await writeFileAtomic(snapshotPath, contents);
  await writeFileAtomic(
    provenancePath,
    `${JSON.stringify(provenance, null, 2)}\n`,
  );

  console.log(
    `Synced ${provenance.sourcePath} from ${provenance.sourceCommit.slice(0, 12)} (${provenance.sha256}).`,
  );
  console.log("Run pnpm contracts:generate to update generated types.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
