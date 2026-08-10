import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeImprovement,
  ImprovementFailure,
  readImprovementLedger,
} from "./improvement.mjs";

test("keeps the real-style insufficient state disabled with no hypothesis", () => {
  const evidence = {
    schemaVersion: 3,
    records: [
      record({ id: "one", risk: "high" }),
      record({ id: "two", risk: "high" }),
      record({ id: "three", risk: "high", repair: true }),
    ],
  };
  const result = analyzeImprovement({
    evidence,
    ledger: { schemaVersion: 1, hypotheses: [] },
    shadow: true,
  });

  assert.equal(result.status, "disabled");
  assert.equal(result.reason, "operating-evidence-insufficient");
  assert.equal(result.decision, null);
});

test("deterministically recommends keep or revert without mutation", () => {
  const fixture = createFixture();
  try {
    const evidence = eligibleEvidence();
    writeJson(fixture.ledgerPath, {
      schemaVersion: 1,
      hypotheses: [hypothesis()],
    });
    const before = fs.readFileSync(fixture.ledgerPath, "utf8");
    const ledger = readImprovementLedger(fixture.root, evidence);
    const keep = analyzeImprovement({ evidence, ledger, shadow: true });
    const revertEvidence = eligibleEvidence();
    const repairedShadow = revertEvidence.records.find(
      (record) => record.id === "shadow-one",
    );
    repairedShadow.repairOrEscalation = "repair";
    repairedShadow.stopFamily = "integration";
    const revert = analyzeImprovement({
      evidence: revertEvidence,
      ledger: {
        ...ledger,
        hypotheses: [
          { ...ledger.hypotheses[0], minimumEffectBasisPoints: 10_000 },
        ],
      },
      shadow: true,
    });

    assert.equal(keep.decision, "keep");
    assert.equal(keep.effectBasisPoints, 10_000);
    assert.equal(revert.decision, "revert");
    assert.equal(fs.readFileSync(fixture.ledgerPath, "utf8"), before);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("fails closed for privacy fields and multiple evaluating hypotheses", () => {
  const fixture = createFixture();
  try {
    const evidence = eligibleEvidence();
    writeJson(fixture.ledgerPath, {
      schemaVersion: 1,
      hypotheses: [{ ...hypothesis(), notes: "raw review prose" }],
    });
    assert.throws(
      () => readImprovementLedger(fixture.root, evidence),
      failureWithCode("improvement-hypothesis"),
    );
    writeJson(fixture.ledgerPath, {
      schemaVersion: 1,
      hypotheses: [hypothesis(), { ...hypothesis(), id: "second" }],
    });
    assert.throws(
      () => readImprovementLedger(fixture.root, evidence),
      failureWithCode("improvement-concurrency"),
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

function eligibleEvidence() {
  return {
    schemaVersion: 3,
    records: [
      record({ id: "baseline-one", risk: "medium", repair: true }),
      record({ id: "baseline-two", risk: "medium", repair: true }),
      record({ id: "shadow-one", risk: "medium" }),
      record({ id: "shadow-two", risk: "medium" }),
      record({ id: "diverse-high", risk: "high" }),
    ],
  };
}

function hypothesis() {
  return {
    id: "better-diagnostic",
    status: "evaluating",
    patternStopFamily: "integration",
    baselineTaskIds: ["baseline-one", "baseline-two"],
    targetKind: "diagnostic",
    targetPaths: ["tools/frontendkit/"],
    metric: "repair-rate",
    minimumEffectBasisPoints: 5_000,
    maxFalsePositives: 0,
    maxGateDurationIncreaseSeconds: 5,
    plan: "docs/exec-plans/active/improvement.md",
    rollbackPaths: ["tools/frontendkit/"],
    shadowTaskIds: ["shadow-one", "shadow-two"],
    requiredRisk: "medium",
    requiredLanes: ["full", "runtime"],
  };
}

function record({ id, risk, repair = false }) {
  return {
    id,
    risk,
    repairOrEscalation: repair ? "repair" : "none",
    stopFamily: repair ? "integration" : "none",
    falsePositive: false,
    gateDurationSeconds: repair ? 30 : 30,
    selectedLanes: risk === "low" ? ["fast"] : ["full", "runtime"],
    independentlyReviewed: true,
    ciReproduced: true,
    firstPass: !repair,
    eventualOutcome: "completed",
    attempts: repair ? 2 : 1,
    failureBoundary: repair ? "full" : "none",
    humanIntervention: "review",
  };
}

function createFixture() {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "frontendkit-improvement-"),
  );
  writeText(
    path.join(root, "docs/exec-plans/active/improvement.md"),
    "# Improvement\n",
  );
  return {
    root,
    ledgerPath: path.join(root, "docs/engineering/harness-improvements.json"),
  };
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function failureWithCode(code) {
  return (error) =>
    error instanceof ImprovementFailure && error.failure.code === code;
}
