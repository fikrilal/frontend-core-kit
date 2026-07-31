# 2026-08-01 Agent Harness Phase 4.1: Task-Oriented Verification

**Plan version:** 1
**Status:** active
**Owner:** primary agent
**Risk:** high
**Authority:** implement and verify repository-local task-verification tooling;
do not commit, push, deploy, mutate external systems, or change task content

## Objective

Provide one deterministic local command that validates task prerequisites,
discovers the complete change set, computes effective risk, runs the cheapest
required verification lanes in order, and emits actionable human and machine
evidence without modifying repository content.

## Current Evidence

- `pnpm verify:fast`, `pnpm verify`, and `pnpm verify:runtime` are trustworthy but
  require the agent to choose and sequence them manually.
- `pnpm risk:classify` combines committed changed paths with a v1 plan's declared
  risk, but its primary interface compares Git revisions and does not represent
  the complete staged, unstaged, and untracked task state.
- CI independently selects full and runtime lanes, but there is no equivalent
  task-oriented local entry point or sanitized machine-readable task summary.

## Decisions And Invariants

- Add one entry point, provisionally `pnpm task:verify`, using repository-owned
  Node tooling and existing gates rather than a new orchestration dependency.
- Discover committed, staged, unstaged, and untracked paths. Never ignore a path
  merely because it is not committed.
- Effective risk is the maximum of plan-declared and path-derived risk;
  automation may raise it and never lower it.
- Run fail-fast in cost order. Low risk runs the fast gate; medium/high risk runs
  the full gate and runtime gate. A small explicit registry may select existing
  specialized checks, but live backend preflight remains opt-in because it
  requires external state.
- Validate the Node and pnpm versions, Git base, plan lifecycle, and browser
  prerequisites before expensive work. Diagnostics name missing requirements
  without printing environment values.
- Emit concise terminal output and an optional JSON result under the already
  ignored `test-results/` tree. Do not persist raw logs or secrets.
- Verification is read-only: it must not format, generate accepted snapshots,
  edit plans, commit, push, install browsers, or repair code.

## Non-Goals

- Automatically editing source, weakening tests, accepting screenshots, or
  retrying failed commands.
- Enforcing allowed change scope or attempt budgets; Phase 4.2 owns those.
- Committing, pushing, opening PRs, reading hosted CI, or merging; Phase 4.3 owns
  authorized GitHub handoff.
- Adding new quality sensors unrelated to orchestration.

## Acceptance Scenarios

1. Given an invalid runtime, unresolved Git base, invalid plan, or missing
   browser, when task verification starts, then it stops before expensive gates
   with a sanitized remediation message.
2. Given committed, staged, unstaged, or untracked files, when risk is computed,
   then every path contributes and the result cannot be lower than active-plan
   risk.
3. Given a low-risk task, when verification runs, then only the required fast
   deterministic lane runs.
4. Given a medium/high-risk task, when verification runs, then full verification
   precedes runtime verification and later lanes do not run after failure.
5. Given any outcome, when summary output is requested, then stable JSON records
   risk, path/rule evidence, commands, outcomes, durations, and the first failed
   invariant without raw logs or configuration values.
6. Given a passing run, when Git status is inspected, then verification has not
   changed tracked or untracked task content except the ignored requested result.

## Risk And Authority

Risk is high because this command becomes the primary local decision point for
all future changes; incorrect selection could create false confidence. This
queued plan records design only. Activating it requires explicit implementation
authority, and push/deployment/external communication remain separately gated.

## Impact Areas

- new task-verification orchestration and focused Node tests
- `package.json` command surface
- risk-classifier reuse or extraction without changing CI semantics
- ignored machine-readable result location
- harness, testing, baseline, and execution-plan documentation

## Verification Matrix

| Acceptance                   | Evidence                                   |
| ---------------------------- | ------------------------------------------ |
| Complete change discovery    | temporary Git repository fixtures          |
| Risk and lane selection      | injected-command unit tests                |
| Fail-fast actionable output  | negative fixtures and secret-safety checks |
| Read-only behavior           | before/after repository-state tests        |
| Existing repository behavior | `pnpm verify` and `pnpm verify:runtime`    |

## Checklist

- [x] Confirm command contract and base-revision precedence before coding.
- [x] Implement prerequisite, change-discovery, risk, and lane orchestration.
- [x] Add stable sanitized JSON and terminal summaries.
- [x] Add injected-command and temporary-repository tests for all outcomes.
- [x] Document local usage and explicit non-mutating behavior.
- [x] Run full and runtime verification and record evidence.
- [ ] Run `pnpm task:verify` end-to-end under Node 24 and record hosted CI proof.

## Rollout And Rollback

The new command is additive until operating evidence supports making it the
documented default. Existing verification commands and CI remain authoritative.
Rollback removes the entry point and leaves every underlying gate intact.

## Decision And Deviation Log

- 2026-08-01: Phase 4 is split so orchestration proves itself before scope,
  repair-budget, or GitHub mutation controls depend on it.
- 2026-08-01: `--base` defaults to `HEAD` so the normal loop classifies all
  staged, unstaged, and untracked task paths. Agents may provide an explicit
  base revision to include already committed task history.
- 2026-08-01: The active plan's risk always contributes even if the plan file is
  unchanged, while CI risk classification retains its existing changed-plan-only
  semantics.

## Verification

- Focused Node tests: passed, 22 task/risk scenarios covering complete change
  discovery, exact runtime validation, active-plan risk, lane selection,
  browser preflight, fail-fast behavior, safe summaries, and non-mutation.
- `pnpm verify`: passed with formatting, contracts, lint, typecheck, 60 Vitest,
  6 contract, and 33 harness/testing Node tests, production build, and harness
  checks. The local shell used Node `v22.22.0`, so pnpm emitted the expected
  engine warning for the repository's Node 24 requirement.
- Local `pnpm task:verify -- --summary test-results/task-verification.json`:
  correctly stopped before any lane with the sanitized Node 24 remediation. A
  successful end-to-end local run cannot be obtained until Node `v24.18.0` is
  installed in this shell.

## Runtime Evidence

- `pnpm verify:runtime`: passed; all 14 Chromium scenarios succeeded in 10.4
  seconds. The new task verifier's high-risk success path is covered by injected
  command fixtures; hosted CI under Node 24 remains required for the real command
  path.

## Follow-Up Debt

- Phase 4.2 will consume this command's change and failure evidence for scope and
  bounded-repair controls.
- Do not complete this plan until a Node 24 run proves `pnpm task:verify` selects
  and completes the real high-risk lanes from an active task state.
