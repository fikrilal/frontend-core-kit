import fs from "node:fs";
import path from "node:path";

const evidencePath = "docs/engineering/harness-operating-evidence.json";
const risks = new Set(["low", "medium", "high"]);
const outcomes = new Set(["completed", "blocked"]);
const events = new Set([
  "none",
  "repair",
  "scope",
  "risk",
  "authority",
  "external",
]);
const interventions = new Set([
  "none",
  "review",
  "product",
  "security",
  "tooling",
  "external",
]);

export function readOperatingEvidence(root) {
  const sourcePath = path.join(root, evidencePath);
  let evidence;
  try {
    evidence = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  } catch {
    throw evidenceError(
      "evidence-unreadable",
      "Operating evidence is missing or invalid JSON.",
      `Restore ${evidencePath} from the tracked template.`,
    );
  }
  validateEvidence({ root, evidence });
  return evidence;
}

export function summarizeOperatingEvidence(evidence) {
  const records = evidence.records;
  const riskCounts = countBy(records, (record) => record.risk);
  const outcomeCounts = countBy(records, (record) => record.eventualOutcome);
  const eventCounts = countBy(records, (record) => record.repairOrEscalation);
  const interventionCounts = countBy(
    records,
    (record) => record.humanIntervention,
  );
  const attempts = records.reduce(
    (total, record) => total + record.attempts,
    0,
  );
  const elapsedSeconds = records.reduce(
    (total, record) => total + record.gateDurationSeconds,
    0,
  );

  return {
    recordCount: records.length,
    reviewedCount: records.filter((record) => record.independentlyReviewed)
      .length,
    firstPassCount: records.filter((record) => record.firstPass).length,
    completedCount: records.filter(
      (record) => record.eventualOutcome === "completed",
    ).length,
    ciReproducedCount: records.filter((record) => record.ciReproduced).length,
    falsePositiveCount: records.filter((record) => record.falsePositive).length,
    attempts,
    elapsedSeconds,
    riskCounts,
    outcomeCounts,
    eventCounts,
    interventionCounts,
  };
}

export function evaluateOperatingProof(summary) {
  const gaps = [];
  if (summary.recordCount < 3)
    gaps.push("at least three reviewed task records");
  if (summary.reviewedCount !== summary.recordCount) {
    gaps.push("independent review for every record");
  }
  if (Object.keys(summary.riskCounts).length < 2) {
    gaps.push("at least two observed risk classes");
  }
  if ((summary.riskCounts.medium ?? 0) + (summary.riskCounts.high ?? 0) === 0) {
    gaps.push("at least one medium or high-risk task");
  }
  if (
    ["repair", "scope", "risk", "authority", "external"].every(
      (event) => (summary.eventCounts[event] ?? 0) === 0,
    )
  ) {
    gaps.push("at least one repair or escalation outcome");
  }
  if (
    summary.recordCount === 0 ||
    summary.ciReproducedCount !== summary.recordCount
  ) {
    gaps.push("CI reproduction for every record");
  }

  return gaps.length === 0
    ? {
        status: "ready-for-human-review",
        gaps: [],
        recommendation:
          "Human review may decide whether a narrow Phase 5 proposal is justified; this report changes no harness policy.",
      }
    : {
        status: "insufficient",
        gaps,
        recommendation:
          "Collect the missing independently reviewed evidence; do not expand autonomy or change harness policy.",
      };
}

export function renderOperatingReport({ summary, assessment }) {
  const steering = deriveSteering(summary);
  return [
    "# Harness Operating Evidence Report",
    "",
    `**Status:** ${assessment.status}`,
    `**Eligible records:** ${summary.recordCount}`,
    `**Independently reviewed:** ${summary.reviewedCount}`,
    `**First-pass success:** ${summary.firstPassCount}`,
    `**Eventual completion:** ${summary.completedCount}`,
    `**Total attempts:** ${summary.attempts}`,
    `**Total gate duration:** ${summary.elapsedSeconds}s`,
    `**CI reproduced:** ${summary.ciReproducedCount}`,
    `**False positives:** ${summary.falsePositiveCount}`,
    "",
    "## Observed Categories",
    "",
    renderCounts("Risk", summary.riskCounts),
    renderCounts("Outcome", summary.outcomeCounts),
    renderCounts("Repair or escalation", summary.eventCounts),
    renderCounts("Human intervention", summary.interventionCounts),
    "",
    "## Evidence Gaps",
    "",
    assessment.gaps.length === 0
      ? "- None; human review remains required."
      : assessment.gaps.map((gap) => `- ${gap}`).join("\n"),
    "",
    "## Steering Signals",
    "",
    steering.length === 0
      ? "- None observed; do not infer that the harness is optimal."
      : steering.map((signal) => `- ${signal}`).join("\n"),
    "",
    "## Recommendation",
    "",
    assessment.recommendation,
  ].join("\n");
}

