# 2026-08-03 Phase 5: Repair Boundary Diagnostics

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with human owner for harness policy review
**Risk:** high
**Authority:** edit and verify repository-local evidence diagnostics; do not
commit, push, create or update pull requests, merge, deploy, weaken graders,
lower thresholds, broaden authority, or mutate external systems
**Allowed paths:** scripts/harness/, docs/engineering/, docs/exec-plans/
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Make repair outcomes more actionable by recording the failed verification
boundary as a small approved category. The existing operating-evidence report
identifies that a repair occurred, but it cannot distinguish whether the next
task should inspect preflight, fast verification, full verification, or browser
runtime diagnostics. This slice adds that distinction without storing raw logs,
prompts, credentials, environment values, or review content.

## Current Evidence

- The Phase 4.4 ledger contains three independently reviewed, CI-reproduced
  high-risk tasks.
- Password registration is recorded as `firstPass: false`, `attempts: 3`, and
  `repairOrEscalation: "repair"`.
- The ledger has no failed-boundary field, even though Phase 4.4 explicitly
  requires bounded aggregates to include the failed boundary.
- The original registration repair evidence did not preserve a safe boundary
  category, so its new value must remain `unknown`; no historical cause will be
  inferred.
- The current report emits only the generic steering signal
  `repair outcomes → harness maintainer: inspect diagnostics`.
- A prior lifecycle reconciliation plan remained in `active/` with unchecked
  work after its PR merged, which violated the one-current-plan invariant used
  by task verification.

## Decisions And Invariants

- Add only the categorical boundary values `none`, `unknown`, `preflight`,
  `fast`, `full`, and `runtime`.
- A record with no repair or escalation uses `none`; a repaired or escalated
  record must use a non-`none` value. Historical records use `unknown` when the
  source evidence does not establish the boundary.
- Bump the evidence schema to version 2 and reject records that omit or misuse
  the new field.
- Reports may aggregate and route categories, but must never print raw command
  output, prompts, credentials, environment values, request data, or private
  review content.
- Preserve the existing insufficient status and second-risk-class requirement;
  this change does not expand autonomy, change required CI lanes, or alter risk
  thresholds.
- Keep exactly one active execution plan while work is in progress; completed
  plans move to `completed/` with their evidence recorded.
- The metric for this slice is the count of repair records with a known boundary;
  the current honest baseline is zero of one repair record.

## Non-Goals

- No application source, product behavior, UI, API, session, or deployment work.
- No attempt to reconstruct the registration failure from unavailable logs.
- No automatic collection from GitHub, CI, prompts, or agent traces.
- No new risk class, repair budget, required lane, merge authority, or policy
  exception.
- No broad observability system or free-form evidence field.

## Acceptance Scenarios

1. Given the existing ledger, when `pnpm harness:evidence` runs, then it
   validates schema version 2, reports the historical repair boundary as
   `unknown`, and keeps the operating proof `insufficient` only for its
   existing evidence gaps.
2. Given a record with a known boundary, when the report is rendered, then the
   boundary count and a safe owner-directed steering signal are present.
3. Given a repair record with `failureBoundary: "none"`, or a non-repair record
   with another boundary, when validation runs, then it fails with actionable
   remediation.
4. Given malformed or free-form boundary data, when validation runs, then no
   raw value is echoed into the report and the existing privacy boundary holds.
5. Given the diagnostic change, when the existing harness and repository gates
   run, then risk classification, required lanes, and human gates are unchanged.

## Risk And Authority

Risk is high because this changes a harness evidence contract used to steer
future work. The authorized mutation is limited to the listed repository paths
and categorical diagnostics. Human review remains required before any policy,
threshold, authority, merge, or deployment decision.

## Impact Areas

- `scripts/harness/operating-evidence.mjs` and its tests;
- the sanitized operating-evidence ledger and report;
- harness documentation and this execution-plan lifecycle;
- no application runtime or external system.

## Verification Matrix

| Acceptance                   | Evidence                                                      |
| ---------------------------- | ------------------------------------------------------------- |
| Schema and consistency rules | operating-evidence unit tests and malformed fixtures          |
| Safe boundary aggregation    | report assertions with known and unknown categories           |
| Honest existing evidence     | `pnpm harness:evidence` output and ledger inspection          |
| No policy weakening          | risk/authority negative assertions and diff review            |
| Repository consistency       | `pnpm knowledge:check`, `pnpm verify`, and `git diff --check` |

## Checklist

- [x] Add schema-version-2 boundary validation and aggregation.
- [x] Record the historical repair boundary as explicit `unknown`.
- [x] Add tests for valid, invalid, known, and unknown boundary categories.
- [x] Update the evidence report and harness documentation.
- [x] Complete the stale lifecycle plan and restore the one-active-plan
      invariant.
- [x] Prove existing insufficient status and privacy behavior remain intact.
- [x] Run the full repository verification and record exact evidence.
- [x] Obtain human review before any policy or automation change.

## Rollout And Rollback

Roll out as an additive versioned evidence-schema change behind the existing
verification gates. Roll back by reverting the schema, ledger, report, tests,
and documentation together. No application or external runtime state changes.

## Decision And Deviation Log

- 2026-08-03: Select the missing repair-boundary category as the first Phase 5
  signal because the existing ledger records one repair but cannot route its
  diagnostics. Preserve `unknown` rather than inferring the historical cause.
- 2026-08-03: Keep the change limited to sanitized evidence and report output;
  no automatic policy or authority mutation is permitted.
- 2026-08-03: Complete the previously stale lifecycle plan as documentation
  gardening; no application or policy behavior was changed.

## Verification

- `node --test scripts/harness/operating-evidence.test.mjs` passed (4 tests).
- `pnpm harness:evidence` passed and reported three eligible records with
  `insufficient` status only for the missing second risk class. The historical
  repair is explicitly `failureBoundary: "unknown"`.
- `pnpm knowledge:check` passed.
- `pnpm verify` passed: formatting, contract drift, lint, typecheck, 108
  Vitest tests, 6 contract tests, 62 harness/fixture tests, production build,
  architecture, maintainability, and public-page checks.
- `pnpm verify:runtime` passed with 34 Chromium tests.
- `git diff --check` passed.
- Local commands emitted the expected Node 22 engine warning; the repository
  requires Node 24 or newer.

## Runtime Evidence

- No browser-visible behavior was introduced. The full existing runtime suite
  passed with 34 Chromium tests.

## Follow-Up Debt

- Record a known boundary on the next independently reviewed repair outcome.
- Observe a second risk class before making broader operating claims or
  considering any autonomy expansion.
