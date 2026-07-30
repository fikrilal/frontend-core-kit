# Lamara Frontend

Web application for Lamara, a SaaS product under development.

## Current scope

Implemented:

- a generic public landing page at `/`;
- light and dark theme support;
- web manifest, robots, sitemap, icon, and social images;
- a committed backend OpenAPI snapshot with generated TypeScript types and Zod
  runtime schemas;
- password login at `/login`;
- process-memory server sessions with an opaque browser cookie;
- an authenticated technical proof at `/app`, current-user loading, refresh
  rotation, and logout;
- format, lint, type, unit, architecture, build, and browser gates.

Not implemented:

- registration, password recovery, OIDC, or account management;
- product workflows or product-specific authenticated pages.

Detailed product positioning and workflows are not finalized. The frontend must
not invent product capabilities.

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

The auth routes also require the two server-only values documented in
`.env.example`.

Sessions intentionally live in the single Next.js process. Restarting or
redeploying that process signs in users out.

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

`verify` does not include browser tests. Run `verify:runtime` for session or
visible behavior changes.