function validateEvidence({ root, evidence }) {
  if (
    !evidence ||
    evidence.schemaVersion !== 1 ||
    !Array.isArray(evidence.records)
  ) {
    throw evidenceError(
      "evidence-schema",
      "Operating evidence must use schema version 1 with a records array.",
      `Copy the tracked ${evidencePath} structure before adding reviewed records.`,
    );
  }
  const ids = new Set();
  for (const record of evidence.records) {
    validateRecord({ root, record });
    if (ids.has(record.id)) {
      throw evidenceError(
        "evidence-duplicate",
        "Operating evidence contains duplicate task identifiers.",
        "Keep exactly one aggregate record for each reviewed task.",
      );
    }
    ids.add(record.id);
  }
}

function validateRecord({ root, record }) {
  if (!record || typeof record !== "object") {
    throw recordError("Each operating-evidence record must be an object.");
  }
  if (
    typeof record.id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)
  ) {
    throw recordError("Task identifiers must be short lower-case slugs.");
  }
  if (
    typeof record.plan !== "string" ||
    !/^docs\/exec-plans\/completed\/[a-z0-9_.-]+\.md$/.test(record.plan) ||
    !fs.existsSync(path.join(root, record.plan))
  ) {
    throw recordError(
      "Each record must cite an existing completed execution plan.",
    );
  }
  if (!risks.has(record.risk) || !outcomes.has(record.eventualOutcome)) {
    throw recordError(
      "Risk and eventual outcome must use the approved categories.",
    );
  }
  if (
    !events.has(record.repairOrEscalation) ||
    !interventions.has(record.humanIntervention)
  ) {
    throw recordError(
      "Repair/escalation and human intervention must use approved categories.",
    );
  }
  for (const name of [
    "firstPass",
    "falsePositive",
    "ciReproduced",
    "independentlyReviewed",
  ]) {
    if (typeof record[name] !== "boolean") {
      throw recordError(
        `${name} must be a boolean without free-form explanation.`,
      );
    }
  }
  for (const name of ["attempts", "gateDurationSeconds"]) {
    if (
      !Number.isInteger(record[name]) ||
      record[name] < (name === "attempts" ? 1 : 0)
    ) {
      throw recordError(`${name} must be a bounded non-negative integer.`);
    }
  }
  if (record.firstPass && record.attempts !== 1) {
    throw recordError("A first-pass task must record exactly one attempt.");
  }
  const allowedKeys = new Set([
    "id",
    "plan",
    "risk",
    "firstPass",
    "eventualOutcome",
    "attempts",
    "gateDurationSeconds",
    "repairOrEscalation",
    "humanIntervention",
    "falsePositive",
    "ciReproduced",
    "independentlyReviewed",
  ]);
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) {
    throw recordError(
      "Operating evidence permits no free-form or unapproved fields.",
    );
  }
}

function countBy(items, valueFor) {
  return Object.fromEntries(
    [...new Set(items.map(valueFor))]
      .toSorted()
      .map((key) => [
        key,
        items.filter((item) => valueFor(item) === key).length,
      ]),
  );
}

function renderCounts(label, counts) {
  const entries = Object.entries(counts);
  return entries.length === 0
    ? `- ${label}: none`
    : entries.map(([key, value]) => `- ${label} — ${key}: ${value}`).join("\n");
}

function deriveSteering(summary) {
  const signals = [];
  if ((summary.eventCounts.repair ?? 0) > 0) {
    signals.push("repair outcomes → harness maintainer: inspect diagnostics");
  }
  if (
    (summary.eventCounts.scope ?? 0) > 0 ||
    (summary.eventCounts.risk ?? 0) > 0 ||
    (summary.eventCounts.authority ?? 0) > 0
  ) {
    signals.push("boundary escalations → human owner: review task policy");
  }
  if ((summary.eventCounts.external ?? 0) > 0) {
    signals.push(
      "external failures → service owner: review external dependency",
    );
  }
  if (summary.falsePositiveCount > 0) {
    signals.push(
      "false positives → harness maintainer and human owner: calibrate sensor",
    );
  }
  if ((summary.interventionCounts.product ?? 0) > 0) {
    signals.push("product interventions → product owner: clarify task intent");
  }
  if ((summary.interventionCounts.security ?? 0) > 0) {
    signals.push(
      "security interventions → security owner: review risk boundary",
    );
  }
  return signals;
}

function recordError(invariant) {
  return evidenceError(
    "evidence-record",
    invariant,
    "Keep only the documented categorical fields and completed-plan source link.",
  );
}

function evidenceError(code, invariant, remediation) {
  return new OperatingEvidenceFailure({ code, invariant, remediation });
}

export class OperatingEvidenceFailure extends Error {
  constructor(failure) {
    super(failure.invariant);
    this.failure = failure;
  }
}
