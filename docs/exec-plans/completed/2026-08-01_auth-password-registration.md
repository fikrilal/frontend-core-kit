# 2026-08-01 Password Registration Vertical Slice

**Plan version:** 2
**Status:** completed
**Owner:** primary agent
**Risk:** high
**Authority:** implement, verify, and commit the password-registration auth
slice; do not change backend behavior, send real account-creation traffic
outside the isolated fixture, push, deploy, or alter unrelated product
workflows
**Allowed paths:** src/features/auth/, src/app/(auth)/, scripts/testing/, tests/e2e/, docs/exec-plans/
**Allowed actions:** edit, verify, commit
**Maximum risk:** high
**Repair limit:** 2

## Objective

Implement the frontend password-registration vertical slice against the existing
generated backend contract so a new user can submit valid credentials, receive
the same server-managed session as login, and understand that email verification
is required.

## Current Evidence

- The backend exposes `POST /v1/auth/password/register`, validates email and a
  minimum ten-character password, immediately returns access/refresh tokens, and
  queues a verification email.
- The frontend OpenAPI snapshot already generates the registration operation,
  request DTO, and `AuthPasswordRegisterResponse` runtime schema.
- Login and registration now share one server-side session-establishment helper,
  while `auth-api.ts` keeps the generated operation boundary explicit.
- `/login` and `/register` are implemented public auth routes, and the isolated
  fixture covers registration success and duplicate-email failure.

## Decisions And Invariants

- Use generated request/response types and runtime schemas; do not hand-copy
  the registration DTO or response model.
- Validate email in the server action and enforce the backend's ten-character
  password minimum before network access.
- Reuse one server-side session-establishment helper for login and registration;
  failed local session creation must revoke the newly issued remote session.
- Map backend error codes to frontend-owned safe copy. Never expose backend
  problem text, tokens, passwords, or request bodies in UI or test output.
- Registration is self-service for this slice because the backend contract
  explicitly exposes public password registration; email verification remains a
  visible post-registration state rather than being silently treated as done.
- The default fixture and browser suite remain isolated from the real backend.

## Non-Goals

- Email verification submission/resend screens or verification-token handling.
- Password reset, OIDC registration, invitation workflows, profile onboarding,
  role selection, or product-specific wedding data.
- Backend changes, real account creation in CI, or external email delivery.

## Acceptance Scenarios

1. Given a valid email and ten-character password, when registration is
   submitted, then the frontend calls the generated registration operation,
   stores the opaque server session, and redirects to `/app`.
2. Given an existing email, when registration fails with
   `AUTH_EMAIL_ALREADY_EXISTS`, then the UI shows safe guidance without backend
   response text.
3. Given invalid input or a short password, when registration is submitted,
   then no network request is made and the UI shows field-level-safe guidance.
4. Given a valid registration response with `emailVerified: false`, when the
   authenticated foundation loads, then the user can see that verification is
   still required.
5. Given malformed registration data or a failed local session write, when the
   request completes, then no token value reaches the browser and remote session
   cleanup is attempted.

## Risk And Authority

Risk is high because this changes account creation, session issuance, and public
auth behavior. The user authorized repository-local implementation and isolated
fixture/runtime verification. Backend mutation, real account creation, commits,
pushes, deployment, and external communication remain excluded.

## Impact Areas

- generated-contract auth adapter and registration error mapper;
- shared server session establishment used by login and registration;
- `/register` route, form, metadata, and auth navigation;
- isolated API fixture, unit/server tests, accessibility, and browser flows;
- this execution plan and verification evidence.

## Verification Matrix

| Acceptance                | Evidence                                                       |
| ------------------------- | -------------------------------------------------------------- |
| Contract request/response | Auth API test with generated registration schema               |
| Safe failures             | Registration mapper/action tests and fixture problem responses |
| Session behavior          | Action/server tests and authenticated browser redirect         |
| Public route              | Playwright registration, accessibility, and metadata checks    |
| Repository health         | `pnpm verify` and `pnpm verify:runtime`                        |

## Checklist

- [x] Add generated registration adapter and shared session helper.
- [x] Add safe registration errors and server action state.
- [x] Add `/register` form/page and login/register navigation.
- [x] Extend isolated fixture and tests for success/failure/session behavior.
- [x] Run full and runtime verification; record evidence.

## Rollout And Rollback

The route becomes available when the frontend deployment includes this slice;
the backend endpoint already exists. Roll back by reverting the registration
route, action, adapter, fixture, and tests together. No backend migration or
external account cleanup is required because default verification uses fixtures.

## Decision And Deviation Log

- 2026-08-01: Registration is treated as self-service for this slice because
  the existing backend contract explicitly provides the public endpoint. Email
  verification remains a follow-up flow, not a hidden assumption.

## Verification

- Passed on 2026-08-01 with `pnpm verify`:
  - Prettier formatting check passed.
  - Generated-contract drift check passed.
  - ESLint and TypeScript checks passed.
  - 70 Vitest tests passed.
  - 6 contract tests passed.
  - 56 harness/fixture tests passed.
  - Production build passed and generated `/register`.
  - Knowledge, architecture, maintainability, and public-page checks passed.
  - The shell reported the documented Node engine warning because it is
    running Node 22.22.0; the repository requires Node >=24.0.0.

## Runtime Evidence

- Passed on 2026-08-01 with `pnpm verify:runtime`:
  - 18 Playwright Chromium tests passed.
  - Registration success established an opaque `HttpOnly` session and loaded
    the authenticated foundation with verification guidance.
  - Duplicate-email failure rendered safe frontend copy without a session.
  - Registration accessibility and visual states passed.
  - Existing landing, login, logout, protection, metadata, and authenticated
    foundation coverage remained green.
- Phase 4.4 records this task as high-risk, not first-pass, completed after
  repair, independently reviewed, and reproduced in hosted CI. Its 122-second
  gate duration is the wall-clock span of hosted run `30695230750`.

## Follow-Up Debt

- Implement email verification and resend only after the product flow and email
  delivery policy are decided.
- The Phase 4.4 operating-evidence ledger now contains this task after
  independent review and hosted CI reproduction.
