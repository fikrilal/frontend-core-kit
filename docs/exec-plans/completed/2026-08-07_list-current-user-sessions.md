# 2026-08-07 List Current User Sessions

**Plan version:** 2
**Status:** completed
**Owner:** primary agent with independent reviewer for auth behavior
**Risk:** high
**Authority:** implement and verify the authenticated `GET /v1/me/sessions` slice against the committed generated contract; do not change backend behavior, alter session storage, commit, push, deploy, merge, or introduce product workflows
**Allowed paths:** src/features/users/, src/app/(authenticated)/, scripts/testing/, tests/e2e/, docs/exec-plans/, docs/engineering/, docs/product/initial-pages.md, docs/core/architecture.md
**Allowed actions:** edit, verify
**Maximum risk:** high
**Repair limit:** 2

## Objective

Add a sessions list on a new authenticated `/app/sessions` page that displays
the current user's sessions through the generated
`GET /v1/me/sessions` (`users.me.sessions.list`) contract. The implementation
must preserve the server-owned session boundary, expose only safe feedback,
and follow the existing per-flow pattern under `src/features/users/sessions/`.

## Current Evidence

- The committed OpenAPI snapshot defines `users.me.sessions.list` as an
  authenticated `GET /v1/me/sessions` accepting optional `limit` (1–100,
  default 25), `cursor` (opaque), and `sort` (comma-separated; default
  `-createdAt`) query parameters and returning the `MeSessionsListEnvelopeDto`
  with `data: MeSessionDto[]` and `meta: { limit, hasMore, nextCursor? }`.
- `MeSessionDto` includes `id`, `deviceId?`, `deviceName?`, `ip?`, `userAgent?`,
  `lastSeenAt`, `createdAt`, `expiresAt`, `revokedAt?`, `current`, and `status`
  (`active` | `revoked` | `expired`).
- The `/app` proof page and `/app/profile` page load authenticated data through
  `loadAuthenticatedUser()`; the session service coordinates access-token
  expiry and refresh for a single Next.js process.
- Existing flows keep a per-flow file set colocated under `src/features/users/`
  and export pages only through the feature `index.ts`.

## Decisions And Invariants

- Keep the sessions list as an authenticated read-only flow under
  `src/features/users/sessions/`, exported via the feature `index.ts`.
- Obtain the access token from the server-owned session. Never pass access or
  refresh tokens through form fields, client props, cookies, URLs, storage, or
  rendered error messages.
- Retry exactly once after a `401` by requesting a forced session refresh. A
  second `401` invalidates the local session and redirects to `/login`.
- Treat `VALIDATION_FAILED`/HTTP `400`/`422` as a safe frontend state. Backend
  title, detail, and raw response text never become UI copy.
- Accept only the generated `MeSessionsListEnvelopeDto` response; use `no-store`,
  the existing ten-second timeout, and the request-ID boundary.
- Keep the page a Server Component that reads sessions server-side; do not add
  client-side refresh, timers, or global state. The server remains authoritative.
- Do not introduce a generic authenticated-request abstraction until another
  real flow demonstrates the same need.
- The existing `/app` and `/app/profile` surfaces remain untouched; the new
  list lives at `/app/sessions`.

## Non-Goals

- Backend changes, session revocation (`POST /v1/me/sessions/{id}/revoke`),
  password change, OIDC, profile-image, push-token, account-deletion, or
  product onboarding workflows.
- Client-side polling, optimistic updates, or cursor pagination beyond the
  default first page.
- Changes to the `/app` proof page, its evidence, or its visual baselines.

## Acceptance Scenarios

1. Given an authenticated user with sessions, when `/app/sessions` renders,
   then it shows a list of session rows with device name, status, and dates.
2. Given a valid server session and a fixture `MeSessionsListEnvelopeDto`
   response, when the page loads, then it renders the sessions without
   exposing tokens.
3. Given the backend returns `VALIDATION_FAILED` or `401`, when the page loads,
   then it shows safe feedback or redirects to `/login` per the session policy.
4. Given the first request returns `401` and a forced refresh succeeds, when
   the loader runs, then exactly one refreshed access token is used for a
   retry.
