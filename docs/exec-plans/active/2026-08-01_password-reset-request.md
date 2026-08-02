# 2026-08-01 Password Reset Request

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the public password-reset-request slice
against the committed generated contract; do not implement reset confirmation,
change backend behavior, send real reset emails, commit, push, deploy, merge,
or introduce product workflows
**Allowed paths:** src/features/auth/, src/app/(auth)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/product/initial-pages.md, docs/engineering/
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a product-neutral password-reset request flow so a visitor can submit an
email address and receive the same safe confirmation whether or not an account
exists. Use the existing `auth.password.reset.request` contract and prove the
boundary without implementing the token-confirmation flow.

## Current Evidence

- The committed OpenAPI snapshot already defines `POST
/v1/auth/password/reset/request` with `PasswordResetRequestDto`, a `204`
  response, and explicit account-enumeration-safe semantics.
- Generated TypeScript and Zod artifacts already expose the request DTO and
  empty response schema.
- Login and registration already establish the generic auth page shell and
  expose server-only adapters/actions with safe error mappers.
- At task start, the login page had no password-reset entry point, and the
  isolated API fixture had no reset-request route.

## Decisions And Invariants

- Keep the public route at `/forgot-password`; reset confirmation is a separate
  future route and is not part of this task.
- Validate a trimmed email at the Server Action boundary before network access.
- Treat every successful `204` identically. The UI must never reveal whether an
  email belongs to an account.
- Map only `VALIDATION_FAILED`, `RATE_LIMITED`, and transport/response failures
  into frontend-owned safe states. Backend problem titles and detail never
  become UI copy.
- Use the generated request type and `readEmptyApiResult`; do not hand-copy a
  response model or parse an empty success body as JSON.
- Do not create a browser session, expose tokens, or put reset data in a URL,
  cookie, browser storage, log, or rendered payload.
- Keep the existing login/register visual language and route composition
  boundaries.

## Non-Goals

- Password-reset token confirmation or new-password submission.
- Email verification/resend, account settings, password change, or OIDC.
- Real email delivery, real account traffic, backend changes, or product
  positioning/workflow decisions.
- Generic form, API, retry, query, or repository abstractions without a second
  demonstrated use.

## Acceptance Scenarios

1. Given a visitor opens `/forgot-password`, when the page renders, then it
   exposes a labelled email field, a clear submit action, a sign-in link, and
   no reset token or account data.
2. Given a syntactically valid email and a `204` API response, when the form is
   submitted, then the page shows generic reset-instructions copy and no
   session cookie is created.
3. Given an unknown email and a `204` API response, when the form is submitted,
   then the visible result is indistinguishable from the known-email result.
4. Given malformed input, when the form is submitted, then no network request
   occurs and safe validation feedback is rendered.
5. Given a rate-limited or unavailable API result, when the form is submitted,
   then the page renders safe retry guidance without exposing backend details.
6. Given the password-reset request route is implemented, when the generated
   contract and browser harness run, then request construction, empty-response
   validation, accessibility, and runtime behavior are covered.

## Risk And Authority

Risk is high because this is an account-recovery boundary. Incorrect behavior
could reveal account existence, mishandle credentials, or mislead users about
email delivery. Authority is limited to repository-local implementation and
isolated fixture/runtime verification; human review remains required for auth
copy, privacy invariants, and any later token-confirmation design.

## Impact Areas

- generated-contract password-reset-request adapter and safe failure mapper;
- auth Server Action, state, form, page, and `/forgot-password` route;
- login navigation to the reset-request route;
- isolated fixture contract and Playwright request/error/accessibility/visual
  coverage;
- this execution plan and eventual Phase 4.4 evidence record.

## Verification Matrix

| Acceptance                     | Evidence                                                                  |
| ------------------------------ | ------------------------------------------------------------------------- |
| Generated request/204 boundary | Auth API test with generated DTO and empty response                       |
| Safe action states             | Server Action and failure-mapper tests                                    |
| Non-enumerating success        | Fixture-backed Playwright success coverage for known/unknown inputs       |
| Invalid/rate-limited behavior  | Action and browser failure tests with no session cookie                   |
| Public route and accessibility | Playwright route, keyboard, labels, and axe checks                        |
| Visual consistency             | Repository-owned forgot-password screenshots reviewed with the auth shell |
| Repository health              | `pnpm verify` and `pnpm verify:runtime`                                   |

## Checklist

- [x] Add the generated-contract password-reset-request adapter and empty-result test.
- [x] Add safe failure mapping, action state, and Server Action validation.
- [x] Add `/forgot-password`, form, metadata, and login navigation.
- [x] Extend the isolated fixture with contract-valid 204 and rate-limit cases.
- [x] Add unit, accessibility, browser, and visual coverage without account enumeration.
- [x] Run full and runtime verification and record the exact outcomes.
- [ ] Move this plan to completed only after independent review and hosted CI.

## Rollout And Rollback

The public request route becomes available with the frontend deployment and
does not alter backend state outside the backend's existing email enqueue
operation. Roll back by reverting the route, action, adapter, fixture, tests,
and login link together. Reset confirmation remains unavailable until a
separate plan defines its token handling and product copy.

## Decision And Deviation Log

- 2026-08-01: Start with request-only recovery because the backend contract
  already guarantees a `204` for both known and unknown emails; confirmation is
  deferred to keep token handling out of this slice.
- 2026-08-01: Queue Phase 4.4 while this implementation plan is active so the
  task harness has exactly one active plan; evidence collection resumes after
  this task reaches independent review and hosted CI.
- 2026-08-01: The task baseline stored under `test-results/` was removed by the
  Playwright runner while executing the browser lane. The feature gates remain
  valid, but the harness state location needs a separate maintenance fix before
  task verification can span a browser run.

## Verification

- `pnpm knowledge:check` passed before implementation.
- Focused auth and fixture tests passed: 20 Vitest tests and 5 fixture tests.
- `pnpm verify` passed with 85 Vitest tests, 6 contract tests, 57
  harness/fixture tests, production build, and all repository fitness checks.
- The first `pnpm task:begin` attempt correctly rejected Node 22; the Node 24
  baseline then started successfully. `pnpm task:verify` later stopped with
  `task-state-missing` because the Playwright runner cleaned `test-results/`.

## Runtime Evidence

- `pnpm verify:runtime` passed with 22 Playwright Chromium tests, including
  known/unknown reset-request equivalence, rate-limit copy, accessibility, and
  visual states. The local runtime was Node 24.18.0.

## Follow-Up Debt

- Decide and implement password-reset confirmation only after token transport,
  expiry, invalid-token copy, and session-revocation behavior are reviewed.
- Move the task baseline/summary artifacts outside Playwright's cleaned output
  directory before relying on `pnpm task:verify` for browser-backed tasks.
- Record this completed task in the Phase 4.4 ledger only after independent
  review and hosted CI reproduction.
