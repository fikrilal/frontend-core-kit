# 2026-08-01 Agent Harness Phase 2: Independent Integration Proof

**Plan version:** 1
**Status:** completed
**Owner:** primary agent
**Risk:** high
**Authority:** implement and verify repository-local CI and harness changes; do
not commit, push, enable repository rules, merge, deploy, access secrets, or
mutate external systems

## Objective

Implement Phase 2 of the accepted
[agent-first harness and loop engineering proposal](../../planning/agent-harness-loop-engineering-proposal.md):
make the current local evidence reproducible from a clean GitHub Actions
checkout, classify the minimum risk deterministically from changed paths and
the execution-plan declaration, publish concise CI evidence, and expose one
stable status check that can later be required by repository rules.

The observable outcome is a least-privilege workflow and locally tested risk
classifier whose behavior does not depend on an agent weakening its declared
risk. Activating branch protection remains a separate human-owned GitHub
administration step after the workflow has run successfully on the remote.

## Current Evidence

- Phase 1 is complete in
  [`dc13ee8`](https://github.com/fikrilal/lamara-frontend/commit/dc13ee8): the
  repository has a v1 plan contract, knowledge validator, measured baseline,
  and passing local gates.
- `pnpm verify` is the deterministic full gate; `pnpm verify:runtime` is the
  browser lane.
- Node `v24.18.0`, pnpm `11.15.0`, and the dependency lock are pinned in the
  repository.
- The repository has no `.github/workflows/` files and therefore no independent
  integration proof or required-check candidate.
- GitHub's official action documentation currently recommends explicit Node
  selection, pnpm-aware caching, read-only contents permission, and job
  summaries through `GITHUB_STEP_SUMMARY`.
- GitHub repository rules can require a stable job status after that status has
  existed on the remote; local implementation cannot activate or prove that
  external rule.

## Decisions And Invariants

- Risk is the maximum of the v1 changed-plan declaration and path-derived risk;
  automation can raise risk and never lower it.
- Changes to auth, sessions, API contracts, server configuration/transport,
  dependencies, CI, deployment, persistence, or secret-bearing configuration
  classify as high risk.
- Application, browser-test, and build-tool changes classify as at least medium
  risk. Documentation-only changes classify as low unless a plan raises them.
- Unknown paths default to medium rather than silently receiving low risk.
- The full deterministic gate runs for every CI change. Medium/high changes
  also run the Chromium lane; low-risk changes may skip that expensive lane.
- CI runs from a clean checkout with a frozen lockfile and repository-pinned
  runtime versions.
- The workflow grants only `contents: read`, uses no repository secrets, and
  never deploys or mutates external state.
- GitHub context values enter shell steps through environment variables, not
  direct expression interpolation.
- `CI Required` is the unique, stable aggregate job name intended for future
  repository-rule configuration. It fails if any required upstream job fails or
  is cancelled and accepts an intentionally skipped runtime lane for low risk.
- Evidence summaries contain paths, risk reasons, gate names, and outcomes only;
  they never print environment values, request data, credentials, cookies, or
  response bodies.
- Actions use current upstream releases pinned to verified full commit SHAs;
  readable release comments preserve update context. Phase 3 may add an
  automated update policy as a supply-chain sensor.

## Non-Goals

- Pushing the workflow or observing a real GitHub Actions run.
- Enabling GitHub rulesets, branch protection, auto-merge, or deployment.
- Adding Docker, a real-backend smoke lane, accessibility, visual regression,
  secret scanning, dependency auditing, or maintainability thresholds.
- Skipping the full deterministic gate for documentation changes before CI has
  enough stability evidence.
- Trusting a user-supplied or agent-supplied risk output without recomputation.
- Uploading raw logs or `.env` contents as artifacts.
- Supporting CI providers other than GitHub Actions.

## Acceptance Scenarios

1. Given changed documentation and a low-risk plan, classification returns low.
2. Given any high-risk path and a low-risk plan, classification returns high and
   identifies the path rule that raised it.
3. Given medium-risk paths and a high-risk plan, classification remains high.
4. Given an unknown path, classification returns at least medium.
5. Given a malformed revision or missing changed v1 plan, the classifier fails
   actionably rather than assuming low risk.
6. Given a pull request or main-branch push, CI uses a clean checkout, pinned
   Node/pnpm versions, and `pnpm install --frozen-lockfile` before verification.
7. Given any CI change, the full deterministic gate runs; given medium/high
   risk, the Chromium lane also runs.
8. Given successful required lanes, `CI Required` succeeds; given a failed or
   cancelled required lane, it fails.
9. Given a CI run, the workflow summary reports classification and gate outcomes
   without sensitive configuration values.
10. Given a future repository administrator, documentation names the single
    status to require and states that activation must wait for a successful
    remote run.

## Risk And Authority

This is high risk because it changes the future integration and merge gate. A
false negative can allow unsafe work through; a false positive can block every
pull request. Risk classification therefore has focused boundary tests, unknown
paths fail upward, and the aggregate job is deliberately simple.

The user authorized Phase 2 implementation. The agent may add or edit local
workflow, scripts, tests, and documentation and run local verification. The
request did not explicitly authorize a commit or any remote mutation, so the
agent must leave changes uncommitted and must not push, run workflows remotely,
or configure repository rules.

## Impact Areas

- `.github/workflows/ci.yml`
- `scripts/harness/risk-classifier.mjs`
- `scripts/harness/classify-risk.mjs`
- `scripts/harness/risk-classifier.test.mjs`
- `package.json`
- `docs/engineering/harness.md`
- `docs/engineering/testing-strategy.md`
- `docs/engineering/harness-baseline.md`
- `docs/exec-plans/README.md`
- `docs/exec-plans/active/` and `completed/`

## Verification Matrix

| Acceptance                                          | Evidence                                                    |
| --------------------------------------------------- | ----------------------------------------------------------- |
| Risk maximum and path tiers are deterministic       | Node fixture tests for low, medium, high, unknown, and plan |
| Git revision and plan failures are actionable       | CLI integration fixtures and failure assertions             |
| Workflow is least privilege and branch-ready        | Workflow inspection plus automated structural assertions    |
| Clean dependency and deterministic gates still pass | Frozen install and `pnpm verify`                            |
| Medium/high browser lane remains healthy            | `pnpm verify:runtime`                                       |
| Evidence is concise and secret-safe                 | Summary fixture assertions and workflow review              |
| Repository knowledge remains truthful               | `pnpm knowledge:check` and completed plan evidence          |

## Checklist

- [x] Implement pure path and declared-plan risk classification.
- [x] Add a revision-aware CLI with GitHub output and summary support.
- [x] Add focused classifier and workflow-structure tests.
- [x] Add the least-privilege clean-checkout GitHub Actions workflow.
- [x] Integrate classifier tests and commands into the harness.
- [x] Document CI lanes, risk policy, summaries, and branch-rule handoff.
- [x] Update the baseline from local-only to configured-but-unobserved CI.
- [x] Run frozen installation, targeted tests, and negative fixtures.
- [x] Run `pnpm verify` and `pnpm verify:runtime` under Node 24.
- [x] Record exact evidence and deviations.
- [x] Commit locally after explicit user authorization.
- [x] Push only after explicit user authorization.
- [x] Observe `CI Risk`, `CI Verify`, `CI Runtime`, and `CI Required` on a
      GitHub-hosted runner.
- [x] Record remote evidence and move this plan to `completed/`.

## Rollout And Rollback

The local rollout adds the workflow but does not activate it remotely. After a
future authorized push, observe at least one pull-request run, inspect summaries
and runtime cost, then configure the repository rule to require the unique
`CI Required` status. Do not require a status before GitHub has observed it.

Rollback removes the workflow and classifier command, restores the Phase 1
documentation, and disables the external required status before removal if it
was ever activated. No application runtime state or production data changes.

## Decision And Deviation Log

- 2026-08-01: Phase 2 starts only after Phase 1 passed and was committed.
- 2026-08-01: GitHub administration is explicitly excluded because the user
  authorized implementation but did not authorize remote mutation.
- 2026-08-01: The selected releases are `actions/checkout@v7.0.1`,
  `pnpm/action-setup@v6.0.8`, and `actions/setup-node@v7.0.0`.
- 2026-08-01: pnpm 11 forwards a standalone `--` to this script invocation;
  the CLI accepts that conventional separator explicitly.
- 2026-08-01: An all-zero push base revision now classifies the complete target
  tree with `git ls-tree`, preventing an initial main-branch push from examining
  only its tip commit.
- 2026-08-01: GitHub-hosted execution remains deliberately unverified. The
  baseline says “configured but unobserved” instead of claiming independent CI.
- 2026-08-01: Final security review adopted GitHub's full-SHA guidance rather
  than leaving mutable major tags in this high-risk boundary. Tag and peeled
  commit identities were resolved from the official upstream repositories.
- 2026-08-01: The user explicitly authorized a local commit. Push, hosted CI,
  and repository-rule mutation remain outside current authority.
- 2026-08-01: The first hosted run exposed a compatibility gap: risk
  classification rejected an allowlisted pre-v1 completed plan even though the
  knowledge validator accepts it. The legacy-plan policy is now shared by both
  validators; only the four named historical plans are exempt.
- 2026-08-01: The second hosted run passed risk classification but exposed a
  clean-install-only pnpm 11 migration issue. The workspace mixed `allowBuilds`
  with removed `onlyBuiltDependencies` syntax, so strict installs rejected the
  ignored Sharp and resolver scripts. All three reviewed build dependencies now
  use the pnpm 11 `allowBuilds` map.
- 2026-08-01: The user authorized fixing and observing CI, which expanded
  authority to focused commits, pushes, and hosted-run observation. Repository
  rules remained excluded.
- 2026-08-01: Run
  [30682954749](https://github.com/Orymu/lamara-frontend/actions/runs/30682954749)
  passed all four jobs after the two portability repairs.

## Verification

- Official GitHub and action documentation reviewed for action versions,
  read-only permissions, job summaries, and required-status behavior.
- `pnpm test:harness`: passed, 18 tests including real temporary Git history,
  GitHub output/summary files, aggregate status outcomes, and workflow structure.
- `pnpm risk:classify -- --base HEAD~1 --head HEAD`: passed and raised the
  previous medium plan declaration to high for harness/package paths.
- `pnpm install --frozen-lockfile`: passed; lockfile was already current.
- `pnpm verify:fast`: passed under Node `v24.18.0`; 60 Vitest tests, 6 contract
  tests, and 17 harness tests; measured at 24.25 seconds.
- `pnpm verify`: passed under Node `v24.18.0` with explicit non-secret CI
  configuration, including production build and all harness checks; measured at
  32.79 seconds.
- `git diff --check`: passed before plan completion.
- Clean temporary checkout `pnpm install --frozen-lockfile`: passed under Node
  `v24.18.0` and pnpm `11.15.0`; all three approved dependency builds ran.

## Runtime Evidence

- `pnpm verify:runtime`: passed under Node `v24.18.0`; all 6 Chromium scenarios
  passed against the isolated API fixture; measured at 8.84 seconds.
- GitHub Actions
  [run 30682954749](https://github.com/Orymu/lamara-frontend/actions/runs/30682954749):
  `CI Risk` passed in 8 seconds, `CI Verify` in 1 minute 25 seconds, `CI Runtime`
  in 1 minute 12 seconds, and `CI Required` in 8 seconds.

## Follow-Up Debt

- Repository-rule activation remains a separate administrator decision; this
  phase did not require `CI Required` on `main`.
- Phase 3 owns new maintainability, security, backend, accessibility, and visual
  sensors; Phase 2 only reproduces current evidence independently.
