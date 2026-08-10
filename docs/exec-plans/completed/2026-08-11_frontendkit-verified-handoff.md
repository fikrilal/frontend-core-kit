# 2026-08-11 Frontendkit Verified Handoff

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit the CLI handoff boundary and tests; do not perform a real push, create a real pull request, merge, deploy, or infer publication authority
**Allowed paths:** tools/frontendkit/, scripts/harness/, package.json, knip.json, docs/engineering/, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Move verified handoff behind `frontendkit` while preserving fresh candidate
verification, exact task paths, separate action authority, safe dry-run, and
fail-closed handling of uncertain external outcomes.

## Current Evidence

- Existing `task:handoff` validates branch, remote, task paths, draft PR state,
  and action authority.
- It combines commit, push, and draft-PR/update-PR behavior behind one adapter.
- The new task lifecycle provides explicit readiness and candidate identity.

## Decisions And Invariants

- Dry-run is read-only and exercises the same preflight.
- Every external action requires its own plan authority and fresh candidate.
- The CLI never force-pushes, merges, deploys, changes review state, or guesses
  after an uncertain external result.
- Native adapter detail remains independently testable.

## Non-Goals

- No actual push or PR creation during implementation verification.
- No auto-merge, credential management, worktree orchestration, or GitHub event
  intake.

## Acceptance Scenarios

1. Given a ready task and handoff authority, when dry-run executes, then it
   reports exact candidate paths and intended actions without mutation.
2. Given stale verification or changed paths, when handoff runs, then it stops
   before Git mutation.
3. Given missing action authority, when an operation is requested, then it
   fails with a stable authorization reason.
4. Given an uncertain push or PR response, when the adapter cannot prove the
   outcome, then it escalates and does not retry automatically.

## Risk And Authority

Risk is high because this code can create external mutations when separately
authorized. This execution plan authorizes only local implementation, tests,
dry-run, and commit of the harness change itself.

## Impact Areas

- CLI handoff routing and rendering;
- existing handoff service integration;
- lifecycle freshness checks;
- negative and dry-run tests;
- harness docs.

## Verification Matrix

| Acceptance        | Evidence                            |
| ----------------- | ----------------------------------- |
| Dry-run safety    | injected adapter tests              |
| Fresh candidate   | lifecycle/handoff integration tests |
| Action authority  | negative fixtures                   |
| Uncertain outcome | no-retry adapter fixture            |

## Checklist

- [x] Register handoff commands and structured results.
- [x] Bind handoff readiness to lifecycle candidate identity.
- [x] Preserve native adapter tests and compatibility alias.
- [x] Add dry-run, stale, unauthorized, and uncertain-outcome tests.
- [x] Update harness documentation.
- [x] Run verification and record evidence.

## Rollout And Rollback

The existing package alias delegates to the CLI. Rollback restores the direct
entry point; no external operation is performed by rollout.

## Decision And Deviation Log

- 2026-08-11: Keep external actions separate in authority even if one operator
  command sequences them.
- 2026-08-11: Retain the native handoff adapter as an explicit Knip entry after
  moving its compatibility alias behind `frontendkit`.
- 2026-08-11: Dry-run verification uses `recordState: false`; it executes the
  same gates but does not add lifecycle transitions or failure records.
- 2026-08-11: Remote push and GitHub failures use the conservative
  `publication-outcome-uncertain` stop and are never retried automatically.

## Verification

- `pnpm test:frontendkit` passed: 23 tests.
- `pnpm test:harness` passed: 68 tests, including exact candidate readiness,
  authorization, stale evidence, dry-run no-state-mutation, and uncertain
  external outcome fixtures.
- `pnpm typecheck:frontendkit`, `pnpm maintainability:check`,
  `pnpm format:check`, and `pnpm knowledge:check` passed.
- `pnpm verify` passed: 8 canonical steps in 46.6 seconds.

## Runtime Evidence

- Dry-run exercised full preflight through injected adapters and produced no
  Git, GitHub, or lifecycle mutation.
- Fake adapters proved one normal push attempt and no retry or later GitHub
  call after an uncertain response.
- `pnpm verify:runtime` passed: 1 browser step in 27.1 seconds; snapshots were
  not updated. No real push or pull request was attempted.

## Follow-Up Debt

- Real hosted handoff evidence requires a future explicitly authorized push.
