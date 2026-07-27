# Lamara Web Design System

## Purpose

This document defines how Lamara Web should build its UI foundation.

Lamara uses a **shadcn-compatible local component model**, with selective
adoption from **chanhdai** and **beUI** registries. Components are copied into
the repo and owned locally — not loaded as a remote UI runtime.

This is not a broad design system yet. It is a decision framework for adopting
components safely while the product surface is still small.

## Local UI codebases (identical style)

Lamara Web must look and feel **identical** to these checked-out repos on this
machine. Agents and humans should open them when implementing UI — do not invent
a separate Lamara-only aesthetic.

| Role                          | Path                                        | Notes                                              |
| ----------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Primary craft / chanhdai site | `/home/fikrilal/devs/_tmp`                  | Layout density, panels, typography, registry craft |
| Product UI patterns           | `/home/fikrilal/devs/personal/code-alchemy` | e.g. contribution graph, tooltips, profile chrome  |

Also pinned in `AGENTS.md` under **UI Style Reference**.

## Foundation parity (2026-07-22)

Execution plan: `docs/exec-plans/completed/2026-07-22_ui-foundation-match-references.md`.

| Layer                          | Aligned to                                                 | Lamara notes                                                                              |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Tokens (`src/app/globals.css`) | code-alchemy oklch neutrals + soft `--line`; `.dark` class | Keep `--ember`, `--surface`, `--success`, `--warning`                                     |
| Theme                          | code-alchemy class dark + localStorage                     | `ThemeScript`/`ThemeSync` + `ThemeToggle`; pref `light`\|`dark`\|`system` (default light) |
| Text roles                     | shadcn                                                     | `text-muted-foreground` for secondary text; `--muted` is a background                     |
| `cn`                           | code-alchemy                                               | `clsx` + `tailwind-merge`                                                                 |
| Button                         | code-alchemy variants/sizes                                | beUI press motion retained                                                                |
| Card                           | `_tmp` ring card                                           | `ring-1 ring-foreground/10`, gap-6/py-6, medium title; `variant="dashed"` empty           |
| Panel                          | code-alchemy lined panel                                   | Lined chrome only (header rails); product blocks use Card                                 |
| Separator                      | code-alchemy                                               | Keep `VerticalSeparator` for toolbars                                                     |
| AppHeader                      | code-alchemy Navbar + marketing Rail                       | Lined rail chrome; Dashboard/Reports only; mobile nav in AccountMenu                      |
| AccountMenu                    | reference icon density                                     | size-8 rounded-lg trigger; ring dropdown                                                  |

**Do not** invent a third density or freehand chrome after this pass. Prefer
opening the reference repos when redesigning product pages on top of this base.

## UI Sources (do not forget)

These are the canonical registry sources for Lamara Web. Prefer them (in order)
when you need a new primitive or interaction pattern — then match the local
repos above for how those primitives are composed on the page.

