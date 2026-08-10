# 2026-08-07 Get Profile Image URL

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `GET /v1/me/profile-image/url` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a profile-image URL loader on the `/app/profile` surface that resolves the
current profile image through the generated
`GET /v1/me/profile-image/url` (`users.me.profileImage.url`) contract. The
implementation must preserve the server-owned session boundary, expose only
safe feedback, and follow the existing per-flow pattern under
`src/features/users/profile-image/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.profileImage.url` as an
  authenticated `GET /v1/me/profile-image/url` with no parameters, returning
  either `ProfileImageUrlEnvelopeDto` (`data: { url, expiresAt }`) on `200` or
  an empty `204` when no profile image is set, with `UNAUTHORIZED`,
  `USERS_OBJECT_STORAGE_NOT_CONFIGURED`, and `INTERNAL` error codes.
- The backend returns a short-lived presigned URL for rendering the current
  profile image.
- The generated runtime exposes `ProfileImageUrlEnvelopeDto` and
  `UsersMeProfileImageUrlResponse`; the `204` case uses the existing
  empty-response boundary.
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep the profile-image URL load as an authenticated Server Component loader
  under `src/features/users/profile-image/`, exported via the feature
  `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `USERS_OBJECT_STORAGE_NOT_CONFIGURED` and unexpected failures as a safe
  `unavailable` state. Backend title, detail, and raw response text never
  become UI copy.
- Accept only the generated `ProfileImageUrlEnvelopeDto` response or the empty
  `204`; use `no-store` and the existing ten-second timeout.
- This slice only resolves the render URL; it does not upload, complete, or
  clear a profile image (separate plans).
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, the upload-plan/complete/clear endpoints (separate plans),
  the direct object-storage PUT, profile-image display UI, OIDC, push-token,
  or product onboarding workflows.
- Client-side URL caching, prefetching, or polling.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user with a profile image on `/app/profile`, when the
   loader runs, then it returns the presigned render URL.
2. Given an authenticated user without a profile image, when the loader runs,
   then it returns the empty `204` state (no image).
3. Given a valid server session and a fixture `ProfileImageUrlEnvelopeDto`
   response, when the loader runs, then it resolves the URL without exposing
   tokens.
4. Given the first request returns `401` and a forced refresh succeeds, when
   the loader runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the loader runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, bearer header, `no-store` policy, timeout, envelope
   parsing, empty-response handling, and request-ID boundary match the
   generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new url, session, and privacy
   behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account read and the
loader is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate requests. Authority is limited to repository-local implementation
and isolated fixture/runtime verification. Human review remains required for
auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users profile-image url adapter and failure mapper;
- authenticated profile-image URL loader and `/app/profile` integration;
- contract-faithful API fixture and Playwright url coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                  |
| ---------------------------- | --------------------------------------------------------- |
| Generated request/response   | Users profile-image url API transport test                |
| Authentication and one retry | URL loader tests with session-service fixtures            |
| Safe failure mapping         | URL failure-mapper tests                                  |
| URL UI behavior              | Playwright url-present and url-absent flows               |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                   |

## Checklist

- [x] Add the generated-contract profile-image url adapter and transport test.
- [x] Add safe failure mapping, authenticated loader, and `/app/profile`
      integration.
- [x] Extend the isolated fixture with authenticated url-present and url-absent
      behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The profile-image URL loader becomes available with the frontend deployment and
depends on the backend `users.me.profileImage.url` endpoint and object storage
already being configured. Roll back by reverting the loader, adapter, mapper,
fixture, tests, and page integration together; the existing profile editor
remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `GET /v1/me/profile-image/url` as the third of four
  profile-image slices, resolving the attached image for rendering.
- 2026-08-07: The `204` (no image) case is a distinct safe state from an
  `unavailable` failure.
- 2026-08-07: Added `readOptionalApiResult` to the shared API boundary — the
  url endpoint is the first 200-or-204 success; the helper reuses the existing
  error/network handling.
- 2026-08-07: Review fixes applied — `loadProfileImageUrl` now runs only when
  the authenticated user loads successfully (avoids a redundant session read
  and request on the unavailable path), and the loader result property was
  renamed `url` → `imageUrl` for clarity (`imageUrl.url` instead of
  `image.url.url`). The `aria-describedby`-on-button recommendation was not
  applied: it contradicts the established form convention (live regions
  announce feedback; buttons carry no descriptor).

## Verification

- Focused users tests passed: 99 Vitest tests across the profile-image url
  adapter transport (200 envelope, 204 null), the url loader (redirect,
  one-401-retry, second-401 invalidation, null/unavailable mapping), the
  failure mapper, and the existing users flows, plus the new
  `readOptionalApiResult` helper.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed.
- Full unit suite: 228 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 68 Chromium tests, including the url-present
  flow (avatar rendered for the fixture user with an image), the url-absent
  flow (no avatar for the default user), and the stable profile visual
  baselines.
- The profile visual baselines were unchanged by this slice (the default user
  has no image); no regeneration was needed.

## Follow-Up Debt

- None yet.
