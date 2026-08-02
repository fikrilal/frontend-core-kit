# 2026-08-02 Password Reset Confirmation

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the public password-reset-confirmation
slice against the committed generated contract; do not change backend
behavior, send real reset emails, alter session storage, commit, push, deploy,
merge, or introduce product workflows
**Allowed paths:** src/features/auth/, src/app/(auth)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/product/initial-pages.md, docs/engineering/
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Implement the product-neutral `/reset-password` route that consumes the
one-time token from the backend email link, accepts and confirms a new
password, calls `POST /v1/auth/password/reset/confirm`, and sends the user to a
clean sign-in URL after a successful `204` response.

## Current Evidence

- The backend controller exposes `POST /v1/auth/password/reset/confirm` with a
  `204` response and revokes all sessions after consuming the token.
- The backend password-reset documentation defines the frontend-owned link as
  `/reset-password?token=<raw-token>`.
- The committed OpenAPI snapshot and generated artifacts already define
  `auth.password.reset.confirm`, `PasswordResetConfirmRequestDto`, and the
  empty `AuthPasswordResetConfirmResponse` schema.
- The request slice already provides the auth page shell, generated-contract
  adapter pattern, safe failure mapping, and isolated Playwright fixture.

## Decisions And Invariants

- Keep the public route at `/reset-password` to match the backend-owned link
  format.
- Read the token from the server page's `searchParams` and pass only the single
  string needed by the form. Treat missing or repeated token parameters as an
  invalid link.
- Keep the raw token transient: it may remain in the reset URL and form field
  during the confirmation attempt, but must not be written to cookies,
  localStorage, sessionStorage, logs, analytics payloads, or error messages.
- Submit through a server action. Validate the token, new password, and exact
  confirmation match again on the server; client attributes are only hints.
- Derive the new-password minimum from the generated runtime contract. Do not
  trim or normalize passwords, because the backend receives the exact value.
- Map invalid and expired token codes to one safe frontend state. Backend
  titles, details, and raw response bodies never become UI copy.
- On successful `204`, redirect to `/login?reset=success` so the token is no
  longer present in the visible URL. The login page may show only a static
  success message and must not create a session.
- Keep the route and feature internals private; export only the public feature
  page through `src/features/auth/index.ts`.

## Non-Goals

- Backend changes, email delivery, token generation, token validation logic, or
  session-revocation implementation.
- Password change for an already authenticated user.
- Token pre-validation on page load, token refresh, local persistence, or
  client-side API calls.
- Product positioning, account settings, profile management, or any dashboard
  workflow.
- Generic reset-form, API, retry, query, or localization abstractions without
  a second demonstrated use.

## Acceptance Scenarios

1. Given a valid token URL, when `/reset-password?token=...` renders, then the
   page exposes labelled new-password and confirmation fields, password
   guidance, and no authenticated session.
2. Given matching valid passwords and a fixture `204`, when the form is
   submitted, then the browser lands on `/login?reset=success`, shows static
   reset-success guidance, and has no session cookie or browser-stored token.
3. Given a missing, repeated, invalid, or expired token, when the page or form
   is used, then safe invalid-link copy is rendered and no raw backend detail
   is exposed.
4. Given a short or mismatched password, when the form is submitted, then the
   server action returns validation feedback without an API request.
5. Given an unavailable or malformed API result, when the form is submitted,
   then the UI renders safe retry guidance without exposing credentials or the
   token.
6. Given the reset-confirmation route is implemented, when contract, unit,
   accessibility, browser, and visual lanes run, then request construction,
   `204` handling, error mapping, token-boundary behavior, and clean redirect
   are covered.

## Risk And Authority

Risk is high because this is a credential-recovery boundary. Incorrect token
handling can leak a credential-reset capability; incorrect success behavior can
mislead users or create an unintended authenticated session. Authority is
limited to repository-local implementation and isolated fixture/runtime
verification. Human review remains required for token exposure, copy, and
production rollout.

## Impact Areas

- generated-contract password-reset-confirmation adapter and safe failure
  mapper;
- auth server action, state, form, page, and `/reset-password` route;
- login success status after a completed reset;
- isolated fixture contract and Playwright request/error/accessibility/visual
  coverage;
- auth API, testing, product-foundation, and execution-plan documentation.

## Verification Matrix

| Acceptance                        | Evidence                                                                  |
| --------------------------------- | ------------------------------------------------------------------------- |
| Generated request/204 boundary    | Auth API test using generated input and empty response                    |
| Server validation and safe states | Server Action and failure-mapper tests                                    |
| Invalid/expired token behavior    | Fixture-backed action and Playwright error tests                          |
| Clean success redirect            | Playwright confirmation and login-status coverage                         |
| Token boundary                    | Browser assertions for URL cleanup, cookies, storage, and rendered errors |
| Accessibility                     | Playwright labels, keyboard focus, password guidance, and axe checks      |
| Visual consistency                | Repository-owned reset-form, reset-error, and login-success screenshots   |
| Repository health                 | `pnpm verify` and `pnpm verify:runtime`                                   |

## Checklist

- [x] Add the generated-contract password-reset-confirmation adapter and
      empty-result test.
- [x] Add safe failure mapping, action state, server validation, and clean
      redirect behavior.
- [x] Add `/reset-password`, token-query handling, form, metadata, and login
      success status.
- [x] Extend the isolated fixture with valid, invalid, expired, and malformed
      confirmation cases.
- [x] Add unit, accessibility, browser, and visual coverage without token
      persistence or leakage.
- [x] Update truthful API, testing, and initial-page documentation.
- [x] Run full and runtime verification and record exact outcomes.
- [ ] Move this plan to completed only after independent review and hosted CI.

## Rollout And Rollback

The confirmation route becomes available with the frontend deployment and
depends on the backend's existing token/email flow. Roll back by reverting the
route, action, adapter, mapper, fixture, tests, and documentation together.
The password-reset request route remains usable if confirmation is rolled back,
but its emails must not be considered actionable until the route is deployed.

## Decision And Deviation Log

- 2026-08-02: Start confirmation only after the request slice established the
  backend contract, generated artifacts, and non-enumerating request behavior.
- 2026-08-02: Use a server-rendered token boundary plus a server action; do not
  pre-validate tokens or persist them in browser-owned state.
- 2026-08-02: Queue the request plan while independent review and hosted CI are
  outstanding so this remains the repository's only active implementation plan.
- 2026-08-02: Keep the raw token in the reset URL and transient form field only;
  verify persistence boundaries through clean redirect, cookie, local-storage,
  and session-storage assertions rather than treating the required form value
  as durable browser state.

## Verification

- `pnpm knowledge:check` passed after creating the plan and queuing the request
  plan.
- Focused confirmation/API/fixture tests passed: 18 Vitest tests and 6 fixture
  tests before the full gate.
- `pnpm verify` passed with 97 Vitest tests, 6 contract tests, 59
  harness/fixture tests, production build, and all repository fitness checks.

## Runtime Evidence

- `pnpm verify:runtime` passed with 28 Playwright Chromium tests, including
  valid confirmation, missing/invalid/expired token behavior, clean redirect,
  accessibility, and visual states. The local runtime was Node 24.18.0.

## Follow-Up Debt

- Add a referrer-policy/header decision before enabling third-party analytics on
  the reset route.
- Repair task baseline storage so `pnpm task:verify` can span Playwright runs.
- Record this completed task in the Phase 4.4 operating ledger only after
  independent review and hosted CI reproduction.
