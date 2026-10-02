// @ts-check

import { CliUsageError, passed } from "./result.mjs";
import { runDoctor } from "./doctor.mjs";
import { runOwnedCommand } from "./owned-commands.mjs";
import { runVerificationProfile, verificationProfiles } from "./profiles.mjs";
import { runRemoveFeature } from "./remove.mjs";
import { runScaffoldFeature } from "./scaffold.mjs";
import {
  parseScaffoldAllArguments,
  parseScaffoldDataArguments,
  runScaffoldAll,
  runScaffoldData,
} from "./scaffold-data.mjs";

const helpLines = Object.freeze([
  "Usage: pnpm frontendkit -- <command> [options]",
  "help — Show this help.",
  "doctor — Inspect local harness readiness.",
  "verify --profile <fast|full|runtime|ci> — Run canonical verification.",
  "knowledge check — Validate repository knowledge.",
  "contracts check — Check generated API contracts.",
  "risk classify --base <rev> --head <rev> — Classify change risk.",
  "evidence check|report — Inspect operating evidence.",
  "task begin|status|verify|complete|recover — Control task lifecycle.",
  "handoff [options] — Run verified handoff preflight.",
  "improve check|analyze|shadow — Analyze controlled improvement.",
  "scaffold feature <name> [options] — Scaffold a new feature skeleton.",
  "scaffold data [options] — Scaffold typed OpenAPI server client adapter.",
  "scaffold all [options] — Scaffold feature and OpenAPI data layer end-to-end.",
  "remove feature <name> [options] — Safely remove a feature and unwire it.",
  "--json — Emit bounded structured output.",
]);

/** @typedef {"human" | "json"} OutputFormat */

/**
 * @typedef {{ kind: "help" | "doctor", format: OutputFormat } | { kind: "verify", format: OutputFormat, profile: import("./profiles.mjs").VerificationProfile } | { kind: "owned", format: OutputFormat, owner: import("./owned-commands.mjs").CommandOwner, args: readonly string[] } | { kind: "scaffold-feature", format: OutputFormat, options: import("./scaffold.mjs").ScaffoldFeatureOptions } | { kind: "scaffold-data", format: OutputFormat, options: import("./scaffold-data.mjs").ScaffoldDataOptions } | { kind: "scaffold-all", format: OutputFormat, options: import("./scaffold-data.mjs").ScaffoldAllOptions } | { kind: "remove-feature", format: OutputFormat, options: import("./remove.mjs").RemoveFeatureOptions }} ParsedCommand
 */

/**
 * @param {readonly string[]} args
 * @returns {ParsedCommand}
 */
