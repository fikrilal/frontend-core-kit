#!/usr/bin/env node

import fs from "node:fs";
import process from "node:process";

import {
  classifyRisk,
  formatRiskSummary,
  gitChangedPaths,
  loadChangedPlanDocuments,
} from "./risk-classifier.mjs";

try {
  const options = parseArguments(process.argv.slice(2));
  const changedPaths = gitChangedPaths({
    root: process.cwd(),
    base: options.base,
    head: options.head,
  });
  const planDocuments = loadChangedPlanDocuments(process.cwd(), changedPaths);
  const classification = classifyRisk({ changedPaths, planDocuments });

  if (options.githubOutput) {
    appendGithubOutput(options.githubOutput, classification);
  }
  if (options.githubSummary) {
    fs.appendFileSync(
      options.githubSummary,
      formatRiskSummary(classification),
      "utf8",
    );
  }

  console.log(JSON.stringify(classification, null, 2));
} catch (error) {
  console.error(
    `Risk classification failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") continue;
    if (
      !["--base", "--head", "--github-output", "--github-summary"].includes(
        argument,
      )
    ) {
      throw new Error(`Unknown argument "${argument}".`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value.`);
    }
    options[
      argument
        .slice(2)
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    ] = value;
    index += 1;
  }

  if (!options.base || !options.head) {
    throw new Error("Both --base and --head are required.");
  }
  return options;
}

function appendGithubOutput(filePath, classification) {
  const values = {
    risk: classification.risk,
    path_risk: classification.pathRisk,
    declared_risk: classification.declaredRisk ?? "none",
    changed_count: String(classification.changedPaths.length),
  };
  fs.appendFileSync(
    filePath,
    `${Object.entries(values)
      .map(([name, value]) => `${name}=${value}`)
      .join("\n")}\n`,
    "utf8",
  );
}
