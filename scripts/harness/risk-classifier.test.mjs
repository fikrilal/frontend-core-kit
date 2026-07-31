import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  classifyPath,
  classifyRisk,
  evaluateRequiredCi,
  formatRiskSummary,
  gitChangedPaths,
} from "./risk-classifier.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("keeps documentation-only work low when the plan declares low risk", () => {
  const planPath = "docs/exec-plans/active/plan.md";
  const result = classifyRisk({
    changedPaths: ["docs/README.md", planPath],
    planDocuments: [{ path: planPath, source: plan("low") }],
  });

  assert.equal(result.risk, "low");
  assert.equal(result.pathRisk, "low");
  assert.equal(result.declaredRisk, "low");
});

test("raises low declarations for high-risk paths", () => {
  const planPath = "docs/exec-plans/active/plan.md";
  const result = classifyRisk({
    changedPaths: ["src/features/auth/login-action.ts", planPath],
    planDocuments: [{ path: planPath, source: plan("low") }],
  });

  assert.equal(result.risk, "high");
  assert(
    result.reasons.some(
      (reason) => reason.path === "src/features/auth/login-action.ts",
    ),
  );
});

test("keeps a high plan declaration for medium paths", () => {
  const planPath = "docs/exec-plans/completed/plan.md";
  const result = classifyRisk({
    changedPaths: ["src/features/marketing/home-page.tsx", planPath],
    planDocuments: [{ path: planPath, source: plan("high") }],
  });

  assert.equal(result.pathRisk, "medium");
  assert.equal(result.declaredRisk, "high");
  assert.equal(result.risk, "high");
});

test("includes the active plan risk even when that plan is unchanged", () => {
  const activePlanPath = "docs/exec-plans/active/plan.md";
  const result = classifyRisk({
    changedPaths: ["docs/README.md"],
    activePlanDocument: { path: activePlanPath, source: plan("high") },
  });

  assert.equal(result.pathRisk, "low");
  assert.equal(result.declaredRisk, "high");
  assert.equal(result.risk, "high");
  assert.deepEqual(result.reasons, [
    {
      path: activePlanPath,
      risk: "high",
      rule: "active execution-plan declaration",
    },
  ]);
});

test("defaults unknown paths to medium and rejects paths outside the repository", () => {
  assert.deepEqual(classifyPath("unrecognized.file"), {
    path: "unrecognized.file",
    risk: "medium",
    rule: "unknown path",
  });
  assert.throws(
    () => classifyPath("../outside"),
    /must stay inside the repository/,
  );
});

test("requires changed execution plans to provide valid V1/V2 risk", () => {
  const planPath = "docs/exec-plans/active/plan.md";

  assert.throws(
    () => classifyRisk({ changedPaths: [planPath] }),
    /must exist at the target revision/,
  );
  assert.throws(
    () =>
      classifyRisk({
        changedPaths: [planPath],
        planDocuments: [{ path: planPath, source: "# Old plan\n" }],
      }),
    /Plan version/,
  );
  assert.throws(
    () =>
      classifyRisk({
        changedPaths: [planPath],
        planDocuments: [{ path: planPath, source: plan("extreme") }],
      }),
    /valid "\*\*Risk:\*\*"/,
  );
});

test("accepts only allowlisted legacy completed plans without v1 metadata", () => {
  const legacyPath =
    "docs/exec-plans/completed/2026-07-30_generic-auth-session-foundation.md";
  const result = classifyRisk({
    changedPaths: [legacyPath],
    planDocuments: [{ path: legacyPath, source: "# Legacy completed plan\n" }],
  });

  assert.equal(result.risk, "low");
  assert.equal(result.declaredRisk, null);
  assert.throws(
    () =>
      classifyRisk({
        changedPaths: ["docs/exec-plans/completed/new-plan.md"],
        planDocuments: [
          {
            path: "docs/exec-plans/completed/new-plan.md",
            source: "# New completed plan\n",
          },
        ],
      }),
    /Plan version/,
  );
});

test("renders a bounded summary without plan contents", () => {
  const classification = classifyRisk({
    changedPaths: ["src/server/api/client.ts"],
  });
  const summary = formatRiskSummary(classification);

  assert.match(summary, /Effective/);
  assert.match(summary, /src\/server\/api\/client\.ts/);
  assert.doesNotMatch(summary, /LAMARA_API_BASE_URL/);
});

