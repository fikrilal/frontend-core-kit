# 2026-08-06 Patch Current User Profile

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `PATCH /v1/me` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a profile editor on a new authenticated `/app/profile` page that updates the
display name, given name, and family name through the generated
`PATCH /v1/me` (`users.me.patch`) contract. The implementation must preserve the
server-owned session boundary, expose only safe failure feedback, and follow the
existing per-flow auth pattern (`*-action.ts`, `*-state.ts`, `*-failure.ts`,
`*-form.tsx`, `*-page.tsx`) under a new `src/features/users/` feature.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.patch` as an authenticated
  `PATCH /v1/me` accepting `PatchMeRequestDto` (`{ profile: { displayName,
givenName, familyName } }`, each `min 1`/`max 100`/nullable) and returning the
  `MeEnvelopeDto`, with `VALIDATION_FAILED`, `UNAUTHORIZED`,
  `IDEMPOTENCY_IN_PROGRESS`, `CONFLICT`, and `INTERNAL` error codes.
- The `/app` proof page (`src/features/auth/session/authenticated-page.tsx`)
  loads `/v1/me` through `loadAuthenticatedUser()` and currently renders
  "Product workflows have not been defined yet."
- The session service already coordinates access-token expiry and refresh for a
  single Next.js process, with an established one-retry-after-401 pattern used
  by `load-authenticated-user.ts` and the email-verification-resend action.
- Existing flows keep a per-flow file set colocated under `src/features/auth/`
  and export pages only through the feature `index.ts`.

## Decisions And Invariants

- Keep the profile editor as an authenticated flow under a new
  `src/features/users/profile/` tree, exported via a feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `VALIDATION_FAILED`/HTTP `400`/`422` and `CONFLICT`/`409` as safe
  frontend states. Backend title, detail, and raw response text never become UI
  copy.
- Accept only the generated `MeEnvelopeDto` response; use `no-store`, the
  existing ten-second timeout, and the request-ID boundary.
- Keep the UI a small Server Action form with `useActionState`; do not add a
  client query cache, timer, or global state. The server remains authoritative.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.
- The existing `/app` proof page remains untouched; the new editor lives at
  `/app/profile`.

## Non-Goals

- Backend changes, account-settings surfaces beyond profile fields, password
  change, OIDC, session management, profile-image, push-token, account-deletion,
  or product onboarding workflows.
- Client-side optimistic updates, automatic retries, or polling.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user, when `/app/profile` renders, then it shows the
   profile editor with fields for display name, given name, and family name,
   pre-filled from the current user.
2. Given a valid server session and a fixture `MeEnvelopeDto` response, when the
   form is submitted, then the browser shows safe success copy reflecting the
   saved values.
3. Given the backend returns `VALIDATION_FAILED` or `CONFLICT`, when the form is
   submitted, then the browser shows safe feedback without backend details.
4. Given the first request returns `401` and a forced refresh succeeds, when the
   action runs, then exactly one refreshed access token is used for a retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to the
   existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, body, bearer header, `no-store` policy, timeout,
   envelope parsing, and request-ID boundary match the generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new success, conflict,
   session, and privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent write. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users adapter and profile failure mapper;
- authenticated profile Server Action, state, and form;
- `/app/profile` route and feature index;
- contract-faithful API fixture and Playwright success/conflict coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| Generated request/response   | Users API transport test                                   |
| Authentication and one retry | Server Action tests with session-service fixtures          |
| Safe failure mapping         | Profile failure-mapper tests and browser conflict scenario |
| Profile UI behavior          | Playwright profile load, save success, and conflict flows  |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions  |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                    |

## Checklist

- [x] Add the generated-contract `PATCH /v1/me` adapter and transport test.
- [x] Add safe failure mapping, authenticated Server Action, state, and form.
- [x] Add the `/app/profile` route and feature index without exposing
      credentials.
- [x] Extend the isolated fixture with authenticated profile update success and
      conflict behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The profile editor becomes available with the frontend deployment and depends
on the backend `users.me.patch` endpoint already being configured. Roll back by
reverting the form, action, adapter, mapper, fixture, tests, route, and
documentation together; the existing authenticated foundation remains usable.

## Decision And Deviation Log

- 2026-08-06: Choose `PATCH /v1/me` as the first users-feature slice because
  the authenticated profile is the smallest self-contained account mutation on
  the contract.
- 2026-08-06: Host the editor at `/app/profile` rather than replacing the `/app`
  proof page, preserving existing evidence and baselines.
- 2026-08-06: Name the feature `users/` (not `profile/`) to match the backend
  `users.me.*` operation namespace.

## Verification

- Focused users tests passed: 14 Vitest tests across the adapter transport,
  the authenticated Server Action (redirect, one-401-retry, second-401
  invalidation, validation/conflict/unavailable mapping), and the failure
  mapper.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed; `/app/profile` is registered as a dynamic
  server-rendered route.
- Full unit suite: 126 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 42 Chromium tests, including profile load
  with prefilled values, save success reflecting the updated server profile,
  conflict feedback, profile route protection, accessibility (labels, focus,
  aria-describedby, axe), and the two new profile visual baselines.
- The new `profile.png` and `profile-saved.png` baselines were visually
  inspected before recording; they show the prefilled editor and the
  post-save state with the success message.

## Follow-Up Debt

- None yet.
