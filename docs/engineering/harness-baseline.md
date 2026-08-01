# Harness Baseline

**Baseline version:** 5

**Captured:** 2026-08-01

**Scope:** Lamara Frontend repository and GitHub-hosted CI

**Threshold status:** descriptive measurements only

This baseline records what the harness can prove today and, equally
importantly, what it cannot. Durations are observations from one local machine,
not performance budgets. A passing gate does not imply coverage for a sensor
listed as missing.

## Runtime And Delivery Context

- Intended local runtime: Node `v24.18.0` from `.nvmrc`.
- Package manager: pnpm `11.15.0` from `packageManager`.
- Framework: Next.js `16.2.10`.
- Deployment topology: one frontend process; Docker packaging is planned but
  not implemented.
- Automation: GitHub Actions independently runs risk classification, full
  verification, conditional browser verification, and one aggregate status.
  The workflow is proven on a hosted runner; no protected required check exists.
- Runtime browser lane: isolated Next.js output and generated-schema-validated
  local API fixture; it does not call the real backend.

## Current Sensors

| Dimension       | Blocking controls today                                                                   | Known gap                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Intent          | v1 plan schema, lifecycle/link/proposal checks, and deterministic risk classification     | No semantic judgment of plan quality or human authority                         |
| Formatting      | Prettier check                                                                            | None known for covered file types                                               |
| Static analysis | ESLint/TypeScript, calibrated size and complexity caps, and Knip dead-code analysis       | Duplication has a measured baseline but no permanent sensor                     |
| Architecture    | Environment, fetch, import, feature API, and thin-route checks                            | Regex/static heuristics do not prove all dependency directions                  |
| API contracts   | Regeneration and byte-drift check from committed OpenAPI snapshot                         | No automatic backend publication or live compatibility lane                     |
| Behavior        | Vitest, contract-validated auth fixtures, production build, and Playwright                | No mutation score, coverage threshold, or real-backend behavior lane            |
| Authentication  | Failure, token, session, refresh, cookie, and browser-flow coverage                       | Default runtime lane uses a fixture rather than the real backend                |
| Security        | Server-only boundaries, secret-safe API failures, read-only CI, and immutable action pins | No secret scan, dependency audit, or browser security scan                      |
| Accessibility   | Semantic Testing Library and Playwright queries where tests exist                         | No automated accessibility audit                                                |
| Visual quality  | Human inspection only                                                                     | No screenshot comparison or deterministic visual oracle                         |
| Delivery        | Proven clean-checkout CI, frozen install, stable aggregate status, and summaries          | No repository rule, container evidence, artifact provenance, or deployment gate |

## Test Inventory

The inventory below is recorded from the verification run in this baseline:

| Layer                        | Count | Scope                                                    |
| ---------------------------- | ----: | -------------------------------------------------------- |
| Vitest unit/component/server |    60 | Application and server-boundary behavior                 |
| Contract Node tests          |     6 | Contract tooling and deterministic generation            |
| Harness Node tests           |    18 | Knowledge, risk, aggregate-status, and workflow fixtures |
| Testing-tool Node tests      |     7 | Auth fixture contracts and sanitized backend preflight   |
| Playwright scenarios         |     6 | Public metadata, auth, session, and unknown-route flows  |

Counts describe current test cases, not requirements coverage. They must not be
used as a target that encourages low-value tests.

## Gate Measurements

Measured serially on the local development machine using the intended Node
runtime:

| Command               | Result | Wall time | Notes                               |
| --------------------- | ------ | --------- | ----------------------------------- |
| `pnpm verify:fast`    | passed | 24.25 s   | Full fast deterministic gate        |
| `pnpm verify`         | passed | 32.79 s   | Fast controls plus production build |
| `pnpm verify:runtime` | passed | 8.84 s    | Six Chromium scenarios              |

These values establish an observation point for future calibration. A later
phase may introduce regression budgets only after multiple comparable samples.

## Baseline Interpretation

The repository has credible local and independent CI feedback for its small implemented slice:
formatting, typing, contracts, focused behavior, architecture boundaries,
production compilation, and browser flows. The least-privilege CI workflow
reproduced that evidence successfully in
[run 30682954749](https://github.com/Orymu/lamara-frontend/actions/runs/30682954749).
There is still no required repository rule,
real-backend smoke lane, container evidence, or calibrated maintainability,
security, accessibility, or visual sensor.

Phase 3 can now add new quality signals without mistaking configured automation
for observed delivery confidence.

## Maintainability Measurements

Phase 3.1 measured non-test, non-generated production source before selecting
controls:

| Metric                      | Observed maximum/result                              | Control                                     |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| Logical file lines          | 317 in `session-service.ts`                          | ESLint maximum 350                          |
| Logical function lines      | 73 in `readResponse`                                 | ESLint maximum 80                           |
| Cyclomatic complexity       | 12 in `mapPasswordLoginFailure`                      | ESLint maximum 12                           |
| Duplicate blocks            | 0 at 8 lines/60 tokens across 49 non-generated files | Recorded only; no recurring dependency      |
| Unused exports/dependencies | Six unnecessary exports plus generated noise         | Knip gate; generated contracts are excluded |

The maxima are no-regression boundaries, not desired targets. The initial Knip
cleanup also removed an unused Zod schema that was never executed and therefore
misrepresented an internal session record as runtime-validated.

The complete maintainability gate was independently reproduced in
[GitHub Actions run 30684371899](https://github.com/Orymu/lamara-frontend/actions/runs/30684371899).
