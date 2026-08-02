# 2026-08-03 Agent Harness Phase 5: Controlled Hill Climbing

**Plan version:** 2
**Status:** queued
**Owner:** primary agent with human owner for policy and authority decisions
**Risk:** high
**Authority:** prepare and verify a bounded Phase 5 harness-improvement plan;
do not implement policy changes, weaken graders, lower thresholds, enable
auto-merge, deploy, or mutate external systems
**Allowed paths:** scripts/harness/, docs/engineering/, docs/exec-plans/, package.json
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Use observed task evidence to propose one narrow, measurable improvement to the
agent harness without turning the repository into an unsupervised self-modifying
system. The first implementation slice should improve feedback classification,
diagnostic ownership, or documentation gardening only when a concrete signal
justifies it.

Phase 5 is a steering loop, not an autonomy expansion. It may recommend a
change, but policy, risk, authority, grader, threshold, merge, and deployment
decisions remain human-owned.

## Current Evidence

- Phase 4.4 records three independently reviewed, CI-reproduced high-risk auth
  tasks: registration, password-reset confirmation, and email verification.
- The deterministic evidence report remains `insufficient` because the sample
  has no second risk class. The human owner accepted this bounded limitation
  for Phase 5 planning only.
- The sample contains one repair outcome, producing the steering signal to
  inspect diagnostics.
- The current repository already has layered deterministic verification,
  execution-plan metadata, risk classification, scope bounds, CI summaries,
  and sanitized operating evidence.
- No escaped defect, flaky sensor, false positive, or policy regression has
  been recorded yet; Phase 5 must not invent one.

## Decisions And Invariants

- Track only bounded categories: escaped defect, repair friction, review
  comment, flaky sensor, false positive, stale knowledge, unnecessary
  abstraction/dependency, missing diagnostic, or human intervention.
- Every proposed improvement must name the observed signal, owner, expected
  metric, verification lane, rollback, and human decision point.
- Keep raw prompts, source diffs, credentials, environment values, logs,
  private review content, and user data out of versioned feedback.
- A harness change may not weaken a required lane, lower a threshold, reduce a
  risk class, or broaden authority as a side effect of making a loop green.
- Do not enable auto-merge or autonomous deployment from this phase. A future
  low-risk exception requires sustained evidence from multiple risk classes and
  a separate human decision.

## Non-Goals

- No autonomous product discovery, feature implementation, or UI work.
- No LLM reviewer as an authoritative correctness gate.
- No automatic policy mutation based on a metric or model suggestion.
- No broad refactor of the harness, new global state, or speculative sensors.
- No synthetic tasks created solely to improve the evidence sample.

## Acceptance Scenarios

1. Given a concrete recurring signal, when Phase 5 is proposed, then the plan
   identifies its source category, owner, expected outcome, and bounded scope.
2. Given a one-off mistake or ambiguous intent, when it is classified, then the
   proposal routes it to the task or product-plan owner instead of adding a
   speculative grader.
3. Given a repeated mechanically detectable failure, when a sensor change is
   proposed, then its diagnostic, cost, false-positive behavior, and rollback
   are specified before implementation.
4. Given a proposed harness change, when risk and authority are evaluated, then
   required CI lanes and human gates remain unchanged or are explicitly
   approved in a separate decision.
5. Given insufficient risk diversity, when autonomy expansion is considered,
   then the plan stops at observation and recommends collecting the missing
   evidence rather than enabling automatic merge or deployment.

## Risk And Authority

Risk is high because harness policy and diagnostics can influence every future
agent change, even though the first slice is expected to be narrow. This plan
authorizes planning and verification only. Implementation requires a separate
approved execution plan and human review of any grader, threshold, risk, or
authority mutation.

## Impact Areas

- bounded feedback/steering records and reports;
- harness diagnostics and maintenance ownership;
- execution-plan and harness documentation;
- verification cost, false-positive, and escaped-defect reporting;
- no product runtime or external state.

## Verification Matrix

| Acceptance                  | Evidence                                     |
| --------------------------- | -------------------------------------------- |
| Concrete observed signal    | linked sanitized ledger category             |
| Narrow proposed improvement | plan scope, owner, metric, and rollback      |
| No self-weakening           | risk/authority review and negative fixtures  |
| Stable required lanes       | harness/risk-classifier tests and CI summary |
| Actionable diagnostics      | focused failure fixtures and safe output     |
| Documentation consistency   | `pnpm knowledge:check` and link validation   |

## Checklist

- [ ] Select one observed steering signal without inventing product work.
- [ ] Define a bounded implementation plan with owner, metric, and rollback.
- [ ] Add or update only the sensor/guide required by that signal.
- [ ] Prove unchanged risk, authority, required lanes, and privacy boundaries.
- [ ] Measure cost, false positives, repair friction, and any escaped defects.
- [ ] Obtain human review before changing policy or enabling any automation.

## Rollout And Rollback

Roll out one narrow harness improvement behind existing required gates. If the
signal is noisy, the cost is excessive, or a false positive appears, revert the
improvement and retain the evidence record. No deployment or external runtime
state is involved.

## Decision And Deviation Log

- 2026-08-03: Queue Phase 5 after the human owner accepted a bounded Phase 4.4
  planning deviation. The missing second risk class remains a prerequisite for
  any autonomy expansion or automatic merge decision.
- 2026-08-03: Start with steering and diagnostics, not self-modifying graders
  or broad maintainability automation.

## Verification

Not run; this is a queued plan and contains no implementation.

## Runtime Evidence

Not applicable until a concrete Phase 5 implementation plan is approved.

## Follow-Up Debt

- Observe a second risk class before making broader operating claims.
- Create a separate active plan for the first narrow Phase 5 implementation
  after a concrete signal and human approval are selected.
