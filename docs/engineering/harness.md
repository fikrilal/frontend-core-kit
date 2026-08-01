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
