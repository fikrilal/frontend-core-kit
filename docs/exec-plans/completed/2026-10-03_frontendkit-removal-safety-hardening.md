# 2026-10-03 Frontendkit Removal Safety Hardening

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** harden removal reference scanning and cross-feature import enforcement, refactor existing violations to the public API, add tests, verify, and commit; do not push, deploy, or mutate production
**Allowed paths:** tools/frontendkit/, scripts/harness/, src/features/auth/, src/features/users/, docs/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Close the two safety gaps found by the feature compatibility test: slice removal must scan for external consumers of the slice's exported symbols, and the removal scanner plus `architecture:check` must detect relative imports that resolve into another feature.

## Current Evidence

- `remove feature auth --slice login --force-core --dry-run` previews deleting a slice whose `LoginPage` export is imported by `src/app/(auth)/login/page.tsx`; slice removal runs no reference scan.
- `src/features/users/profile/profile-page.tsx` and `src/features/users/account-deletion/request-account-deletion-page.tsx` import `../../auth/session/load-authenticated-user`; neither the removal scanner nor `architecture:check` detects relative cross-feature imports.

## Decisions And Invariants

- Whole-feature removal keeps aborting on any external reference, now including relative specifiers that resolve into the feature.
- Slice removal aborts when an external file imports a symbol the slice exports from the feature index, or when a relative or deep specifier resolves into the slice directory. External barrel imports that use other slices' symbols do not block removal.
- Namespace imports of the feature barrel are treated conservatively as slice consumers when the slice is exported.
- `architecture:check` flags relative specifiers that resolve into a different feature; cross-feature imports must use `@/features/<name>`.
- `loadAuthenticatedUser` becomes part of the auth feature public API; the architecture document is updated to state that deliberately.

## Non-Goals

- Changing protected-core policy or scaffold templates.
- Extracting the architecture checker into a module; coverage comes from a subprocess fixture test plus the repository gate.

## Acceptance Scenarios

1. Given a scaffolded feature whose slice export is imported from the feature barrel by another module, when the slice is removed, then it aborts listing the consumer and its imported symbols.
2. Given the same feature where external barrel imports use only other slices' symbols, when the slice is removed, then it succeeds.
3. Given an external relative import resolving into the removed feature or slice, when removal runs, then it aborts; the same import resolving into a sibling slice does not block slice removal.
4. Given the relative cross-feature imports in `src/features/users/`, when the refactor lands, then `architecture:check` passes; before it lands, the extended checker flags both files.
5. Given the final repository state, when `pnpm test:frontendkit`, `pnpm verify`, and `pnpm verify:runtime` run, then all pass.

## Risk And Authority

Risk is high because removal guards and the architecture sensor protect destructive workflows. Local edits, tests, and commits are authorized; external publication is excluded.

## Impact Areas

- `tools/frontendkit/remove.mjs`: relative resolution, slice-aware consumer detection.
- `tools/frontendkit/remove.test.mjs`: scanner and slice scenarios.
- `scripts/harness/check-architecture.mjs`: relative cross-feature rule.
- `scripts/harness/check-architecture.test.mjs`: subprocess fixture coverage.
- `src/features/auth/index.ts`, `src/features/users/**`: public API refactor.
- `docs/core/architecture.md`, `docs/engineering/harness.md`: durable descriptions.

## Verification Matrix

| Acceptance              | Evidence                                                      |
| :---------------------- | :------------------------------------------------------------ |
| Slice consumer abort    | unit test with a live consumer fixture                        |
| Sibling slice unblocked | unit test asserting successful removal                        |
| Relative resolution     | unit tests for feature and slice relative imports             |
| Architecture rule       | fixture subprocess test plus before/after gate runs           |
| Verification            | `pnpm test:frontendkit`, `pnpm verify`, `pnpm verify:runtime` |

## Checklist

- [x] Add relative-import resolution to the removal scan.
- [x] Add slice-aware consumer detection with barrel symbol matching.
- [x] Extend `architecture:check` to flag relative cross-feature imports.
- [x] Refactor existing relative cross-feature imports to the public API.
- [x] Add scanner unit tests and checker fixture tests.
- [x] Run the compatibility spot checks and canonical gates.

## Rollout And Rollback

Contained within `tools/frontendkit/`, `scripts/harness/`, and the two feature directories. Cleanly rolled back with `git revert`.

## Decision And Deviation Log

- 2026-10-03: Plan created from compatibility-test findings.
- 2026-10-03: Added relative-import resolution and slice-aware consumer detection to the removal scanner; the feature index is excluded from slice scans because it is pruned by the removal itself.
- 2026-10-03: Extended `architecture:check` with the relative cross-feature rule; it flagged both `src/features/users/` violations before the refactor and passes after.
- 2026-10-03: Exported `loadAuthenticatedUser` from the auth public API, refactored the two users pages onto it, and updated the architecture and harness documents.
- 2026-10-03: Standalone `pnpm verify:runtime` again cleared `test-results/`; the baseline was recreated with `task begin` before canonical verification.

## Verification

- `pnpm typecheck:frontendkit` passed with 0 errors; `pnpm test:frontendkit` passed 61 tests (4 new scanner scenarios); `pnpm test:harness` passed 74 tests (2 new checker fixtures).
- `architecture:check` flagged exactly the two `src/features/users/` violations before the refactor and passed after; `pnpm lint` and `pnpm typecheck` passed.
- Live spot checks: `remove feature auth --slice login --force-core --dry-run` refuses with `src/app/(auth)/login/page.tsx (LoginPage)`; `remove feature users --slice profile --force-core --dry-run` refuses with `src/app/(authenticated)/app/profile/page.tsx (ProfilePage)`; `remove feature auth --force-core --dry-run` now reports 9 references including the users pages that were previously invisible.
- `pnpm verify` (full) passed in 59.8s; `pnpm verify:runtime` passed in 29s.
- Canonical `task verify` passed full deterministic and runtime browser lanes in 90.6s.

## Runtime Evidence

- `pnpm verify:runtime` and the task-verification runtime lane passed the Chromium browser suites.
- Live dry-run scans against every core feature and slice: protected refusals, symbol-attributed slice consumers, and relative-import detection in the real repository.

## Follow-Up Debt

- None yet.
