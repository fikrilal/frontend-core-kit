# 2026-08-11 Frontendkit Controlled Improvement Machinery

**Plan version:** 2
**Status:** active
**Owner:** primary implementation agent with human supervision
**Risk:** high
**Authority:** implement, verify, and commit sanitized evidence and read-only improvement machinery; do not create an unsupported hypothesis, mutate policy, lower risk or gates, push, deploy, or contact external systems
**Allowed paths:** tools/frontendkit/, scripts/harness/, package.json, docs/engineering/, docs/exec-plans/
**Allowed actions:** plan, edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Implement candidate-bound operating evidence, deterministic eligibility and
trend analysis, a versioned one-hypothesis improvement contract, and read-only
`improve check|analyze|shadow` commands that remain disabled while evidence is
insufficient.

## Current Evidence

- The current ledger has three reviewed, CI-reproduced high-risk tasks and no
  second risk class.
- One historical repair has an explicitly unknown failure boundary.
- The accepted proposal requires pre-registered baseline tasks, metrics,
  rollback, shadow tasks, and a human keep/revert decision.

## Decisions And Invariants

- Insufficient evidence permits an empty ledger and read-only analysis only.
- At most one hypothesis may be `evaluating`.
- Baseline and shadow tasks must be independently reviewed, exact-candidate,
  CI-reproduced real tasks.
- Deterministic analysis cannot edit hypothesis status or harness policy.
- Versioned evidence excludes prompts, logs, diffs, review prose, secrets,
  environment values, user data, and external URLs.

## Non-Goals

- No synthetic evidence, automatic hypothesis creation, agent launch,
  self-editing grader, auto-merge, deployment, or policy weakening.
- No claim that the current evidence is eligible.

## Acceptance Scenarios

1. Given the current ledger, when improvement analysis runs, then it reports
   disabled/insufficient and creates no hypothesis.
2. Given a malformed or privacy-violating ledger, when checked, then it fails
   with a stable schema reason.
3. Given eligible fixture evidence and one valid hypothesis, when shadow
   analysis runs, then it deterministically recommends keep or revert without
   changing stored status.
4. Given multiple evaluating hypotheses or missing baseline/shadow tasks, when
   checked, then it fails closed.

## Risk And Authority

Risk is high because this machinery can influence every later harness change.
It is advisory and read-only; humans retain hypothesis approval and keep/revert
authority.

## Impact Areas

- evidence schema and validators;
- trend and eligibility analysis;
- improvement ledger and commands;
- privacy and negative fixtures;
- harness documentation.

## Verification Matrix

| Acceptance                  | Evidence                     |
| --------------------------- | ---------------------------- |
| Current disabled state      | real ledger CLI output       |
| Schema/privacy              | negative fixtures            |
| Deterministic shadow result | keep/revert fixtures         |
| No self-mutation            | before/after file assertions |

## Checklist

- [ ] Extend candidate-bound operating evidence safely.
- [ ] Add deterministic eligibility and trend analysis.
- [ ] Add improvement ledger schema and empty current ledger.
- [ ] Add check/analyze/shadow commands and tests.
- [ ] Document human hypothesis and keep/revert ownership.
- [ ] Run verification and record evidence.

## Rollout And Rollback

Install the machinery disabled with an empty improvement ledger. Rollback
removes the analyzer and ledger but retains reviewed operating evidence.

## Decision And Deviation Log

- 2026-08-11: Do not fabricate a second risk class or recurring signal for the
  sake of demonstrating activation.

## Verification

- Not run yet.

## Runtime Evidence

- Real current-ledger output and fixture-only eligible shadow evaluation will be
  recorded separately.

## Follow-Up Debt

- The first real hypothesis remains blocked by operating evidence, not code.
