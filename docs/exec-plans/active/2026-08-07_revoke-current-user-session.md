# 2026-08-07 Revoke Current User Session

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `POST /v1/me/sessions/{sessionId}/revoke` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a revoke action on the `/app/sessions` list that revokes a session through
the generated `POST /v1/me/sessions/{sessionId}/revoke`
(`users.me.sessions.revoke`) contract. The implementation must preserve the
server-owned session boundary, expose only safe feedback, and follow the
existing per-flow pattern under `src/features/users/sessions/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.sessions.revoke` as an
  authenticated `POST /v1/me/sessions/{sessionId}/revoke` with a required
  `sessionId` path parameter, an empty `204` response, and `VALIDATION_FAILED`,
  `UNAUTHORIZED`, `NOT_FOUND`, and `INTERNAL` error codes. The endpoint is
  idempotent.
- `/app/sessions` currently renders a read-only list of sessions
  (`src/features/users/sessions/sessions-page.tsx`), each row with device
  name, status, and `current` flag.
- The session service coordinates access-token expiry and refresh for a single
  Next.js process; the email-verification-resend and profile flows establish
  the one-401-retry authenticated-action pattern.
- The revoke contract response schema is `zod.void()`, so the adapter uses the
  existing empty-response boundary (`readEmptyApiResult`).

## Decisions And Invariants

- Keep revoke as an authenticated Server Action inside the existing
  `/app/sessions` page; do not add a new route.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `NOT_FOUND`/`404` and `VALIDATION_FAILED`/`400`/`422` as safe frontend
  states. Backend title, detail, and raw response text never become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- Keep the UI a small Server Action form per row with `useActionState`; do not
  add a client query cache, timer, or global state. The server remains
  authoritative.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.
- The current session row is not revocable from the UI; the action stays
  idempotent if invoked directly.

## Non-Goals

- Backend changes, session list pagination, password change, OIDC,
  profile-image, push-token, account-deletion, or product onboarding
  workflows.
- Client-side optimistic revocation, polling, or cross-row state beyond the
  action's own pending/feedback state.
- Changes to the read-only sessions list rendering or its visual baselines
  beyond the revoke affordance.

## Acceptance Scenarios

1. Given an authenticated user with a non-current session, when `/app/sessions`
   renders, then each non-current session row shows an accessible revoke
   action.
2. Given a valid server session and a fixture `204`, when revoke is submitted,
   then the browser remains on `/app/sessions` and shows safe success copy.
3. Given the backend returns `NOT_FOUND` or `VALIDATION_FAILED`, when revoke is
   submitted, then the browser shows safe feedback without backend details.
4. Given the first revoke request returns `401` and a forced refresh succeeds,
   when the action runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, session id, method, bearer header, `no-store` policy,
   timeout, empty response, and request-ID boundary match the generated
   contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new revoke, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent revoke. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users sessions revoke adapter and failure mapper;
- authenticated revoke Server Action, state, and per-row form;
- `/app/sessions` page integration with the revoke affordance;
- contract-faithful API fixture and Playwright revoke coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| Generated request/204        | Users sessions revoke API transport test                   |
| Authentication and one retry | Revoke Server Action tests with session-service fixtures   |
| Safe failure mapping         | Revoke failure-mapper tests and browser not-found scenario |
| Revoke UI behavior           | Playwright revoke success and not-found flows              |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions  |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                    |

## Checklist

- [x] Add the generated-contract revoke adapter and empty-response transport
      test.
- [x] Add safe failure mapping, authenticated Server Action, state, and
      per-row form.
- [x] Add the revoke affordance to the `/app/sessions` page without exposing
      credentials.
- [x] Extend the isolated fixture with authenticated revoke success and
      not-found behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The revoke action becomes available with the frontend deployment and depends
on the backend `users.me.sessions.revoke` endpoint already being configured.
Roll back by reverting the form, action, adapter, mapper, fixture, tests, and
page integration together; the existing read-only sessions list remains
usable.

## Decision And Deviation Log

- 2026-08-07: Choose `POST /v1/me/sessions/{sessionId}/revoke` as the next
  slice because it completes the sessions surface (list then revoke) and is
  the smallest remaining authenticated account mutation on the contract.
- 2026-08-07: Keep the action inside the existing `/app/sessions` page; no new
  route or account-settings surface is inferred.
- 2026-08-07: The current session row has no revoke affordance; the endpoint is
  idempotent and the action remains safe if invoked directly.

## Verification

- Focused users tests passed: 39 Vitest tests across the revoke adapter
  transport (path interpolation, bearer header, empty 204), the revoke Server
  Action (redirect, missing-session-id rejection, one-401-retry, second-401
  invalidation, not-found/validation/unavailable mapping), the failure mapper,
  and the existing profile/sessions-list flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed.
- Full unit suite: 151 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 48 Chromium tests, including revoke
  success with safe feedback, the not-found browser scenario, the current
  session having no revoke affordance, accessibility (labels, focus,
  live-region, axe), and the refreshed sessions visual baseline.
- The regenerated `sessions.png` baseline was visually inspected before
  recording; it shows the current active iPhone without a revoke button and
  the MacBook/unknown-device rows with right-aligned revoke buttons.

## Follow-Up Debt

- None yet.
