import fs from "node:fs";
import path from "node:path";

import {
  evaluateOperatingProof,
  readOperatingEvidence,
  summarizeOperatingEvidence,
} from "./operating-evidence.mjs";

const ledgerPath = "docs/engineering/harness-improvements.json";
const statuses = new Set(["proposed", "evaluating", "keep", "revert"]);
const targetKinds = new Set(["guide", "sensor", "diagnostic", "controller"]);
const risks = new Set(["low", "medium", "high"]);
const stopFamilies = new Set([
  "preflight",
  "knowledge",
  "scope",
  "contract",
  "architecture",
  "maintainability",
  "behavior",
  "build",
  "runtime",
  "integration",
]);

export function readImprovementLedger(
  root,
  evidence = readOperatingEvidence(root),
) {
  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(path.join(root, ledgerPath), "utf8"));
  } catch {
    throw improvementError(
      "improvement-unreadable",
      "The improvement ledger is missing or invalid JSON.",
      `Restore the tracked ${ledgerPath} file.`,
    );
  }
  validateLedger({ root, ledger, evidence });
  return ledger;
}

export function analyzeImprovement({ evidence, ledger, shadow = false }) {
  const summary = summarizeOperatingEvidence(evidence);
  const assessment = evaluateOperatingProof(summary);
  const evaluating = ledger.hypotheses.filter(
    (hypothesis) => hypothesis.status === "evaluating",
  );
  if (assessment.status !== "ready-for-human-review") {
    return {
      status: "disabled",
      reason: "operating-evidence-insufficient",
      evidenceRecords: summary.recordCount,
      evaluatingHypotheses: evaluating.length,
      decision: null,
    };
  }
  if (!shadow || evaluating.length === 0) {
    return {
      status: evaluating.length === 0 ? "idle" : "eligible",
      reason:
        evaluating.length === 0
          ? "no-evaluating-hypothesis"
          : "human-approved-hypothesis-present",
      evidenceRecords: summary.recordCount,
      evaluatingHypotheses: evaluating.length,
      decision: null,
    };
  }

  const hypothesis = evaluating[0];
  const records = new Map(
    evidence.records.map((record) => [record.id, record]),
  );
  const baseline = hypothesis.baselineTaskIds.map((id) => records.get(id));
  const later = hypothesis.shadowTaskIds.map((id) => records.get(id));
  const baselineRate = repairRate(baseline, hypothesis.patternStopFamily);
  const shadowRate = repairRate(later, hypothesis.patternStopFamily);
  const effectBasisPoints = baselineRate - shadowRate;
  const falsePositives = later.filter((record) => record.falsePositive).length;
  const durationIncreaseSeconds = Math.round(
    average(later.map((record) => record.gateDurationSeconds)) -
      average(baseline.map((record) => record.gateDurationSeconds)),
  );
  const unchangedControls = [...baseline, ...later].every(
    (record) =>
      record.risk === hypothesis.requiredRisk &&
      JSON.stringify(record.selectedLanes) ===
        JSON.stringify(hypothesis.requiredLanes),
  );
  const keep =
    effectBasisPoints >= hypothesis.minimumEffectBasisPoints &&
    falsePositives <= hypothesis.maxFalsePositives &&
    durationIncreaseSeconds <= hypothesis.maxGateDurationIncreaseSeconds &&
    unchangedControls;

  return {
    status: "evaluated",
    reason: keep ? "minimum-effect-met" : "evaluation-contract-not-met",
    evidenceRecords: summary.recordCount,
    evaluatingHypotheses: 1,
    decision: keep ? "keep" : "revert",
    effectBasisPoints,
    falsePositives,
    durationIncreaseSeconds,
    unchangedControls,
  };
}

function validateLedger({ root, ledger, evidence }) {
  if (
    !ledger ||
    ledger.schemaVersion !== 1 ||
    !Array.isArray(ledger.hypotheses)
  ) {
    throw improvementError(
      "improvement-schema",
      "The improvement ledger must use schema version 1 with hypotheses.",
      "Restore the documented bounded ledger shape.",
    );
  }
  if (
    ledger.hypotheses.filter((item) => item?.status === "evaluating").length > 1
  ) {
    throw improvementError(
      "improvement-concurrency",
      "At most one improvement hypothesis may be evaluating.",
      "Finish the current human decision before evaluating another hypothesis.",
    );
  }
  const ids = new Set();
  const evidenceById = new Map(
    evidence.records.map((record) => [record.id, record]),
  );
  for (const hypothesis of ledger.hypotheses) {
    validateHypothesis({ root, hypothesis, evidenceById });
    if (ids.has(hypothesis.id)) {
      throw hypothesisError("Hypothesis identifiers must be unique.");
    }
    ids.add(hypothesis.id);
  }
  const allowedRootKeys = new Set(["schemaVersion", "hypotheses"]);
  if (Object.keys(ledger).some((key) => !allowedRootKeys.has(key))) {
    throw improvementError(
      "improvement-schema",
      "The improvement ledger contains an unapproved root field.",
      "Remove free-form or unapproved fields.",
    );
  }
}

