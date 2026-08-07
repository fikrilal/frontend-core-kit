# 2026-08-02 Email Verification Resend

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated email-verification-resend slice against the committed generated contract; do not change backend behavior, send real verification emails, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/auth/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/core/tech-stack.md, docs/product/initial-pages.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Allow an authenticated user whose email is not yet verified to request another
verification email from the existing `/app` foundation. The implementation must
use the generated `POST /v1/auth/email/verification/resend` contract, preserve
the server-owned session boundary, and expose only safe rate-limit or
availability feedback.

## Current Evidence

- The committed OpenAPI snapshot defines `auth.email.verification.resend` as an
  authenticated `POST` with an empty `204` response and `UNAUTHORIZED`,
  `RATE_LIMITED`, and `INTERNAL` error codes.
- The backend endpoint enqueues a verification email, returns success for an
  already-verified user, and applies a cooldown/IP rate limit.
- Registration establishes an opaque web session for an unverified user, while
  `/app` currently displays verification guidance without an action.
- The session service already coordinates access-token expiry and refresh for a
  single Next.js process.

## Decisions And Invariants

- Keep resend as an authenticated action inside the existing `/app` proof; do
  not add a new route or account-settings surface.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `RATE_LIMITED` and HTTP `429` as one safe frontend state. Backend title,
  detail, and raw response text never become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- Keep the UI a small Server Action form with `useActionState`; do not add a
  client query cache, timer, or global state. The server remains authoritative
  for cooldown enforcement.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, email-provider configuration, queue inspection, or real
  email delivery.
- Password change, OIDC, account settings, session management, profile, or
  product onboarding workflows.
- Client-side countdowns, optimistic success, automatic retries, or polling.
- Changes to the public verification-link route or token handling.

## Acceptance Scenarios

1. Given an authenticated user with `emailVerified: false`, when `/app` renders,
   then it shows verification guidance and an accessible resend action.
2. Given a valid server session and a fixture `204`, when the action is
   submitted, then the browser remains on `/app` and shows safe success copy.
3. Given the backend returns `429 RATE_LIMITED`, when the action is submitted,
   then the browser remains on `/app` and shows wait-and-retry guidance without
   backend details.
4. Given the first resend request returns `401` and a forced refresh succeeds,
   when the action runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after
   one retry, when the action runs, then no credential is exposed and the user
   is redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, bearer header, `no-store` policy, timeout, empty response, and
   request-ID boundary match the generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   visual, full, and runtime verification run, then the new success, rate-limit,
   session, and privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate a rate-limited email request. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract auth adapter and resend failure mapper;
- authenticated email-verification Server Action, state, and form;
- `/app` unverified-user guidance;
- contract-faithful API fixture and Playwright success/rate-limit coverage;
- auth API, testing, product-foundation, and execution-plan documentation.

## Verification Matrix

| Acceptance                     | Evidence                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| Generated request/204 boundary | Auth API transport test                                       |
| Authentication and one retry   | Server Action tests with session-service fixtures             |
| Safe failure mapping           | Resend failure-mapper tests and browser rate-limit scenario   |
| Authenticated UI behavior      | Playwright registration, resend success, and rate-limit flows |
| Accessibility                  | Playwright labels, focus, live-region, and axe assertions     |
| Visual consistency             | Authenticated foundation screenshot review                    |
| Repository health              | `pnpm verify` and `pnpm verify:runtime`                       |

## Checklist

- [x] Add the generated-contract resend adapter and empty-response transport
      test.
- [x] Add safe failure mapping, authenticated Server Action, state, and form.
- [x] Add the form to the unverified `/app` state without exposing credentials.
- [x] Extend the isolated fixture with authenticated success and rate-limit
      behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, and execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.
- [x] Move this plan to `completed/` only after verification and review.

## Rollout And Rollback

The action becomes available with the frontend deployment and depends on the
backend email worker and rate limiter already being configured. Roll back by
reverting the form, action, adapter, mapper, fixture, tests, and documentation
together; the existing authenticated verification guidance remains usable.

## Decision And Deviation Log

- 2026-08-02: Choose resend as the next auth slice because registration already
  creates an unverified authenticated session and `/app` has a truthful place
  for the action.
- 2026-08-02: Keep the endpoint inside the generic authenticated foundation;
  no account-settings or product workflow is inferred.

## Verification

- Focused auth and fixture tests passed: 20 Vitest tests and 10 fixture
  contract tests.
- `pnpm verify` passed: 120 Vitest tests, 6 contract tests, 63
  harness/fixture tests, production build, knowledge, architecture,
  maintainability, and public-page checks.
- The local shell emitted the expected Node 22 engine warning; the repository
  requires Node 24 or newer. `pnpm task:begin` therefore stopped before
  creating a task baseline.

## Runtime Evidence

- `pnpm verify:runtime` passed with 37 Chromium tests, including unverified
  registration, resend success, rate-limit feedback, accessibility, privacy,
  and the new visual baseline.
- The new unverified authenticated screenshot was visually inspected before
  recording the baseline.

## Follow-Up Debt

- Add a cooldown countdown only if product research shows that server-enforced
  rate-limit feedback is insufficient; do not infer it from this endpoint.
