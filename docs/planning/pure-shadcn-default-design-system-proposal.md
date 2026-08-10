# Pure Shadcn Default Design System Proposal

**Status:** Proposed on 2026-08-10

## Summary

Lamara Frontend should become a template-grade Next.js starter whose UI is
**pure shadcn defaults** — no custom tokens, no hand-rolled primitives, no
theme extensions. The design direction changes from "match the chanhdai /
code-alchemy look" (the current UI Style Reference) to "shadcn new-york as
shipped, modified only through documented shadcn conventions."

The motivation is a product decision: this repository is intended to become a
**template project** for future Lamara work. A template must be
recognizable, upgradeable, and low-surprise. Custom design tokens and
hand-rolled components make the template harder to upgrade (every shadcn
upstream change conflicts with local forks) and harder to use (consumers must
learn a bespoke vocabulary instead of the shadcn default).

This proposal replaces the visual source of truth in `AGENTS.md` and
`docs/design/design-direction.md`. It does not authorize implementation; the
implementation is a separate execution plan.

## Current State

- The token layer in `src/app/globals.css` is a custom neutral palette
  (`--background`, `--foreground`, `--muted`, `--border`, `--line`, `--ember`,
  `--success`, `--radius`) with light/dark variables and `@theme inline`.
- `src/components/ui/` and `src/hooks/` are empty. `components.json` declares
  the shadcn new-york style with `@ncdai`/`@beui` registry sources, but no
  registry component has been installed.
- Features duplicate the same visual vocabulary inline: 8 card shells, 7
  primary buttons, 6 secondary buttons, 10 inputs, 13 hardcoded
  `text-red-600 dark:text-red-400` error paragraphs, focus-ring boilerplate in
  19 files.
- The docs and AGENTS.md pin the visual style to the chanhdai/code-alchemy
  reference repos (hairline `--line` system, compact density, custom `ember`
  accent).

## Decision

Adopt **shadcn default styling** as the single source of truth:

- Install the shadcn new-york base (`Button`, `Input`, `Label`, `Card`,
  `Alert`, `Form`/`Field`, `Badge`, `Separator`, `Skeleton`, `Sheet`/`Drawer`
  as needed) from the official registry.
- Keep the shadcn default token set exactly as generated. Do not add custom
  tokens (`--line`, `--ember`, `--surface`, `--success`) unless a shadcn
  convention requires them.
- Replace all hand-rolled inline class strings with the installed primitives.
  Features compose `@/components/ui/*`; they do not re-implement button/input/
  card/alert markup.
- Keep the theme as the shadcn default light/dark via the `dark` class and the
  default `next-themes` (or the repo's existing theme-script, if it can be
  reduced to the shadcn default contract).
- Update `docs/design/design-direction.md`, `docs/design/design-system.md`,
  and `AGENTS.md` to pin the shadcn new-york default as the visual reference,
  superseding the chanhdai/code-alchemy pins.

## Rationale

1. **Template reuse:** a default-styled starter lets future projects keep the
   shadcn upgrade path and the ecosystem's assumptions. Custom tokens force
   every consumer to port a bespoke look or fight the template.
2. **Upgradeability:** hand-rolled forks of shadcn components block
   `shadcn add` updates. Pure defaults mean `shadcn upgrade`/`add` just works.
3. **Maintainability:** the duplication audit shows the hand-rolled layer is
   already drifting (`rounded-sm` vs `rounded-lg`, `text-xs` vs `text-sm`).
   Primitives eliminate the drift and centralize focus-ring, radius, and
   density.
4. **Onboarding:** shadcn is the de-facto Next.js UI standard. A template
   that uses it verbatim is immediately familiar; a template with a custom
   system requires documentation.
5. **Accessibility and testing:** the axe and visual baseline gates stay
   unchanged; they verify the shadcn defaults instead of the custom layer.

## Non-Goals

- No product styling, branding, or layout beyond the shadcn default. The
  `LamaraMark` brand asset stays, but it is placed using shadcn primitives,
  not custom chrome.
- No custom design tokens, motion system, or component variants beyond the
  shadcn default set.
- No port of the chanhdai/code-alchemy registry or its blocks.
- No change to the auth/session/feature architecture; this is a UI-layer
  refactor only.

## Migration Approach

1. Run the shadcn CLI init to generate the default new-york token set in
   `src/app/globals.css` (replacing the custom tokens) and install the
   primitive set.
2. Extract the duplicated feature markup onto the primitives, feature by
   feature, in small reversible commits: `Button` → all `*-form.tsx` submits,
   `Input`/`Label` → all form fields, `Card`/`CardHeader`/`CardTitle` → the
   8 page shells, `Alert` → error/status paragraphs, `Badge` → session status
   pills.
3. Keep `cn()` from `@/lib/utils` as the single utility (the shadcn alias);
   remove `src/lib/cn.ts` duplication.
4. Delete dead tokens and dead utility files once features stop referencing
   them.
5. Regenerate visual baselines after an intended-change review pass (the
   existing `pnpm test:e2e:update` flow with human PNG inspection).
6. Keep the axe accessibility suite as the gate; run `pnpm verify` and
   `pnpm verify:runtime` per risk tier.

## Impact

- `src/app/globals.css` — replaced with shadcn default tokens.
- `src/components/ui/*` and `src/hooks/*` — populated with shadcn defaults.
- `src/features/**` — refactored to compose primitives; inline class strings
  removed.
- `src/components/` — custom primitives (`rail`, `section-divider`,
  `site-topbar`, `site-footer`) either ported to shadcn defaults or removed;
  brand/theme assets retained.
- `docs/design/*`, `AGENTS.md` — visual source of truth updated to shadcn
  default.
- Visual baselines — regenerated once, with review.

## Risks

- **Visual regression:** mitigated by the existing visual baseline gate and a
  human review pass of the regenerated PNGs.
- **Behavioral regression:** mitigated by the axe accessibility suite and the
  full e2e runtime gate.
- **Scope creep:** the migration is UI-only; feature logic, server actions,
  session handling, and contracts are untouched.
- **Theme divergence:** the existing theme-script must be reconciled with the
  shadcn default contract; if it cannot be reduced, replace it with
  `next-themes` defaults.

## Open Questions

- Should the default theme be light, dark, or system? (shadcn defaults to
  light; the current repo defaults to light.)
- Should the `--line`/hairline utilities be removed entirely, or kept as an
  opt-in extension documented as "not template default"?
- Which shadcn components beyond the base set are required for the current
  features (e.g. `Badge` for session status, `Sheet` for mobile nav)?

## Verification

- Not run yet. Implementation will follow the execution-plan workflow with
  `pnpm verify` and `pnpm verify:runtime` evidence.

## Decision Log

- 2026-08-10: Propose pure shadcn defaults as the template styling direction,
  superseding the chanhdai/code-alchemy visual reference.
- 2026-08-10: Confirmed this replaces the `AGENTS.md` UI Style Reference;
  `AGENTS.md` has been updated to pin the pure-shadcn-default direction.
  `docs/design/design-direction.md` and `docs/design/design-system.md` are
  updated in the same change.