function validateHypothesis({ root, hypothesis, evidenceById }) {
  const allowedKeys = new Set([
    "id",
    "status",
    "patternStopFamily",
    "baselineTaskIds",
    "targetKind",
    "targetPaths",
    "metric",
    "minimumEffectBasisPoints",
    "maxFalsePositives",
    "maxGateDurationIncreaseSeconds",
    "plan",
    "rollbackPaths",
    "shadowTaskIds",
    "requiredRisk",
    "requiredLanes",
  ]);
  if (
    !hypothesis ||
    typeof hypothesis !== "object" ||
    Object.keys(hypothesis).some((key) => !allowedKeys.has(key)) ||
    typeof hypothesis.id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hypothesis.id) ||
    !statuses.has(hypothesis.status) ||
    !targetKinds.has(hypothesis.targetKind) ||
    !stopFamilies.has(hypothesis.patternStopFamily) ||
    hypothesis.metric !== "repair-rate" ||
    !risks.has(hypothesis.requiredRisk)
  ) {
    throw hypothesisError("A hypothesis contains invalid categorical fields.");
  }
  for (const name of ["baselineTaskIds", "shadowTaskIds"]) {
    if (
      !validIds(hypothesis[name]) ||
      hypothesis[name].some((id) => !evidenceById.has(id))
    ) {
      throw hypothesisError(`${name} must cite reviewed operating evidence.`);
    }
  }
  if (
    hypothesis.baselineTaskIds.length < 2 ||
    (hypothesis.status === "evaluating" &&
      hypothesis.shadowTaskIds.length === 0) ||
    hypothesis.baselineTaskIds.some((id) =>
      hypothesis.shadowTaskIds.includes(id),
    )
  ) {
    throw hypothesisError(
      "Baseline and shadow tasks must be sufficient and disjoint.",
    );
  }
  const selected = [
    ...hypothesis.baselineTaskIds,
    ...hypothesis.shadowTaskIds,
  ].map((id) => evidenceById.get(id));
  if (
    selected.some(
      (record) => !record.independentlyReviewed || !record.ciReproduced,
    )
  ) {
    throw hypothesisError(
      "Every evaluation task must be reviewed and CI reproduced.",
    );
  }
  if (
    !Number.isInteger(hypothesis.minimumEffectBasisPoints) ||
    hypothesis.minimumEffectBasisPoints < 0 ||
    hypothesis.minimumEffectBasisPoints > 10_000 ||
    !Number.isInteger(hypothesis.maxFalsePositives) ||
    hypothesis.maxFalsePositives < 0 ||
    !Number.isInteger(hypothesis.maxGateDurationIncreaseSeconds) ||
    hypothesis.maxGateDurationIncreaseSeconds < 0
  ) {
    throw hypothesisError("Effect and cost budgets must be bounded integers.");
  }
  if (
    !safePaths(hypothesis.targetPaths) ||
    !safePaths(hypothesis.rollbackPaths) ||
    !Array.isArray(hypothesis.requiredLanes) ||
    JSON.stringify(hypothesis.requiredLanes) !==
      JSON.stringify(
        hypothesis.requiredRisk === "low" ? ["fast"] : ["full", "runtime"],
      )
  ) {
    throw hypothesisError(
      "Targets, rollback paths, or required lanes are invalid.",
    );
  }
  if (
    typeof hypothesis.plan !== "string" ||
    !/^docs\/exec-plans\/(?:active|completed)\/[a-z0-9_.-]+\.md$/.test(
      hypothesis.plan,
    ) ||
    !fs.existsSync(path.join(root, hypothesis.plan))
  ) {
    throw hypothesisError(
      "The hypothesis must cite an existing execution plan.",
    );
  }
}

function repairRate(records, family) {
  return Math.round(
    (records.filter(
      (record) =>
        record.stopFamily === family && record.repairOrEscalation !== "none",
    ).length /
      records.length) *
      10_000,
  );
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function validIds(value) {
  return (
    Array.isArray(value) &&
    new Set(value).size === value.length &&
    value.every(
      (id) => typeof id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id),
    )
  );
}

function safePaths(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every(
      (item) =>
        typeof item === "string" &&
        !item.startsWith("/") &&
        !item.split("/").includes("..") &&
        !/[\s*?\[\]{}!]/.test(item),
    )
  );
}

function hypothesisError(invariant) {
  return improvementError(
    "improvement-hypothesis",
    invariant,
    "Use only reviewed task IDs and the documented falsifiable contract fields.",
  );
}

function improvementError(code, invariant, remediation) {
  return new ImprovementFailure({ code, invariant, remediation });
}

export class ImprovementFailure extends Error {
  constructor(failure) {
    super(failure.invariant);
    this.failure = failure;
  }
}
