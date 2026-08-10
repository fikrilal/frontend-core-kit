# 2026-08-10 Shadcn Default Foundation

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with independent reviewer for UI behavior
**Risk:** high
**Authority:** implement and verify the shadcn default foundation slice against the accepted pure-shadcn-default design-system proposal; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/app/globals.css, src/components/, src/lib/, components.json, package.json, pnpm-lock.yaml, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/design/, docs/core/architecture.md, docs/product/initial-pages.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Establish the pure-shadcn-default foundation: replace the custom token set in
`src/app/globals.css` with the shadcn new-york default tokens, install the base
shadcn primitives (`button`, `input`, `label`, `card`, `alert`, `badge`) into
`src/components/ui/`, fix `components.json` aliases, unify `cn()` on
`@/lib/utils`, and reconcile the theme behavior with the shadcn default
light/dark contract. No feature migration happens in this slice.

## Current Evidence

- The accepted proposal pins the pure shadcn default as the template styling
  direction; AGENTS.md and the design docs now reference it as the source of
  truth.
- `src/app/globals.css` contains a custom neutral palette (`--background`,
  `--foreground`, `--muted`, `--border`, `--line`, `--surface`, `--ember`,
  `--success`, `--radius`) with `@theme inline` and `@custom-variant dark`.
- `src/components/ui/` and `src/hooks/` are empty. `components.json` declares
  the shadcn new-york style with `@ncdai`/`@beui` registry sources, but no
  registry component is installed.
- `cn()` lives in `src/lib/cn.ts` with a re-export shim at `src/lib/utils.ts`;
  components import from both.
- The theme is a custom `theme-script`/`theme-sync`/`theme-toggle` using the
  `.dark` class and a `theme` localStorage key, defaulting to light.

## Decisions And Invariants

- The shadcn new-york default token set and component source are the single
  source of truth. Do not add custom tokens back without a shadcn convention.
- Remove the custom tokens (`--line`, `--ember`, `--surface`, `--success`) and
  their `@utility` blocks once nothing references them in this slice.
- Install primitives with the shadcn CLI; do not hand-write them.
- Keep the `.dark` class contract and light default; reconcile the theme
  scripts to the shadcn default contract without changing user-visible theme
  behavior.
- `cn()` is `@/lib/utils` (the shadcn alias); `src/lib/cn.ts` is removed.
- Features are not migrated in this slice; inline classes stay until the
  feature plans replace them.
- The visual baseline gate and axe accessibility suite stay intact.

## Non-Goals

- Feature migration (separate plans for auth, users, and marketing/layout).
- Custom tokens, custom component variants, or a bespoke styling layer.
- Backend, contract, session, or feature-logic changes.

## Acceptance Scenarios

1. Given the shadcn CLI init, when the foundation slice is complete, then
   `src/components/ui/` contains the installed base primitives and
   `globals.css` contains the default token set.
2. Given the custom token removal, when the slice is complete, then no feature
   or shared component references `--line`, `--ember`, `--surface`, or
   `--success`.
3. Given `cn()` unification, when the slice is complete, then all imports use
   `@/lib/utils` and `src/lib/cn.ts` is deleted.
4. Given the theme reconciliation, when the slice is complete, then light/dark
   toggling still works and defaults to light.
5. Given the full verification, when the slice is complete, then
   `pnpm verify`, `pnpm verify:runtime`, and the visual baseline gate pass with
   no unintended visual drift.

## Risk And Authority

Risk is high because the change touches every page's global styling and the
shared theme contract; an incorrect token mapping changes the look of all
surfaces. Authority is limited to repository-local implementation and isolated
fixture/runtime verification. Human review remains required for visual and
theme behavior.

## Impact Areas

- `src/app/globals.css` (token replacement);
- `src/components/ui/**` (installed shadcn primitives);
- `src/lib/utils.ts` / `src/lib/cn.ts` (unification);
- `components.json` (alias fixes);
- `src/components/theme/**` (default-contract reconciliation);
- visual baselines (regenerated only if the default tokens change the look).

## Verification Matrix

| Acceptance            | Evidence                                          |
| --------------------- | ------------------------------------------------- |
| Primitives installed  | `src/components/ui/*` present via shadcn CLI      |
| Custom tokens removed | Grep for removed tokens returns no matches        |
| `cn()` unified        | Imports use `@/lib/utils`; `cn.ts` deleted        |
| Theme contract        | Light default + `.dark` toggle works; theme tests |
| Repository health     | `pnpm verify` and `pnpm verify:runtime`           |

## Checklist

- [x] Run the shadcn CLI init; replace `globals.css` tokens with the default
      set and install the base primitives.
- [x] Remove custom tokens and their utilities once unreferenced.
- [x] Fix `components.json` aliases; unify `cn()` on `@/lib/utils`; delete
      `src/lib/cn.ts`.
- [x] Reconcile the theme scripts to the shadcn default contract.
- [x] Update design docs and architecture docs for the foundation state.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The foundation lands with the token swap and primitive install. Roll back by
reverting `globals.css`, `components.json`, the theme scripts, and `src/lib/`
together; features still use inline classes until the feature plans migrate
them.

## Decision And Deviation Log

- 2026-08-10: Foundation is the first of four shadcn-default plans; features
  migrate in their owning plans.
- 2026-08-10: The custom tokens (`--line`, `--ember`, `--surface`,
  `--success`) and utilities are kept as a transitional block in
  `globals.css` because the marketing layout still uses them; plan 4 removes
  them.
- 2026-08-10: The sessions status pill was migrated to the shadcn `Badge`
  (secondary) within this plan — the default `--muted-foreground`/`--muted`
  pair failed WCAG AA contrast on the old inline pill (128 axe violations).
  This is forward-compatible with the users migration plan.
- 2026-08-10: `src/components/ui/**` is added to knip's ignore list until the
  feature migrations import the primitives (they are unused entry files now).
- 2026-08-10: `pnpm-lock.yaml` added to `.prettierignore` — the pnpm 11
  lockfile format is not prettier-compatible.

## Verification

- Static lanes passed under Node 24: `format:check`, `contracts:check`,
  `lint`, `typecheck`, `harness:check` (knowledge, architecture,
  maintainability, public-pages), and `pnpm build`.
- Unit suite: 236 passed, 1 failed — the pre-existing `theme-toggle`
  `React.act` failure, plus a pre-existing `session-service.test.ts` module
  resolution error (`No such built-in module: node:`), both reproduced on the
  clean base and unrelated to this change.
- `pnpm verify:runtime`: 69 Chromium tests passed after regenerating the
  sessions baseline (status pill → shadcn `Badge`).

## Runtime Evidence

- The axe accessibility suite passes across all page states after the Badge
  migration; the token swap initially caused 128 contrast violations on the
  sessions status pills, resolved by using the shadcn `Badge` secondary
  variant.
- The sessions visual baseline was regenerated (intended change) and inspected
  before recording; other baselines were unchanged by the token swap.

## Follow-Up Debt

- Remove the transitional custom-token block and `src/components/ui/**` knip
  ignore in the marketing migration plan.
- Migrate the remaining features onto the primitives in plans 2 and 3.