export function parseCommand(args) {
  const values = args.filter((value) => value !== "--");
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

  if (values[0] === "doctor") {
    requireLength(values, 1, "The doctor command accepts no arguments.");
    return { kind: "doctor", format };
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

  if (values[0] === "knowledge" && values[1] === "check") {
    requireLength(values, 2, "The knowledge check accepts no arguments.");
    return { kind: "owned", format, owner: "knowledge", args: [] };
  }
  if (values[0] === "contracts" && values[1] === "check") {
    requireLength(values, 2, "The contracts check accepts no arguments.");
    return { kind: "owned", format, owner: "contracts", args: [] };
  }
  if (values[0] === "risk" && values[1] === "classify") {
    return {
      kind: "owned",
      format,
      owner: "risk",
      args: parseRiskArguments(values.slice(2)),
    };
  }
  if (
    values[0] === "evidence" &&
    (values[1] === "check" || values[1] === "report")
  ) {
    requireLength(values, 2, "Evidence inspection accepts no arguments.");
    return { kind: "owned", format, owner: "evidence", args: [] };
  }
  if (values[0] === "task") {
    const taskCommand = values[1];
    if (!taskCommand || !isTaskCommand(taskCommand)) {
      throw new CliUsageError("Use task begin|status|verify|complete|recover.");
    }
    const allowedOptions =
      taskCommand === "begin"
        ? ["--base"]
        : taskCommand === "verify"
          ? ["--base", "--summary"]
          : [];
    return {
      kind: "owned",
      format,
      owner: `task-${taskCommand}`,
      args: parseOptionPairs(
        values.slice(2),
        allowedOptions,
        `task ${taskCommand}`,
      ),
    };
  }
  if (values[0] === "handoff") {
    return {
      kind: "owned",
      format,
      owner: "handoff",
      args: parseHandoffArguments(values.slice(1)),
    };
  }
  if (values[0] === "improve" && isImproveCommand(values[1])) {
    requireLength(values, 2, "Improvement commands accept no arguments.");
    return {
      kind: "owned",
      format,
      owner: `improve-${values[1]}`,
      args: [],
    };
  }
  if (values[0] === "scaffold") {
    if (values[1] === "feature") {
      return {
        kind: "scaffold-feature",
        format,
        options: parseScaffoldFeatureArguments(values.slice(2)),
      };
    }
    if (values[1] === "data") {
      return {
        kind: "scaffold-data",
        format,
        options: parseScaffoldDataArguments(values.slice(2)),
      };
    }
    if (values[1] === "all") {
      return {
        kind: "scaffold-all",
        format,
        options: parseScaffoldAllArguments(values.slice(2)),
      };
    }
    throw new CliUsageError(
      "Use scaffold feature <name> [options], scaffold data [options], or scaffold all [options].",
    );
  }
  if (values[0] === "remove") {
    if (values[1] === "feature") {
      return {
        kind: "remove-feature",
        format,
        options: parseRemoveFeatureArguments(values.slice(2)),
      };
    }
    throw new CliUsageError("Use remove feature <name> [options].");
  }

  throw new CliUsageError(`Unknown frontendkit command: ${values[0]}.`);
}

/** @param {string} value @returns {value is "begin" | "status" | "verify" | "complete" | "recover"} */
function isTaskCommand(value) {
  return ["begin", "status", "verify", "complete", "recover"].includes(value);
}

/** @param {string | undefined} value @returns {value is "check" | "analyze" | "shadow"} */
function isImproveCommand(value) {
  return value !== undefined && ["check", "analyze", "shadow"].includes(value);
}

/**
 * @param {ParsedCommand} command
 * @param {Parameters<typeof runDoctor>[0] & Parameters<typeof runVerificationProfile>[1]} [options]
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
          { name: "command-doctor", value: helpLines[2] },
          { name: "command-verify", value: helpLines[3] },
          { name: "command-knowledge", value: helpLines[4] },
          { name: "command-contracts", value: helpLines[5] },
          { name: "command-risk", value: helpLines[6] },
          { name: "command-evidence", value: helpLines[7] },
          { name: "command-task", value: helpLines[8] },
          { name: "command-handoff", value: helpLines[9] },
          { name: "command-improve", value: helpLines[10] },
          { name: "command-scaffold-feature", value: helpLines[11] },
          { name: "command-scaffold-data", value: helpLines[12] },
          { name: "command-scaffold-all", value: helpLines[13] },
          { name: "command-remove-feature", value: helpLines[14] },
          { name: "option-json", value: helpLines[15] },
        ],
      });
    case "doctor":
      return runDoctor(options);
    case "verify":
      return runVerificationProfile(command.profile, options);
    case "scaffold-feature":
      return runScaffoldFeature(command.options, options);
    case "scaffold-data":
      return runScaffoldData(command.options, options);
    case "scaffold-all":
      return runScaffoldAll(command.options, options);
    case "remove-feature":
      return runRemoveFeature(command.options, options);
    case "owned":
      return runOwnedCommand(command.owner, command.args, options);
  }
}

/** @param {string} value @returns {value is import("./profiles.mjs").VerificationProfile} */
function isVerificationProfile(value) {
  return Object.hasOwn(verificationProfiles, value);
}

/** @param {readonly string[]} values */
function parseRiskArguments(values) {
  if (
    values.length !== 4 ||
    values.filter((value) => value === "--base").length !== 1 ||
    values.filter((value) => value === "--head").length !== 1
  ) {
    throw new CliUsageError(
      "Use risk classify --base <revision> --head <revision>.",
    );
  }
  for (let index = 0; index < values.length; index += 2) {
    if (
      !["--base", "--head"].includes(values[index]) ||
      !values[index + 1] ||
      values[index + 1].startsWith("--")
    ) {
      throw new CliUsageError(
        "Use risk classify --base <revision> --head <revision>.",
      );
    }
  }
  return values;
}

/** @param {readonly string[]} values @param {number} expected @param {string} message */
function requireLength(values, expected, message) {
  if (values.length !== expected) throw new CliUsageError(message);
}

/** @param {readonly string[]} values @param {readonly string[]} allowed @param {string} command */
function parseOptionPairs(values, allowed, command) {
  if (values.length % 2 !== 0) {
    throw new CliUsageError(`${command} received incomplete options.`);
  }
  const seen = new Set();
  for (let index = 0; index < values.length; index += 2) {
    const option = values[index];
    const value = values[index + 1];
    if (
      !allowed.includes(option) ||
      seen.has(option) ||
      !value ||
      value.startsWith("--")
    ) {
      throw new CliUsageError(`${command} received invalid options.`);
    }
    seen.add(option);
  }
  return values;
}

/** @param {readonly string[]} values */
function parseHandoffArguments(values) {
  const output = [];
  const seen = new Set();
  for (let index = 0; index < values.length; index += 1) {
    const option = values[index];
    if (option === "--dry-run") {
      if (seen.has(option))
        throw new CliUsageError("handoff received duplicate options.");
      seen.add(option);
      output.push(option);
      continue;
    }
    if (
      !["--base", "--head", "--title", "--pr"].includes(option) ||
      seen.has(option)
    ) {
      throw new CliUsageError("handoff received invalid options.");
    }
    const value = values[index + 1];
    if (!value || value.startsWith("--")) {
      throw new CliUsageError("handoff received incomplete options.");
    }
    seen.add(option);
    output.push(option, value);
    index += 1;
  }
  return output;
}

/**
 * @param {readonly string[]} values
 * @returns {import("./scaffold.mjs").ScaffoldFeatureOptions}
 */
function parseScaffoldFeatureArguments(values) {
  let feature = "";
  let slice;
  /** @type {"authenticated" | "marketing"} */
  let kind = "authenticated";
  let dryRun = false;
  let force = false;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") {
      dryRun = true;
    } else if (value === "--force") {
      force = true;
    } else if (value === "--slice") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --slice option requires a value.");
      }
      slice = next;
    } else if (value === "--kind") {
      index += 1;
      const next = values[index];
      if (next !== "authenticated" && next !== "marketing") {
        throw new CliUsageError(
          "The --kind option must be authenticated or marketing.",
        );
      }
      kind = next;
    } else if (value.startsWith("--")) {
      throw new CliUsageError(`Unknown scaffold feature option: ${value}.`);
    } else {
      if (feature) {
        throw new CliUsageError("Unexpected multiple feature arguments.");
      }
      feature = value;
    }
  }

  if (!feature) {
    throw new CliUsageError("Missing required feature name.");
  }

  return { feature, slice, kind, dryRun, force };
}

/**
 * @param {readonly string[]} values
 * @returns {import("./remove.mjs").RemoveFeatureOptions}
 */
function parseRemoveFeatureArguments(values) {
  let feature = "";
  let slice;
  let dryRun = false;
  let forceCore = false;
  let yes = false;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") {
      dryRun = true;
    } else if (value === "--force-core") {
      forceCore = true;
    } else if (value === "--yes") {
      yes = true;
    } else if (value === "--slice") {
      index += 1;
      const next = values[index];
      if (!next || next.startsWith("--")) {
        throw new CliUsageError("The --slice option requires a value.");
      }
      slice = next;
    } else if (value.startsWith("--")) {
      throw new CliUsageError(`Unknown remove feature option: ${value}.`);
    } else {
      if (feature) {
        throw new CliUsageError("Unexpected multiple feature arguments.");
      }
      feature = value;
    }
  }

  if (!feature) {
    throw new CliUsageError("Missing required feature name.");
  }

  return { feature, slice, dryRun, forceCore, yes };
}
