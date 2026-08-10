# 2026-08-11 Frontendkit CLI Foundation

**Plan version:** 2
**Status:** active
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit the repository-local CLI foundation; do not push, publish, deploy, contact external systems, or change product behavior
**Allowed paths:** tools/frontendkit/, package.json, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Create a small repository-local `frontendkit` command surface with a closed
command model, safe process execution, stable results and exit codes, human and
JSON rendering, and focused tests. This phase establishes the control boundary
without migrating existing harness behavior.

## Current Evidence

- Harness behavior is currently exposed through independent Node entry points
  and package scripts.
- The accepted proposal selects `tools/frontendkit/` and
  `pnpm frontendkit -- <command>` as the canonical boundary.
- Existing harness tests use Node's built-in test runner and dependency
  injection, so the CLI can follow the same low-dependency pattern.

## Decisions And Invariants

- Use Node ESM, JSDoc/static checking, runtime validation, and existing
  dependencies.
- Keep command parsing, process execution, rendering, and domain dispatch
  separate.
- Never invoke through a shell; pass executable and arguments directly.
- JSON output is bounded and sanitized by construction.
- The CLI does not launch agents, schedule work, infer authority, or contact a
  network in this phase.

## Non-Goals

- No migration of verification, task, handoff, evidence, or CI commands.
- No new CLI framework, daemon, database, model SDK, or application behavior.
- No removal or behavior change of existing pnpm commands.

## Acceptance Scenarios

1. Given `frontendkit --help`, when invoked, then it prints stable command help
   and exits successfully.
2. Given an unknown or malformed command, when invoked, then it returns exit
   code 2 with a concise usage error and no stack trace.
3. Given a registered command result, when human or JSON output is selected,
   then the renderer emits only the declared structured fields.
4. Given a subprocess request, when executed, then no shell is involved and the
   result records bounded status, duration, and ownership.

## Risk And Authority

Risk is high because this becomes the future owner of repository verification
and external-action routing. The user explicitly authorized implementation and
commits but prohibited pushes. This phase cannot publish or mutate external
state.

## Impact Areas

- `tools/frontendkit/` command kernel and tests;
- `package.json` CLI and test entry points;
- execution-plan lifecycle only.

## Verification Matrix

| Acceptance               | Evidence                                                       |
| ------------------------ | -------------------------------------------------------------- |
| Help and usage contract  | CLI parser/command tests                                       |
| Safe process boundary    | process-runner negative tests                                  |
| Structured rendering     | human/JSON snapshot assertions                                 |
| Repository compatibility | `pnpm test:frontendkit`, `pnpm format:check`, `pnpm typecheck` |

## Checklist

- [ ] Add command/result contracts and parser.
- [ ] Add safe process runner and bounded result normalization.
- [ ] Add CLI entry point, help, human output, and JSON output.
- [ ] Add focused positive and negative tests.
- [ ] Add package scripts without changing existing command behavior.
- [ ] Run verification and record evidence.

## Rollout And Rollback

The new command is additive and initially owns only help/kernel behavior.
Rollback removes `tools/frontendkit/` and its package scripts without affecting
the existing harness.

## Decision And Deviation Log

- 2026-08-11: Keep the kernel dependency-free and use direct process spawning.

## Verification

- Not run yet.

## Runtime Evidence

- CLI invocation evidence will be recorded after implementation.

## Follow-Up Debt

- Command migrations are intentionally assigned to the following plans.
