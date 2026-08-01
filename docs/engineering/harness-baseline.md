# Harness Baseline

**Baseline version:** 1

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
- Automation: local commands only; no repository CI workflow or protected
  required checks exist.
- Runtime browser lane: isolated Next.js output and contract-faithful local API
  fixture; it does not call the real backend.

## Current Sensors

| Dimension       | Blocking controls today                                             | Known gap                                                        |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Intent          | v1 plan schema, lifecycle checks, link and proposal-index checks    | No semantic judgment of plan quality or human authority          |
| Formatting      | Prettier check                                                      | None known for covered file types                                |
| Static analysis | ESLint and strict TypeScript                                        | No complexity, duplication, or dead-export sensor                |
| Architecture    | Environment, fetch, import, feature API, and thin-route checks      | Regex/static heuristics do not prove all dependency directions   |
| API contracts   | Regeneration and byte-drift check from committed OpenAPI snapshot   | No automatic backend publication or live compatibility lane      |
| Behavior        | Vitest, Node fixtures, production build, and Playwright             | No mutation score or coverage threshold                          |
| Authentication  | Failure, token, session, refresh, cookie, and browser-flow coverage | Default runtime lane uses a fixture rather than the real backend |
| Security        | Server-only boundaries and secret-safe API failure tests            | No secret scan, dependency audit, or browser security scan       |
| Accessibility   | Semantic Testing Library and Playwright queries where tests exist   | No automated accessibility audit                                 |
| Visual quality  | Human inspection only                                               | No screenshot comparison or deterministic visual oracle          |
| Delivery        | Reproducible local build command                                    | No CI, container build, artifact provenance, or deployment gate  |

## Test Inventory

The inventory below is recorded from the verification run in this baseline:

| Layer                        | Count | Scope                                                   |
| ---------------------------- | ----: | ------------------------------------------------------- |
| Vitest unit/component/server |    60 | Application and server-boundary behavior                |
| Contract Node tests          |     6 | Contract tooling and deterministic generation           |
| Harness Node tests           |     7 | Knowledge validator fixtures                            |
| Playwright scenarios         |     6 | Public metadata, auth, session, and unknown-route flows |

Counts describe current test cases, not requirements coverage. They must not be
used as a target that encourages low-value tests.

## Gate Measurements

Measured serially on the local development machine using the intended Node
runtime:

| Command               | Result | Wall time | Notes                               |
| --------------------- | ------ | --------- | ----------------------------------- |
| `pnpm verify:fast`    | passed | 27.06 s   | Full fast deterministic gate        |
| `pnpm verify`         | passed | 35.48 s   | Fast controls plus production build |
| `pnpm verify:runtime` | passed | 10.34 s   | Six Chromium scenarios              |

These values establish an observation point for future calibration. A later
phase may introduce regression budgets only after multiple comparable samples.

## Baseline Interpretation

The repository has credible local feedback for its small implemented slice:
formatting, typing, contracts, focused behavior, architecture boundaries,
production compilation, and browser flows. It is not yet an autonomous delivery
system. In particular, there is no independent CI execution, no real-backend
smoke lane, no container evidence, and no calibrated maintainability, security,
accessibility, or visual sensor.

Phase 2 should make existing evidence independently repeatable in CI before
Phase 3 adds new quality signals. This ordering prevents local-only confidence
from being mistaken for delivery confidence.
