# 2026-08-10 Shadcn Default Marketing And Layout Migration

**Plan version:** 2
**Status:** queued
**Owner:** primary agent with independent reviewer for UI behavior
**Risk:** medium
**Authority:** implement and verify the shadcn-default migration of the marketing and shared layout chrome against the accepted pure-shadcn-default design-system proposal; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/marketing/, src/components/layout/, src/components/brand/, src/components/theme/, src/app/(marketing)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/design/, docs/core/architecture.md, docs/product/initial-pages.md
**Allowed actions:** edit, verify
**Maximum risk:** medium
**Repair limit:** 2

## Objective

Migrate the marketing pages and the shared layout chrome onto the shadcn
default: the landing page, `MarketingShell`, `Rail`/`RailViewport`,
`SectionDivider`, `SiteTopbar`, and `SiteFooter`. Custom layout primitives are
either recomposed from shadcn defaults (Card, Button, Separator) or removed
where the shadcn default pattern covers the need. This completes the pure-
shadcn-default migration.

## Current Evidence

- The shadcn foundation, auth, and users plans land first (dependencies).
- `src/components/layout/` contains custom primitives (`marketing-shell`,
  `rail`, `section-divider`, `site-footer`, `site-topbar`) built on the
  custom `--line` hairline utilities and `ember` accent.
- `src/features/marketing/` renders the landing page with the custom chrome.
- The landing light/dark visual baselines and the marketing accessibility
  suite cover the current look.

## Decisions And Invariants

- Reuse installed shadcn primitives; remove the custom layout primitives and
  their `--line`/`ember` utilities.
- The landing page recomposes with `Button`, `Card`, and `Separator` from the
  shadcn defaults; the `LamaraMark` brand asset stays.
- Theme behavior stays on the shadcn default contract; `theme-sync`/
  `theme-toggle` are kept only if they reduce to the default contract,
  otherwise replaced by the shadcn default provider.
- Regenerate the marketing visual baselines via `pnpm test:e2e:update` and
  inspect the PNGs.
- Keep the axe suite green.

## Non-Goals

- Auth or users feature migration (separate plans).
- Product branding or marketing copy changes.
- Behavior, session, or contract changes.
- Custom tokens or variants beyond the shadcn defaults.

## Acceptance Scenarios

1. Given the landing page, when it renders, then it uses only shadcn
   primitives and the retained brand asset.
2. Given the shared layout, when any page renders, then no custom layout
   primitive (`Rail`, `SectionDivider`, `SiteTopbar`, `SiteFooter`) or
   `--line`/`ember` utility remains.
3. Given the theme toggle, when toggled, then light/dark works on the shadcn
   default contract.
4. Given the visual baseline regeneration, when the slice is complete, then
   the landing baselines match the shadcn default look and were inspected.
5. Given full verification, when the slice is complete, then `pnpm verify`
   and `pnpm verify:runtime` pass including the axe suite.

## Risk And Authority

Risk is medium because the change is browser-visible on the public landing
page and removes the last custom layout layer, but it does not touch
authenticated behavior or server logic. Authority is limited to
repository-local implementation and isolated fixture/runtime verification.
Human review remains required for visual behavior.

## Impact Areas

- `src/features/marketing/**` (landing page);
- `src/components/layout/**` (custom primitives removed/recomposed);
- `src/components/brand/**` (asset retained);
- `src/components/theme/**` (default-contract reconciliation);
- marketing visual baselines (regenerated with review).

## Verification Matrix

| Acceptance            | Evidence                                        |
| --------------------- | ----------------------------------------------- |
| Primitives used       | Grep for removed custom primitives/utilities    |
| Layout layer removed  | `src/components/layout/**` empty or shadcn-only |
| Theme contract        | Light default + `.dark` toggle works            |
| Baselines regenerated | Updated PNGs inspected per page                 |
| Repository health     | `pnpm verify` and `pnpm verify:runtime`         |

## Checklist

- [ ] Recompose the landing page with shadcn primitives.
- [ ] Remove or recompose the custom layout primitives.
- [ ] Reconcile the theme behavior to the shadcn default contract.
- [ ] Regenerate and inspect the marketing visual baselines.
- [ ] Update design and architecture docs for the completed migration.
- [ ] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The marketing migration lands last, completing the pure-shadcn-default
migration. Roll back by reverting `src/features/marketing/**` and
`src/components/layout/**`; the foundation and feature migrations remain.

## Decision And Deviation Log

- 2026-08-10: Marketing/layout migrates last because it removes the final
  custom layer and depends on the feature migrations settling the patterns.

## Verification

- Not run yet.

## Runtime Evidence

- Not run yet.

## Follow-Up Debt

- None yet.
