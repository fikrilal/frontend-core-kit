# 2026-10-03 Frontendkit Feature Lifecycle Dogfood And Documentation

**Plan version:** 2
**Status:** queued
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** dogfood feature lifecycle loop, update CLI help and durable engineering documentation, verify full and runtime profiles, and commit; do not push, deploy, or mutate production
**Allowed paths:** tools/frontendkit/, docs/, README.md, _WIP/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Exercise the complete feature lifecycle loop (`scaffold feature` → verify passing build → `remove feature` → verify clean repository), update `frontendkit help`, update durable documentation in `docs/engineering/harness.md` and `README.md`, run full deterministic and runtime browser gates, and complete the proposal audit.

## Current Evidence

- Plans 1, 2, and 3 introduce `scaffold feature`, `scaffold data`, `scaffold all`, and `remove feature`.
- The user requires verification that the loop works seamlessly end-to-end without leaving residues or broken states.
- Documentation must accurately reflect all new commands and capabilities.

## Decisions And Invariants

- Real dogfooding: scaffold a realistic sample feature, run verification to prove it compiles and meets all harness invariants, then remove it and prove repository cleanliness.
- Durable docs: update `docs/engineering/harness.md` and `README.md` to document the new subcommands and options.
- CLI Help: ensure `frontendkit help` and individual subcommand `--help` accurately describe usage.
- Verification: both `pnpm verify` (full) and `pnpm verify:runtime` (browser) must pass.

## Non-Goals

- External publication, pushing to remote, or creating pull requests.
- Retaining synthetic test features in production code.

## Acceptance Scenarios

1. Given the new CLI capabilities, when running `frontendkit help`, then it lists `scaffold` and `remove` commands with clear descriptions.
2. Given a temporary test feature `sample_test`, when scaffolded, then `pnpm verify:fast` passes with zero violations.
3. Given the test feature `sample_test`, when removed, then git status confirms complete unwiring and `pnpm verify` passes.
4. Given the final repository state, when running full verification and runtime browser gates, then all checks pass.

## Risk And Authority

Risk is high because the task updates harness documentation and exercises repository-wide verification. Local commits are authorized; external publication is excluded.

## Impact Areas

- `tools/frontendkit/command.mjs`: help text updates.
- `docs/engineering/harness.md`: feature lifecycle command documentation.
- `README.md`: feature scaffolding section.
- `docs/exec-plans/`: completion audits.

## Verification Matrix

| Acceptance   | Evidence                                                        |
| :----------- | :-------------------------------------------------------------- |
| Dogfood loop | successful execution log of scaffold → verify → remove → verify |
| CLI help     | inspection of `frontendkit help`                                |
| Durable docs | inspection of `docs/engineering/harness.md`                     |
| Verification | clean pass of `pnpm verify` and `pnpm verify:runtime`           |

## Checklist

- [ ] Update `frontendkit help` text to include `scaffold` and `remove`.
- [ ] Run full end-to-end dogfood scenario with a sample feature.
- [ ] Update `docs/engineering/harness.md` and `README.md`.
- [ ] Run `pnpm verify` and `pnpm verify:runtime`.
- [ ] Audit acceptance criteria from proposal and commit.

## Rollout And Rollback

Documentation and CLI help updates. Cleanly roll back with `git revert`.

## Decision And Deviation Log

- 2026-10-03: Queued plan created from approved proposal `_WIP/2026-10-03_frontend-feature-scaffold-and-remove-proposal.md`.

## Verification

- Not run yet.

## Runtime Evidence

- Not run yet.

## Follow-Up Debt

- None yet.
