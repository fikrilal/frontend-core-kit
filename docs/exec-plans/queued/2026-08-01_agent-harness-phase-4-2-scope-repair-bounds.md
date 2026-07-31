# 2026-08-01 Agent Harness Phase 4.2: Scope And Repair Bounds

**Plan version:** 1
**Status:** queued
**Owner:** primary agent
**Risk:** high
**Authority:** planning only; plan-schema, policy, implementation, commit, push,
and external mutation require separate user authorization

## Objective

Make task scope and repair limits mechanically enforceable so an agent can
distinguish authorized progress from unrelated edits, repeated failure, risk
escalation, and conditions that require human direction.

## Current Evidence

- V1 plans validate risk, authority prose, impact areas, acceptance, and
  lifecycle, but impact and authority are not structured enough for safe path or
  action enforcement.
- Risk classification covers paths but does not prove those paths were permitted
  by the task or distinguish pre-existing user changes from agent changes.
- No repository mechanism fingerprints unchanged failures or records a bounded
  repair attempt count.
- Phase 4.1 is expected to provide complete change discovery and stable failure
  evidence; this phase must not duplicate its orchestration.

## Decisions And Invariants

- This phase depends on completed, proven Phase 4.1 behavior.
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
policy decisions with human review. This queued document grants no implementation
or repository mutation authority.

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

- [ ] Approve the structured path and action-authority schema with the user.
- [ ] Migrate the template and active/new-plan validator without rewriting
      historical completed evidence unnecessarily.
- [ ] Implement starting-state, scope, fingerprint, and attempt-budget controls.
- [ ] Add exhaustive dirty-worktree and escalation fixtures.
- [ ] Integrate controls with Phase 4.1 without creating a second verifier.
- [ ] Document escalation semantics and run full/runtime verification.

## Rollout And Rollback

Roll out schema parsing and advisory reporting before making scope violations
blocking. Promote to blocking only after repository fixtures and one real task
show acceptable signal. Rollback disables the blocking integration while
retaining readable plan fields and existing risk checks.

## Decision And Deviation Log

- 2026-08-01: Free-form `Impact Areas` remains useful for humans but is
  insufficient as an authorization boundary; a structured companion is required.

## Verification

- Not run; queued plan only.

## Runtime Evidence

- Not run; queued plan only.

## Follow-Up Debt

- Phase 4.3 will map structured action authority to GitHub handoff operations.
