# 2026-08-11 Frontendkit Task Lifecycle And Failure Taxonomy

**Plan version:** 2
**Status:** queued
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit task lifecycle, recovery, candidate identity, and failure classification; do not push, publish, deploy, broaden task authority, or erase active evidence
**Allowed paths:** tools/frontendkit/, scripts/harness/, package.json, docs/engineering/, docs/exec-plans/
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

- [ ] Define lifecycle states, transitions, and schema migration policy.
- [ ] Replace metadata fingerprints with content-derived candidate identity.
- [ ] Add stable failure descriptors and task command routes.
- [ ] Add complete/recover behavior with fail-closed archive rules.
- [ ] Add cross-component task tests and docs.
- [ ] Run verification and record evidence.

## Rollout And Rollback

Support the prior ignored state schema only for explicit diagnosis; require a
new baseline when safe migration is impossible. Rollback restores the prior
controller and leaves archived evidence untouched.

## Decision And Deviation Log

- 2026-08-11: Separate plan-boundary identity from editable plan progress.

## Verification

- Not run yet.

## Runtime Evidence

- A temporary real Git repository will exercise the lifecycle.

## Follow-Up Debt

- Linked worktrees remain evidence-triggered and out of scope.
