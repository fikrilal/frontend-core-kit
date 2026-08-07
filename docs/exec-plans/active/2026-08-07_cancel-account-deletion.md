# 2026-08-07 Cancel Account Deletion

**Plan version:** 2
**Status:** active
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `POST /v1/me/account-deletion/cancel` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add an account-deletion cancel action on the authenticated
`/app/account-deletion` surface that cancels a scheduled deletion through the
generated `POST /v1/me/account-deletion/cancel`
(`users.me.accountDeletion.cancel`) contract. The implementation must preserve
the server-owned session boundary, expose only safe feedback, and follow the
existing per-flow pattern under `src/features/users/account-deletion/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.accountDeletion.cancel` as
  an authenticated `POST /v1/me/account-deletion/cancel` with no request body,
  an empty `204` response, and `UNAUTHORIZED`, `IDEMPOTENCY_IN_PROGRESS`, and
  `INTERNAL` error codes. An optional `Idempotency-Key` header is accepted.
- The backend cancels a previously scheduled account deletion request; the
  endpoint is idempotent.
- `GET /v1/me` returns `AccountDeletionDto` (`requestedAt`, `scheduledFor`) or
  `null` in `MeDto.accountDeletion`, so the UI can reflect whether a deletion
  request is pending and offer cancel only when one exists.
- The account-deletion request slice (separate plan) adds the
  `/app/account-deletion` surface and the request action; cancel extends the
  same surface.
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep account-deletion cancel as an authenticated Server Action under
  `src/features/users/account-deletion/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat unexpected failures as a safe `unavailable` state. Backend title,
  detail, and raw response text never become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- Keep the UI a small Server Action form with `useActionState`; do not add a
  client query cache, timer, or global state. The server remains authoritative.
- The page reads the current user (`loadAuthenticatedUser`) to show the cancel
  affordance only when a deletion request is pending and to protect the route.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, account-deletion request (separate plan), profile-image,
  push-token, OIDC, password change, or product onboarding workflows.
- Client-side optimistic cancellation, countdowns, or polling.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user with a pending deletion, when
   `/app/account-deletion` renders, then it shows the cancel affordance.
2. Given a valid server session and a fixture `204`, when the cancel action is
   submitted, then the browser remains on `/app/account-deletion` and shows
   safe success copy.
3. Given the first request returns `401` and a forced refresh succeeds, when
   the action runs, then exactly one refreshed access token is used for a
   retry.
4. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
5. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, bearer header, `no-store` policy, timeout, empty
   response, and request-ID boundary match the generated contract.
6. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new cancel, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent cancel. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users account-deletion cancel adapter and failure mapper;
- authenticated cancel Server Action, state, and form;
- `/app/account-deletion` page integration with the cancel affordance;
- contract-faithful API fixture and Playwright cancel coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                  |
| ---------------------------- | --------------------------------------------------------- |
| Generated request/204        | Users account-deletion cancel API transport test          |
| Authentication and one retry | Cancel Server Action tests with session-service fixtures  |
| Safe failure mapping         | Cancel failure-mapper tests                               |
| Cancel UI behavior           | Playwright cancel success flow                            |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                   |

## Checklist

- [ ] Add the generated-contract account-deletion cancel adapter and
      empty-response transport test.
- [ ] Add safe failure mapping, authenticated Server Action, state, and form.
- [ ] Add the cancel affordance to the `/app/account-deletion` page without
      exposing credentials.
- [ ] Extend the isolated fixture with authenticated cancel behavior.
- [ ] Add unit, accessibility, browser, and visual coverage.
- [ ] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [ ] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The account-deletion cancel surface becomes available with the frontend
deployment and depends on the backend `users.me.accountDeletion.cancel`
endpoint already being configured. Roll back by reverting the form, action,
adapter, mapper, fixture, tests, and page integration together; the existing
account-deletion request surface remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `POST /v1/me/account-deletion/cancel` as the companion
  slice to the request endpoint, completing the deletion lifecycle on the same
  `/app/account-deletion` surface.
- 2026-08-07: The cancel affordance renders only when `GET /v1/me` reports a
  pending deletion; the endpoint remains idempotent if invoked directly.
- 2026-08-07: No new route; cancel extends the request slice's surface.

## Verification

- Not run yet.

## Runtime Evidence

- Not run yet.

## Follow-Up Debt

- None yet.
