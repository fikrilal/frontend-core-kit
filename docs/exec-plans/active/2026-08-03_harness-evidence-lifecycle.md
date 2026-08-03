# 2026-08-03 Harness Evidence Lifecycle Reconciliation

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for evidence conclusions
**Risk:** low
**Authority:** reconcile repository documentation after the merged email-
verification task and prepare a truthful operating-evidence record; do not
change application behavior, weaken evidence thresholds, commit, push, create
or update pull requests, merge, deploy, or mutate external systems
**Allowed paths:** docs/engineering/, docs/exec-plans/
**Allowed actions:** edit, verify
**Maximum risk:** low
**Repair limit:** 1

## Objective

Reconcile the execution-plan lifecycle and operating-evidence ledger after the
merged email-verification task, then leave the repository with an accurate
three-record report that still refuses to recommend Phase 5 until risk
diversity is observed.

This is a naturally occurring documentation-maintenance task caused by the
merged feature. It does not add product behavior or create a synthetic
application task merely to satisfy the Phase 4.4 sample.

## Current Evidence

- Pull request #2 merged on GitHub with commit `f77b8f0`.
- Hosted CI run `30739192007` passed CI Risk, CI Verify, CI Runtime, and CI
  Required. Its wall-clock duration was 154 seconds.
- The email-verification plan is still under `active/` even though its human
  review and hosted CI gates are complete.
- The evidence ledger has two independently reviewed high-risk auth records.
  Adding email verification will make three records, but all three remain
  high-risk, so the report must continue to state that a second risk class is
  missing.

## Decisions And Invariants

- Record only the merged email-verification task's bounded categorical
  evidence; do not store a PR URL, raw logs, prompts, credentials, or review
  text in the ledger.
- Move the email-verification plan to `completed/` only after its required
  hosted and human-review evidence is recorded.
- Preserve the Phase 4.4 acceptance threshold: three reviewed records,
  multiple risk classes, repair/escalation evidence, and CI reproduction.
- Do not mark Phase 4.4 complete or start Phase 5 in this task.
- Keep the execution-plan index, evidence report, and plan status consistent.

## Non-Goals

- No application source, tests, generated contracts, or runtime behavior.
- No change to evidence schema, eligibility rules, risk thresholds, or
  autonomy policy.
- No new product workflow and no synthetic feature implementation.
- No commit, push, pull request, merge, deployment, or external mutation.

## Acceptance Scenarios

1. Given the merged email-verification task and its hosted CI run, when the
   lifecycle is reconciled, then its plan is completed and its ledger record
   cites the completed plan path.
2. Given three reviewed records that are all high-risk, when the evidence
   command runs, then it reports `insufficient` only for the missing second
   risk class.
3. Given the lifecycle update, when knowledge and diff checks run, then plan
   folders, statuses, links, and sanitized evidence remain valid.
4. Given this low-risk documentation task, when the diff is inspected, then no
   application or harness policy file outside the documented evidence and
   plan lifecycle is changed.

## Risk And Authority

Risk is low because this task changes only versioned documentation and an
already-defined categorical evidence record. The consequence of an incorrect
status is mitigated by retaining the deterministic `insufficient` report and
the explicit second-risk-class gap. Human review remains required before any
Phase 4.4 conclusion or Phase 5 policy proposal.

## Impact Areas

- email-verification execution-plan lifecycle;
- Phase 4.4 execution-plan index and evidence report;
- sanitized operating-evidence ledger;
- no application runtime or external system.

## Verification Matrix

| Acceptance                         | Evidence                     |
| ---------------------------------- | ---------------------------- |
| Completed-plan lifecycle           | `pnpm knowledge:check`       |
| Three-record truthful report       | `pnpm harness:evidence`      |
| No malformed documentation changes | `git diff --check`           |
| No source or policy drift          | explicit changed-path review |

## Checklist

- [ ] Move the reviewed email-verification plan to `completed/`.
- [ ] Add its bounded record to the operating-evidence ledger.
- [ ] Update the evidence report and execution-plan index.
- [ ] Verify the report remains insufficient only for risk diversity.
- [ ] Run knowledge, harness-evidence, and diff checks.
- [ ] Move this plan to completed only after independent review and hosted CI.

## Rollout And Rollback

This is an additive documentation reconciliation. Roll back by reverting the
plan move, index/report wording, and one ledger record together. No runtime or
external state is affected.

## Decision And Deviation Log

- 2026-08-03: Create this low-risk lifecycle task after the email-verification
  PR merged, so the real reviewed task can be recorded without weakening the
  Phase 4.4 evidence contract.
- 2026-08-03: Keep Phase 4.4 queued until a separate real task from another
  risk class is independently reviewed and CI-reproduced.

## Verification

Not run yet.

## Runtime Evidence

Not applicable; this task changes no browser-visible behavior.

## Follow-Up Debt

- Complete one naturally occurring task from a second risk class, then record
  that task and close Phase 4.4 in a separate reviewed change.
- Do not create synthetic product work solely to satisfy evidence diversity.
