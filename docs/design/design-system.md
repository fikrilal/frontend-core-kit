# Lamara Frontend Design System

## Current foundation

Lamara uses the **pure shadcn default** as its design system — the official
shadcn new-york components and token set as shipped:

- Tailwind CSS 4 with the shadcn default `globals.css` (`:root` / `.dark`
  token set, `@theme inline`, `@custom-variant dark`);
- shadcn primitives installed under `src/components/ui/**` (`button`, `input`,
  `label`, `card`, `alert`, `badge`, `separator`, `skeleton`);
- light and dark themes via the shadcn default contract;
- `cn()` (`clsx` + `tailwind-merge`) from `src/lib/utils.ts`.

The migration to pure shadcn defaults is complete: no custom tokens,
utilities, or layout primitives remain in `src/`. The previous custom
`--line`/`--ember` tokens and `Rail`/`SectionDivider` chrome were removed in
the marketing layout migration.

There is no custom token layer, no hand-rolled primitive set, and no bespoke
styling vocabulary. The previous chanhdai/code-alchemy visual references are
superseded; this is a deliberate template decision (see
`docs/planning/pure-shadcn-default-design-system-proposal.md`).

## Adoption rules

When a feature needs a reusable primitive:

1. use an installed shadcn component (`@/components/ui/*`) — do not write
   inline class strings that duplicate it;
2. if the component is not installed, add it with the shadcn CLI
   (`pnpm dlx shadcn@latest add <component>`);
3. keep the shadcn default styling: same token set, same radius, same
   variants;
4. customize only through documented shadcn conventions;
5. keep product language in the owning feature;
6. preserve accessibility and reduced-motion behavior;
7. add tests for meaningful interaction.

Do not hand-fork shadcn components, and do not add custom design tokens
without a shadcn convention requiring them.

## Component boundaries

- `components/layout`: cross-page chrome.
- `components/theme`: browser theme behavior.
- `components/ui`: installed shadcn primitives; business-free.
- `features/<feature>`: product copy, product panels, and feature behavior.

Default to Server Components. A leaf component becomes client-side only when it
needs a browser API or event handler.

## Tokens

The token set is the shadcn default: background, foreground, card, muted,
muted-foreground, border, input, ring, primary, secondary, accent, destructive,
popover, and radius roles, with light and dark values in `:root` / `.dark`.

Do not add custom tokens without a shadcn convention requiring them. Text
colors must retain WCAG AA contrast against their intended surface in both
themes. Interactive elements must expose a visible `:focus-visible` indicator;
do not remove the browser outline unless a ring or equivalent indicator replaces
it. The browser accessibility suite enforces the implemented page states, while
human review remains necessary for conformance.

Representative desktop states are stored beside `tests/e2e/visual.spec.ts` as
reviewable visual baselines. An intentional UI change must update only affected
images through `pnpm test:e2e:update`; inspect the PNGs before accepting them.
These baselines detect drift but do not make aesthetic decisions.
