# Lamara Web Harness

## Purpose

This document defines the engineering harness for Lamara Web.

The harness is the set of repository-local docs, scripts, tests, and workflows
that make changes safe, reviewable, and repeatable for both humans and coding
agents.

Use this document when the question is:

- what checks exist?
- what does each check prove?
- when should browser evidence be collected?
- when should we add a new guardrail?
- where should harness rules live?

## Principles

- Make the correct path the easiest path.
- Prefer deterministic checks over reviewer memory.
- Keep checks cheap enough to run locally.
- Enforce objective rules mechanically.
- Keep `AGENTS.md` short and point to source-of-truth docs.
- Promote repeated mistakes into docs, scripts, tests, or scaffolds.
- Avoid tooling theater: do not add a guardrail until it protects real
  repository behavior.

## Sources Of Truth

Core docs:

```text
docs/README.md
docs/core/tech-stack.md
docs/core/architecture.md
docs/core/project-foundation.md
docs/product/initial-pages.md
docs/design/design-direction.md
docs/engineering/testing-strategy.md
docs/engineering/harness.md
docs/engineering/api-integration.md
```

Execution plans:

```text
docs/exec-plans/
```

Harness scripts:

```text
scripts/harness/
```

## Canonical Commands

Fast local gate:

```bash
pnpm verify:fast
```

Full local gate:

```bash
pnpm verify
```

Runtime/browser gate:

```bash
pnpm verify:runtime
```

Targeted commands:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm architecture:check
pnpm public-pages:check
pnpm harness:check
pnpm test:e2e
```

## Gate Definitions

`verify:fast` runs checks suitable during active iteration:

```text
format:check
lint
typecheck
test
harness:check
```

`verify` runs the normal PR-ready local gate:

```text
format:check
lint
typecheck
test
build
harness:check
```

High-risk auth/session product changes should include evidence from
`pnpm verify:runtime` (auth smoke + marketing public smoke), not only unit
tests. See `docs/engineering/testing-strategy.md` and
`docs/exec-plans/active/2026-07-10_auth-testing-gaps.md`.

`verify:runtime` runs browser-visible workflow checks:

```text
test:e2e
```

Keep runtime checks separate from `verify` until browser setup and runtime cost
are stable enough for the default gate.

## Architecture Harness

Architecture checks live in:

```text
scripts/harness/check-architecture.mjs
```

Checks enforce:

- no `process.env` outside approved config/runtime files,
- no raw `fetch(...)` outside approved server/contract/test scopes,
- `src/components/ui/**` does not import app, features, server, or contracts,
- `src/lib/**` does not import app, features, or server,
- Client Components do not import server-only modules,
- feature internals are not deep-imported from outside that feature (use
  `@/features/<name>` public APIs),
- App Router `page` files stay thin (line budget, no `fetch`, no HTML tags).

These checks encode stable rules from `docs/core/architecture.md`.

When a rule becomes noisy, fix the architecture or refine the check. Do not
normalize broad exceptions.

## Public Page Harness

Public page checks live in:

```text
scripts/harness/check-public-pages.mjs
```

Checks enforce the first public page contract:

```text
/
/download
/privacy
/supported-sources
```

Requirements:

- route files exist and export a default page component,
- subpages export route-level metadata with `title` and `description`,
- the landing page may inherit root metadata from `src/app/layout.tsx`,
- harness routes match `publicRoutes` in `src/app/site-metadata.ts` (sitemap
  source of truth).

Future checks may validate canonical URLs, CTA presence, download metadata, and
public source-support content.

## TypeScript Lint Harness

TypeScript linting uses type-aware `typescript-eslint` rules in addition to
Next.js lint presets.

The lint policy rejects:

- explicit `any`,
- unsafe assignments, calls, returns, member access, and arguments,
- floating promises,
- misused promises,
- unnecessary conditions,
- unnecessary type assertions,
- non-exhaustive switches,
- avoidable optional-chain and nullish-coalescing misses,
- inconsistent type imports.

These rules enforce the TypeScript policy from `docs/core/project-foundation.md`.

## Accessibility And Import Lint Harness

Accessibility linting uses `eslint-plugin-jsx-a11y` strict rules.

The lint policy rejects common accessibility regressions such as:

- missing alt text,
- invalid anchors,
- unsupported ARIA props,
- inaccessible interactive elements,
- missing label/control associations,
- autofocus.

Import hygiene uses `eslint-plugin-import-x`.

The lint policy rejects:

- unresolved imports,
- duplicate imports,
- import cycles,
- mutable exports,
- imports that appear after non-import statements,
- missing blank lines after imports.

Tailwind class sorting is handled by `prettier-plugin-tailwindcss` through the
normal format gate.

## Runtime Evidence

Browser evidence is required when static checks do not prove behavior.

Use:

```bash
pnpm verify:runtime
```

Expected runtime evidence for the current baseline:

- landing page renders,
- download page renders,
- privacy page renders,
- supported sources page renders,
- basic public navigation is usable.

Future runtime evidence may include responsive screenshots, visual regression
checks, copy-button behavior, platform detection, authenticated report flows,
and leaderboard table rendering.

## Risk Classes

### Low

Examples:

- docs-only changes,
- small static UI copy,
- local tests,
- narrow formatting or config cleanup.

Expected verification:

- targeted checks,
- `pnpm verify:fast` when source code changes.

### Medium

Examples:

- route behavior,
- page composition,
- download metadata,
- architecture harness changes,
- API integration,
- significant UI behavior.

Expected verification:

- `pnpm verify`,
- targeted tests,
- `pnpm verify:runtime` when browser-visible behavior changes.

### High

Examples:

- auth/session behavior,
- billing,
- privacy-sensitive sync,
- public leaderboard publication,
- release/download security,
- deployment and CI changes.

Expected verification:

- `pnpm verify`,
- `pnpm verify:runtime`,
- focused failure-path tests,
- human review,
- rollback or recovery notes when relevant.

## Execution Plans

Use execution plans for non-trivial implementation work.

Execution plans live in:

```text
docs/exec-plans/active/
docs/exec-plans/queued/
docs/exec-plans/completed/
```

Use the template:

```text
docs/exec-plans/_template.md
```

Tiny docs edits and one-file mechanical changes do not need execution plans.

## Failure To Harness Upgrade Rule

If the same issue appears two or more times, promote it into one of:

- documentation,
- ESLint rule,
- harness script,
- unit test,
- Playwright assertion,
- scaffold/template,
- content validation check.

Do not rely on repeated human reminders for objective rules.

## Future Harness Areas

Add these only when the repo earns them:

- download metadata validation,
- supported-source content validation,
- generated API contract drift checks,
- duplicate-helper review reports,
- visual screenshot evidence,
- feature/page scaffolding.

## Related Docs

- `docs/engineering/testing-strategy.md`
- `docs/core/architecture.md`
- `docs/core/project-foundation.md`
- `docs/engineering/api-integration.md`
- `docs/exec-plans/README.md`