| Source        | Role                                                                                   | Registry / docs                                                                |
| ------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **shadcn/ui** | Base component conventions, CLI, primitives (button, card, field, input, separator, …) | [ui.shadcn.com](https://ui.shadcn.com) — default registry via CLI              |
| **chanhdai**  | Polished Next/Tailwind blocks and craft (login blocks, command/code surfaces, nav)     | [chanhdai.com/components](https://chanhdai.com/components) — registry `@ncdai` |
| **beUI**      | Motion toolkit: press feedback, springs, animated controls                             | [beui.dev](https://beui.dev) — registry `@beui`                                |

Config lives in repo root `components.json`:

```json
"registries": {
  "@ncdai": "https://chanhdai.com/r/{name}.json",
  "@beui": "https://beui.dev/r/{name}.json"
}
```

Install examples:

```bash
# shadcn default registry
pnpm dlx shadcn@latest add button

# chanhdai
pnpm dlx shadcn@latest add @ncdai/<name>

# beUI motion components
pnpm dlx shadcn@latest add @beui/button-base
```

**Rules of engagement:**

- Always generate/copy into local source under `src/components/**` (or feature
  folders). Never depend on a live remote component package at runtime.
- After install: review, strip unused variants, adapt tokens to Lamara
  (`accent`, `surface`, `border`, …), keep press/motion subtle and
  `prefers-reduced-motion` safe.
- Do not overwrite Lamara-tuned primitives (e.g. button, separator) without
  re-applying product styles and checking marketing/auth surfaces.
- chanhdai and beUI are **references and registries**, not product direction.
  Product copy, layout, and brand stay Lamara-owned.

## Decision

Lamara Web should use:

- local React components,
- Tailwind CSS v4,
- shadcn-compatible component conventions,
- small primitives in `src/components/ui`,
- product-specific compositions in feature or marketing component folders,
- selective components from **shadcn**, **chanhdai (`@ncdai`)**, and
  **beUI (`@beui`)**.

Lamara Web should not use:

- a large external UI kit runtime,
- a copied portfolio website structure,
- decorative components without product value,
- broad primitives created before repeated need exists,
- barrel imports on route and page entrypoints.

## Reference Style

**chanhdai** is a useful craft reference because it is aligned with the stack:

- Next.js,
- Tailwind CSS,
- shadcn-compatible local components,
- polished command/code surfaces,
- compact navigation,
- refined dark/light visual treatment,
- subtle motion and detail.

**beUI** is the motion reference for tappable surfaces and micro-interactions
(e.g. button press scale, spring tokens in `src/lib/ease.ts`).

Use both as references for interaction quality and component craft, not as a
source of product direction.

## Lamara Fit

The following component families fit Lamara well:

- command/code blocks for install instructions,
- compact navigation,
- source/status grids,
- subtle spotlight or grid treatments,
- refined copy buttons,
- theme controls,
- focused card grids for repeated product states.

The following should be avoided until a real product need exists:

- testimonials,
- logos carousels,
- shimmering text,
- spinning text,
- decorative-heavy portfolio blocks,
- motion effects that distract from the desktop product.

## Component Placement

Use these folders by default:

```text
src/components/ui/
  Generic primitives with no Lamara business language.

src/components/layout/
  Cross-page layout components.

src/components/marketing/
  Reusable marketing compositions that are not generic primitives.

src/features/<feature>/
  Feature-owned content, page modules, and product-specific components.
```

Generic primitives must not know about Lamara-specific sources, reports,
downloads, privacy copy, users, or pricing.

## Adoption Rules

When adopting a component from a registry or public codebase:

1. Copy or generate it into local source.
2. Review the code before keeping it.
3. Remove unused variants, dependencies, and animations.
4. Convert imports to local aliases.
5. Keep TypeScript strict; do not introduce `any`.
6. Prefer server components unless interactivity is required.
7. Use direct imports on route and page entrypoints.
8. Run local verification before treating it as accepted.

Do not keep a component just because it looks polished. It must serve a current
Lamara page or workflow.

## Initial Component Priorities

For the landing and download pages, prioritize:

- `ButtonLink`,
- `Badge`,
- `Panel`,
- `CodeBlock`,
- `CopyCommand`,
- `Section`,
- `Container`,
- `SourceStatusBadge`,
- product-faithful preview panels.

Only extract `Section`, `Container`, or status badges after repeated usage makes
the abstraction obvious.

## Registry Compatibility

The repo includes `components.json` so shadcn-compatible registries and commands
understand project aliases and the configured registries:

- default shadcn registry (CLI `add <name>`),
- `@ncdai` → chanhdai,
- `@beui` → beUI.

See **UI Sources** above for when to use each.

The canonical class-name helper remains:

```text
src/lib/cn.ts
```

The registry-compatible alias is:

```text
src/lib/utils.ts
```

Use `src/lib/cn.ts` directly in hand-written Lamara code. Keep `src/lib/utils.ts`
for generated or registry-imported components that expect `@/lib/utils`.

## Quality Bar

A component is acceptable only when:

- it passes `pnpm verify:fast`,
- it does not weaken lint rules,
- it does not require route files to own UI details,
- it does not mix business logic into generic primitives,
- it improves a real page in the current roadmap.
