# 2026-10-03 Frontendkit Feature Scaffolding Engine

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement the feature scaffolding command in frontendkit CLI, write templates, add unit tests, verify, and commit; do not push, deploy, mutate production, or add unapproved dependencies
**Allowed paths:** tools/frontendkit/, package.json, docs/exec-plans/, _WIP/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Introduce `pnpm frontendkit -- scaffold feature <name>` to generate standardized, architecturally compliant feature skeletons complying with Next.js App Router rules, pure shadcn UI components, Server Actions, Zod validation schemas, domain failure mappings, co-located unit tests, and thin route pages.

## Current Evidence

- `mobile-core-kit` includes `mobilekit scaffold feature` which enforces architectural consistency from inception.
- `frontend-core-kit` requires manual feature creation in `src/features/` and route creation in `src/app/`.
- `scripts/harness/check-architecture.mjs` enforces strict boundaries (route files <= 50 lines, feature encapsulation via `src/features/<feature>/index.ts`, pure shadcn tokens, no deep cross-feature imports).
- The accepted engineering proposal is documented in `_WIP/2026-10-03_frontend-feature-scaffold-and-remove-proposal.md`.

## Decisions And Invariants

- CLI command syntax: `pnpm frontendkit -- scaffold feature <name> [--slice <slice>] [--kind <authenticated|marketing>] [--dry-run]`.
- Feature naming: enforce kebab-case or snake-case names, normalizing to kebab-case for directory/file names and PascalCase for React component identifiers.
- Default route group is `authenticated` (`src/app/(authenticated)/<feature>/page.tsx`). If `--kind marketing` is passed, target `src/app/(marketing)/<feature>/page.tsx` and register the route in `src/app/site-metadata.ts` `publicRoutes`.
- Thin route invariant: generated `page.tsx` files must stay <= 15 lines, contain no raw JSX elements, and only compose components exported from `@/features/<feature>`.
- Encapsulation invariant: `src/features/<feature>/index.ts` must export the public feature component.
- Pure shadcn invariant: generated UI forms use installed `@/components/ui/*` primitives.
- Collision safety: refuse to scaffold if target files or directories already exist unless `--force` is specified.
- Support `--dry-run` to preview all files and directories without filesystem mutations.

## Non-Goals

- OpenAPI data layer generation (deferred to Plan 2).
- Feature removal and unwiring (deferred to Plan 3).
- Adding custom styling or non-shadcn component libraries.

## Acceptance Scenarios

1. Given a valid feature name `billing`, when running `pnpm frontendkit -- scaffold feature billing --dry-run`, then it previews all directories and files to create without writing to disk.
2. Given a valid feature name `billing`, when running `pnpm frontendkit -- scaffold feature billing`, then it generates `src/features/billing/` (index.ts, slice page, form, action, state, failure, tests) and `src/app/(authenticated)/billing/page.tsx`.
3. Given `--kind marketing`, when scaffolding a feature, then it places the route under `src/app/(marketing)/<feature>/page.tsx` and adds an entry to `publicRoutes` in `src/app/site-metadata.ts`.
4. Given an existing feature directory, when scaffolding without `--force`, then it aborts with a collision blocker.
5. Given invalid feature names or malformed arguments, then it returns a usage error without stack traces.

## Risk And Authority

Risk is high because the task extends canonical harness CLI tools (`tools/frontendkit/`). Local edits, tests, and commits are authorized; external push, deployment, or publish are strictly excluded.

## Impact Areas

- `tools/frontendkit/command.mjs`: CLI argument parser for `scaffold feature`.
- `tools/frontendkit/scaffold.mjs`: Scaffolding engine, templates, and path generators.
- `tools/frontendkit/scaffold.test.mjs`: Unit tests covering syntax, collisions, dry run, and template outputs.

## Verification Matrix

| Acceptance            | Evidence                                                      |
| :-------------------- | :------------------------------------------------------------ |
| CLI routing & options | `node --test tools/frontendkit/scaffold.test.mjs`             |
| Dry run & collisions  | targeted unit tests asserting preview and rejection           |
| Template validity     | generated files pass typecheck, lint, and architecture checks |
| Harness compliance    | `pnpm verify:fast` and `pnpm frontendkit -- doctor`           |

## Checklist

- [x] Add `scaffold feature` argument parsing in `tools/frontendkit/command.mjs`.
- [x] Implement feature scaffolding engine and template generators in `tools/frontendkit/scaffold.mjs`.
- [x] Implement collision preflights, directory creation, and `--dry-run` output formatting.
- [x] Add unit test suite in `tools/frontendkit/scaffold.test.mjs`.
- [x] Verify test suite and run canonical gates (`pnpm test:frontendkit`, `pnpm verify`).

## Rollout And Rollback

Changes are contained within `tools/frontendkit/`. Can be cleanly reverted using `git revert` without altering existing application features.

## Decision And Deviation Log

- 2026-10-03: Plan created from approved proposal `_WIP/2026-10-03_frontend-feature-scaffold-and-remove-proposal.md`.
- 2026-10-03: Refined collision detection so `index.ts` allows appending new slice exports when extending an existing feature.

## Verification

- `pnpm test:frontendkit` passed 34/34 unit tests.
- `pnpm typecheck:frontendkit` passed with 0 errors.
- `pnpm format:check` passed with all files adhering to Prettier formatting.
- `pnpm lint` passed with 0 errors and 0 warnings.
- `pnpm typecheck` passed with 0 root errors.
- `pnpm task:verify` passed full deterministic build and runtime browser verification in 88.5s.
- Candidate fingerprint `923b22286fdab398cb430c96fa1ca0c7b3ed8ba22d197ef630496f7562fb0637` verified with 0 repairs.

## Runtime Evidence

- Playwright browser E2E test suite passed with 0 failures across all Chromium scenarios.
- `scaffold feature --dry-run` and live generation verified across multiple unit and fixture tests.

## Follow-Up Debt

- None.
