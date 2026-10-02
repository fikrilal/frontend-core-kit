# 2026-10-03 Frontendkit Feature Lifecycle Dogfood And Documentation

**Plan version:** 2
**Status:** completed
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

- [x] Update `frontendkit help` text to include `scaffold` and `remove`.
- [x] Run full end-to-end dogfood scenario with a sample feature.
- [x] Update `docs/engineering/harness.md` and `README.md`.
- [x] Run `pnpm verify` and `pnpm verify:runtime`.
- [x] Audit acceptance criteria from proposal and commit.

## Rollout And Rollback

Documentation and CLI help updates. Cleanly roll back with `git revert`.

## Decision And Deviation Log

- 2026-10-03: Queued plan created from approved proposal `_WIP/2026-10-03_frontend-feature-scaffold-and-remove-proposal.md`.
- 2026-10-03: Activated plan for implementation.
- 2026-10-03: Dogfood `scaffold feature sample_test` → `pnpm verify:fast` failed at lint: the generated Server Action stub violated `@typescript-eslint/require-await` and the failure mapper switch was not `null`-exhaustive. Fixed both templates in `scaffold.mjs`, added regression assertions, re-scaffolded, and `verify:fast` passed.
- 2026-10-03: Added a subcommand `--help` fallback to global help so `frontendkit <command> --help` describes usage instead of failing.
- 2026-10-03: Running `pnpm verify:runtime` standalone clears `test-results/` (Playwright's default output directory), which removes the harness task state and archived evidence; recovery is `task begin` followed by `task verify`. Recorded as follow-up debt.

## Verification

- Dogfood loop on `sample_test`: `pnpm frontendkit -- scaffold feature sample_test` (9 files) → `env -u NODE_ENV pnpm verify:fast` passed (10 steps, 47.8s) → `pnpm frontendkit -- remove feature sample_test` → `git status` free of feature and route paths.
- `pnpm test:frontendkit`: 57 tests passed (0 failures).
- `pnpm verify` (full): passed (11 steps, 53.6s).
- `pnpm verify:runtime`: passed (30.2s).
- Canonical `task verify`: passed full deterministic and runtime browser lanes in 86.9s.
- Proposal acceptance audit: (1) scaffold correctness — the generated thin route and slice pass format/lint/typecheck/architecture inside `verify:fast`; (2) data scaffold correctness — schema-valid adapter output and executing contract tests were evidenced by the plan-2 review probes and unit tests; (3) clean removal and unwiring — residue-free removal followed by passing full verification; (4) safety and protection — protected-core guard and dangling-import abort are covered by plan-3 unit tests; (5) deterministic preflight — `--dry-run` previews with zero mutations, verified in tests and CLI smoke runs.

## Runtime Evidence

- Dogfood CLI sequence on a real repository checkout: scaffold → verify → remove → verify.
- `pnpm verify:runtime` and the task-verification runtime lane both passed the Chromium browser suites.

## Follow-Up Debt

- `pnpm verify:runtime` standalone clears `test-results/`, wiping harness task state and archives; consider a distinct Playwright output directory or a separate harness state location.
- Generated scaffold output is lint-verified by dogfooding only; consider an automated lint fixture for generated files.
- `frontendkit help` lists commands but not per-command options; per-command usage text could be added later.
