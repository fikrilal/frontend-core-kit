# 2026-10-03 Frontendkit Safe Feature Removal Engine

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement safe feature removal and unwiring command in frontendkit CLI, write dependency scanner, add unit tests, verify, and commit; do not push, deploy, or mutate production
**Allowed paths:** tools/frontendkit/, docs/exec-plans/, _WIP/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Introduce `pnpm frontendkit -- remove feature <name> [options]` to safely delete feature directories, unwire associated route files, prune public route metadata from `src/app/site-metadata.ts`, scan for dangling external imports, and enforce protected core safeguards.

## Current Evidence

- `mobilekit remove feature` enforces core guards (`auth`, `account`, `home`) and unwires routes, DI, and lint exceptions.
- In `frontend-core-kit`, removing a feature manually requires deleting `src/features/<feature>`, `src/app/**/<feature>`, and cleaning `publicRoutes` in `src/app/site-metadata.ts` if a marketing page was created.
- Accidental removal of foundational features breaks core kit invariants.

## Decisions And Invariants

- Syntax: `frontendkit remove feature <name> [--slice <slice>] [--dry-run] [--force-core] [--yes]`.
- Protected core features: `auth`, `marketing`, `users` cannot be removed without `--force-core`.
- Dangling import check: scans repository files for imports from `@/features/<name>`. If references exist outside the feature being deleted, aborts with a diagnostic error listing referencing files.
- Surgical unwiring: if the feature has a route registered in `src/app/site-metadata.ts` (`publicRoutes`), prunes the route entry so `pnpm public-pages:check` passes cleanly.
- If `--slice` is specified, deletes only `src/features/<feature>/<slice>/` and prunes exports from `src/features/<feature>/index.ts`.
- Supports `--dry-run` to preview deletions and modifications without filesystem changes.

## Non-Goals

- Removing non-feature modules (e.g. `src/server/`, `src/components/ui/`).
- Force-deleting git history or uncommitted user changes in unrelated paths.

## Acceptance Scenarios

1. Given a protected feature name `auth`, when running `frontendkit remove feature auth`, then it refuses with a protected core blocker code.
2. Given a protected feature name `auth` with `--force-core --dry-run`, then it previews the deletion without modifying disk.
3. Given a feature `billing` referenced by an external file, when running `remove feature billing`, then it aborts and reports the referencing files.
4. Given an unreferenced feature `billing`, when running `remove feature billing`, then it cleanly removes feature and route directories and leaves verification passing.
5. Given a marketing feature with an entry in `site-metadata.ts`, when running `remove feature`, then it prunes the entry and `public-pages:check` passes.

## Risk And Authority

Risk is high because the task introduces file deletion and unwiring logic in canonical CLI tooling. Local edits, tests, and commits are authorized; external publication is excluded.

## Impact Areas

- `tools/frontendkit/command.mjs`: CLI arguments for `remove feature`.
- `tools/frontendkit/remove/`: Removal engine, import scanner, and unwiring helpers.
- `tools/frontendkit/remove.test.mjs`: Unit tests for protected guards, reference checks, and unwiring.

## Verification Matrix

| Acceptance           | Evidence                                                     |
| :------------------- | :----------------------------------------------------------- |
| Protected core guard | unit test verifying rejection without `--force-core`         |
| Dangling import scan | unit test asserting detection of external references         |
| Unwiring accuracy    | unit test asserting clean modification of `site-metadata.ts` |
| Verification         | `pnpm test:frontendkit` and `pnpm verify:fast`               |

## Checklist

- [x] Add `remove feature` CLI argument parsing in `tools/frontendkit/command.mjs`.
- [x] Implement protected core checks for `auth`, `marketing`, `users`.
- [x] Implement dangling import scanner across `src/`.
- [x] Implement surgical unwiring for `src/app/site-metadata.ts` and `src/features/<feature>/index.ts`.
- [x] Implement file and directory deletion engine with `--dry-run`.
- [x] Add unit tests in `tools/frontendkit/remove.test.mjs`.
- [x] Verify test suite and run canonical gates.

## Rollout And Rollback

Contained within `tools/frontendkit/`. Can be cleanly rolled back with `git revert`.

## Decision And Deviation Log

- 2026-10-03: Queued plan created from approved proposal `_WIP/2026-10-03_frontend-feature-scaffold-and-remove-proposal.md`.
- 2026-10-03: Activated plan for implementation.
- 2026-10-03: Implemented the removal engine in `tools/frontendkit/remove.mjs` as a flat module (matching the existing `scaffold.mjs`/`scaffold-data.mjs` layout) instead of the `tools/frontendkit/remove/` directory listed in Impact Areas.
- 2026-10-03: `--yes` is accepted for forward compatibility but no interactive prompt is implemented; frontendkit commands are non-interactive and acceptance scenario 4 expects non-interactive removal.
- 2026-10-03: First canonical verification run failed in `pnpm test` because the developer shell exported `NODE_ENV=production` (production React / Vite client conditions). Re-ran with `env -u NODE_ENV`, matching CI.

## Verification

- `pnpm typecheck:frontendkit`: passed with 0 errors.
- `pnpm test:frontendkit`: 56 tests passed (0 failures), including 9 new removal tests.
- `pnpm lint`, `pnpm format:check`, `pnpm knowledge:check`, `pnpm architecture:check`, `pnpm public-pages:check`, `pnpm maintainability:check`, `pnpm contracts:check`, `pnpm typecheck`: all passed.
- Canonical `task verify`: passed full deterministic and runtime browser lanes in 101.5s; candidate handed off.

## Runtime Evidence

- CLI end-to-end on a scratch root: `scaffold feature billing` (9 files) → `remove feature billing --dry-run` (preview only, no mutation) → `remove feature billing` (feature and route directories removed).

## Follow-Up Debt

- None yet.
