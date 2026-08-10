// @ts-check

import { CliUsageError, passed } from "./result.mjs";
import { runVerificationProfile, verificationProfiles } from "./profiles.mjs";

const helpLines = Object.freeze([
  "Usage: pnpm frontendkit -- <command> [options]",
  "  help                                Show this help.",
  "  verify --profile <fast|full|runtime|ci>",
  "                                      Run a canonical verification profile.",
  "  --json                              Emit bounded structured output.",
]);

/** @typedef {"human" | "json"} OutputFormat */

/**
 * @typedef {{ kind: "help", format: OutputFormat } | { kind: "verify", format: OutputFormat, profile: import("./profiles.mjs").VerificationProfile }} ParsedCommand
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

  if (values[0] === "verify") {
    if (values.length !== 3 || values[1] !== "--profile") {
      throw new CliUsageError("Use verify --profile <fast|full|runtime|ci>.");
    }
    const profile = values[2];
    if (!isVerificationProfile(profile)) {
      throw new CliUsageError(`Unknown verification profile: ${profile}.`);
    }
    return { kind: "verify", format, profile };
  }

  throw new CliUsageError(`Unknown frontendkit command: ${values[0]}.`);
}

/**
 * @param {ParsedCommand} command
 * @param {Parameters<typeof runVerificationProfile>[1]} [options]
 */
export function executeCommand(command, options) {
  switch (command.kind) {
    case "help":
      return passed({
        command: "help",
        summary: "Frontendkit repository harness.",
        details: [
          { name: "usage", value: helpLines[0] },
          { name: "command-help", value: helpLines[1] },
          { name: "command-verify", value: helpLines[2] },
          { name: "option-json", value: helpLines[4] },
        ],
      });
    case "verify":
      return runVerificationProfile(command.profile, options);
  }
}

/** @param {string} value @returns {value is import("./profiles.mjs").VerificationProfile} */
function isVerificationProfile(value) {
  return Object.hasOwn(verificationProfiles, value);
}
