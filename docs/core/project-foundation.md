# Lamara Frontend Project Foundation

## Repository shape

Lamara Frontend is one Next.js application:

```text
docs/       current decisions, proposals, and execution plans
scripts/    repository-local checks and hooks
src/        application source
tests/e2e/  browser-visible behavior
```

Do not introduce a monorepo or shared package until a real second consumer
exists.

## Package management

pnpm is the only supported package manager.

```bash
pnpm install
pnpm dev
```

The pnpm version is pinned through `packageManager` in `package.json`. Do not
commit npm or Yarn lockfiles.

## TypeScript

- Keep strict mode enabled.
- Use `unknown` and validation at external boundaries.
- Do not use `any` or unsafe assertions to bypass type errors.
- Keep generated files isolated and reproducible.

## Environment

`LAMARA_API_BASE_URL` is the only application environment variable. It is
server-only, validated through `src/server/config/env.ts`, and documented in
`.env.example`.

It must contain an HTTP(S) origin without credentials, a path, query string, or
fragment. Never prefix it with `NEXT_PUBLIC_`.

## API contract

The backend OpenAPI snapshot, generated TypeScript types, and generated Zod
runtime schemas are committed under `src/contracts/lamara-api/`.

```bash
pnpm contracts:check
pnpm contracts:sync -- --source /absolute/path/to/openapi.yaml
pnpm contracts:generate
```

Normal verification needs only the committed snapshot. Contract sync is an
explicit maintainer action and requires a clean, tracked source artifact.

## Verification

```bash
pnpm verify:fast
pnpm verify
pnpm verify:runtime
```

- `verify:fast`: formatting, contract drift, lint, types, unit tests, harness.
- `verify`: fast checks plus production build.
- `verify:runtime`: Playwright browser coverage.

Browser installation:

```bash
pnpm exec playwright install chromium
```

## Baseline principle

The repository should describe and test what exists. Planned routes, session
formats, APIs, dependencies, and components stay out of runtime code and
current-state documentation until their implementation starts.