test("computes changed paths from real git revisions without shell interpolation", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lamara-risk-git-"));
  try {
    git(root, "init");
    git(root, "config", "user.email", "test@example.com");
    git(root, "config", "user.name", "Test User");
    fs.writeFileSync(path.join(root, "README.md"), "first\n");
    git(root, "add", "README.md");
    git(root, "commit", "-m", "first");
    const base = git(root, "rev-parse", "HEAD").trim();
    fs.mkdirSync(path.join(root, "src"));
    fs.writeFileSync(path.join(root, "src/app.ts"), "export {};\n");
    git(root, "add", "src/app.ts");
    git(root, "commit", "-m", "second");
    const head = git(root, "rev-parse", "HEAD").trim();

    assert.deepEqual(gitChangedPaths({ root, base, head }), ["src/app.ts"]);
    assert.deepEqual(
      gitChangedPaths({ root, base: "0".repeat(40), head }).toSorted(),
      ["README.md", "src/app.ts"],
    );
    assert.throws(
      () => gitChangedPaths({ root, base: "--output=/tmp/no", head }),
      /Invalid base revision/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("writes GitHub outputs and a compact summary from revision evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lamara-risk-cli-"));
  try {
    git(root, "init");
    git(root, "config", "user.email", "test@example.com");
    git(root, "config", "user.name", "Test User");
    fs.writeFileSync(path.join(root, "README.md"), "first\n");
    git(root, "add", "README.md");
    git(root, "commit", "-m", "first");
    const base = git(root, "rev-parse", "HEAD").trim();
    fs.writeFileSync(path.join(root, "README.md"), "second\n");
    git(root, "add", "README.md");
    git(root, "commit", "-m", "second");
    const head = git(root, "rev-parse", "HEAD").trim();
    const outputPath = path.join(root, "github-output.txt");
    const summaryPath = path.join(root, "github-summary.md");

    execFileSync(
      process.execPath,
      [
        path.join(repositoryRoot, "scripts/harness/classify-risk.mjs"),
        "--base",
        base,
        "--head",
        head,
        "--github-output",
        outputPath,
        "--github-summary",
        summaryPath,
      ],
      { cwd: root, encoding: "utf8" },
    );

    assert.match(fs.readFileSync(outputPath, "utf8"), /^risk=low$/m);
    assert.match(fs.readFileSync(summaryPath, "utf8"), /Changed paths \|/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("requires the correct aggregate outcomes for every risk tier", () => {
  assert.equal(
    evaluateRequiredCi({
      risk: "low",
      riskResult: "success",
      verifyResult: "success",
      runtimeResult: "skipped",
    }).passed,
    true,
  );
  assert.equal(
    evaluateRequiredCi({
      risk: "high",
      riskResult: "success",
      verifyResult: "success",
      runtimeResult: "success",
    }).passed,
    true,
  );
  for (const input of [
    {
      risk: "high",
      riskResult: "failure",
      verifyResult: "success",
      runtimeResult: "success",
    },
    {
      risk: "medium",
      riskResult: "success",
      verifyResult: "success",
      runtimeResult: "skipped",
    },
    {
      risk: "low",
      riskResult: "success",
      verifyResult: "failure",
      runtimeResult: "skipped",
    },
  ]) {
    assert.equal(evaluateRequiredCi(input).passed, false);
  }
});

test("keeps the GitHub workflow least-privilege and branch-protection ready", () => {
  const workflow = fs.readFileSync(
    path.join(repositoryRoot, ".github/workflows/ci.yml"),
    "utf8",
  );

  assert.match(workflow, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(workflow, /pull_request_target|secrets\./);
  assert.match(workflow, /name: CI Required/);
  assert.equal((workflow.match(/name: CI Required/g) ?? []).length, 1);
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /run: pnpm verify\n/);
  assert.match(workflow, /run: pnpm verify:runtime/);
  assert.match(workflow, /if: needs\.risk\.outputs\.risk != 'low'/);
  assert.equal(actionPins(workflow, "actions/checkout").length, 4);
  assert.equal(actionPins(workflow, "actions/setup-node").length, 4);
  assert.equal(actionPins(workflow, "pnpm/action-setup").length, 2);
  assert.equal((workflow.match(/runs-on: ubuntu-24\.04/g) ?? []).length, 4);
  assert.equal((workflow.match(/timeout-minutes:/g) ?? []).length, 4);
  assert.match(workflow, /persist-credentials: false/);
});

function plan(risk) {
  return `# Plan\n\n**Plan version:** 2\n**Risk:** ${risk}\n`;
}

function actionPins(workflow, action) {
  const escapedAction = action.replace("/", "\\/");
  return Array.from(
    workflow.matchAll(
      new RegExp(
        `uses: ${escapedAction}@[a-f0-9]{40} # v\\d+\\.\\d+\\.\\d+`,
        "g",
      ),
    ),
  );
}

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}
