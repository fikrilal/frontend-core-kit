# 2026-08-07 Change Current User Password

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `POST /v1/auth/password/change` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/auth/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a change-password surface on a new authenticated `/app/password` page that
updates the current user's password through the generated
`POST /v1/auth/password/change` (`auth.password.change`) contract. The
implementation must preserve the server-owned session boundary, expose only
safe feedback, and follow the existing per-flow pattern under
`src/features/auth/password-change/`.

## Current Evidence

- The committed OpenAPI snapshot defines `auth.password.change` as an
  authenticated `POST /v1/auth/password/change` accepting
  `ChangePasswordRequestDto` (`{ currentPassword, newPassword }`, new password
  `min 10`), returning an empty `204`, with `VALIDATION_FAILED`, `UNAUTHORIZED`,
  `IDEMPOTENCY_IN_PROGRESS`, `CONFLICT`, `AUTH_PASSWORD_NOT_SET`,
  `AUTH_CURRENT_PASSWORD_INVALID`, and `INTERNAL` error codes. An optional
  `Idempotency-Key` header is accepted.
- The backend revokes other sessions (and their refresh tokens) on change but
  keeps the current session active.
- The generated runtime exposes `ChangePasswordRequestDto`,
  `changePasswordRequestDtoNewPasswordMin`, and `AuthPasswordChangeResponse`
  (`zod.void()`), so the adapter uses the existing empty-response boundary.
- Existing flows keep a per-flow file set colocated under `src/features/auth/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep change-password as an authenticated flow under
  `src/features/auth/password-change/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `AUTH_CURRENT_PASSWORD_INVALID`/HTTP `400`/`422`, `CONFLICT`/`409`, and
  `AUTH_PASSWORD_NOT_SET` as safe frontend states. Backend title, detail, and
  raw response text never become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- Keep the UI a small Server Action form with `useActionState`; do not add a
  client query cache, timer, or global state. The server remains authoritative.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, session revocation, OIDC, profile-image, push-token,
  account-deletion, or product onboarding workflows.
- Client-side password strength meters, confirmation via email, or automatic
  re-login flows.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user, when `/app/password` renders, then it shows a
   change-password form with current-password and new-password fields.
2. Given a valid server session and a fixture `204`, when the form is
   submitted, then the browser remains on `/app/password` and shows safe
   success copy.
3. Given the backend returns `AUTH_CURRENT_PASSWORD_INVALID`,
   `AUTH_PASSWORD_NOT_SET`, or `CONFLICT`, when the form is submitted, then the
   browser shows safe feedback without backend details.
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
   full, and runtime verification run, then the new change, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent write. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract auth password-change adapter and failure mapper;
- authenticated password-change Server Action, state, and form;
- `/app/password` route and feature index;
- contract-faithful API fixture and Playwright change-password coverage;
- auth feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| Generated request/204        | Auth password-change API transport test                           |
| Authentication and one retry | Server Action tests with session-service fixtures                 |
| Safe failure mapping         | Password-change failure-mapper tests and browser invalid scenario |
| Password-change UI behavior  | Playwright change success and invalid-current flows               |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions         |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                           |

## Checklist

- [x] Add the generated-contract password-change adapter and empty-response
      transport test.
- [x] Add safe failure mapping, authenticated Server Action, state, and form.
- [x] Add the `/app/password` route and feature index without exposing
      credentials.
- [x] Extend the isolated fixture with authenticated change-password success
      and invalid-current behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The change-password surface becomes available with the frontend deployment and
depends on the backend `auth.password.change` endpoint already being
configured. Roll back by reverting the form, action, adapter, mapper, fixture,
tests, route, and documentation together; the existing authenticated
foundation remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `POST /v1/auth/password/change` as the next slice because
  it completes the password lifecycle (register, verify, login, change, reset)
  and is the last auth-domain endpoint on the contract.
- 2026-08-07: Host the surface at `/app/password`; no account-settings or
  product workflow is inferred.
- 2026-08-07: The current session stays active after a change (backend
  behavior); no special session handling is added.
- 2026-08-07: Review fixes applied after independent review — `minLength` is
  now optional and only applies to the new-password fields (not the current
  password); the error message drops `role="alert"` in favor of the
  `aria-live="polite"` convention; `aria-describedby` was removed from the
  submit button and inputs only reference the error (never the success banner);
  the mismatch copy now says "matching new password".

## Verification

- Focused auth tests passed: 98 Vitest tests across the password-change adapter
  transport (path, bearer header, body, empty 204), the password-change Server
  Action (redirect, mismatch rejection, one-401-retry, second-401 invalidation,
  invalid-current/password-not-set/conflict/unavailable mapping), the failure
  mapper, and the existing auth flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed; `/app/password` is registered as a dynamic
  server-rendered route.
- Full unit suite: 168 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 54 Chromium tests, including change-password
  success, invalid-current feedback, mismatched-confirmation rejection, route
  protection, accessibility (labels, focus, aria-describedby, axe), and the two
  new change-password visual baselines.
- The new `change-password.png` and `change-password-error.png` baselines were
  visually inspected before recording; they show the empty form and the red
  "The current password is incorrect." error state.

## Follow-Up Debt

- None yet.
