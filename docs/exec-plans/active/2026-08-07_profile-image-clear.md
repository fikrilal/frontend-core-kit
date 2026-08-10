# 2026-08-07 Clear Profile Image

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `DELETE /v1/me/profile-image` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a profile-image clear action on the `/app/profile` surface that detaches
the current profile image through the generated
`DELETE /v1/me/profile-image` (`users.me.profileImage.clear`) contract. The
implementation must preserve the server-owned session boundary, expose only
safe feedback, and follow the existing per-flow pattern under
`src/features/users/profile-image/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.profileImage.clear` as an
  authenticated `DELETE /v1/me/profile-image` with no parameters, returning an
  empty `204`, with `UNAUTHORIZED` and `INTERNAL` error codes.
- The backend detaches the current profile image (if any) and marks the stored
  file deleted; object-storage deletion is best-effort.
- The generated runtime exposes `UsersMeProfileImageClearResponse`
  (`zod.void()`).
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep the profile-image clear as an authenticated Server Action under
  `src/features/users/profile-image/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat unexpected failures as a safe `unavailable` state. Backend title,
  detail, and raw response text never become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- This slice only clears the profile image; it does not upload, complete, or
  resolve a profile image (separate plans).
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, the upload-plan/complete/url endpoints (separate plans), the
  direct object-storage PUT, profile-image display UI, OIDC, push-token, or
  product onboarding workflows.
- Client-side optimistic clearing or polling.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user with a profile image on `/app/profile`, when the
   clear action runs, then it returns success and the image is detached.
2. Given a valid server session and a fixture `204`, when the action runs, then
   the browser receives success without exposing tokens.
3. Given the first request returns `401` and a forced refresh succeeds, when
   the action runs, then exactly one refreshed access token is used for a
   retry.
4. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
5. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, bearer header, `no-store` policy, timeout, empty
   response, and request-ID boundary match the generated contract.
6. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new clear, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent clear. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users profile-image clear adapter and failure mapper;
- authenticated clear Server Action, state, and `/app/profile` integration;
- contract-faithful API fixture and Playwright clear coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                  |
| ---------------------------- | --------------------------------------------------------- |
| Generated request/204        | Users profile-image clear API transport test              |
| Authentication and one retry | Clear Server Action tests with session-service fixtures   |
| Safe failure mapping         | Clear failure-mapper tests                                |
| Clear UI behavior            | Playwright clear flow                                     |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                   |

## Checklist

- [x] Add the generated-contract profile-image clear adapter and transport
      test.
- [x] Add safe failure mapping, authenticated Server Action, state, and
      `/app/profile` integration.
- [x] Extend the isolated fixture with authenticated clear behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The clear action becomes available with the frontend deployment and depends on
the backend `users.me.profileImage.clear` endpoint already being configured.
Roll back by reverting the action, adapter, mapper, fixture, tests, and page
integration together; the existing profile editor remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `DELETE /v1/me/profile-image` as the fourth of four
  profile-image slices, completing the profile-image lifecycle.
- 2026-08-07: The endpoint is idempotent; clearing with no image set is a safe
  no-op success.
- 2026-08-07: The clear action revalidates `/app/profile` on success; the e2e
  fixture does not mutate the user on clear (matching the cancel precedent) so
  the client success state survives the re-render.

## Verification

- Focused users tests passed: 107 Vitest tests across the profile-image clear
  adapter transport (DELETE path, bearer header, empty 204), the clear Server
  Action (redirect, one-401-retry, second-401 invalidation, unavailable
  mapping, revalidation on success), the failure mapper, and the existing users
  flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed.
- Full unit suite: 236 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 69 Chromium tests, including the clear
  success flow (avatar shown then removed with safe feedback), the
  url-present/url-absent flows, and the stable profile visual baselines.
- The profile visual baselines were unchanged by this slice (the default user
  has no image); no regeneration was needed.

## Follow-Up Debt

- None yet.
