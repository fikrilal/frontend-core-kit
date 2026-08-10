# 2026-08-11 Frontendkit Verified Handoff

**Plan version:** 2
**Status:** active
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit the CLI handoff boundary and tests; do not perform a real push, create a real pull request, merge, deploy, or infer publication authority
**Allowed paths:** tools/frontendkit/, scripts/harness/, package.json, docs/engineering/, docs/exec-plans/
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

- [ ] Register handoff commands and structured results.
- [ ] Bind handoff readiness to lifecycle candidate identity.
- [ ] Preserve native adapter tests and compatibility alias.
- [ ] Add dry-run, stale, unauthorized, and uncertain-outcome tests.
- [ ] Update harness documentation.
- [ ] Run verification and record evidence.

## Rollout And Rollback

The existing package alias delegates to the CLI. Rollback restores the direct
entry point; no external operation is performed by rollout.

## Decision And Deviation Log

- 2026-08-11: Keep external actions separate in authority even if one operator
  command sequences them.

## Verification

- Not run yet.

## Runtime Evidence

- Only dry-run and local fake-adapter evidence are authorized.

## Follow-Up Debt

- Real hosted handoff evidence requires a future explicitly authorized push.
