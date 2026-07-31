# 2026-08-01 Agent Harness Phase 3.4: Repository-Owned Visual Evidence

**Plan version:** 1
**Status:** completed
**Owner:** primary agent
**Risk:** high
**Authority:** implement, verify, and commit repository-local visual evidence;
do not push, deploy, mutate external systems, redesign the UI, or approve visual
taste without human review

## Objective

Give agents a deterministic visual regression signal for every meaningful state
of the currently implemented UI, with baselines stored in the repository and
executed through the existing Playwright runtime lane.

## Current Evidence

- The harness baseline records visual quality as human inspection only, with no
  screenshot comparison or deterministic visual oracle.
- Playwright already runs an isolated API fixture and Next.js server on pinned
  Chromium in local and hosted runtime verification.
- The implemented visual surface is limited to the landing page, login page and
  error state, and authenticated foundation. Light/dark theme behavior exists,
  but no product workflows have been decided.

## Decisions And Invariants

- Use Playwright's built-in screenshot assertions and commit its Linux Chromium
  baselines; add no external visual-testing service or dependency.
- Fix the viewport, color scheme, theme preference, animation behavior, and test
  data so diffs reflect repository changes rather than ambient machine state.
- Cover representative states rather than every permutation: landing in both
  themes, login default/error, and authenticated foundation.
- Use the existing contract-validated fixture and fixed credentials. Never call
  the real backend or place secrets in screenshots.
- A changed baseline is an explicit review artifact. Agents must not update
  snapshots merely to make a failure green.

## Non-Goals

- Redesigning or polishing the current UI, approving visual taste, or asserting
  that the generic product foundation is a final product design.
- Cross-browser/device matrices, third-party screenshot hosting, or responsive
  coverage without a demonstrated product need.
- Snapshotting metadata endpoints, arbitrary 404 pages, or future routes.

## Acceptance Scenarios

1. Given the landing page in explicit light or dark mode, when visual
   verification runs, then it matches the corresponding repository baseline.
2. Given the login page before and after a failed login, when verification runs,
   then both stable states match their repository baselines.
3. Given a successful fixture-backed login, when `/app` settles, then the
   authenticated foundation matches its repository baseline.
4. Given an intentional visual change, when a baseline differs, then Playwright
   reports the diff without silently rewriting expected images.

## Risk And Authority

Risk is high because browser tests, auth states, repository binaries, and the
runtime CI signal change. The user explicitly authorized continuing to Phase
3.4 and committing it. Push, deployment, external services, and unsupervised
baseline acceptance remain excluded.

## Impact Areas

- Playwright visual scenarios and committed screenshot baselines
- Playwright configuration if deterministic defaults are required
- `.gitignore` for generated visual failure artifacts
- testing, harness, baseline, design, and execution-plan documentation

## Verification Matrix

| Acceptance                 | Evidence                                 |
| -------------------------- | ---------------------------------------- |
| Stable representative UI   | Playwright `toHaveScreenshot` assertions |
| Theme determinism          | Explicit preference and color scheme     |
| Auth-state determinism     | Existing contract-validated API fixture  |
| Repository remains healthy | `pnpm verify`                            |
| Runtime visual comparison  | `pnpm verify:runtime`                    |

## Checklist

- [x] Add deterministic visual scenarios for the selected implemented states.
- [x] Generate and inspect repository-owned Chromium baselines.
- [x] Document review/update policy and generated failure artifacts.
- [x] Run full and runtime verification and record exact evidence.
- [x] Commit Phase 3.4 locally without pushing.

## Rollout And Rollback

The new comparisons become blocking wherever `pnpm verify:runtime` runs.
Rollback removes the visual spec and its baseline directory; application and
backend state are unaffected.

## Decision And Deviation Log

- 2026-08-01: The first visual sensor uses the existing Chromium lane because
  its pinned CI OS/browser and isolated fixture provide the needed deterministic
  boundary without a new service.
- 2026-08-01: Playwright's default caret hiding caused a hydration-time DOM
  mutation during initial generation. Visual assertions now retain the initial
  caret state, and E2E mode disables the Next.js development indicator so no
  harness chrome enters the baselines. Runtime errors remain visible in logs.
- 2026-08-01: All five generated images were visually inspected before being
  accepted. No application redesign was performed.

## Verification

- `pnpm verify`: passed; formatting, contracts, lint, typecheck, 60 Vitest tests,
  6 contract tests, 25 harness/testing tests, production build, and all harness
  checks succeeded.
- The shell used Node `v22.22.0`, so pnpm emitted the expected warning for the
  repository's Node 24 requirement. Hosted CI remains the independent intended-
  runtime proof after a future authorized push.

## Runtime Evidence

- `pnpm verify:runtime`: passed without snapshot updates; all 14 Chromium
  scenarios matched, including five repository-owned visual baselines, in 8.0
  seconds.

## Follow-Up Debt

- Responsive and cross-browser evidence should be added only after implemented
  product behavior demonstrates the need and stable reference designs exist.
- Phase 3.4 still needs independent hosted CI proof after an authorized push.
