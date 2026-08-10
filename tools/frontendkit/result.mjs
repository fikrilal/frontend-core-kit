// @ts-check

const maximumSummaryLength = 500;
const maximumDetailLength = 2_000;
const safeDetailName = /^[a-z][a-z0-9-]*$/;

export const exitCodes = Object.freeze({
  success: 0,
  failure: 1,
  usage: 2,
});

/** @typedef {"passed" | "failed"} CommandStatus */

/**
 * @typedef {object} CommandDetail
 * @property {string} name
 * @property {string | number | boolean | null} value
 */

/**
 * @typedef {object} CommandResult
 * @property {1} schemaVersion
 * @property {string} command
 * @property {CommandStatus} status
 * @property {string} summary
 * @property {readonly CommandDetail[]} details
 */

/**
 * @param {{ command: string, summary: string, details?: readonly CommandDetail[] }} input
 * @returns {CommandResult}
 */
export function passed(input) {
  return result({ ...input, status: "passed" });
}

/**
 * @param {{ command: string, summary: string, details?: readonly CommandDetail[] }} input
 * @returns {CommandResult}
 */
export function failed(input) {
  return result({ ...input, status: "failed" });
}

/**
 * @param {CommandResult} value
 * @returns {string}
 */
export function renderJson(value) {
  return `${JSON.stringify(validateResult(value), null, 2)}\n`;
}

/**
 * @param {CommandResult} value
 * @returns {string}
 */
export function renderHuman(value) {
  const checked = validateResult(value);
  const lines = [checked.summary];
  for (const detail of checked.details) {
    lines.push(`${detail.name}: ${String(detail.value)}`);
  }
  return `${lines.join("\n")}\n`;
}

export class CliUsageError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "CliUsageError";
  }
}

/**
 * @param {{ command: string, status: CommandStatus, summary: string, details?: readonly CommandDetail[] }} input
 * @returns {CommandResult}
 */
function result({ command, status, summary, details = [] }) {
  return validateResult({
    schemaVersion: 1,
    command,
    status,
    summary,
    details,
  });
}

/**
 * @param {CommandResult} value
 * @returns {CommandResult}
 */
function validateResult(value) {
  if (!/^[a-z][a-z0-9:-]*$/.test(value.command)) {
    throw new Error("Frontendkit result has an invalid command identifier.");
  }
  if (value.status !== "passed" && value.status !== "failed") {
    throw new Error("Frontendkit result has an invalid status.");
  }
  assertBoundedText(value.summary, "summary", maximumSummaryLength);
  if (!Array.isArray(value.details) || value.details.length > 50) {
    throw new Error("Frontendkit result has invalid details.");
  }
  for (const detail of value.details) validateDetail(detail);
  return value;
}

/** @param {CommandDetail} detail */
function validateDetail(detail) {
  if (!safeDetailName.test(detail.name)) {
    throw new Error("Frontendkit result has an invalid detail name.");
  }
  if (typeof detail.value === "string") {
    assertBoundedText(detail.value, detail.name, maximumDetailLength);
    return;
  }
  if (
    detail.value !== null &&
    typeof detail.value !== "number" &&
    typeof detail.value !== "boolean"
  ) {
    throw new Error("Frontendkit result has an invalid detail value.");
  }
}

/** @param {string} value @param {string} label @param {number} maximum */
function assertBoundedText(value, label, maximum) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum
  ) {
    throw new Error(`Frontendkit result has an invalid ${label}.`);
  }
}
