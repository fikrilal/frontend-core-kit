# 2026-08-01 Agent Harness Phase 4.4: Operating Proof

**Plan version:** 2
**Status:** queued
**Owner:** primary agent with independent reviewer for future operating conclusions
**Risk:** medium
**Authority:** implement and verify repository-local, read-only operating-evidence
collection and reporting; do not commit, push, create or update pull requests,
merge, deploy, mutate external systems, or infer results without records
**Allowed paths:** scripts/harness/, docs/exec-plans/, docs/engineering/, package.json
**Allowed actions:** edit, verify
**Maximum risk:** medium
**Repair limit:** 0

## Objective

Demonstrate that the completed Phase 4 loop is useful on real repository tasks,
record its costs and failure modes without sensitive data, and produce a human-
reviewed recommendation on whether Phase 5 optimization is justified.

## Current Evidence

- Phases 4.1 through 4.3 are implementation-complete; their Node 24 real-task
  and separately authorized live-handoff proof remain explicit follow-up debt.
- The new versioned evidence ledger contains zero records, so it is an honest
  report of insufficient evidence rather than an operating-success claim.
- Existing baseline measurements cover gate duration and counts but not repair
  attempts, first-pass success, scope escalations, false positives, or human
  intervention reasons.
- The proposal rejects commit count and raw coverage percentage as success
  metrics and requires feedback about the loop itself.

## Decisions And Invariants

- The repository-local ledger/report may be implemented now, but the operating
  conclusion begins only after Phases 4.1 through 4.3 have real-task and hosted
  proof appropriate to their risk.
- A delegated agent may collect and normalize read-only evidence because it
  should not be the same actor that designed the policy or implemented every
  sampled task. The primary agent and human owner review conclusions.
- Evaluate at least three completed, independently reviewed repository tasks
  spanning at least two risk classes, with at least one medium/high task and one
  task that required a repair or escalation. Do not invent product work merely
  to satisfy the sample.
- Record bounded aggregates and categorical reasons only: first-pass/eventual
  outcome, attempts, failed boundary, elapsed gate time, scope/risk escalation,
  human intervention category, false positive, and CI reproduction.
- Do not store prompts, credentials, environment values, raw logs, user data, or
  private review content.
- Evidence may recommend narrower diagnostics or policy changes but cannot
  directly weaken graders, thresholds, risk, authority, or required lanes.

## Non-Goals

- Optimizing for agent commit count, coverage percentage, or maximum autonomy.
- Auto-merging, deploying, scheduling background jobs, or creating synthetic
  product changes.
- Implementing Phase 5 harness changes inside the evidence collection task.

## Acceptance Scenarios

1. Given an eligible completed task, when evidence is recorded, then every
   required field is sourced from plans/gates/CI or a categorical human decision
   and contains no sensitive/raw content.
2. Given fewer than three eligible tasks or insufficient risk/repair diversity,
   when conclusions are requested, then the phase reports insufficient evidence
   instead of claiming success.
3. Given repeated failure, false-positive, stale-guide, or human-intervention
   evidence, when classified, then it maps to a concrete steering category and
   proposed owner without silently changing the harness.
4. Given the completed sample, when reviewed, then the report states observed
   first-pass/eventual success, attempts, elapsed feedback, escalations, CI
   reproduction, and limitations.
5. Given evidence that the loop is noisy or unsafe, when Phase 5 is considered,
   then the recommendation can be to simplify or stop rather than expand autonomy.

## Risk And Authority

Risk is medium because the implementation should be read-only documentation and
sanitized aggregation, but misleading metrics could drive unsafe policy. This is
the only whole Phase 4 slice suitable for delegation: another agent can collect
evidence independently, while policy conclusions and any follow-up mutations
remain subject to primary-agent and human review.

## Impact Areas

- versioned, sanitized Phase 4 operating-evidence ledger or report
- harness baseline and execution-plan evidence links
- read-only extraction helpers if manual collection proves error-prone
- no application source, external system, or policy mutation

## Verification Matrix

| Acceptance                | Evidence                                       |
| ------------------------- | ---------------------------------------------- |
| Complete safe records     | schema/fixture validation and privacy review   |
| Minimum sample/diversity  | deterministic eligibility summary              |
| Honest conclusions        | source links, limitations, and human review    |
| No harness self-weakening | diff inspection and existing full verification |

## Checklist

- [x] Record the local completion status and outstanding hosted/live proof debt
      for Phases 4.1-4.3.
- [x] Implement the sanitized evidence schema and eligible-task rules.
- [ ] Collect at least three diverse real-task records.
- [ ] Classify repairs, escalations, false positives, and interventions.
- [x] Publish a bounded insufficient-evidence report and recommendation.
- [x] Run full and runtime repository verification after this documentation update.

## Rollout And Rollback

Evidence collection is additive and read-only. If the schema is misleading or
captures unsafe content, stop collection, remove unsafe fields, and retain only
validated aggregate records. No automation expansion follows without separate
approval.

## Decision And Deviation Log

- 2026-08-01: Independent evidence collection is intentionally delegatable;
  authority and policy implementation remain primary-agent responsibilities.
- 2026-08-01: Evidence records are fixed categorical fields with a completed-plan
  source link; free-form fields are rejected to prevent raw logs, prompts, and
  private review material from entering the ledger.

## Verification

- `node --test scripts/harness/operating-evidence.test.mjs` passed (3 tests).
- `pnpm harness:evidence` passed and reported zero eligible records with
  `insufficient` status and no autonomy-expansion recommendation.
- `pnpm verify` passed (format, contracts, lint, typecheck, tests, build, and
  harness checks); `pnpm verify:runtime` passed (14 Chromium checks). The local
  shell emitted the expected Node 22 engine warning while CI remains Node 24.

## Runtime Evidence

- No browser-visible behavior is introduced; the existing runtime gate passed
  unchanged with 14 Chromium checks.

## Follow-Up Debt

- Phase 5 starts only if this evidence supports a narrow, reviewable improvement.
- Collect three real, independently reviewed, CI-reproduced tasks across at least
  two risk classes, including one medium/high task and one repair/escalation,
  before changing this plan to completed or proposing Phase 5.
