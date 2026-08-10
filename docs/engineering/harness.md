# Frontend Core Kit Engineering Harness

## Commands

`frontendkit` is the canonical repository-local harness CLI:

```bash
pnpm frontendkit -- doctor
pnpm frontendkit -- verify --profile fast
pnpm frontendkit -- knowledge check
pnpm frontendkit -- contracts check
pnpm frontendkit -- risk classify --base <revision> --head <revision>
pnpm frontendkit -- evidence report
```

`doctor` is a read-only pre-task check. It reports stable blockers and warnings
for exact Node/pnpm versions, Git worktree identity, the active plan, ignored
task state, required Chromium, and committed contract prerequisites. It does not
install, regenerate, verify, clean, contact a backend, or modify repository
state. Use `--json` for bounded structured output; native commands remain
available when detailed diagnostics are needed.

Existing pnpm names remain compatibility delegates:

```bash
pnpm verify:fast
pnpm verify
pnpm verify:runtime
```

`verify:fast` runs:

```text
format:check
contracts:check
lint
typecheck
typecheck:frontendkit
test
harness:check
```

`verify` adds the production build. `verify:runtime` runs Playwright separately
because browser installation and runtime cost are machine-specific.

## Task verification

The canonical lifecycle is `frontendkit task
begin|status|verify|complete|recover`; the `task:*` pnpm scripts remain
compatibility delegates. Start an active V2 task with `task begin`. It captures
its base revision,
active-plan identity, narrow structured boundaries, and pre-existing changed
paths in ignored `test-results/task-state.json`; it never stashes, restores, or
claims ownership of those paths. `pnpm task:verify` then requires that baseline,
checks exact Node and pnpm versions, discovers committed/staged/unstaged/untracked
paths, rejects new out-of-scope paths, requires `verify` authority, and stops if
effective risk exceeds the plan's maximum risk.

After scope preflight, task verification runs `verify:fast` for low risk or
`verify` followed by `verify:runtime` for medium/high risk, stopping after the
first failed lane. A failure records only its stable boundary code and a
path/metadata task fingerprint. Repeating the same failure without a meaningful
task change exhausts the plan's repair limit and escalates before another costly
run. This is an execution bound, not automatic source repair.

State schema 2 moves explicitly through `authorized`, `verifying`, `repairing`,
`ready_for_review`, and terminal `handed_off`, `escalated`, or `failed` states.
Every transition records its timestamp, stable reason, structured-boundary
fingerprint, and content-derived candidate fingerprint. Checklist or evidence
edits do not invalidate authority; changes to allowed paths/actions, maximum
risk, or repair limit do. Candidate identity hashes contents and deletion state,
so touching a file cannot reset the repair budget.

`task complete` accepts only `ready_for_review`, transitions it to
`handed_off`, archives the exact ignored state, and removes the active state.
`task recover` accepts only terminal state. It refuses active or ambiguous state
and unchanged escalated candidates, preventing recovery from becoming a repair
budget reset. Schema-1 state is diagnostic-only and is never silently migrated.

Use `pnpm task:verify -- --base <revision>` only when the task includes commits
after that base; the default base is `HEAD`. To write sanitized machine evidence,
use `pnpm task:verify -- --summary test-results/task-verification.json`. The
summary records only risk/path evidence, executed commands, outcomes, durations,
and a remediation—not command output, environment values, credentials, cookies,
or request data. The begin/verify commands write only ignored task-state and
optional summary evidence; they never format, regenerate snapshots, edit code,
commit, push, or contact external systems.

The baseline is intentionally path-level. It preserves and identifies user
changes that existed at `task:begin`, but it cannot determine who changed a line
inside such a file later. Agents must treat pre-existing out-of-scope paths as
user-owned and request a boundary change before editing them.

## Draft handoff

