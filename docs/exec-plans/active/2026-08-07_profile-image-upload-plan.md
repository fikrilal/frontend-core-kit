# 2026-08-07 Create Profile Image Upload Plan

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `POST /v1/me/profile-image/upload` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a profile-image upload-plan action on the `/app/profile` surface that
creates an upload plan through the generated
`POST /v1/me/profile-image/upload` (`users.me.profileImage.upload`) contract.
The implementation must preserve the server-owned session boundary, expose
only safe feedback, and follow the existing per-flow pattern under
`src/features/users/profile-image/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.profileImage.upload` as an
  authenticated `POST /v1/me/profile-image/upload` accepting
  `CreateProfileImageUploadRequestDto` (`{ contentType: image/jpeg|image/png|image/webp,
sizeBytes: 1..5000000 }`), returning `ProfileImageUploadPlanEnvelopeDto`
  (`data: { fileId, upload: { method: PUT, url, headers }, expiresAt }`), with
  `VALIDATION_FAILED`, `UNAUTHORIZED`, `RATE_LIMITED`, `IDEMPOTENCY_IN_PROGRESS`,
  `CONFLICT`, `USERS_OBJECT_STORAGE_NOT_CONFIGURED`, and `INTERNAL` error codes.
- The backend creates an upload record and returns a short-lived presigned URL
  for direct upload to object storage; the actual file upload is a separate
  direct PUT (handled by the complete slice).
- The generated runtime exposes `CreateProfileImageUploadRequestDto` (with
  `createProfileImageUploadRequestDtoSizeBytesMax`), the envelope schema, and
  the response schema.
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep the upload-plan creation as an authenticated Server Action under
  `src/features/users/profile-image/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `RATE_LIMITED`/`429` and `CONFLICT`/`409` as safe frontend states.
  Backend title, detail, and raw response text never become UI copy.
- Accept only the generated `ProfileImageUploadPlanEnvelopeDto` response; use
  `no-store` and the existing ten-second timeout.
- This slice only creates the upload plan; the direct object-storage PUT and
  the `complete` call are separate slices. The action returns the plan's
  `fileId` and presigned `url`/`headers` to the caller.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, the actual direct-to-storage upload, the `complete`/`clear`/
  `url` endpoints (separate plans), profile-image display UI, OIDC, push-token,
  or product onboarding workflows.
- Client-side image cropping, encoding, or size heuristics beyond passing the
  declared `contentType`/`sizeBytes`.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user on `/app/profile`, when the upload-plan action
   runs with a valid `contentType`/`sizeBytes`, then it returns the generated
   plan (fileId, presigned PUT url, headers, expiresAt).
2. Given a valid server session and a fixture `ProfileImageUploadPlanEnvelopeDto`
   response, when the action runs, then the browser receives the plan without
   exposing tokens.
3. Given the backend returns `RATE_LIMITED`/`429` or `CONFLICT`/`409`, when the
   action runs, then the browser shows safe feedback without backend details.
4. Given the first request returns `401` and a forced refresh succeeds, when
   the action runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, body, bearer header, `no-store` policy, timeout,
   envelope parsing, and request-ID boundary match the generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new upload-plan, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent write. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users profile-image upload adapter and failure mapper;
- authenticated upload-plan Server Action, state, and failure mapping;
- `/app/profile` page integration with the upload-plan affordance;
- contract-faithful API fixture and Playwright upload-plan coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                      |
| ---------------------------- | ------------------------------------------------------------- |
| Generated request/response   | Users profile-image upload API transport test                 |
| Authentication and one retry | Upload-plan Server Action tests with session-service fixtures |
| Safe failure mapping         | Upload failure-mapper tests and browser rate-limit scenario   |
| Upload-plan UI behavior      | Playwright upload-plan creation flow                          |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions     |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                       |

## Checklist

- [x] Add the generated-contract profile-image upload adapter and transport
      test.
- [x] Add safe failure mapping, authenticated Server Action, state, and
      `/app/profile` integration.
- [x] Extend the isolated fixture with authenticated upload-plan success and
      rate-limit behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The upload-plan action becomes available with the frontend deployment and
depends on the backend `users.me.profileImage.upload` endpoint and object
storage already being configured. Roll back by reverting the action, adapter,
mapper, fixture, tests, and page integration together; the existing profile
editor remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `POST /v1/me/profile-image/upload` as the first of four
  profile-image slices because the flow is strictly sequential (upload plan,
  then complete, then url, then clear).
- 2026-08-07: This slice only creates the plan; the direct object-storage PUT
  and the complete call are separate slices.
- 2026-08-07: The action returns the presigned plan to the caller; the browser
  never handles tokens.
- 2026-08-07: Contract amendment — `PresignedUploadDto.headers` in the committed
  OpenAPI snapshot had no `additionalProperties`, generating
  `Record<string, never>` and making real upload headers untypeable. Added
  `additionalProperties: { type: string }` and regenerated the committed
  contract types/Zod.

## Verification

- Focused users tests passed: 75 Vitest tests across the profile-image upload
  adapter transport (path, body, bearer header, envelope), the upload-plan
  Server Action (redirect, invalid-input rejection, one-401-retry, second-401
  invalidation, rate-limit/conflict/unavailable mapping), the failure mapper,
  and the existing users flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed.
- Full unit suite: 204 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 64 Chromium tests, including upload-plan
  creation success, the rate-limit browser scenario, accessibility (labels,
  axe), and the regenerated profile visual baselines (the profile page now
  includes the upload section).
- The regenerated `profile.png` and `profile-saved.png` baselines were visually
  inspected before recording; both show the profile editor with the upload
  section below it.

## Follow-Up Debt

- When the upload-complete and clear slices land, the upload-plan form needs a
  reset path: completing or canceling an upload should clear the plan state so
  the user can upload a new avatar without a full page reload. Recorded from
  independent review.
- 2026-08-07: Review fix applied — removed `aria-describedby` from the
  upload-plan submit button (the file input already carries it; the duplicate
  caused redundant announcements).
