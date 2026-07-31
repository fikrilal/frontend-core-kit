# 2026-08-01 Agent Harness Phase 4.3: Authorized PR Loop

**Plan version:** 2
**Status:** completed
**Owner:** primary agent
**Risk:** high
**Authority:** implement and verify repository-local Git/GitHub handoff tooling;
do not commit, push, create branches, create or update pull requests, merge,
deploy, or mutate external systems
**Allowed paths:** scripts/harness/, docs/exec-plans/, docs/engineering/, package.json
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 0

## Objective

Allow an agent to hand off a locally verified task as a draft pull request and
repair that same PR within explicit per-task authority, while keeping push,
review, merge, deployment, secrets, and high-risk approval boundaries visible
and mechanically enforced.

## Current Evidence

- CI provides risk-tiered clean-checkout verification and a stable `CI Required`
  outcome, but repository tooling does not connect local task evidence to a PR.
- Plans state authority in prose today; Phase 4.2 must provide structured action
  authority before this phase can safely execute GitHub writes.
- Existing commit conventions and hooks are enforced locally, while no auto-merge
  or repository mutation policy exists.
- `task:handoff` now uses an injected Git/GitHub command adapter and a fresh
  task-verification result; its live publication path remains disabled unless a
  task plan grants each required structured action.
- GitHub authentication and repository rules are external state and cannot be
  assumed by deterministic tests.

## Decisions And Invariants

- This phase depends on proven Phase 4.1 verification and Phase 4.2 structured
  authority/scope enforcement.
- Use existing Git and GitHub CLI capabilities through a small injected adapter;
  add no GitHub SDK unless a concrete missing API requires it.
- Separate authorities for commit, push, create draft PR, update an existing PR,
  resolve comments, merge, deploy, and external messaging. Permission for one
  never implies another.
- Initial automation may create draft PRs only. It provides no merge or deploy
  command, and high-risk changes always retain a human gate.
- Require a clean task result from Phase 4.1, satisfied scope/repair bounds, an
  explicit remote/branch target, and no unowned changes before any mutation.
- PR text includes objective, risk, acceptance evidence, executed commands,
  runtime evidence, rollback, and remaining human gates without raw logs or
  secrets.
- Repair handoff requires a matching open draft PR, fresh task verification, and
  separate `update-pr` authority. It never force-pushes, merges, deploys,
  comments, or resolves review threads.
- Never force-push. If published history must change, stop and request explicit
  approval for a safe strategy.

## Non-Goals

- Autonomous merge, deployment, production mutation, review approval, branch
  protection administration, or secret provisioning.
- Creating product intent, changing acceptance scenarios to satisfy CI, or
  accepting visual baselines without human inspection.
- Replacing GitHub Actions or weakening its independent risk decision.

## Acceptance Scenarios

1. Given missing structured commit/push/PR authority, when publication is
   requested, then it stops before the first Git or GitHub mutation.
2. Given dirty unowned changes, failed verification, scope violation, or an
   ambiguous remote/base, when publication is requested, then it fails with a
   safe remediation and preserves repository state.
3. Given explicit authority and passing evidence, when draft handoff runs, then
   it creates only the permitted commit/push/draft-PR operations and produces a
   sanitized evidence-rich description.
4. Given a failed hosted check with an actionable in-scope cause, when repair is
   authorized, then the agent may amend source through a new commit, rerun local
   verification, push normally, and wait for independent CI.
5. Given high risk, exhausted repair budget, review ambiguity, or requested
   merge/deploy behavior, when encountered, then the loop stops at a human gate.
6. Given injected Git/GitHub failures in tests, when the adapter runs, then exact
   command ordering and stop-before-mutation behavior are proven without live
   external changes.

## Risk And Authority

Risk is high because this phase can mutate Git history on a remote and communicate
through GitHub. The primary agent should own implementation and safety review.
Unit/fixture work may be delegated, but live proof requires explicit case-specific
user approval. This completed implementation authorizes no live mutation.

## Impact Areas

- task publication and hosted-repair command adapters
- structured authority integration from Phase 4.2
- commit/branch/remote and GitHub preflight
- sanitized PR evidence rendering
- injected Git/GitHub fixtures and optional separately authorized live proof
- SCM, harness, testing, and execution-plan documentation

## Verification Matrix

| Acceptance               | Evidence                                   |
| ------------------------ | ------------------------------------------ |
| Stop-before-mutation     | injected command-order and failure tests   |
| Authority/action mapping | complete permission-matrix fixtures        |
| Sanitized PR evidence    | golden text without secret/raw-log content |
| Bounded hosted repair    | simulated CI outcome and scope fixtures    |
| Live draft handoff       | separately authorized disposable/test PR   |
| Repository health        | full and runtime verification              |

## Checklist

- [x] Confirm Phase 4.1 and 4.2 implementation evidence and their remaining
      Node 24 real-workflow proof debt.
- [x] Define the exact action-authority matrix and draft-only initial rollout.
- [x] Implement injected Git/GitHub preflight and publication adapters.
- [x] Add permission, ordering, failure, privacy, and no-force fixtures.
- [x] Exclude live draft-PR proof until separate explicit authorization exists.
- [x] Document human gates, rollback, and hosted repair limits.

## Rollout And Rollback

Ship the adapter disabled except through an explicit command and authority check.
First prove command construction with injected fixtures, then one disposable or
real draft PR with explicit approval. Rollback removes the publication entry
point; local verification and plan evidence remain usable.

## Decision And Deviation Log

- 2026-08-01: Draft PR creation is the maximum initial external autonomy; merge
  and deployment remain absent rather than merely disabled by default.
- 2026-08-01: `task:handoff` re-runs local task verification immediately before
  mutation and rejects dirty baselines, stale verified scope, detached branches,
  missing `origin`, PR/base/head mismatches, and any absent required action.

## Verification

- `node --test scripts/harness/task-handoff.test.mjs` passed (6 tests), covering
  authority stops, dry run, draft creation ordering, repair handoff, stale or
  unowned changes, branch validation, sanitized body content, and no force-push.
- `pnpm maintainability:check` passed after registering the CLI as
  `pnpm task:handoff`.

## Runtime Evidence

- No live GitHub operation was attempted or authorized. The command adapter is
  proven only through injected local fixtures.

## Follow-Up Debt

- Phase 4.4 must measure real repair-loop outcomes before any broader autonomy is
  proposed.
- A real Node 24.18.0 task must prove `task:begin`, `task:verify`, and a
  separately authorized draft handoff before live publication is considered
  independently proven.
