// @ts-check

import { CliUsageError, passed } from "./result.mjs";

export const helpLines = Object.freeze([
  "Usage: pnpm frontendkit -- <command> [options]",
  "  help       Show this help.",
  "  --json     Emit bounded structured output.",
]);

/** @typedef {"human" | "json"} OutputFormat */

/**
 * @typedef {object} ParsedCommand
 * @property {"help"} kind
 * @property {OutputFormat} format
 */

/**
 * @param {readonly string[]} args
 * @returns {ParsedCommand}
 */
export function parseCommand(args) {
  const values = [...args];
  if (values[0] === "--") values.shift();
  const jsonIndexes = values.flatMap((value, index) =>
    value === "--json" ? [index] : [],
  );
  if (jsonIndexes.length > 1) {
    throw new CliUsageError("Use --json at most once.");
  }
  const format = jsonIndexes.length === 1 ? "json" : "human";
  if (jsonIndexes.length === 1) values.splice(jsonIndexes[0], 1);

  if (values.length === 0 || values[0] === "help" || values[0] === "--help") {
    if (values.length > 1) {
      throw new CliUsageError("The help command accepts no arguments.");
    }
    return { kind: "help", format };
  }

  throw new CliUsageError(`Unknown frontendkit command: ${values[0]}.`);
}

/** @param {ParsedCommand} command */
export function executeCommand(command) {
  switch (command.kind) {
    case "help":
      return passed({
        command: "help",
        summary: "Frontendkit repository harness.",
        details: [
          { name: "usage", value: helpLines[0] },
          { name: "command-help", value: helpLines[1] },
          { name: "option-json", value: helpLines[2] },
        ],
      });
  }
}
