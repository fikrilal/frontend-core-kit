# 2026-08-02 Email Verification

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the public email-verification slice
against the committed generated contract; do not change backend behavior,
send real verification emails, implement authenticated resend, alter session
storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/auth/, src/app/(auth)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/product/initial-pages.md, docs/engineering/
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Implement the product-neutral `/verify-email` route that consumes the
one-time token from the backend verification email, calls
`POST /v1/auth/email/verify`, and sends the visitor to a clean sign-in URL
after a successful `204` response.

## Current Evidence

- The backend exposes `POST /v1/auth/email/verify` with a `204` response. The
  operation is idempotent for an already-verified user and does not mint new
  access or refresh tokens.
- The backend email-verification documentation defines the frontend-owned link
  as `/verify-email?token=<verification-token>` and maps invalid and expired
  tokens to stable problem codes.
- The committed OpenAPI snapshot and generated artifacts already define
  `auth.email.verify`, `VerifyEmailRequestDto`, and the empty
  `AuthEmailVerifyResponse` schema.
- Registration and the authenticated foundation already show safe guidance when
  `emailVerified` is false; this slice makes the emailed verification link
  actionable without inventing product workflows.

## Decisions And Invariants

- Keep the public route at `/verify-email` to match the backend-owned email
  link format.
- Read the token from the server page's `searchParams` and pass only one string
  to the form. Treat missing, empty, or repeated token parameters as an
  invalid link.
- Keep the raw token transient: it may remain in the URL and hidden form field
  during the confirmation attempt, but must not be written to cookies,
  localStorage, sessionStorage, logs, analytics payloads, or error messages.
- Submit through a Server Action. Validate the token again on the server; the
  generated OpenAPI schema lacks the backend DTO's `minLength: 1`, so the
  action adds that local boundary validation.
- Accept only the generated empty `204` response. Do not establish or mutate a
  browser session because this endpoint does not mint tokens.
- Redirect success to `/login?verified=success` so the token is removed from
  the visible URL. The login page may show static confirmation and must not
  automatically create a session.
- Map invalid and expired token codes to one safe frontend state. Backend
  titles, details, and raw response bodies never become UI copy.
- Keep authenticated resend out of this slice. The resend endpoint requires a
  separate product decision for its session-aware UX and rate-limit guidance.

## Non-Goals

- Authenticated verification-email resend or delivery configuration.
- Backend changes, token generation, token validation logic, or session-token
  minting/rotation.
- Password reset, password change, OIDC, account settings, or product
  onboarding workflows.
- Token pre-validation on page load, token refresh, local persistence, or
  client-side API calls.
- Generic verification-form, API, retry, query, or localization abstractions
  without a second demonstrated use.

## Acceptance Scenarios

1. Given a valid token URL, when `/verify-email?token=...` renders, then the
   page exposes a clear verification action and no authenticated session is
   created by rendering the page.
2. Given a valid token and fixture `204`, when the action is submitted, then
   the browser lands on `/login?verified=success`, shows static verification
   guidance, and has no new session or browser-stored token.
3. Given a missing, repeated, invalid, or expired token, when the page or form
   is used, then safe invalid-link copy is rendered and no raw backend detail
   is exposed.
4. Given a missing or malformed token in the submitted form, when the action
   runs, then it returns validation feedback without an API request.
5. Given an unavailable or malformed API result, when the form is submitted,
   then the UI renders safe retry guidance without exposing credentials or the
   token.
6. Given the verification endpoint is idempotent for an already-verified
   account, when the fixture returns `204`, then the frontend treats it as the
   same successful state without creating a session.
7. Given the verification route is implemented, when contract, unit,
   accessibility, browser, and visual lanes run, then request construction,
   `204` handling, error mapping, token-boundary behavior, and clean redirect
   are covered.

## Risk And Authority

Risk is high because this is an account-verification credential boundary.
Incorrect token handling can leak a verification capability, while incorrect
success behavior can create a false account state or unintended session. The
authority is limited to repository-local implementation and isolated
fixture/runtime verification. Human review remains required for token exposure,
copy, and production rollout.

## Impact Areas

- generated-contract email-verification adapter and safe failure mapper;
- auth Server Action, state, form, page, and `/verify-email` route;
- login success status after a completed verification;
- isolated fixture contract and Playwright request/error/accessibility/visual
  coverage;
