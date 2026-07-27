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
- Design system (shadcn / chanhdai / beUI): `docs/design/design-system.md`
- Harness: `docs/engineering/harness.md`
- Testing strategy: `docs/engineering/testing-strategy.md`
- Execution plans: `docs/exec-plans/README.md`
- Commit conventions: `docs/contributing/commit-conventions.md`

## UI Style Reference (identical look)

Lamara Frontend UI must match these local codebases. Treat them as the **visual and
interaction source of truth** for layout chrome, density, cards, headers,
contribution/heatmap graphs, typography, and component craft. Prefer copying
patterns from them over inventing a third style.

| Role                         | Absolute path                               | What to use it for                                                                         |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Primary craft / registry** | `/home/fikrilal/devs/_tmp`                  | chanhdai-style site, shadcn registry craft, panels, typography, marketing + app chrome     |
| **Product UI patterns**      | `/home/fikrilal/devs/personal/code-alchemy` | Portfolio app patterns (e.g. contribution graph, profile panels, tooltips, footer legends) |

Rules for agents:

1. Before building or redesigning UI, **open the matching pattern in those repos**
   (do not rely on memory alone).
2. Aim for **identical** visual language: spacing, borders, muted hierarchy,
   header density, card surfaces, motion restraint — not “inspired by”.
3. When something already exists there (heatmap, tooltip, panel, topbar),
   **port structure/classes/geometry** rather than freehanding a Lamara-only look.
4. Document durable UI decisions in `docs/design/design-system.md`; keep this
   section as the pinned path map.

## Commit Messages

Use semantic scoped commits:

```text
type(scope): message
```

Examples: `feat(auth): …`, `docs(api): …`, `chore(harness): …`.

Scope is required. See `docs/contributing/commit-conventions.md` and
`commitlint.config.cjs`. Install local hooks with `npm run setup:hooks`.

## Next.js Version Warning

This repo uses a new Next.js version. APIs, conventions, generated route types,
and file structure may differ from older examples or model memory.

Before using unfamiliar Next.js behavior, inspect the installed docs under
`node_modules/next/dist/docs/` or official Next.js documentation.

## Non-Negotiables

- Keep route files thin. Routes compose feature entry points and metadata.
- Keep product behavior inside `src/features/` as features are introduced.
- Keep `src/components/ui/**` business-free.
- Keep server-only integration code under `src/server/**`.
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
npm run verify:fast
```

Full local gate:

```bash
npm run verify
```

Runtime/browser gate:

```bash
npm run verify:runtime
```

Targeted commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run harness:check
npm run test:e2e
```

Never claim checks passed unless they were actually run.

## Harness Workflow

Use the harness docs for non-trivial work:

- `docs/engineering/harness.md`
- `docs/engineering/testing-strategy.md`
- `docs/exec-plans/README.md`

Risk expectations:

- `low`: targeted checks are usually sufficient.
- `medium`: run `npm run verify`; add `npm run verify:runtime` for browser-visible
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
- Match UI style to `/home/fikrilal/devs/_tmp` and
  `/home/fikrilal/devs/personal/code-alchemy` (see **UI Style Reference**).
