# Frontend Core Kit

Template-grade Next.js starter with a generic landing page, authentication, and account surfaces built on pure shadcn defaults.

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

## Feature lifecycle

Generate and remove feature scaffolds with the harness CLI:

```bash
pnpm frontendkit -- scaffold feature billing --dry-run
pnpm frontendkit -- scaffold feature billing
pnpm frontendkit -- scaffold data --feature billing --operation users.me.get
pnpm frontendkit -- scaffold all --feature billing --operation users.me.get
pnpm frontendkit -- remove feature billing --dry-run
pnpm frontendkit -- remove feature billing
```

`scaffold feature` writes a thin route under `src/app/` plus a feature slice
(page, client form, Server Action, Zod state, failure mapper, and tests) under
`src/features/`, and formats the output with the repository Prettier
configuration. `scaffold data` generates a typed server adapter and contract
test from the committed OpenAPI snapshot. `remove feature` deletes the feature
and its route, prunes public route metadata and slice exports, checks for
dangling imports, and refuses protected core features (`auth`, `marketing`,
`users`) unless `--force-core` is passed. See the
[engineering harness](docs/engineering/harness.md#feature-lifecycle) for all
options.

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
