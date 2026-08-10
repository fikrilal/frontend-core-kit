# Lamara Frontend Agent Guide

Lamara Frontend is the web application for Lamara.

## Source Of Truth

- Docs index: `docs/README.md`
- Architecture: `docs/core/architecture.md`
- Tech stack: `docs/core/tech-stack.md`
- Project foundation: `docs/core/project-foundation.md`
- API integration: `docs/engineering/api-integration.md`
- Initial pages: `docs/product/initial-pages.md`
- Design direction: `docs/design/design-direction.md`
- Design system (pure shadcn default): `docs/design/design-system.md`
- Harness: `docs/engineering/harness.md`
- Testing strategy: `docs/engineering/testing-strategy.md`
- Execution plans: `docs/exec-plans/README.md`
- Commit conventions: `docs/contributing/commit-conventions.md`

## UI Style Reference (pure shadcn default)

Lamara Frontend is a template-grade Next.js starter. Its UI must use **pure
shadcn defaults** — the official shadcn new-york components and token set as
shipped, with no custom design tokens, no hand-rolled primitives, and no
bespoke styling layer. This is deliberate: a template must stay recognizable,
upgradeable (`shadcn add`/upgrade just works), and low-surprise for consumers.

| Role           | Source                                             | What to use it for                                                                                                     |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Components** | `src/components/ui/**` (installed shadcn defaults) | All buttons, inputs, cards, alerts, badges, and form primitives. Features compose these; they never re-implement them. |
| **Tokens**     | shadcn default `globals.css` (`:root` / `.dark`)   | All colors, radii, and shadows. Do not add custom tokens without a shadcn convention requiring them.                   |

Rules for agents:

1. Before building or redesigning UI, **use the installed shadcn primitives**
   (`@/components/ui/*`); do not write inline class strings that duplicate a
   shadcn component.
2. Keep the shadcn default styling: same token set, same radius, same
   component variants. Customize only through documented shadcn conventions.
3. When a needed component is not installed, add it with the shadcn CLI
   (`pnpm dlx shadcn@latest add <component>`) rather than hand-writing it.
4. Document durable UI decisions in `docs/design/design-system.md`; keep this
   section as the pinned source of truth. The shadcn-default direction
   supersedes the previous chanhdai/code-alchemy visual references.

## Commit Messages

Use semantic scoped commits:

```text
type(scope): message
```

Examples: `feat(auth): …`, `docs(api): …`, `chore(harness): …`.

Scope is required. See `docs/contributing/commit-conventions.md` and
`commitlint.config.cjs`. Install local hooks with `pnpm setup:hooks`.

## Next.js Version Warning

This repo uses a new Next.js version. APIs, conventions, generated route types,
and file structure may differ from older examples or model memory.

Before using unfamiliar Next.js behavior, inspect the installed docs under
`node_modules/next/dist/docs/` or official Next.js documentation.

## Non-Negotiables

- Keep route files thin. Routes compose feature entry points and metadata.
- Keep product behavior inside `src/features/` as features are introduced.
- Keep `src/components/ui/**` business-free.
- Keep shared server infrastructure under `src/server/**`; keep feature-owned
  endpoint adapters under `src/features/<feature>/server/**`.
- Do not read `process.env` outside approved config/runtime files.
- Do not scatter raw `fetch(...)`; use server adapters or generated contracts.
- Do not import server-only modules from Client Components.
- Keep TypeScript strict. Do not use `any` or unsafe assertions to silence the
  compiler.
- Use runtime validation at external boundaries.
- Do not introduce global client state until a real cross-page client-only need
  exists.
- Do not add abstractions for hypothetical reuse.
- Never commit or push unless explicitly instructed.

## Verification

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
pnpm contracts:check
pnpm risk:classify -- --base <revision> --head <revision>
pnpm knowledge:check
pnpm harness:check
pnpm test:e2e
```

Never claim checks passed unless they were actually run.

## Harness Workflow

Use the harness docs for non-trivial work:

- `docs/engineering/harness.md`
- `docs/engineering/testing-strategy.md`
- `docs/exec-plans/README.md`

Risk expectations:

- `low`: targeted checks are usually sufficient.
- `medium`: run `pnpm verify`; add `pnpm verify:runtime` for browser-visible
  behavior.
- `high`: run full verification and runtime evidence; human review expected.

If the same mistake or review comment appears two or more times, promote it into
a harness rule, test, script, scaffold, or doc update.

## Implementation Preferences

- Prefer small, focused, reversible changes.
- Keep feature internals private and export through `index.ts` when features are
  introduced.
- Add feature layers progressively; do not create Clean Architecture folders for
  simple display/content pages.
- Prefer Server Components by default.
- Use Client Components only for browser APIs, local interaction state, event
  handlers, or client-side refresh needs.
- Use actual product visuals or product-faithful assets for public pages.
- Keep public copy concrete and technically honest.
- Match UI style to the pure shadcn default (see **UI Style Reference**).
