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

There are no application environment variables today. Add `.env.example` and a
single validated server config module when the first runtime configuration is
implemented. Never add placeholder secrets or unused variables.

## Verification

```bash
pnpm verify:fast
pnpm verify
pnpm verify:runtime
```

- `verify:fast`: formatting, lint, types, unit tests, harness.
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
