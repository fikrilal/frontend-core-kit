# 2026-08-10 Shadcn Default Users Migration

**Plan version:** 2
**Status:** queued
**Owner:** primary agent with independent reviewer for UI behavior
**Risk:** high
**Authority:** implement and verify the shadcn-default migration of the users feature against the accepted pure-shadcn-default design-system proposal; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/components/ui/, src/app/globals.css, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/design/, docs/core/architecture.md, docs/product/initial-pages.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Migrate all users feature surfaces onto the installed shadcn primitives:
`profile`, `profile-image` (upload-plan, complete, clear, url rendering),
`sessions` (list, revoke), and `account-deletion` (request, cancel). The
inline card shells, buttons, inputs, status pills, and feedback paragraphs
are replaced with `@/components/ui/*` components; no behavior changes.

## Current Evidence

- The shadcn foundation plan installs the base primitives and default tokens;
  the auth migration establishes the form-feedback pattern (dependencies).
- Users pages duplicate the same visual vocabulary inline: the `max-w-sm`
  card shell, `h-10` buttons, inputs, error paragraphs, and the session
  status pill (`bg-muted text-muted-foreground rounded-full px-2 py-0.5`).
- The axe accessibility suite and visual baselines cover every users state.

## Decisions And Invariants

- Use only installed shadcn primitives; do not hand-write replacements.
- Keep the exact markup structure (labels, `aria-describedby`, `aria-invalid`,
  `aria-live` feedback) — the migration is class-level, not behavior-level.
- The session status pill becomes the shadcn `Badge`; the profile avatar keeps
  its `img` with the `object-cover` treatment composed with `cn`.
- The sessions list stays a server-rendered list of `Card` compositions; the
  revoke and account-deletion forms keep their per-row `useActionState`.
- The profile-image forms compose `Card`/`Input`/`Button`/`Alert`; the nested-
  form constraint (sibling forms, not nested) is preserved.
- Error and status feedback use the shadcn `Alert` with the existing
  live-region wiring.
- Regenerate only the affected visual baselines via `pnpm test:e2e:update`
  and inspect the PNGs.
- Keep the axe suite green.

## Non-Goals

- Auth feature migration (separate plan).
- Marketing/layout chrome migration (separate plan).
- Behavior, copy, session, or contract changes.
- Custom variants beyond the shadcn defaults.

## Acceptance Scenarios

1. Given a users page, when it renders, then it uses only shadcn primitives
   for buttons, inputs, cards, badges, and alerts.
2. Given form interaction, when an error occurs, then the same
   `aria-describedby`/`aria-invalid`/`aria-live` wiring is preserved.
3. Given the session list, when it renders, then the status pills use `Badge`
   and the revoke affordance keeps its per-row state.
4. Given the profile-image forms, when a plan is created, then the complete
   form renders as a sibling (no nested forms) with the same flow.
5. Given the visual baseline regeneration, when the slice is complete, then
   the new users baselines match the shadcn default look and were inspected.
6. Given full verification, when the slice is complete, then `pnpm verify`
   and `pnpm verify:runtime` pass including the axe suite.

## Risk And Authority

Risk is high because the change is browser-visible across all users flows and
the a11y wiring and nested-form constraint must survive. Authority is limited
to repository-local implementation and isolated fixture/runtime verification.
Human review remains required for visual and accessibility behavior.

## Impact Areas

- `src/features/users/**` (profile, profile-image, sessions,
  account-deletion flows);
- `src/components/ui/**` (consumption only);
- users visual baselines (regenerated with review).

## Verification Matrix

| Acceptance              | Evidence                                        |
| ----------------------- | ----------------------------------------------- |
| Primitives used         | Grep for removed inline class strings           |
| A11y wiring preserved   | Axe suite + focus-order e2e tests               |
| Nested-form constraint  | Upload-plan + complete flow e2e tests           |
| Baselines regenerated   | Updated PNGs inspected per page                 |
| Repository health       | `pnpm verify` and `pnpm verify:runtime`         |

## Checklist

- [ ] Migrate the profile and profile-image flows onto primitives.
- [ ] Migrate the sessions list and revoke flows (Badge status pills).
- [ ] Migrate the account-deletion request/cancel flows.
- [ ] Regenerate and inspect the affected visual baselines.
- [ ] Update design and architecture docs for the users migration.
- [ ] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The users migration lands flow by flow. Roll back by reverting the affected
`src/features/users/**` files; the foundation primitives remain.

## Decision And Deviation Log

- 2026-08-10: Users migrates after auth, reusing the established form-feedback
  and card-shell patterns.

## Verification

- Not run yet.

## Runtime Evidence

- Not run yet.

## Follow-Up Debt

- None yet.