`pnpm frontendkit -- handoff --title "type(scope): summary" --dry-run`
exercises the same verification and publication preflight without changing task
state or mutating Git or GitHub. `pnpm task:handoff` remains a compatibility
delegate. The non-dry path re-runs task verification, requires schema-2
`ready_for_review` state for the exact candidate fingerprint and paths, validates
the current named branch and `origin`, and requires separate `commit`, `push`,
and `draft-pr` action authority in the active V2 plan before it can stage only
verified task paths, create one normal commit, push normally, and create a draft
PR. It never force-pushes, merges, deploys, comments, or changes review state.
An uncertain push or GitHub response stops with no automatic retry; a human must
inspect remote state.

`pnpm task:handoff -- --pr <number> --title "type(scope): repair"` is the
separate repair-handoff form. It requires `commit`, `push`, and `update-pr`
authority, and only continues when the given PR is still an open draft whose
base/head exactly match the local task. The adapter updates its sanitized
evidence body after a normal push; it does not inspect or override review or CI
outcomes. A real handoff always needs task-specific human authority for every
external action.

## Operating evidence

`pnpm harness:evidence` reads the versioned,
[sanitized operating-evidence ledger](harness-operating-evidence.md) and prints
aggregates only. It requires each record to cite a completed execution plan and
uses fixed categorical fields, including the failed verification boundary, so it
cannot collect prompts, logs, credentials, environment values, PR links, source
diffs, notes, or review prose. The command reports `insufficient` until there are
at least three independently reviewed, CI-reproduced tasks across two risk
classes, including a medium/high task and a repair or escalation. Even then, its
only outcome is `ready-for-human-review`; it never expands autonomy or changes
harness policy.

CI repeats these commands from a clean checkout. Local results remain repair
feedback; GitHub Actions is the independent integration run once the workflow
has been pushed.

## Contract check

`pnpm contracts:check` regenerates API types and Zod runtime schemas from the
committed frontend OpenAPI snapshot in a temporary directory and fails on any
byte-level drift. The gate has no sibling-repository or network dependency.

## Knowledge check

`pnpm knowledge:check` validates mechanically knowable repository intent:

- local Markdown links resolve inside the repository;
- every planning proposal is present in the planning index;
- V2 active/queued execution plans contain required metadata, boundaries, and
  sections; completed V1 plans remain valid historical evidence;
- plan status agrees with its lifecycle folder;
- completed plans contain no unresolved required checkbox or placeholder
  verification evidence.

The validator accepts historical pre-v1 plans without forcing a rewrite. It
does not decide whether a proposal is correct, whether acceptance scenarios are
sufficient, or whether a human granted the stated authority. Those remain
review responsibilities.

## Architecture check

`scripts/harness/check-architecture.mjs` enforces current stable boundaries:

- environment access is restricted to approved runtime/configuration files;
- application raw `fetch` is restricted to
  `src/server/api/client.ts`; scripts and tests retain explicit allowances;
- generic UI and library modules cannot depend on product/server layers;
- Client Components cannot import server-only modules;
- features are consumed through their public API;
- route pages remain thin compositions.

Keep allowlists narrow. Add a rule only when it protects a real boundary.

The password-login function uses the typed client rather than calling `fetch`
or reading environment variables directly.

## Public-page check

`scripts/harness/check-public-pages.mjs`:

- derives implemented public pages from `src/app/(marketing)/**/page.*`;
- compares those routes with `publicRoutes`;
- verifies required metadata route files exist;
- verifies the sitemap derives from `publicRoutes`.

The harness does not list planned pages.

## Browser evidence

Run:

```bash
pnpm exec playwright install chromium
pnpm verify:runtime
```

Browser tests prove public content, metadata endpoints, route protection,
password login, the opaque `HttpOnly` session cookie, authenticated loading,
logout, and an accessibility baseline for every implemented page state. The
accessibility scenarios combine Axe WCAG A/AA scans with explicit keyboard,
error-association, title, heading, and landmark assertions. A passing automated
scan is not a WCAG conformance claim; human and assistive-technology review
remain separate evidence. The runner uses a contract-faithful local API fixture
and isolates Next.js output in `.next-e2e`.