- auth API, testing, product-foundation, and execution-plan documentation.

## Verification Matrix

| Acceptance                        | Evidence                                                                  |
| --------------------------------- | ------------------------------------------------------------------------- |
| Generated request/204 boundary    | Auth API test using generated input and empty response                    |
| Server validation and safe states | Server Action and failure-mapper tests                                    |
| Invalid/expired token behavior    | Fixture-backed action and Playwright error tests                          |
| Clean success redirect            | Playwright verification and login-status coverage                         |
| Token boundary                    | Browser assertions for URL cleanup, cookies, storage, and rendered errors |
| Accessibility                     | Playwright labels, keyboard focus, and axe checks                         |
| Visual consistency                | Repository-owned verification, error, and login-success screenshots       |
| Repository health                 | `pnpm verify` and `pnpm verify:runtime`                                   |

## Checklist

- [x] Add the generated-contract email-verification adapter and empty-result
      test.
- [x] Add safe failure mapping, action state, server validation, and clean
      redirect behavior.
- [x] Add `/verify-email`, token-query handling, form, metadata, and login
      success status.
- [x] Extend the isolated fixture with valid, invalid, expired, and malformed
      verification cases.
- [x] Add unit, accessibility, browser, and visual coverage without token
      persistence or leakage.
- [x] Update truthful API, testing, and initial-page documentation.
- [x] Run full and runtime verification and record exact outcomes.
- [x] Move this plan to completed after independent review and hosted CI.

## Rollout And Rollback

The verification route becomes available with the frontend deployment and
depends on the backend's existing worker-generated link flow. Roll back by
reverting the route, action, adapter, mapper, fixture, tests, and documentation
together. Registration remains usable, but its verification guidance must not
be considered actionable until this route is deployed.

## Decision And Deviation Log

- 2026-08-02: Scope the first email-verification slice to public token
  consumption. Authenticated resend remains a separate task because it has a
  different session and rate-limit boundary.
- 2026-08-02: Use a server-rendered token boundary plus a Server Action; do not
  pre-validate tokens or persist them in browser-owned state.
- 2026-08-02: Queue Phase 4.4 while this high-risk auth task is active so task
  verification has exactly one current plan.
- 2026-08-02: Keep invalid-link copy honest while resend remains out of scope;
  the route returns users to sign in instead of promising an unimplemented
  resend action.
- 2026-08-03: Pull request #2 was independently reviewed and merged. Hosted
  CI run `30739192007` passed CI Risk, CI Verify, CI Runtime, and CI Required;
  the bounded task record is now eligible for the Phase 4.4 ledger.

## Verification

- `pnpm format:check`, `pnpm contracts:check`, `pnpm lint`, and
  `pnpm typecheck` passed.
- `pnpm test` passed with 108 Vitest tests, 6 contract tests, and 61
  harness/fixture tests. The generated contract check remained byte-current.
- `pnpm build` passed and generated the dynamic `/verify-email` route.
- Knowledge, architecture, maintainability, and public-page checks passed.
- Focused API/action/mapper tests passed with 18 tests; fixture contract tests
  passed with 9 tests.
- The frontend OpenAPI snapshot SHA-256 matches the backend checkout's current
  `docs/openapi/openapi.yaml`; the relevant backend controller, DTO, and
  verification service are unchanged from the snapshot source revision.
- The local shell emitted the expected Node 22 engine warning; the repository
  requires Node 24 or newer.
- Hosted CI independently reproduced the change on GitHub Actions run
  `30739192007`; CI Risk, CI Verify, CI Runtime, and CI Required all passed.

## Runtime Evidence

- `pnpm verify:runtime` passed with 34 Chromium tests. The run covered valid
  and already-verified `204` success, invalid and expired token mapping,
  missing/repeated token rejection, clean redirect, session/storage
  boundaries, accessibility, and visual baselines.
- New verification and login-success screenshots were visually inspected
  before recording the baselines.

## Follow-Up Debt

- Implement authenticated verification-email resend only after its UX,
  session, and rate-limit behavior receives a separate execution plan.
- Add a referrer-policy/header decision before enabling third-party analytics
  on the verification route.
- The Phase 4.4 ledger records this task as independently reviewed and
  CI-reproduced. The operating-proof conclusion remains insufficient until a
  real task from a second risk class is observed.
