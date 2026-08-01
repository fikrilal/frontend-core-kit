# 2026-08-01 Agent Harness Phase 3.1: Maintainability Fitness

**Plan version:** 1
**Status:** active
**Owner:** primary agent
**Risk:** high
**Authority:** implement, verify, commit, push, and observe repository-local
maintainability and architecture checks; do not alter product behavior,
repository rules, deployment, secrets, production systems, or external services

## Objective

Add a small, evidence-backed maintainability gate that prevents new structural
debt without forcing speculative refactors or arbitrary global clean-code
scores. Measure the current TypeScript/JavaScript codebase first, select only
high-signal checks, make failures actionable, and independently prove them in
the existing CI workflow.

## Current Evidence

- ESLint is already type-aware and enforces import cycles, strict TypeScript,
  accessibility syntax, and several correctness rules.
- `scripts/harness/check-architecture.mjs` protects environment access, raw
  network calls, feature public APIs, Client/Server imports, UI/lib dependency
  direction, and thin route files.
- The Phase 3 proposal identifies unmeasured complexity, file/function growth,
  duplication, and dead exports; the current baseline records the same gaps.
- Hosted CI is proven and runs `pnpm verify` plus browser evidence for
  medium/high changes.

## Decisions And Invariants

- Measure before selecting thresholds or dependencies.
- Prefer existing ESLint/TypeScript capabilities; add a focused dependency only
  when it provides a materially better signal than repository-local code.
- New controls are no-regression ratchets. Existing debt is recorded explicitly
  or repaired only when the repair is small and behavior-preserving.
- Generated contracts, framework output, fixtures, and test data must not
  distort production maintainability measurements.
- A violation must identify the file, controlling metric/invariant, observed
  value, allowed value, and remediation.
- Do not combine independent metrics into a vanity score or require coverage
  percentages.
- Architecture constraints must express repository ownership rules, not generic
  style preferences.

## Non-Goals

- Product, auth/session, API, UI, accessibility, visual, Docker, or backend
  preflight changes.
- Refactoring healthy source merely to satisfy a conventional number.
- Mutation testing, code-coverage targets, AI review, or repository rules.
- Blocking on inferential or noisy findings without demonstrated reliability.

## Acceptance Scenarios

1. Given the current repository, when maintainability measurement runs, then it
   reports the baseline deterministically without generated/build output.
2. Given source that exceeds an accepted size or complexity ratchet, when the
   gate runs, then it fails with the file, observed value, limit, and repair
   direction.
3. Given duplicated or unused code, when the selected sensors run, then findings
   are reproducible and exclude documented framework/generated entry points.
4. Given no demonstrated architecture parsing escape, when the current checks
   are assessed, then they remain unchanged rather than adding speculative
   parser infrastructure.
5. Given a clean checkout, when `pnpm verify` and hosted CI run, then the new
   fitness gate is deterministic and does not require secrets or external
   services.

## Risk And Authority

This is high risk because a noisy gate can block every change and a weak gate
can create false confidence. The user authorized executing Phase 3.1 in the
accepted order, including repository changes and the established commit/push/
observation loop. Product behavior and external administration remain excluded.

## Impact Areas

- `eslint.config.mjs`
- `package.json` and `pnpm-lock.yaml` only if evidence justifies tooling
- `scripts/harness/`
- `docs/engineering/harness.md`
- `docs/engineering/harness-baseline.md`
- `docs/exec-plans/README.md`
- `.github/workflows/ci.yml` only if the existing `pnpm verify` lane cannot host
  the selected deterministic gate

## Verification Matrix

| Acceptance                              | Evidence                                             |
| --------------------------------------- | ---------------------------------------------------- |
| Deterministic baseline and exclusions   | Sensor unit/integration fixtures and repeated output |
| Actionable no-regression failures       | Negative fixtures asserting diagnostics              |
| Architecture direction remains enforced | Architecture fixture tests                           |
| Existing repository remains healthy     | `pnpm verify`                                        |
| Independent clean-checkout proof        | GitHub Actions job evidence                          |

## Checklist

- [x] Measure file/function size, complexity, duplication, and unused exports.
- [x] Record findings and select the smallest high-signal sensor set.
- [x] Implement deterministic ratchets using established tool diagnostics.
- [x] Assess architecture parsing; retain current checks because no new escaped
      violation was demonstrated in this slice.
- [x] Integrate the gate into existing local and CI verification.
- [x] Update harness guidance and the measured baseline.
- [x] Run targeted and full local verification; use hosted CI as the clean
      checkout proof.
- [ ] Commit, push, observe hosted CI, and record evidence.
- [ ] Move this plan to `completed/` with no unresolved required work.

## Rollout And Rollback

The gate enters through `pnpm verify`, so the existing CI lane activates it on
push and pull request. Rollback removes the selected configuration/tooling and
restores the previous verification command; no application runtime state or
external system is affected.

## Decision And Deviation Log

- 2026-08-01: Phase 3 is split into focused slices; maintainability and
  architecture fitness precede backend, accessibility, and visual sensors.
- 2026-08-01: Thresholds remain undecided until repository measurements exist.
- 2026-08-01: Production maxima measured at 317 logical file lines, 73 logical
  function lines, and complexity 12. Caps are 350, 80, and 12 respectively.
- 2026-08-01: jscpd found zero clones using an 8-line/60-token floor across 49
  non-generated files. It remains a periodic measurement rather than a
  permanent dependency.
- 2026-08-01: Knip produced actionable dead-export findings after generated API
  contracts were excluded. It is retained as the dead-code sensor.
- 2026-08-01: No architecture implementation changed because this slice found
  no concrete parsing escape to justify a speculative replacement.
- 2026-08-01: Acceptance scenario 4 was narrowed after measurement from a
  hypothetical parser replacement to retaining current architecture checks.
  This records the evidence-based scope reduction instead of silently adding an
  abstraction without a failure case.

## Verification

- `pnpm lint`, `pnpm maintainability:check`, `pnpm harness:check`,
  `pnpm typecheck`, and `pnpm test`: passed; 60 Vitest, 6 contract, and 18
  harness tests.
- `pnpm verify`: passed under Node `v24.18.0`, including production build and
  the new Knip gate.

## Runtime Evidence

- `pnpm verify:runtime`: passed; all 6 Chromium scenarios succeeded.
- No browser-visible behavior changed.

## Follow-Up Debt

- Backend preflight and contract-validated acceptance fixtures belong to Phase
  3.2.
- Accessibility belongs to Phase 3.3; repository-owned visual evidence belongs
  to Phase 3.4.
- Duplication remains measured rather than continuously blocking; promote it
  only after a demonstrated failure or meaningful repository growth.
