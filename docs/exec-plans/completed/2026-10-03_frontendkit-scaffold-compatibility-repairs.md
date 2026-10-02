# 2026-10-03 Frontendkit Scaffold Compatibility Repairs

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** fix scaffold template defects surfaced by compatibility testing, add regression tests, verify, and commit; do not push, deploy, or mutate production
**Allowed paths:** tools/frontendkit/, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Fix the two gate-breaking defects found by the feature compatibility test: marketing route pages collide with their imported component (`TS2440`) and generated non-void data adapter tests import an unused `Data` type (`no-unused-vars`).

## Current Evidence

- `scaffold feature <name> --kind marketing` (with and without `--slice`) fails `pnpm typecheck` because the route's default export reuses the imported feature component name.
- `scaffold data` / `scaffold all` for non-void operations fails `pnpm lint` because the generated test imports `type <Operation>Data` without referencing it; void operations are unaffected.
- Authenticated scaffolds, marketing metadata wiring, multi-slice features, slice removal, and cross-feature reference blocking all pass the same compatibility test.

## Decisions And Invariants

- Marketing route default exports use a distinct suffix (`<Component>Route`) like every other route.
- Generated data tests import only the types they reference.
- Regression tests assert both properties.
- No other generated-output behavior changes.

## Non-Goals

- Slice-removal reference scanning and relative cross-feature import detection (recorded as follow-up findings).
- Other CLI behavior.

## Acceptance Scenarios

1. Given `scaffold feature advert_test --kind marketing`, when `pnpm typecheck` runs, then it passes and the route exports a named default function distinct from the imported component.
2. Given `scaffold data --feature probe_test --operation users.me.get` (envelope) and `users.me.sessions.list` (query/auth), when `pnpm lint` runs, then it passes.
3. Given the full frontendkit test suite, when `pnpm test:frontendkit` runs, then all tests pass including new regression assertions.
4. Given the final repository state, when `pnpm verify` and `pnpm verify:runtime` run, then all checks pass.

## Risk And Authority

Risk is high because templates feed every scaffolded feature. Local edits, tests, and commits are authorized; external publication is excluded.

## Impact Areas

- `tools/frontendkit/scaffold.mjs`: marketing route default-export name.
- `tools/frontendkit/scaffold-data.mjs`: generated test imports.
- `tools/frontendkit/scaffold.test.mjs`, `tools/frontendkit/scaffold-data.test.mjs`: regression assertions.

## Verification Matrix

| Acceptance          | Evidence                                                       |
| :------------------ | :------------------------------------------------------------- |
| Marketing typecheck | regression test plus in-repo scaffold and `pnpm typecheck` run |
| Data lint           | regression test plus in-repo scaffold and `pnpm lint` runs     |
| Test suite          | `pnpm test:frontendkit`                                        |
| Verification        | `pnpm verify` and `pnpm verify:runtime`                        |

## Checklist

- [x] Fix marketing route default-export naming in `scaffold.mjs`.
- [x] Remove the unused `Data` type import from generated data tests.
- [x] Add regression assertions in both scaffold test suites.
- [x] Re-run the compatibility matrix and canonical gates.

## Rollout And Rollback

Contained within `tools/frontendkit/`. Cleanly rolled back with `git revert`.

## Decision And Deviation Log

- 2026-10-03: Plan created from compatibility-test findings.
- 2026-10-03: Slice-removal reference scanning and relative cross-feature import detection are deferred as findings; the protected-core guard remains the only mitigation for referenced core slices.
- 2026-10-03: Fixed `routePageStub` so every route (including marketing) exports `<Component>Route`; marketing scaffolds typecheck in both slice and non-slice forms.
- 2026-10-03: Removed the unused `<Operation>Data` import from generated data tests; envelope, query/auth, plain, and body shapes now lint clean.
- 2026-10-03: Standalone `pnpm verify:runtime` again cleared `test-results/`; the baseline was recreated with `task begin` before canonical verification.

## Verification

- `pnpm test:frontendkit`: 57 tests passed, including the new regression assertions.
- In-repo compatibility checks: marketing (slice and non-slice) `pnpm typecheck` clean; `scaffold all` and query/auth data adapter `pnpm lint` and `pnpm typecheck` clean; every temporary feature removed with a clean working tree.
- Combined matrix run (marketing plus scaffold-all features present): `env -u NODE_ENV pnpm verify:fast` passed (10 steps, 53.7s).
- `pnpm verify` (full): passed (11 steps, 73.3s).
- `pnpm verify:runtime`: passed (31.6s).
- Canonical `task verify`: passed full deterministic and runtime browser lanes in 106s.

## Runtime Evidence

- `pnpm verify:runtime` and the task-verification runtime lane passed the Chromium browser suites.
- Compatibility matrix executed against the live repository: scaffold → verify → remove cycles for authenticated, marketing, multi-slice, scaffold-all, cross-feature reference, and slice-removal scenarios.

## Follow-Up Debt

- The removal scanner misses relative cross-feature imports (`src/features/users/**` importing `../../auth/...`).
- Slice removal does not scan for external consumers; `--force-core` slice removal could break referenced flows.
