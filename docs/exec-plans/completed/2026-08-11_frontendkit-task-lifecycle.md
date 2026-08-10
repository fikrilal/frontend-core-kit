# 2026-08-11 Frontendkit Task Lifecycle And Failure Taxonomy

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit task lifecycle, recovery, candidate identity, and failure classification; do not push, publish, deploy, broaden task authority, or erase active evidence
**Allowed paths:** tools/frontendkit/, scripts/harness/, package.json, knip.json, docs/engineering/, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Provide `task begin|status|verify|complete|recover` with explicit lifecycle
states, content-derived candidate identity, stable owned stop reasons, bounded
repair, and safe terminal recovery.

## Current Evidence

- Current task state stores a baseline and failures but no lifecycle status.
- Its task fingerprint uses size and modification time rather than content.
- The stored plan fingerprint hashes the full plan, so recording progress can
  invalidate an otherwise unchanged task boundary.
- There is no supported completion or recovery command.

## Decisions And Invariants

- Fingerprint only structured authority boundaries for boundary stability.
- Fingerprint candidate contents and deletion state, not mtimes.
- Verification alone may enter `ready_for_review`.
- Only exact terminal state may be archived; active or ambiguous state fails
  closed.
- Recovery cannot reset a repair budget for an unchanged candidate.
- Failure codes map to an owner, repairability, and safe remediation.

## Non-Goals

- No linked-worktree orchestration, event intake, automatic source repair, or
  operating-ledger promotion.
- No additional product or quality gates.

## Acceptance Scenarios

1. Given an authorized plan, when a task begins and verifies, then state moves
   through explicit valid transitions to `ready_for_review`.
2. Given the same content and same failure, when retries exceed the plan budget,
   then the task escalates even if mtimes change.
3. Given plan progress text changes with unchanged boundaries, when verification
   runs, then the task remains valid.
4. Given an active or ambiguous task, when recovery is requested, then it refuses
   to archive or erase evidence.
5. Given terminal task state, when completion/recovery runs, then it archives an
   exact bounded record and permits a new task.

## Risk And Authority

Risk is high because lifecycle and fingerprints control scope, readiness, and
repair. The phase may edit local ignored task state but cannot contact external
systems or publish.

## Impact Areas

- task-state schema and migration;
- verification transitions and failure taxonomy;
- CLI task commands and tests;
- task workflow documentation.

## Verification Matrix

| Acceptance          | Evidence                               |
| ------------------- | -------------------------------------- |
| Valid transitions   | state-machine tests                    |
| Content identity    | same-content/different-mtime fixtures  |
| Boundary stability  | plan-progress fixture                  |
| Recovery safety     | active/terminal negative tests         |
| Integrated behavior | temporary Git repository task scenario |

## Checklist

- [x] Define lifecycle states, transitions, and schema migration policy.
- [x] Replace metadata fingerprints with content-derived candidate identity.
- [x] Add stable failure descriptors and task command routes.
- [x] Add complete/recover behavior with fail-closed archive rules.
- [x] Add cross-component task tests and docs.
- [x] Run verification and record evidence.

## Rollout And Rollback

Support the prior ignored state schema only for explicit diagnosis; require a
new baseline when safe migration is impossible. Rollback restores the prior
controller and leaves archived evidence untouched.

## Decision And Deviation Log

- 2026-08-11: Separate plan-boundary identity from editable plan progress.
- 2026-08-11: Retained native task scripts are explicit Knip entries because
  compatibility aliases now delegate to `frontendkit`; this keeps direct
  diagnostics visible without duplicating command ownership.
- 2026-08-11: Began a real repository task baseline after implementation, then
  used this progress-only plan edit as the bounded candidate for lifecycle
  dogfooding; structured authority remained unchanged.
- 2026-08-11: Added an exact-candidate check to `task complete` before
  dogfooding. Ready state is rejected if any candidate content changes after
  verification.
- 2026-08-11: The real run inherited this already-modified plan path as
  pre-existing, so its candidate path set was empty. It still proves state
  transitions and selected gates, but clean candidate attribution is deferred
  to the dedicated dogfood plan after a clean commit.

## Verification

- `pnpm test:frontendkit` passed: 22 tests.
- `pnpm test:harness` passed: 66 tests, including real temporary Git worktrees,
  content-versus-mtime identity, boundary stability, stale completion, bounded
  repair, and terminal recovery.
- `pnpm typecheck:frontendkit`, `pnpm maintainability:check`,
  `pnpm format:check`, and `pnpm knowledge:check` passed.
- Real repository commands passed for `task begin`, `task status`, `task
verify`, and `task complete`; status after completion failed as expected
  because active state had been archived.

## Runtime Evidence

- Temporary real Git repositories exercised low/high verification, failure,
  repair exhaustion, recovery, scope rejection, and ready-state transitions.
- Real repository `task verify` selected and passed `pnpm verify` in 52.6
  seconds and `pnpm verify:runtime` in 29.6 seconds. The lifecycle then reached
  `ready_for_review`, transitioned to `handed_off`, archived exact schema-2
  state, and removed active private state.

## Follow-Up Debt

- Linked worktrees remain evidence-triggered and out of scope.
