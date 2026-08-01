# Harness Baseline

**Baseline version:** 2

**Captured:** 2026-08-01

**Scope:** local Lamara Frontend repository

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
- Automation: a GitHub Actions workflow is configured locally but has not been
  pushed or observed on a hosted runner; no protected required check exists.
- Runtime browser lane: isolated Next.js output and contract-faithful local API
  fixture; it does not call the real backend.

## Current Sensors

| Dimension       | Blocking controls today                                                                   | Known gap                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Intent          | v1 plan schema, lifecycle/link/proposal checks, and deterministic risk classification     | No semantic judgment of plan quality or human authority                                                  |
| Formatting      | Prettier check                                                                            | None known for covered file types                                                                        |
| Static analysis | ESLint and strict TypeScript                                                              | No complexity, duplication, or dead-export sensor                                                        |
| Architecture    | Environment, fetch, import, feature API, and thin-route checks                            | Regex/static heuristics do not prove all dependency directions                                           |
| API contracts   | Regeneration and byte-drift check from committed OpenAPI snapshot                         | No automatic backend publication or live compatibility lane                                              |
| Behavior        | Vitest, Node fixtures, production build, and Playwright                                   | No mutation score or coverage threshold                                                                  |
| Authentication  | Failure, token, session, refresh, cookie, and browser-flow coverage                       | Default runtime lane uses a fixture rather than the real backend                                         |
| Security        | Server-only boundaries, secret-safe API failures, read-only CI, and immutable action pins | No secret scan, dependency audit, or browser security scan                                               |
| Accessibility   | Semantic Testing Library and Playwright queries where tests exist                         | No automated accessibility audit                                                                         |
| Visual quality  | Human inspection only                                                                     | No screenshot comparison or deterministic visual oracle                                                  |
| Delivery        | Clean-checkout CI workflow, frozen install, stable aggregate status, and summaries        | Hosted CI is unobserved; no repository rule, container evidence, artifact provenance, or deployment gate |

## Test Inventory

The inventory below is recorded from the verification run in this baseline:

| Layer                        | Count | Scope                                                    |
| ---------------------------- | ----: | -------------------------------------------------------- |
| Vitest unit/component/server |    60 | Application and server-boundary behavior                 |
| Contract Node tests          |     6 | Contract tooling and deterministic generation            |
| Harness Node tests           |    17 | Knowledge, risk, aggregate-status, and workflow fixtures |
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

The repository has credible local feedback for its small implemented slice:
formatting, typing, contracts, focused behavior, architecture boundaries,
production compilation, and browser flows. A least-privilege CI workflow now
describes how to reproduce that evidence, but it is not independent proof until
a remote run succeeds. There is still no required repository rule,
real-backend smoke lane, container evidence, or calibrated maintainability,
security, accessibility, or visual sensor.

After an authorized push proves the workflow, Phase 3 can add new quality
signals. This ordering prevents configured automation from being mistaken for
observed delivery confidence.
