# 2026-08-11 Frontendkit Canonical Verification Profiles

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit canonical verification profiles and compatibility delegates; do not push, deploy, publish, or weaken any existing gate
**Allowed paths:** tools/frontendkit/, scripts/harness/, scripts/contracts/, scripts/testing/, package.json, .github/workflows/ci.yml, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Make `frontendkit verify --profile fast|full|runtime|ci` the single owner of
verification composition, then route existing pnpm aliases and CI through that
registry without changing effective coverage.

## Current Evidence

- `package.json` duplicates profile composition in shell-style pnpm chains.
- CI directly invokes `pnpm verify` and `pnpm verify:runtime`.
- The CLI kernel exists after the preceding plan and is additive.

## Decisions And Invariants

- Profiles are data with stable step identifiers, owners, commands, and args.
- `fast`, `full`, and `runtime` preserve current behavior; `ci` exposes the
  clean-checkout deterministic profile used by hosted CI.
- Compatibility aliases delegate to the registry and do not define steps.
- Stop on the first failing step and return its owned boundary.
- CI may select more work from risk and never less.

## Non-Goals

- No task lifecycle, doctor, handoff, improvement, or new quality sensor.
- No parallel command runner or performance rewrite.
- No gate weakening to reduce duration.

## Acceptance Scenarios

1. Given any profile, when inspected, then its ordered steps come from one
   registry and reject unknown profiles.
2. Given a compatibility alias, when executed, then it selects exactly the same
   steps as the equivalent CLI profile.
3. Given a failing step, when verification runs, then later steps do not run and
   the result names the failing step without leaking raw output into JSON.
4. Given CI verification, when workflows run, then they call the same profile
   registry used locally.

## Risk And Authority

Risk is high because profile drift can produce false confidence repository-wide.
The user authorized commits but not pushes; hosted CI cannot be claimed in this
phase.

## Impact Areas

- profile registry and command adapter;
- package compatibility aliases;
- CI command references;
- focused parity tests.

## Verification Matrix

| Acceptance                | Evidence                          |
| ------------------------- | --------------------------------- |
| Profile composition       | registry unit tests               |
| Alias parity              | package/command parity tests      |
| Failure behavior          | injected-runner negative tests    |
| Effective repository gate | `pnpm verify:fast`, `pnpm verify` |

## Checklist

- [x] Implement the profile registry and executor.
- [x] Register the `verify` CLI command.
- [x] Delegate pnpm aliases to `frontendkit`.
- [x] Update CI to consume the registry.
- [x] Add profile, failure, and parity tests.
- [x] Run verification and record evidence.

## Rollout And Rollback

Keep old script names as delegates. Rollback restores their previous command
strings and removes the profile adapter without changing underlying tools.

## Decision And Deviation Log

- 2026-08-11: Preserve sequential fail-fast execution because it is simple and
  matches the current gate semantics.
- 2026-08-11: Added a dedicated frontendkit typecheck step to every deterministic
  profile. The old gate did not typecheck JavaScript CLI sources, so preserving
  effective coverage would have left the new control plane unchecked.
- 2026-08-11: The first fast-profile run stopped at maintainability because
  `helpLines` was unnecessarily exported. Made it private and reran the same
  profile successfully; no gate was weakened.

## Verification

- `pnpm test:frontendkit` passed: 13 tests.
- `pnpm test:harness` passed: 64 tests.
- `pnpm typecheck:frontendkit` passed.
- `pnpm format:check` passed.
- `pnpm verify:fast` passed through the compatibility delegate: 7 steps in
  43.2 seconds.
- `pnpm verify` passed through the compatibility delegate: 8 steps in 55.9
  seconds.

## Runtime Evidence

- `pnpm verify:runtime` passed through the compatibility delegate: 1 browser
  step in 41.8 seconds; snapshots were not updated.

## Follow-Up Debt

- None identified before implementation.
