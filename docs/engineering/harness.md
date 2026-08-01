# Lamara Frontend Engineering Harness

## Commands

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
test
harness:check
```

`verify` adds the production build. `verify:runtime` runs Playwright separately
because browser installation and runtime cost are machine-specific.

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
- v1 execution plans contain required metadata and sections;
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
and logout. The runner uses a contract-faithful local API fixture and isolates
Next.js output in `.next-e2e`.

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
of path-derived risk and any changed v1 execution-plan declaration. Automation
may raise declared risk and never lower it.

| Minimum risk | Changed boundaries                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| High         | CI/harness, auth, authenticated routes, server code, contracts, dependencies, environment/deployment config |
| Medium       | Other application source, tests, scripts, public assets, and build/test config                              |
| Low          | Documentation and narrow repository metadata                                                                |

Unknown paths default to medium. Changed execution plans must be v1 documents
with valid risk metadata at the target revision. The classifier writes only
path/rule evidence and never configuration values.

## Independent CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main` with
read-only repository permission, a pinned Ubuntu runner image, and bounded job
timeouts:

1. `CI Risk` checks out full history and classifies the change.
2. `CI Verify` performs a frozen install and runs `pnpm verify` for every risk.
3. `CI Runtime` installs Chromium and runs `pnpm verify:runtime` for medium/high
   changes; low-risk changes skip it.
4. `CI Required` independently checks upstream outcomes and provides one stable
   aggregate status.

Jobs publish compact Markdown through GitHub's job-summary mechanism. The
workflow uses no application secrets, backend connection, deployment token, or
write permission. External actions are pinned to full commit SHAs with readable
release comments; updates require reviewing and replacing both values.

The workflow was independently proven by
[GitHub Actions run 30682954749](https://github.com/Orymu/lamara-frontend/actions/runs/30682954749):
all four jobs passed on a clean hosted runner. A repository administrator can
now create a rule for `main` requiring the unique `CI Required` status. No
repository rule or auto-merge policy is currently configured by this phase.

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
