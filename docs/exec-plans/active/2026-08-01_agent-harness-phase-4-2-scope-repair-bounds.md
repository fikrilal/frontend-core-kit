# 2026-08-01 Agent Harness Phase 4.2: Scope And Repair Bounds

**Plan version:** 2
**Status:** active
**Owner:** primary agent
**Risk:** high
**Authority:** implement and verify repository-local plan-schema and task-bound
controls; do not commit, push, deploy, mutate external systems, or alter task
content outside the declared allowed paths
**Allowed paths:** scripts/harness/, docs/exec-plans/, docs/engineering/, package.json, .gitignore
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Make task scope and repair limits mechanically enforceable so an agent can
distinguish authorized progress from unrelated edits, repeated failure, risk
escalation, and conditions that require human direction.

## Current Evidence

- Completed V1 plans retain historical evidence, while new V2 plans add explicit
  path, action, maximum-risk, and repair-limit metadata.
- Risk classification covers paths but does not prove those paths were permitted
  by the task or distinguish pre-existing user changes from agent changes.
- No repository mechanism fingerprints unchanged failures or records a bounded
  repair attempt count.
- Phase 4.1 is expected to provide complete change discovery and stable failure
  evidence; this phase must not duplicate its orchestration.

## Decisions And Invariants

- This phase depends on completed Phase 4.1 behavior. Its independently hosted
  Node 24 proof remains follow-up evidence and does not change Phase 4.2's local
  deterministic contract.
- Introduce a versioned plan-schema change for machine-readable allowed paths and
  action authority. Do not parse safety decisions from free-form prose.
- Allowed paths use narrow repository-relative files or directory prefixes.
  Repository root, unresolved variables, parent traversal, and ambiguous globs
  are invalid. Generated companions must be declared explicitly or by a narrow
  documented rule.
- Capture the starting revision and pre-existing staged, unstaged, and untracked
  path state without modifying or claiming ownership of user changes.
- Scope checks report additions outside the task allowance and never delete,
  restore, stash, or overwrite them.
- A repair attempt is counted only after a verification failure. The failure
  fingerprint and task-diff fingerprint determine whether new evidence or a
  meaningful change occurred.
- The default repeated-failure budget is conservative and configurable only by
  reviewed policy, not by the running agent. Exhaustion stops with escalation.
- Risk rising above granted authority, ambiguous intent, missing external state,
  restricted action, or scope violation always stops; no retry budget overrides
  an authority boundary.
- A baseline is path-level evidence. It preserves and identifies pre-existing
  paths but cannot assign line-level ownership inside them; agents must not edit
  pre-existing out-of-scope paths.

## Non-Goals

- Editing code automatically, choosing business behavior, or deciding that an
  out-of-scope change is harmless.
- Cleaning a dirty worktree or requiring the user to discard unrelated work.
- GitHub PR creation or hosted repair; Phase 4.3 owns external coordination.
- Measuring long-term effectiveness; Phase 4.4 owns operating proof.

## Acceptance Scenarios

1. Given a valid task plan, when allowed paths and action authority are parsed,
   then the result is deterministic and rejects broad, escaping, or ambiguous
   declarations.
2. Given pre-existing user changes, when a task begins and later verifies, then
   those paths remain preserved and separately identified.
3. Given a new task change outside allowed paths, when scope is checked, then the
   loop stops with the exact path and does not modify it.
4. Given a verification failure followed by a meaningful task diff, when the
   next run occurs, then it records a new repair attempt and evidence.
5. Given the same failure with no meaningful diff repeatedly, when the budget is
   exhausted, then the loop stops and requests human direction.
6. Given increased risk or an action beyond structured authority, when evaluated,
   then execution stops before the action even if all technical checks pass.

## Risk And Authority

Risk is high because this phase defines the machine-enforced boundary between
agent autonomy and human ownership. False negatives permit scope creep; false
positives block legitimate work. The primary agent should own the schema and
policy decisions with human review. The user authorized repository-local
implementation; push, deployment, and external mutation remain excluded.

## Impact Areas

- execution-plan schema and template versioning
- knowledge validator and risk/authority policy
- task-state and failure-fingerprint tooling under ignored output
- temporary Git repository and policy fixtures
- `AGENTS.md`, harness, testing, and execution-plan documentation

## Verification Matrix

| Acceptance                    | Evidence                                          |
| ----------------------------- | ------------------------------------------------- |
| Safe structured plan contract | validator acceptance/rejection fixtures           |
| User-change preservation      | dirty-worktree temporary repository tests         |
| Scope enforcement             | in/out-of-scope path fixtures                     |
| Bounded repair behavior       | diff/failure fingerprint state-machine tests      |
| Authority escalation          | risk/action matrix tests and actionable summaries |
| Repository health             | full and runtime verification                     |

## Checklist

- [x] Approve the structured path and action-authority schema with the user.
- [x] Migrate the template and active/new-plan validator without rewriting
      historical completed evidence unnecessarily.
- [x] Implement starting-state, scope, fingerprint, and attempt-budget controls.
- [x] Add exhaustive dirty-worktree and escalation fixtures.
- [x] Integrate controls with Phase 4.1 without creating a second verifier.
- [x] Document escalation semantics and run full/runtime verification.

## Rollout And Rollback

The new blocking behavior runs only through explicit `task:begin` and
`task:verify` commands; existing verification and CI are unchanged. Repository
fixtures demonstrate the boundary before it is used on a real task. Rollback
removes the task-state integration while retaining V2 plan readability and
existing risk checks.

## Decision And Deviation Log

- 2026-08-01: Free-form `Impact Areas` remains useful for humans but is
  insufficient as an authorization boundary; a structured companion is required.
- 2026-08-01: V2 uses comma-separated `Allowed paths` and `Allowed actions`, plus
  `Maximum risk` and `Repair limit`, because these simple fields can be validated
  without a second parser or implicit wildcard language.
- 2026-08-01: The task baseline and repeated-failure data live only under ignored
  `test-results/`; they contain paths, stable failure codes, and metadata
  fingerprints but no source, environment, or command-output content.

## Verification

- `node --test scripts/harness/*.test.mjs scripts/testing/*.test.mjs` passed
  (46 tests), including V2 plan parsing, scope-boundary, state-fingerprint, and
  repair-budget fixtures.
- `pnpm task:begin` correctly stopped before writing task state because this
  local shell is Node 22.22.0 and the repository requires Node 24.18.0.
- `pnpm verify` passed: formatting, contract drift, lint, typecheck, unit and
  harness tests, production build, and repository harness checks all passed.
  The command emitted the expected Node 22 engine warning; CI remains the
  Node 24 authority.

## Runtime Evidence

- `pnpm verify:runtime` passed: 14 Chromium Playwright checks covered public
  routes, authentication behavior, accessibility, and visual baselines. The
  command emitted the same local Node 22 engine warning.

## Follow-Up Debt

- Phase 4.3 will map structured action authority to GitHub handoff operations.
- Run `pnpm task:begin` followed by `pnpm task:verify` in a Node 24.18.0
  worktree before treating the persisted task-state workflow as independently
  proven. The implementation is exercised through deterministic fixtures now;
  this shell cannot create that real baseline because it intentionally fails
  the exact-runtime preflight.
