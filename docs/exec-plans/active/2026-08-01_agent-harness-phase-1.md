# 2026-08-01 Agent Harness Phase 1: Executable Intent And Knowledge

**Plan version:** 1
**Status:** active
**Owner:** primary agent
**Risk:** medium
**Authority:** implement, verify, and create focused local commits; do not push,
merge, deploy, mutate external systems, or alter production data

## Objective

Implement Phase 1 of the accepted
[agent-first harness and loop engineering proposal](../../planning/agent-harness-loop-engineering-proposal.md):
make non-trivial work begin from a machine-valid change contract, reconcile the
repository's ownership guidance, validate repository knowledge links and plan
state, and record the current harness baseline without introducing arbitrary
quality thresholds.

The observable outcome is that a future authorized agent can discover one
unambiguous architecture pattern, create a complete execution plan, and receive
actionable deterministic failures when the plan or documentation graph is
invalid.

## Current Evidence

- `AGENTS.md` maps current documentation and verification commands.
- `docs/exec-plans/_template.md` contains only objective, acceptance, risk,
  impact, checklist, decisions, verification, runtime evidence, and debt.
- Completed plans are materially more detailed than the template.
- No harness command validates plan metadata, required sections, folder/status
  agreement, unresolved completed-plan checkboxes, or Markdown links.
- `AGENTS.md` broadly places server-only integration under `src/server/**`, but
  current architecture intentionally places feature endpoint adapters under
  `src/features/<feature>/server/**`.
- The repository has local verification commands but no CI workflow.
- The accepted proposal records missing maintainability, CI, backend-preflight,
  security, and visual sensors. Those later sensors are not Phase 1 scope.

## Decisions And Invariants

- `AGENTS.md` remains a concise map and set of non-negotiables; detailed policy
  stays in source-of-truth documents.
- Shared server infrastructure belongs under `src/server/**`; feature-owned
  endpoint adapters belong under `src/features/<feature>/server/**`.
- New plans use plan schema version 1 with explicit status, owner, risk, and
  authority metadata.
- Risk is declared by humans in Phase 1. Path-derived risk classification is
  designed in this plan but implemented in Phase 2 with CI.
- The knowledge validator is deterministic, dependency-free, and emits
  actionable messages.
- Existing completed pre-v1 plans remain valid historical artifacts, but they
  must not contain unresolved required checkboxes or broken local links.
- A v1 plan's status must match its folder.
- Completed v1 plans must contain no pending required checkbox or placeholder
  verification evidence.
- The validator checks mechanically knowable structure only; it does not judge
  product correctness or approve decisions.
- Baseline findings are descriptive. Phase 1 adds no blocking complexity,
  duplication, dead-code, coverage, or duration threshold.

## Non-Goals

- GitHub Actions or branch protection.
- Path-derived risk classification.
- Complexity, duplication, dead-export, mutation, coverage, accessibility,
  screenshot, secret-scan, or dependency-audit gates.
- A real-backend smoke lane or Docker deployment.
- Autonomous PR creation, merging, deployment, or harness self-modification.
- Product routes, API endpoints, authentication behavior, or UI changes.
- Adding a general workflow engine or third-party plan framework.

## Acceptance Scenarios

1. Given a valid v1 active plan and valid relative documentation links, the
   knowledge check exits successfully.
2. Given a v1 plan missing required metadata or sections, the check fails and
   names the plan, missing requirement, and expected correction.
3. Given a plan whose declared status disagrees with its folder, the check
   fails.
4. Given a completed plan with an unresolved required checkbox or placeholder
   evidence, the check fails.
5. Given a broken local Markdown link in repository documentation, the check
   fails and reports the source and unresolved target.
6. Existing completed plans remain accepted without rewriting their historical
   format.
7. The normal harness invokes the knowledge check, so `pnpm verify:fast` cannot
   bypass it.
8. The execution-plan template contains every field required by the accepted
   proposal and explains authority boundaries.
9. Repository guidance unambiguously distinguishes shared server infrastructure
   from feature-owned server adapters.
10. A versioned baseline document records current controls, missing controls,
    test inventory, gate durations, and known limitations without claiming
    unsupported quality measurements.

## Risk And Authority

This is a medium-risk harness change. A false positive can block all future
work; a false negative can let incomplete plans appear valid. The implementation
must include focused validator tests and preserve existing verification behavior.

The user explicitly authorized doing the accepted sequence in order. The agent
may edit repository documentation and harness code, run local checks, and create
focused local commits. It may not push, merge, deploy, modify the running
backend, install external infrastructure, or perform destructive operations.

## Impact Areas

- `AGENTS.md`
- `docs/README.md`
- `docs/engineering/harness.md`
- `docs/engineering/testing-strategy.md`
- `docs/engineering/harness-baseline.md`
- `docs/exec-plans/README.md`
- `docs/exec-plans/_template.md`
- `docs/exec-plans/active/` and `completed/`
- `scripts/harness/`
- `package.json`

## Verification Matrix

| Acceptance                                                      | Evidence                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Valid plans and links pass                                      | Focused knowledge-validator tests and `pnpm knowledge:check`      |
| Invalid metadata, status, completion, and links fail actionably | Fixture-driven negative tests                                     |
| Existing history remains accepted                               | Check against the real repository                                 |
| Normal harness cannot bypass knowledge validation               | `pnpm harness:check` and `pnpm verify:fast`                       |
| Documentation remains truthful and connected                    | Link validation and targeted review                               |
| No unrelated behavior changes                                   | Clean diff review, unit suite, architecture/public-page checks    |
| Baseline is reproducible and honest                             | Recorded commands, versions, durations, counts, and declared gaps |

## Checklist

- [ ] Strengthen the execution-plan template and workflow documentation.
- [ ] Clarify shared-infrastructure versus feature-adapter ownership.
- [ ] Implement a dependency-free knowledge and plan validator.
- [ ] Add focused positive and negative validator tests.
- [ ] Integrate the validator into the normal harness and test commands.
- [ ] Record the current harness baseline and missing sensors.
- [ ] Run targeted tests while iterating.
- [ ] Run `pnpm verify` and `pnpm verify:runtime`.
- [ ] Record exact evidence and deviations.
- [ ] Move this plan to `completed/` only after all required evidence passes.

## Rollout And Rollback

Rollout is repository-local. The knowledge check joins `harness:check` only
after it accepts the current repository and its negative fixtures prove each
blocking rule.

Rollback removes the knowledge-check command and module, restores the previous
template and documentation wording, and retains this plan as evidence of the
rejected attempt. No runtime application state or user data is affected.

## Decision And Deviation Log

- 2026-08-01: The accepted proposal and user direction authorize Phase 1.
- 2026-08-01: Phase 1 records missing maintainability sensors rather than adding
  arbitrary thresholds before measurement.

## Verification

- Not run yet.

## Runtime Evidence

- Required because the existing browser gate is part of the current harness,
  even though Phase 1 does not change user-visible behavior.
- Pending.

## Follow-Up Debt

- Phase 2 owns CI, path-derived risk, and independent integration evidence.
- Phase 3 owns calibrated maintainability, security, backend, accessibility,
  and visual sensors.