The same lane compares five repository-owned Linux Chromium images covering
light/dark landing, login, login failure, and authenticated foundation. Tests
fix the viewport, theme preference, color scheme, animations, fonts, and fixture
data. E2E mode hides only Next.js's development indicator; compile/runtime errors
still surface. Update baselines with `pnpm test:e2e:update` only for an intended
change, inspect every PNG, and never regenerate merely to make a diff pass.

## Risk

- Low: documentation and narrow static changes; targeted checks may suffice.
- Medium: public UI, route, or metadata behavior; run `pnpm verify` and browser
  evidence.
- High: auth, session, API compatibility, sync/privacy, or release security;
  require full verification, failure-path evidence, and human review.

Never report a gate as passing unless it was actually executed.

The measured current-state inventory and known sensor gaps live in the
[harness baseline](harness-baseline.md). Measurements describe the repository;
they are not quality budgets until evidence supports a threshold.

## Risk classification

`pnpm risk:classify -- --base <revision> --head <revision>` computes the maximum
of path-derived risk and any changed V1/V2 execution-plan declaration. Automation
may raise declared risk and never lower it.

| Minimum risk | Changed boundaries                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| High         | CI/harness/frontendkit, auth, authenticated routes, server code, contracts, dependencies, environment/deployment config |
| Medium       | Other application source, tests, scripts, public assets, and build/test config                                          |
| Low          | Documentation and narrow repository metadata                                                                            |

Unknown paths default to medium. Changed execution plans must be V1/V2 documents
with valid risk metadata at the target revision. The classifier writes only
path/rule evidence and never configuration values.

## Independent CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main` with
read-only repository permission, a pinned Ubuntu runner image, and bounded job
timeouts:

1. `CI Risk` checks out full history and classifies the change.
2. `CI Verify` performs a frozen install and runs the canonical `ci` profile for
   every risk.
3. `CI Runtime` installs Chromium and runs the canonical `runtime` profile for
   medium/high changes; low-risk changes skip it.
4. `CI Required` independently checks upstream outcomes and provides one stable
   aggregate status.

Jobs publish compact Markdown through GitHub's job-summary mechanism. The
workflow uses no application secrets, backend connection, deployment token, or
write permission. External actions are pinned to full commit SHAs with readable
release comments; updates require reviewing and replacing both values.

The workflow was independently proven by
[GitHub Actions run 30682954749](https://github.com/fikrilal/frontend-core-kit/actions/runs/30682954749):
all four jobs passed on a clean hosted runner. A repository administrator can
now create a rule for `main` requiring the unique `CI Required` status. No
repository rule or auto-merge policy is currently configured by this phase.

Phase 3.2's contract-validated fixture and backend-preflight changes were
independently reproduced in
[GitHub Actions run 30685359536](https://github.com/fikrilal/frontend-core-kit/actions/runs/30685359536):
all four jobs passed at commit `9d7b34b`.

## Maintainability fitness

`pnpm maintainability:check` uses Knip to reject unused files, exports, and
dependencies. Generated API contracts are excluded because their public surface
is generator-owned and independently protected by `pnpm contracts:check`.

ESLint caps non-test, non-generated production source at complexity 12, 350
logical lines per file, and 80 logical lines per function. These measured
no-regression limits are not desired targets. Prefer extracting a cohesive
decision or module over disabling a rule; any narrow exception requires a
recorded reason and owner.

Duplication is measured periodically instead of adding a permanent dependency.
The Phase 3.1 baseline found no clones at 8 lines/60 tokens across 49 analyzed
non-generated files. Promote duplication to a blocking sensor only after a real
failure or repository growth demonstrates the recurring cost is justified.

## Backend preflight

`pnpm backend:preflight` is a manual, read-only diagnostic for backend-dependent
local work. It checks API-origin configuration, calls `GET /ready`, and validates
the result with the generated readiness schema. It prints boundary status only,
never configuration values or response bodies. Default tests and CI continue to
use the isolated contract-validated fixture; real-backend CI remains deferred
until backend startup and data isolation are reproducible.
