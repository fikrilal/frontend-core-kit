# Lamara Web Project Foundation

## Purpose

This document defines the initial repository foundation for Lamara Web.

It covers scaffolding choices, baseline tooling, verification commands, and
early engineering guardrails.

It does not define application architecture, visual design, backend contracts,
deployment workflows, or product roadmap.

## Foundation Goals

- Create a production-shaped web repo without overbuilding the first version.
- Ship the landing and download pages quickly.
- Keep the repo ready for authenticated app surfaces later.
- Match Lamara's existing engineering discipline: strict typing, clear
  boundaries, deterministic checks, and documented decisions.
- Avoid monorepo and package extraction until reuse is proven.

## Initial Repository Shape

Lamara Web starts as a single Next.js application repository.

Initial shape:

```text
lamara-web/
├── docs/
├── public/
├── src/
├── tests/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── eslint.config.js
├── prettier.config.js
├── playwright.config.ts
└── README.md
```

Do not introduce `apps/` and `packages/` yet.

Add a workspace or local packages only when there is a second deployable app or
a shared package with a real second consumer.

## Scaffolding Choices

Use:

```text
Next.js App Router
TypeScript
src/ directory
Tailwind CSS
ESLint
Prettier
pnpm
```

Recommended scaffold posture:

- use the App Router,
- use `src/`,
- use strict TypeScript,
- use Tailwind,
- avoid import aliases that hide architecture boundaries too early except a
  single root alias such as `@/*`,
- remove example/demo content immediately after scaffolding.

## Package Manager

Use `pnpm`.

Reasons:

- matches the Lamara desktop repo,
- supports deterministic installs,
- supports future workspace growth,
- avoids mixing package managers across Lamara frontend work.

## TypeScript Policy

TypeScript must run in strict mode.

Rules:

- Do not use `any`.
- Do not use unsafe assertions to silence compiler errors.
- Prefer `unknown` plus validation at runtime boundaries.
- Keep generated types separate from handwritten product types.
- Use type-only imports where appropriate.

## Styling Foundation

Use Tailwind CSS for styling.

Initial global styling should include:

- CSS reset and Tailwind import,
- theme tokens,
- font setup,
- root background/text defaults,
- focus-visible treatment,
- reduced-motion considerations.

Do not add a large component framework.

Lamara-owned UI primitives should wrap Radix primitives when behavior is
non-trivial.

## Fonts And Assets

Use local or package-managed fonts rather than remote runtime font loading when
practical.

Initial recommended direction:

- Geist or Inter for product/body text,
- a restrained display treatment only if it supports the Lamara brand,
- actual product imagery or generated visual assets for the landing page,
- real platform/download signals for the download page.

Avoid generic SaaS illustration as the primary brand signal.

## Environment Configuration

Environment variables must be validated through a single config module.

Planned location:

```text
src/server/config/env.ts
```

Rules:

- No direct `process.env` reads outside config modules.
- Use Zod for parsing and validation.
- Separate public client-safe values from server-only values.
- Do not expose secrets through `NEXT_PUBLIC_*`.

Initial env needs are expected to be small. Do not create a large environment
system until deployment and backend integration require it.

## Testing Foundation

Use:

```text
Vitest
React Testing Library
Playwright
```

Initial test scope:

- unit tests for small utilities and validation,
- component tests for user-visible UI behavior,
- Playwright smoke tests for landing page, download page, and basic navigation.

Avoid broad snapshots as a substitute for behavior tests.

## Verification Commands

The repository should expose stable commands:

```text
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm verify
```

Expected `pnpm verify`:

```text
format:check
lint
typecheck
test
build
```

Playwright may be part of a separate runtime/e2e gate at first if local browser
setup makes it too slow for every edit loop.

## Architecture Guardrails

Start with documented boundaries. Add mechanical checks once the relevant files
exist.

Early guardrails to enforce:

- UI primitives do not import features or server modules.
- Generic `lib` helpers do not import features, app routes, or server modules.
- Server-only modules are not imported by Client Components.
- Raw environment access is limited to config modules.
- Raw API calls are limited to server adapters or generated clients.
- Generated contracts are not manually edited.
- Feature internals are not deep-imported by other features.

Do not overbuild the harness before the first app structure exists. Promote
repeated review issues into scripts or ESLint rules.

## Documentation Foundation

Docs are source of truth for major decisions.

Docs index:

```text
docs/README.md
```

Initial docs (structured layout):

```text
docs/core/tech-stack.md
docs/core/architecture.md
docs/core/project-foundation.md
docs/product/initial-pages.md
docs/design/design-direction.md
docs/engineering/harness.md
docs/engineering/testing-strategy.md
docs/engineering/api-integration.md
```

Future docs may include:

```text
docs/engineering/download-data.md
docs/engineering/api-contracts.md
docs/engineering/deployment.md
docs/planning/*
```

Non-trivial implementation work should use a short execution plan once the repo
has enough moving parts to justify it.

## Initial Implementation Sequence

Recommended sequence after this foundation is approved:

1. Scaffold Next.js with TypeScript, App Router, Tailwind, ESLint, and `src/`.
2. Add Prettier and baseline formatting.
3. Add Vitest and Testing Library.
4. Add Playwright smoke setup.
5. Add environment validation skeleton.
6. Add initial route groups and placeholder pages.
7. Add first UI primitives needed by landing and download pages.
8. Build landing and download page content.
9. Add verification commands and run the first local gate.

## Decision Status

Approved for the initial Lamara Web foundation.

Revisit this document if Lamara Web becomes a monorepo, adds a second frontend
surface, or extracts shared packages.
