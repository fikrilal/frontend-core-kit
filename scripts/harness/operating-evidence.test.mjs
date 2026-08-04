import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  evaluateOperatingProof,
  OperatingEvidenceFailure,
  readOperatingEvidence,
  renderOperatingReport,
  summarizeOperatingEvidence,
} from "./operating-evidence.mjs";

test("reports insufficient evidence without inventing a recommendation", () => {
  const summary = summarizeOperatingEvidence({ schemaVersion: 2, records: [] });
  const assessment = evaluateOperatingProof(summary);

  assert.equal(assessment.status, "insufficient");
  assert.match(assessment.gaps.join(" "), /three reviewed task records/);
  assert.match(assessment.recommendation, /do not expand autonomy/);
});

test("accepts a reviewed, diverse operating sample for human review only", () => {
  const summary = summarizeOperatingEvidence({
    schemaVersion: 2,
    records: [
      record({ id: "task-low", risk: "low", firstPass: true }),
      record({
        id: "task-medium-repair",
        risk: "medium",
        firstPass: false,
        attempts: 2,
        repairOrEscalation: "repair",
        failureBoundary: "full",
      }),
      record({ id: "task-high", risk: "high", humanIntervention: "review" }),
    ],
  });
  const assessment = evaluateOperatingProof(summary);
  const report = renderOperatingReport({ summary, assessment });

  assert.equal(assessment.status, "ready-for-human-review");
  assert.match(report, /Eligible records:\*\* 3/);
  assert.match(report, /Human review may decide/);
  assert.match(report, /Failure boundary — full: 1/);
  assert.match(report, /recorded verification boundary/);
  assert.doesNotMatch(report, /task-medium-repair/);
});

test("rejects missing plan sources and free-form fields", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lamara-evidence-"));
  try {
    write(root, "docs/engineering/harness-operating-evidence.json", {
      schemaVersion: 2,
      records: [record({ plan: "docs/exec-plans/completed/missing.md" })],
    });
    assert.throws(
      () => readOperatingEvidence(root),
      failureWithCode("evidence-record"),
    );

    write(root, "docs/exec-plans/completed/task.md", "# Completed\n");
    write(root, "docs/engineering/harness-operating-evidence.json", {
      schemaVersion: 2,
      records: [
        {
          ...record({ plan: "docs/exec-plans/completed/task.md" }),
          notes: "raw output must not be stored",
        },
      ],
    });
    assert.throws(
      () => readOperatingEvidence(root),
      failureWithCode("evidence-record"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a boundary that is inconsistent with repair state", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lamara-evidence-"));
  try {
    write(root, "docs/exec-plans/completed/task.md", "# Completed\n");
    write(root, "docs/engineering/harness-operating-evidence.json", {
      schemaVersion: 2,
      records: [
        record({
          plan: "docs/exec-plans/completed/task.md",
          repairOrEscalation: "repair",
          failureBoundary: "none",
        }),
      ],
    });
    assert.throws(
      () => readOperatingEvidence(root),
      failureWithCode("evidence-record"),
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function record({
  id = "task-one",
  plan = "docs/exec-plans/completed/task.md",
  risk = "low",
  firstPass = true,
  eventualOutcome = "completed",
  attempts = 1,
  gateDurationSeconds = 30,
  repairOrEscalation = "none",
  failureBoundary = "none",
  humanIntervention = "none",
  falsePositive = false,
  ciReproduced = true,
  independentlyReviewed = true,
} = {}) {
  return {
    id,
    plan,
    risk,
    firstPass,
    eventualOutcome,
    attempts,
    gateDurationSeconds,
    repairOrEscalation,
    failureBoundary,
    humanIntervention,
    falsePositive,
    ciReproduced,
    independentlyReviewed,
  };
}

function write(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

function failureWithCode(code) {
  return (error) =>
    error instanceof OperatingEvidenceFailure && error.failure.code === code;
}
