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

`pnpm contracts:check` regenerates API types from the committed frontend
OpenAPI snapshot in a temporary directory and fails on any byte-level drift.
The gate has no sibling-repository or network dependency.

## Architecture check

`scripts/harness/check-architecture.mjs` enforces current stable boundaries:

- environment access is restricted to approved runtime/configuration files;
- raw `fetch` is restricted to the server API boundary, scripts, and tests;
- generic UI and library modules cannot depend on product/server layers;
- Client Components cannot import server-only modules;
- features are consumed through their public API;
- route pages remain thin compositions.

Keep allowlists narrow. Add a rule only when it protects a real boundary.

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

Browser tests prove visible content, active navigation, metadata endpoints, and
intentional 404s for deferred routes.

## Risk

- Low: documentation and narrow static changes; targeted checks may suffice.
- Medium: public UI, route, or metadata behavior; run `pnpm verify` and browser
  evidence.
- High: auth, session, API compatibility, sync/privacy, or release security;
  require full verification, failure-path evidence, and human review.

Never report a gate as passing unless it was actually executed.
