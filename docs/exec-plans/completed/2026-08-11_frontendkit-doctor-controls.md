# 2026-08-11 Frontendkit Read-Only Controls And Doctor

**Plan version:** 2
**Status:** completed
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit read-only CLI controls and diagnostics; do not push, publish, deploy, install tools, edit source through doctor, or contact external services
**Allowed paths:** tools/frontendkit/, scripts/harness/, scripts/contracts/, package.json, knip.json, docs/engineering/, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Route knowledge, contract, risk, and operating-evidence inspection through
`frontendkit`, and add a read-only doctor that reports toolchain, repository,
plan, private-state, and browser readiness with stable blocker/warning codes.

## Current Evidence

- Current read-only entry points have independent parsing and rendering.
- The local shell can run Node 22 while `.nvmrc` requires 24.18.0; pnpm warns but
  ordinary commands continue.
- Task verification detects exact tool versions, but there is no pre-task
  aggregate diagnostic.

## Decisions And Invariants

- Doctor performs no installation, cleanup, verification, or external call.
- A missing required tool/version is a blocker; optional runtime capability is
  a warning unless an active plan requires it.
- Existing native commands remain available for focused diagnosis.
- Stable codes and remediation are safe for terminal and JSON output.

## Non-Goals

- No task state transitions, recovery mutation, backend readiness network call,
  or policy changes.
- No inference that credentials or tool availability grant authority.

## Acceptance Scenarios

1. Given the wrong Node version, when doctor runs, then it reports a blocker and
   the required version without printing environment values.
2. Given valid knowledge, contract, risk, and evidence inputs, when their CLI
   commands run, then output matches the native owners.
3. Given stale or malformed private task state, when doctor runs, then it
   reports a stable finding but does not modify the file.
4. Given `--json`, when any read-only command runs, then output is parseable and
   contains no raw command output or sensitive values.

## Risk And Authority

Risk is high because misleading diagnostics can cause every future task to
start from false assumptions. All commands in this phase are read-only.

## Impact Areas

- CLI routing for read-only owners;
- doctor probes and tests;
- package compatibility aliases;
- harness documentation.

## Verification Matrix

| Acceptance                   | Evidence                           |
| ---------------------------- | ---------------------------------- |
| Toolchain and state findings | doctor fixtures and CLI tests      |
| No mutation                  | before/after filesystem assertions |
| Native parity                | injected owner and command tests   |
| Documentation                | `pnpm knowledge:check`             |

## Checklist

- [x] Add read-only command routes.
- [x] Add doctor probes and stable finding schema.
- [x] Preserve native diagnostic entry points and aliases.
- [x] Add privacy, no-mutation, and malformed-state tests.
- [x] Update harness documentation.
- [x] Run verification and record evidence.

## Rollout And Rollback

All changes are additive delegates. Rollback removes the routes and doctor while
leaving native scripts unchanged.

## Decision And Deviation Log

- 2026-08-11: Treat browser availability as plan-sensitive rather than a global
  blocker.
- 2026-08-11: Added `knip.json` to the allowed boundary after alias delegation
  made retained native owner scripts invisible to static entry-point discovery.
  They are declared as entries rather than ignored, preserving maintainability
  coverage and direct diagnostic access.
- 2026-08-11: The first fast-profile run exposed those missing Knip entries at
  the harness boundary. After declaring the retained owners, the same profile
  passed without suppressing a finding or weakening a gate.

## Verification

- `pnpm test:frontendkit` passed: 21 tests covering routing, wrong versions,
  malformed private state, no mutation, privacy, and owner failure behavior.
- `pnpm typecheck:frontendkit`, `pnpm format:check`, and
  `pnpm knowledge:check` passed.
- Compatibility routes passed for knowledge, contracts, evidence, and risk.
- `pnpm verify:fast` passed: 7 canonical steps in 41.8 seconds.
- `pnpm verify` passed: 8 canonical steps in 52.9 seconds.

## Runtime Evidence

- Human and JSON doctor invocations passed under Node 24.18.0 with no blockers
  and the expected `task-state.missing` warning.
- A real invocation under Node 22.22.0 exited 1 with the stable
  `toolchain.node-version` blocker and no raw environment output.
- `pnpm verify:runtime` passed: 1 browser step in 32.8 seconds; snapshots were
  not updated.

## Follow-Up Debt

- None identified before implementation.
