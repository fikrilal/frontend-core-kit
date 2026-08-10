# 2026-08-07 Complete Profile Image Upload

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `POST /v1/me/profile-image/complete` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a profile-image upload-complete action on the `/app/profile` surface that
finalizes a direct upload through the generated
`POST /v1/me/profile-image/complete` (`users.me.profileImage.complete`)
contract. The implementation must preserve the server-owned session boundary,
expose only safe feedback, and follow the existing per-flow pattern under
`src/features/users/profile-image/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.profileImage.complete` as
  an authenticated `POST /v1/me/profile-image/complete` accepting
  `CompleteProfileImageUploadRequestDto` (`{ fileId }`), returning an empty
  `204`, with `VALIDATION_FAILED`, `UNAUTHORIZED`, `NOT_FOUND`,
  `USERS_OBJECT_STORAGE_NOT_CONFIGURED`, `USERS_PROFILE_IMAGE_NOT_UPLOADED`,
  `USERS_PROFILE_IMAGE_SIZE_MISMATCH`,
  `USERS_PROFILE_IMAGE_CONTENT_TYPE_MISMATCH`, and `INTERNAL` error codes.
- The backend verifies the uploaded object (size, content type) and attaches it
  to the current user profile. The direct object-storage PUT happens between
  the upload-plan slice and this complete call.
- The generated runtime exposes `CompleteProfileImageUploadRequestDto` and
  `UsersMeProfileImageCompleteResponse` (`zod.void()`).
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep the upload-complete action as an authenticated Server Action under
  `src/features/users/profile-image/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `NOT_FOUND`/`404` and the `USERS_PROFILE_IMAGE_*` mismatch codes as
  safe frontend states. Backend title, detail, and raw response text never
  become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- This slice assumes the direct upload already happened (via the upload-plan
  slice's presigned URL); it only verifies and attaches.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, the upload-plan or url/clear endpoints (separate plans), the
  direct object-storage PUT, profile-image display UI, OIDC, push-token, or
  product onboarding workflows.
- Client-side retry of the direct upload, or image re-encoding.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user on `/app/profile` with an uploaded object, when
   the complete action runs with a valid `fileId`, then it returns success.
2. Given a valid server session and a fixture `204`, when the action runs, then
   the browser receives success without exposing tokens.
3. Given the backend returns `NOT_FOUND` or a `USERS_PROFILE_IMAGE_*` mismatch,
   when the action runs, then the browser shows safe feedback without backend
   details.
4. Given the first request returns `401` and a forced refresh succeeds, when
   the action runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, body, bearer header, `no-store` policy, timeout,
   empty response, and request-ID boundary match the generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new complete, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent complete. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users profile-image complete adapter and failure mapper;
- authenticated complete Server Action, state, and `/app/profile` integration;
- contract-faithful API fixture and Playwright complete coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| Generated request/204        | Users profile-image complete API transport test              |
| Authentication and one retry | Complete Server Action tests with session-service fixtures   |
| Safe failure mapping         | Complete failure-mapper tests and browser not-found scenario |
| Complete UI behavior         | Playwright complete flow                                     |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions    |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                      |

## Checklist

- [x] Add the generated-contract profile-image complete adapter and transport
      test.
- [x] Add safe failure mapping, authenticated Server Action, state, and
      `/app/profile` integration.
- [x] Extend the isolated fixture with authenticated complete behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The complete action becomes available with the frontend deployment and depends
on the backend `users.me.profileImage.complete` endpoint and object storage
already being configured. Roll back by reverting the action, adapter, mapper,
fixture, tests, and page integration together; the existing profile editor
remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `POST /v1/me/profile-image/complete` as the second of four
  profile-image slices, finalizing the direct upload created by the
  upload-plan slice.
- 2026-08-07: The action takes the `fileId` from the upload plan; the browser
  never handles tokens.
- 2026-08-07: The complete form renders as a sibling of the upload-plan form
  (not nested) — nested forms are invalid HTML and the browser drops the inner
  submit, which the e2e gate caught.
- 2026-08-07: Review fix applied — the complete action now calls
  `revalidatePath("/app/profile")` on success so the profile route refetches
  the updated profile image once the URL slice renders it.

## Verification

- Focused users tests passed: 89 Vitest tests across the profile-image complete
  adapter transport (path, body, bearer header, empty 204), the complete Server
  Action (redirect, missing-file-id rejection, one-401-retry, second-401
  invalidation, not-found/mismatch/unavailable mapping), the failure mapper,
  and the existing users flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed.
- Full unit suite: 218 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 66 Chromium tests, including the complete
  success flow (plan then confirm), the not-found browser scenario, the
  upload-plan success and rate-limit flows, and the stable profile visual
  baselines.
- The profile visual baselines were unchanged by this slice (the initial form
  state is identical); no regeneration was needed.

## Follow-Up Debt

- None yet.