5. Given the session is missing, unavailable, or remains unauthorized after one
   retry, when the loader runs, then no credential is exposed and the user is
   redirected to `/login` or receives safe unavailable feedback according to
   the existing session policy.
6. Given the adapter sends the request, when the transport test inspects it,
   then the path, query params, bearer header, `no-store` policy, timeout,
   envelope parsing, and request-ID boundary match the generated contract.
7. Given the slice is complete, when unit, contract, accessibility, browser,
   full, and runtime verification run, then the new sessions, session,
   and privacy behavior is covered.

## Risk And Authority

Risk is high because the endpoint is an authenticated account read and the
loader is directly invokable like a public server endpoint. Incorrect session
handling could leak or misuse credentials; incorrect retry behavior could
duplicate requests. Authority is limited to repository-local implementation
and isolated fixture/runtime verification. Human review remains required for
auth behavior, copy, and production rollout.

## Impact Areas

- generated-contract users sessions adapter and failure mapper;
- authenticated sessions Server Component loader;
- `/app/sessions` route and feature index;
- contract-faithful API fixture and Playwright sessions coverage;
- users feature, testing, product-foundation, architecture, and execution-plan
  documentation.

## Verification Matrix

| Acceptance                   | Evidence                                                  |
| ---------------------------- | --------------------------------------------------------- |
| Generated request/response   | Users sessions API transport test                         |
| Authentication and one retry | Sessions loader tests with session-service fixtures       |
| Safe failure mapping         | Sessions failure-mapper tests and browser 401 scenario    |
| Sessions UI behavior         | Playwright sessions load and status rendering flows       |
| Accessibility                | Playwright labels, focus, live-region, and axe assertions |
| Repository health            | `pnpm verify` and `pnpm verify:runtime`                   |

## Checklist

- [x] Add the generated-contract `GET /v1/me/sessions` adapter and transport
      test.
- [x] Add safe failure mapping, authenticated Server Component loader, and
      page.
- [x] Add the `/app/sessions` route and feature index without exposing
      credentials.
- [x] Extend the isolated fixture with authenticated sessions-list behavior.
- [x] Add unit, accessibility, browser, and visual coverage.
- [x] Update truthful API, testing, product-foundation, architecture, and
      execution-plan docs.
- [x] Run full and runtime verification and record exact outcomes.

## Rollout And Rollback

The sessions list becomes available with the frontend deployment and depends
on the backend `users.me.sessions.list` endpoint already being configured.
Roll back by reverting the page, loader, adapter, mapper, fixture, tests, route,
and documentation together; the existing authenticated foundation remains
usable.

## Decision And Deviation Log

- 2026-08-07: Choose `GET /v1/me/sessions` as the next users-feature slice
  because it is the smallest self-contained authenticated account read on the
  contract and complements the profile editor.
- 2026-08-07: Host the list at `/app/sessions` as a read-only Server Component;
  revocation is a separate slice.
- 2026-08-07: Render only the first page with the default sort; cursor
  pagination is deferred until a product decision exists.

## Verification

- Focused users tests passed: 25 Vitest tests across the adapter transport,
  the sessions loader (redirect, one-401-retry, second-401 invalidation,
  validation/unavailable mapping), the failure mapper, and the existing profile
  flows.
- Static lanes passed under Node 24: `format:check`, `contracts:check`, `lint`,
  `typecheck`, `harness:check` (knowledge, architecture, maintainability,
  public-pages).
- `pnpm build` passed; `/app/sessions` is registered as a dynamic
  server-rendered route.
- Full unit suite: 137 passed, 1 failed — the single failure is the pre-existing
  `theme-toggle` `React.act` test that also fails on the clean base in this
  environment; unrelated to this change.

## Runtime Evidence

- `pnpm verify:runtime` passed with 46 Chromium tests, including sessions list
  rendering with device names/statuses, sessions route protection,
  accessibility (landmarks, status roles, axe), and the new sessions visual
  baseline.
- The new `sessions.png` baseline was visually inspected before recording; it
  shows two session rows (current active iPhone + revoked MacBook) with
  status pills and formatted last-seen dates.

## Follow-Up Debt

- None yet.
