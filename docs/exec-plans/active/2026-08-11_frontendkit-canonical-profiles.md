# 2026-08-11 Frontendkit Canonical Verification Profiles

**Plan version:** 2
**Status:** active
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

- [ ] Implement the profile registry and executor.
- [ ] Register the `verify` CLI command.
- [ ] Delegate pnpm aliases to `frontendkit`.
- [ ] Update CI to consume the registry.
- [ ] Add profile, failure, and parity tests.
- [ ] Run verification and record evidence.

## Rollout And Rollback

Keep old script names as delegates. Rollback restores their previous command
strings and removes the profile adapter without changing underlying tools.

## Decision And Deviation Log

- 2026-08-11: Preserve sequential fail-fast execution because it is simple and
  matches the current gate semantics.

## Verification

- Not run yet.

## Runtime Evidence

- Runtime profile invocation will be exercised without changing snapshots.

## Follow-Up Debt

- None identified before implementation.
