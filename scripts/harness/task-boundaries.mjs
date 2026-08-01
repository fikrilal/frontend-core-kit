import path from "node:path";

const riskOrder = Object.freeze({ low: 0, medium: 1, high: 2 });
const validRisks = new Set(Object.keys(riskOrder));
const validActions = new Set([
  "plan",
  "edit",
  "verify",
  "commit",
  "push",
  "draft-pr",
  "update-pr",
  "merge",
  "deploy",
]);

export function parseTaskBoundaries(source) {
  const allowedPaths = parseListMetadata(source, "Allowed paths").map(
    normalizeAllowedPath,
  );
  const allowedActions = parseListMetadata(source, "Allowed actions");
  const maximumRisk = requiredMetadata(source, "Maximum risk").toLowerCase();
  const repairLimit = parseRepairLimit(
    requiredMetadata(source, "Repair limit"),
  );

  if (allowedPaths.length === 0) {
    throw boundaryError(
      "allowed-paths-empty",
      "Task boundaries must declare at least one allowed path.",
      "Add narrow repository-relative files or directory prefixes to **Allowed paths:**.",
    );
  }
  if (new Set(allowedPaths).size !== allowedPaths.length) {
    throw boundaryError(
      "allowed-paths-duplicate",
      "Task boundaries contain duplicate allowed paths.",
      "Keep each allowed file or directory prefix only once.",
    );
  }
  if (allowedActions.length === 0) {
    throw boundaryError(
      "allowed-actions-empty",
      "Task boundaries must declare at least one allowed action.",
      "Add explicit actions to **Allowed actions:**.",
    );
  }
  if (new Set(allowedActions).size !== allowedActions.length) {
    throw boundaryError(
      "allowed-actions-duplicate",
      "Task boundaries contain duplicate allowed actions.",
      "Keep each allowed action only once.",
    );
  }
  for (const action of allowedActions) {
    if (!validActions.has(action)) {
      throw boundaryError(
        "allowed-action-invalid",
        "Task boundaries contain an unsupported action.",
        `Use one of: ${[...validActions].join(", ")}.`,
      );
    }
  }
  if (!validRisks.has(maximumRisk)) {
    throw boundaryError(
      "maximum-risk-invalid",
      "Task boundaries must declare a valid maximum risk.",
      "Use low, medium, or high for **Maximum risk:**.",
    );
  }

  return {
    allowedPaths,
    allowedActions,
    maximumRisk,
    repairLimit,
  };
}

export function assertActionAllowed(boundaries, action) {
  if (!boundaries.allowedActions.includes(action)) {
    throw boundaryError(
      "action-not-authorized",
      `The active task plan does not authorize the ${action} action.`,
      `Add ${action} to **Allowed actions:** only with explicit human authority.`,
    );
  }
}

export function assertRiskAllowed(boundaries, risk) {
  if (riskOrder[risk] > riskOrder[boundaries.maximumRisk]) {
    throw boundaryError(
      "risk-escalation",
      "Changed paths raise task risk beyond the active plan's maximum authority.",
      "Obtain human approval for a higher maximum risk before continuing.",
    );
  }
}

export function findScopeViolations(paths, allowedPaths) {
  return paths.filter(
    (filePath) =>
      !allowedPaths.some((allowedPath) =>
        allowedPath.endsWith("/")
          ? filePath.startsWith(allowedPath)
          : filePath === allowedPath,
      ),
  );
}

function boundaryError(code, invariant, remediation) {
  return new TaskBoundaryFailure({ code, invariant, remediation });
}

export class TaskBoundaryFailure extends Error {
  constructor(failure) {
    super(failure.invariant);
    this.failure = failure;
  }
}

function parseListMetadata(source, name) {
  const value = requiredMetadata(source, name);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function requiredMetadata(source, name) {
  const value = metadataValue(source, name);
  if (!value) {
    throw boundaryError(
      "boundary-metadata-missing",
      `Task boundaries are missing **${name}:**.`,
      "Copy the current execution-plan template and provide explicit values.",
    );
  }
  return value;
}

function normalizeAllowedPath(value) {
  const normalized = value.replaceAll("\\", "/");
  if (
    normalized === "." ||
    normalized.startsWith("./") ||
    path.posix.isAbsolute(normalized) ||
    normalized.split("/").includes("..") ||
    /[\s*?\[\]{}!]/.test(normalized)
  ) {
    throw boundaryError(
      "allowed-path-invalid",
      "Task boundaries contain a broad, escaping, or ambiguous allowed path.",
      "Use a narrow repository-relative file or directory prefix without globs.",
    );
  }
  return normalized;
}

function parseRepairLimit(value) {
  if (!/^\d+$/.test(value)) {
    throw boundaryError(
      "repair-limit-invalid",
      "Task boundaries must declare a whole-number repair limit.",
      "Use a non-negative integer for **Repair limit:**.",
    );
  }
  return Number(value);
}

function metadataValue(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    source
      .match(new RegExp(`^\\*\\*${escapedName}:\\*\\*\\s*(.+)$`, "m"))?.[1]
      ?.trim() ?? null
  );
}
