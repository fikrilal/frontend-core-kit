# 2026-08-10 Shadcn Default Auth Migration

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for UI behavior
**Risk:** high
**Authority:** implement and verify the shadcn-default migration of the auth feature against the accepted pure-shadcn-default design-system proposal; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/auth/, src/components/ui/, src/app/globals.css, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/design/, docs/core/architecture.md, docs/product/initial-pages.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Migrate all auth feature surfaces onto the installed shadcn primitives:
`login`, `register`, `password-reset-request`, `password-reset-confirmation`,
`email-verification`, `email-verification-resend`, and `change-password`. The
inline card shells, buttons, inputs, labels, and error/status paragraphs are
replaced with `@/components/ui/*` components; no behavior changes.

## Current Evidence

- The shadcn foundation plan installs the base primitives and default tokens
  (dependency).
- Auth pages duplicate the same visual vocabulary inline: the `max-w-sm` card
  shell with `LamaraMark` header, `h-10` primary buttons, input fields, and
  `text-red-600 dark:text-red-400` error paragraphs.
- The axe accessibility suite and visual baselines cover every auth state.

## Decisions And Invariants

- Use only installed shadcn primitives; do not hand-write replacements.
- Keep the exact markup structure (labels, `aria-describedby`, `aria-invalid`,
  `aria-live` feedback) — the migration is class-level, not behavior-level.
- The card shell becomes a shared `Card` composition (Card/CardHeader/
  CardTitle/CardContent) or a small feature-local shell that composes Card;
  the `LamaraMark` brand header stays as an asset.
- Error and status feedback use the shadcn `Alert` (or `AlertDescription`)
  with the existing live-region wiring.
- Regenerate only the affected visual baselines via `pnpm test:e2e:update`
  and inspect the PNGs.
- Keep the axe suite green; the browser a11y gate is unchanged.

## Non-Goals

- Users feature migration (separate plan).
- Marketing/layout chrome migration (separate plan).
- Behavior, copy, session, or contract changes.
- Custom variants beyond the shadcn defaults.

## Acceptance Scenarios

1. Given an auth page, when it renders, then it uses only shadcn primitives
   for buttons, inputs, cards, and alerts.
2. Given form interaction, when an error occurs, then the same
   `aria-describedby`/`aria-invalid`/`aria-live` wiring is preserved.
3. Given the visual baseline regeneration, when the slice is complete, then
   the new auth baselines match the shadcn default look and were inspected.
4. Given full verification, when the slice is complete, then `pnpm verify`
   and `pnpm verify:runtime` pass including the axe suite.

## Risk And Authority

Risk is high because the change is browser-visible across all auth flows and
the a11y wiring must survive. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for visual and accessibility behavior.

## Impact Areas

- `src/features/auth/**` (all flows: page shells, forms, feedback);
- `src/components/ui/**` (consumption only);
- auth visual baselines (regenerated with review).

## Verification Matrix

| Acceptance            | Evidence                                |
| --------------------- | --------------------------------------- |
| Primitives used       | Grep for removed inline class strings   |
| A11y wiring preserved | Axe suite + focus-order e2e tests       |
| Baselines regenerated | Updated PNGs inspected per page         |
| Repository health     | `pnpm verify` and `pnpm verify:runtime` |

## Checklist

- [x] Migrate the login and register flows onto primitives.
- [x] Migrate the password-reset request/confirmation flows.
- [x] Migrate the email-verification and resend flows.
- [x] Migrate the change-password flow.
- [x] Regenerate and inspect the affected visual baselines.
- [x] Update design and architecture docs for the auth migration.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The auth migration lands feature-flow by feature-flow. Roll back by reverting
the affected `src/features/auth/**` files; the foundation primitives remain.

## Decision And Deviation Log

- 2026-08-10: Auth migrates before users because it is the smaller surface and
  establishes the form-feedback pattern the users flows will reuse.
- 2026-08-10: The shared `AuthShell` (Card composition + brand header + real
  `<h1>` heading) replaces the duplicated page shells; `CardTitle` renders a
  `div`, so a plain `<h1>` with matching classes preserves heading semantics.
- 2026-08-10: Error feedback uses the destructive `Alert`; the shadcn
  destructive variant's `*:data-slot` description color (`text-destructive/90`)
  failed WCAG AA, so the descriptions use `!text-destructive` (full-strength
  token) — a documented shadcn customization, no token changes.
- 2026-08-10: The custom `bg-muted/35` page background and alert tints were
  dropped in favor of the shadcn default card/alert surfaces.

## Verification

- Static lanes passed under Node 24: `format:check`, `contracts:check`,
  `lint`, `typecheck`, `harness:check`, and `pnpm build`.
- Unit suite: 236 passed, 1 failed — the pre-existing `theme-toggle`
  `React.act` failure plus the pre-existing `session-service.test.ts` module
  resolution error, both unrelated to this change.
- `pnpm verify:runtime`: 69 Chromium tests passed, including the full axe
  accessibility suite across all auth states.

## Runtime Evidence

- All auth accessibility tests pass after the heading and error-contrast
  fixes; the initial migration caused 58 contrast violations per error state
  (destructive alert description at 90% opacity) and a heading-semantics
  failure (CardTitle renders a div).
- The auth visual baselines (login, register, password reset, email
  verification, change password, and their states) were regenerated and
  inspected before recording; they show the shadcn default card/input/button/
  alert look.

## Follow-Up Debt

- None yet.
