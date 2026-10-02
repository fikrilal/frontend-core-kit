# 2026-10-03 Frontendkit OpenAPI Data Scaffolding Engine

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement OpenAPI data scaffolding and composite scaffold all commands in frontendkit CLI, write server adapter templates, add unit tests, verify, and commit; do not push, deploy, or mutate production
**Allowed paths:** tools/frontendkit/, src/contracts/, docs/exec-plans/, _WIP/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Introduce `pnpm frontendkit -- scaffold data --feature <name> --operation <id>` and `pnpm frontendkit -- scaffold all --feature <name> --operation <id>` to inspect committed OpenAPI specifications and scaffold typed server client adapters, Result-mapping logic, and unit tests adhering to repository server boundaries.

## Current Evidence

- `mobilekit scaffold data` and `scaffold all` parse OpenAPI operations and scaffold remote datasources.
- In `frontend-core-kit`, server adapters live in `src/features/<feature>/server/<feature>-api.ts`, consuming the generated OpenAPI client (`src/contracts/example-api/runtime.generated.ts`) and returning `Result<T, ProblemDetails>` from `src/server/api/result.ts`.
- Plan 1 introduces the base feature scaffolding engine.

## Decisions And Invariants

- Syntax:
  - `frontendkit scaffold data --feature <name> --operation <id> [--openapi-spec <path>] [--dry-run] [--force]`
  - `frontendkit scaffold all --feature <name> --operation <id> [--slice <slice>] [--kind <authenticated|marketing>] [--dry-run]`
- OpenAPI Spec: defaults to committed snapshot `src/contracts/example-api/openapi.yaml`.
- Architectural boundary: raw fetch is forbidden in features; server adapters wrap generated client functions in `src/server/api/` or `@/contracts/example-api`.
- Operation Resolution: resolve operation by `operationId` or `METHOD /path`.
- Generated files: `src/features/<feature>/server/<feature>-api.ts` and `src/features/<feature>/server/<feature>-api.test.ts`.
- Support `--dry-run` and collision preflight.

## Non-Goals

- Regenerating OpenAPI contracts (contracts remain generator-owned in `src/contracts/`).
- Feature removal (deferred to Plan 3).

## Acceptance Scenarios

1. Given an existing OpenAPI operation `users.profile.get`, when running `pnpm frontendkit -- scaffold data --feature users --operation users.profile.get --dry-run`, then it previews the server adapter code without writing.
2. Given valid feature and operation, when running `scaffold data`, then it writes `src/features/<feature>/server/<feature>-api.ts` and co-located test.
3. Given `scaffold all`, when running for a new feature and operation, then it generates both the feature skeleton and the OpenAPI server adapter.
4. Given an unknown operation ID, then it exits with a diagnostic error listing available operations.

## Risk And Authority

Risk is high because the task modifies canonical CLI tooling and contract consumers. Local edits, tests, and commits are authorized; external publication is excluded.

## Impact Areas

- `tools/frontendkit/command.mjs`: CLI arguments for `scaffold data` and `scaffold all`.
- `tools/frontendkit/scaffold/`: OpenAPI schema reader and server adapter templates.
- `tools/frontendkit/scaffold-data.test.mjs`: Unit tests for operation resolution and code generation.

## Verification Matrix

| Acceptance                | Evidence                                                        |
| :------------------------ | :-------------------------------------------------------------- |
| Operation resolution      | unit tests for valid and invalid operation IDs                  |
| Server adapter generation | generated adapter matches `Result<T, ProblemDetails>` signature |
| Composite scaffold all    | end-to-end unit test creating feature + data layer              |
| Verification              | `pnpm test:frontendkit` and `pnpm verify:fast`                  |

## Checklist

- [x] Add `scaffold data` and `scaffold all` CLI parser support.
- [x] Implement OpenAPI YAML schema parser and operation resolver.
- [x] Implement server API adapter and unit test template generators.
- [x] Add unit tests in `tools/frontendkit/scaffold-data.test.mjs`.
- [x] Verify test suite and run canonical gates.

## Rollout And Rollback

Contained within `tools/frontendkit/`. Can be cleanly rolled back with `git revert`.

## Decision And Deviation Log

- 2026-10-03: Queued plan created from approved proposal `_WIP/2026-10-03_frontend-feature-scaffold-and-remove-proposal.md`.
- 2026-10-03: Implemented `scaffold-data.mjs` and updated `command.mjs` to support `scaffold data` and `scaffold all` commands with `--dry-run`, `--force`, `--list`, and `--filter`. Added 11 unit tests in `scaffold-data.test.mjs`.

## Verification

- `pnpm typecheck:frontendkit`: Passed with 0 errors.
- `pnpm test:frontendkit`: 44 tests passed (0 failures).
- `pnpm maintainability:check`: Knip passed with 0 issues.
- `pnpm verify:fast`: 10 steps passed in 39.4s.

## Runtime Evidence

- Verified dry run preview, unknown operation diagnostic message, and file generation in unit tests and manual execution.

## Follow-Up Debt

- None yet.
