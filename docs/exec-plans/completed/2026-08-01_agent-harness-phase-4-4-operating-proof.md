# 2026-08-01 Agent Harness Phase 4.4: Operating Proof

**Plan version:** 2
**Status:** completed
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
- The versioned evidence ledger contains three independently reviewed,
  high-risk, CI-reproduced auth records: registration, password-reset
  confirmation, and email verification. The deterministic report remains
  insufficient because the sample has no second risk class.
- The registration record covers repair attempts and human review. The
  password-reset confirmation record covers a first-pass hosted gate and human
  review; the sample remains too small to draw conclusions about the loop or
  compare risk classes.
- The proposal rejects commit count and raw coverage percentage as success
  metrics and requires feedback about the loop itself.

## Decisions And Invariants

- The repository-local ledger/report may be implemented now, but the operating
  conclusion begins only after Phases 4.1 through 4.3 have real-task and hosted
  proof appropriate to their risk.
- A delegated agent may collect and normalize read-only evidence because it
  should not be the same actor that designed the policy or implemented every
  sampled task. The primary agent and human owner review conclusions.
- The default operating-proof threshold remains at least three completed,
  independently reviewed repository tasks spanning at least two risk classes,
  with at least one medium/high task and one task that required a repair or
  escalation. Do not invent product work merely to satisfy the sample.
- The human owner explicitly accepts this three-task, high-risk-only sample as
  sufficient to begin a narrow Phase 5 planning exercise. This is a bounded
  deviation from the default diversity threshold; it does not change the
  deterministic report, expand autonomy, or authorize automatic merge or
  deployment.
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
- [x] Record the first independently reviewed task after hosted CI
      reproduction.
- [x] Record the password-reset confirmation task after hosted CI reproduction
      and human review.
- [x] Collect at least three real-task records and record the approved
      high-risk-only limitation.
- [x] Classify repairs, escalations, false positives, and interventions.
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
- 2026-08-02: Activate operating proof after the password-reset confirmation
  plan received human review and hosted CI reproduction. Keep the conclusion
  insufficient until a real task from a second risk class is recorded.
- 2026-08-02: Queue operating proof while the high-risk email-verification
  slice is implemented; resume evidence collection after that task reaches
  independent review and hosted CI.
- 2026-08-03: The human owner accepted the three independently reviewed,
  CI-reproduced high-risk records as sufficient to begin a narrow Phase 5
  planning exercise. Preserve the default risk-diversity warning and do not
  expand autonomy until a second risk class is observed.

## Verification

- `node --test scripts/harness/operating-evidence.test.mjs` passed (3 tests).
- `pnpm harness:evidence` passed and reported three eligible records with
  `insufficient` status only because the default second-risk-class requirement
  is not complete; the sample includes a repair outcome.
- `pnpm verify` passed (format, contracts, lint, typecheck, tests, build, and
  harness checks); `pnpm verify:runtime` passed (18 Chromium checks). The local
  shell emitted the expected Node 22 engine warning while CI remains Node 24.
- Hosted CI independently reproduced the registration task on GitHub Actions
  run `30695230750`; CI Risk, Verify, Runtime, and Required all passed.
- Hosted CI independently reproduced the password-reset confirmation task on
  GitHub Actions run `30732854708`; CI Risk, Verify, Runtime, and Required all
  passed.
- `pnpm knowledge:check`, `pnpm harness:evidence`, `git diff --check`, and
  `pnpm verify:fast` passed after adding the email-verification record and
  recording the approved deviation. Hosted CI independently reproduced the
  lifecycle change on run `30740777479`; all required jobs passed.
  The local shell emitted the expected Node 22 engine warning; the repository
  requires Node 24 or newer. The evidence report remains `insufficient` with
  two reviewed high-risk records and no second risk class.

## Runtime Evidence

- No browser-visible behavior is introduced by evidence collection. The
  registration task's hosted runtime gate passed with 18 Chromium checks.

## Follow-Up Debt

- Phase 5 is limited to a narrow, reviewable improvement and does not expand
  autonomy, merge authority, or deployment authority.
- Collect one additional real, independently reviewed, CI-reproduced task from
  a second risk class before changing harness policy, enabling auto-merge, or
  treating the operating proof as broadly representative. Keep at least one
  repair/escalation record in the sample.
