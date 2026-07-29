# Lamara Frontend

Public web application for Lamara, a local-first desktop utility for tracking
AI coding-tool usage.

## Current scope

Implemented:

- one public landing page at `/`;
- light and dark theme support;
- web manifest, robots, sitemap, icon, and social images;
- a committed backend OpenAPI snapshot with generated TypeScript types and Zod
  runtime schemas;
- a typed server-only API client and validated password-login function with no
  route;
- format, lint, type, unit, architecture, build, and browser gates.

Not implemented:

- downloads or release integration;
- user-facing authentication, cookies, or sessions;
- dashboard, reports, accounts, or sync;
- any route that invokes the Lamara API.

Planned work must not be described as shipped. See
[`docs/README.md`](docs/README.md) for the current sources of truth.

## Requirements

- Node.js 24 LTS
- pnpm 11.15

Corepack can activate the pinned package manager:

```bash
corepack enable
pnpm install
```

Install the Playwright browser once per machine:

```bash
pnpm exec playwright install chromium
```

## Development

```bash
pnpm dev
```

Open <http://127.0.0.1:3000>.

## API contract

The committed OpenAPI snapshot, generated TypeScript types, and generated Zod
schemas are checked by the normal verification gate:

```bash
pnpm contracts:check
```

See
[`docs/engineering/api-integration.md`](docs/engineering/api-integration.md)
before updating the snapshot.

## Verification

```bash
pnpm verify:fast
pnpm verify
pnpm verify:runtime
```

`verify` does not include browser tests. Run `verify:runtime` for visible route
or interaction changes.
