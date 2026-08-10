import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { collectKnowledgeViolations } from "./knowledge-tools.mjs";

test("accepts a complete v2 active plan and valid local links", () => {
  withFixture((root) => {
    write(root, "docs/guide.md", "# Guide\n");
    write(root, "docs/README.md", "[Guide](guide.md)\n");
    write(root, "docs/exec-plans/active/plan.md", validPlan());

    assert.deepEqual(collectKnowledgeViolations(root), []);
  });
});

test("reports missing v2 metadata and sections with remediation", () => {
  withFixture((root) => {
    write(
      root,
      "docs/exec-plans/active/plan.md",
      "# Plan\n\n**Plan version:** 2\n**Status:** active\n",
    );

    const violations = collectKnowledgeViolations(root);

    assert(violations.some((value) => value.includes('"**Owner:**"')));
    assert(
      violations.some((value) =>
        value.includes('missing required section "## Objective"'),
      ),
    );
  });
});

test("requires the current schema for new plans and content in each section", () => {
  withFixture((root) => {
    write(root, "docs/exec-plans/active/unversioned.md", "# Plan\n");
    write(
      root,
      "docs/exec-plans/active/empty.md",
      validPlan().replace("## Objective\n\n- Complete.", "## Objective\n"),
    );

    const violations = collectKnowledgeViolations(root);

    assert(
      violations.some(
        (value) =>
          value.includes("unversioned.md") && value.includes("Plan version"),
      ),
    );
    assert(
      violations.some((value) =>
        value.includes('empty required section "## Objective"'),
      ),
    );
  });
});

test("rejects version 1 plans outside completed history", () => {
  withFixture((root) => {
    write(
      root,
      "docs/exec-plans/active/old.md",
      validPlan().replace("**Plan version:** 2", "**Plan version:** 1"),
    );

    assert(
      collectKnowledgeViolations(root).some((value) =>
        value.includes("New active and queued plans must use version 2"),
      ),
    );
  });
});

test("rejects folder status mismatches and invalid risk", () => {
  withFixture((root) => {
    write(
      root,
      "docs/exec-plans/queued/plan.md",
      validPlan()
        .replace("**Status:** active", "**Status:** completed")
        .replace("**Risk:** medium", "**Risk:** extreme"),
    );

    const violations = collectKnowledgeViolations(root);

    assert(
      violations.some((value) =>
        value.includes('status "completed" but lives in queued/'),
      ),
    );
    assert(
      violations.some((value) => value.includes('invalid risk "extreme"')),
    );
  });
});

test("rejects unresolved completed work and placeholder evidence", () => {
  withFixture((root) => {
    const completed = validPlan()
      .replace("**Status:** active", "**Status:** completed")
      .replace("- [x] Complete the work.", "- [ ] Complete the work.")
      .replace("- Passed.", "- Pending.");
    write(root, "docs/exec-plans/completed/plan.md", completed);

    const violations = collectKnowledgeViolations(root);

    assert(
      violations.some((value) =>
        value.includes("unresolved required checkbox"),
      ),
    );
    assert(
      violations.some((value) =>
        value.includes("verification evidence still contains a placeholder"),
      ),
    );
  });
});

test("accepts legacy completed plans without rewriting their format", () => {
  withFixture((root) => {
    write(
      root,
      "docs/exec-plans/completed/2026-07-28_api-contract-foundation.md",
      "# Legacy\n\n## Checklist\n\n- [x] Complete.\n",
    );

    assert.deepEqual(collectKnowledgeViolations(root), []);
  });
});

test("reports broken local links and unindexed proposals", () => {
  withFixture((root) => {
    write(root, "docs/README.md", "[Missing](missing.md)\n");
    write(root, "docs/planning/README.md", "# Planning\n");
    write(root, "docs/planning/proposal.md", "# Proposal\n");

    const violations = collectKnowledgeViolations(root);

    assert(
      violations.some((value) =>
        value.includes('missing local target "missing.md"'),
      ),
    );
    assert(
      violations.some((value) =>
        value.includes(
          "proposal.md is not linked from docs/planning/README.md",
        ),
      ),
    );
  });
});

function withFixture(run) {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "frontend-core-knowledge-test-"),
  );
  try {
    for (const folder of ["active", "queued", "completed"]) {
      fs.mkdirSync(path.join(root, "docs/exec-plans", folder), {
        recursive: true,
      });
    }
    run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function write(root, relativePath, contents) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function validPlan() {
  const sections = [
    "Objective",
    "Current Evidence",
    "Decisions And Invariants",
    "Non-Goals",
    "Acceptance Scenarios",
    "Risk And Authority",
    "Impact Areas",
    "Verification Matrix",
    "Checklist",
    "Rollout And Rollback",
    "Decision And Deviation Log",
    "Verification",
    "Runtime Evidence",
    "Follow-Up Debt",
  ];

  return `# Plan

**Plan version:** 2
**Status:** active
**Owner:** agent
**Risk:** medium
**Authority:** edit and verify locally
**Allowed paths:** docs/, scripts/harness/, package.json
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

${sections
  .map((heading) =>
    heading === "Checklist"
      ? `## ${heading}\n\n- [x] Complete the work.`
      : `## ${heading}\n\n- ${heading === "Verification" ? "Passed." : "Complete."}`,
  )
  .join("\n\n")}
`;
}
