# 2026-08-07 Request Account Deletion

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `POST /v1/me/account-deletion/request` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add an account-deletion request action on a new authenticated `/app/account-deletion` page that schedules deletion through the generated
`POST /v1/me/account-deletion/request` (`users.me.accountDeletion.request`)
contract. The implementation must preserve the server-owned session boundary,
expose only safe feedback, and follow the existing per-flow pattern under
`src/features/users/account-deletion/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.accountDeletion.request` as
  an authenticated `POST /v1/me/account-deletion/request` with no request body,
  an empty `204` response, and `UNAUTHORIZED`, `IDEMPOTENCY_IN_PROGRESS`,
  `CONFLICT`, `USERS_CANNOT_DELETE_LAST_ADMIN`, and `INTERNAL` error codes. An
  optional `Idempotency-Key` header is accepted.
- The backend schedules deletion 30 days in the future; the account remains
  usable during the grace period and the request can be canceled.
- `GET /v1/me` returns `AccountDeletionDto` (`requestedAt`, `scheduledFor`) or
  `null` in `MeDto.accountDeletion`, so the UI can reflect a pending deletion
  request.
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`; the session service
  coordinates access-token expiry and refresh for a single Next.js process.

## Decisions And Invariants

- Keep account-deletion request as an authenticated Server Action under
  `src/features/users/account-deletion/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `CONFLICT`/`409` and `USERS_CANNOT_DELETE_LAST_ADMIN` as safe frontend
  states. Backend title, detail, and raw response text never become UI copy.
- Accept only the generated empty `204` response. The adapter explicitly uses
  `no-store` and the existing ten-second timeout.
- Keep the UI a small Server Action form with `useActionState`; do not add a
  client query cache, timer, or global state. The server remains authoritative.
- The page reads the current user (`loadAuthenticatedUser`) to reflect whether
  a deletion request is already pending and to protect the route.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.

## Non-Goals

- Backend changes, account-deletion cancel (separate plan), profile-image,
  push-token, OIDC, password change, or product onboarding workflows.
- Client-side countdowns to the scheduled deletion, optimistic scheduling, or
  polling.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user with no pending deletion, when `/app/account-deletion`
   renders, then it shows the account-deletion request surface with safe copy.
2. Given a valid server session and a fixture `204`, when the request action is
   submitted, then the browser remains on `/app/account-deletion` and shows
   safe success copy.
3. Given the backend returns `CONFLICT` or `USERS_CANNOT_DELETE_LAST_ADMIN`,
   when the request action is submitted, then the browser shows safe feedback
   without backend details.
4. Given the first request returns `401` and a forced refresh succeeds, when
   the action runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the action runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, method, bearer header, `no-store` policy, timeout, empty
   response, and request-ID boundary match the generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new request, session, and
   privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account mutation and its
action is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate an idempotent write. Authority is limited to repository-local
implementation and isolated fixture/runtime verification. Human review remains
required for auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users account-deletion request adapter and failure mapper;
- authenticated request Server Action, state, and form;
- `/app/account-deletion` route and feature index;
- contract-faithful API fixture and Playwright request coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                   |
| ---------------------------- | ---------------------------------------------------------- |
| Generated request/204        | Users account-deletion request API transport test          |
| Authentication and one retry | Request Server Action tests with session-service fixtures  |
| Safe failure mapping         | Request failure-mapper tests and browser conflict scenario |
| Request UI behavior          | Playwright request success and conflict flows              |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions  |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                    |

## Checklist

- [x] Add the generated-contract account-deletion request adapter and
      empty-response transport test.
- [x] Add safe failure mapping, authenticated Server Action, state, and form.
- [x] Add the `/app/account-deletion` route and feature index without exposing
      credentials.
- [x] Extend the isolated fixture with authenticated request success and
      conflict behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The account-deletion request surface becomes available with the frontend
deployment and depends on the backend `users.me.accountDeletion.request`
endpoint already being configured. Roll back by reverting the form, action,
adapter, mapper, fixture, tests, route, and documentation together; the
existing authenticated foundation remains usable.

## Decision And Deviation Log

- 2026-08-07: Choose `POST /v1/me/account-deletion/request` as the next slice
  because it completes the account-lifecycle surface (profile, password,
  sessions, deletion) and is the last small idempotent account mutation on the
  contract.
- 2026-08-07: Host the surface at `/app/account-deletion`; cancel is a separate
  plan and slice.
- 2026-08-07: The 30-day grace period is backend-enforced; the frontend only
  schedules the request and shows the pending state from `GET /v1/me`.
- 2026-08-07: Review fixes applied after independent review — the action now
  calls `revalidatePath("/app/account-deletion")` on success so the Router
  Cache reflects the pending deletion state on return visits; the static
  "already in progress" banner drops `aria-live="polite"`/`role="status"`
  (it is initial SSR content, not a dynamic live region).

## Verification

- Focused users tests passed: 51 Vitest tests across the account-deletion
  request adapter transport (path, bearer header, empty 204), the request
  Server Action (redirect, one-401-retry, second-401 invalidation,
  last-admin/conflict/unavailable mapping), the failure mapper, and the
  existing users flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed; `/app/account-deletion` is registered as a dynamic
  server-rendered route.
- Full unit suite: 180 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 59 Chromium tests, including account-deletion
  request success, the already-scheduled state (via a fixture user with
  `accountDeletion` set), route protection, accessibility (landmarks, axe), and
  the new account-deletion visual baseline.
- The new `account-deletion-request.png` baseline was visually inspected before
  recording; it shows the "Delete your account" card with the request button.

## Follow-Up Debt

- None yet.
