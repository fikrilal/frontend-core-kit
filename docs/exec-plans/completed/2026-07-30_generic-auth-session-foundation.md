# 2026-07-30 Generic Auth And Session Foundation

## Status

Completed.

## Objective

Replace stale copied-product assumptions with a generic Lamara SaaS baseline,
then prove the existing password-login API through a production-shaped
server-side session for an eventual Docker deployment.

The proof surface is intentionally narrow:

- `/` states only that Lamara is under development;
- `/login` accepts email and password;
- `/app` proves authenticated access through `/v1/me`;
- logout clears the local session and attempts backend revocation.

No product workflow, dashboard, report, download, registration, password reset,
OIDC, or reusable core-kit extraction belongs to this plan.

## Recorded Decisions

- The product is a SaaS product under development. Detailed product
  positioning and workflows are not finalized.
- Password login is the first authentication mechanism.
- The frontend will be deployed as exactly one Next.js instance in Docker.
- Sessions live in that process. Restarting or redeploying it signs all users
  out; this is accepted to avoid an external session service.
- The browser stores only an opaque session identifier in an `HttpOnly`,
  `SameSite=Lax`, `Path=/` cookie that is secure in production.
- API access and refresh tokens remain in server memory only.
- The frontend session absolute TTL is configured explicitly and must not
  exceed the deployed backend refresh-token TTL.
- No additional idle expiry is introduced initially.
- Unknown refresh outcomes invalidate the frontend session. The old rotating
  refresh token is never retried.

## Risk Class

`high`

This plan handles credentials, cookies, refresh coordination, and
user-visible authentication. Full failure-path evidence and browser inspection
are required.

## Acceptance Criteria

- [x] No AI tracker, desktop utility, download, token-usage, or invented product
      claims remain in active code, tests, or current documentation.
- [x] Normal JSON endpoints validate their complete generated response
      envelopes.
- [x] Empty `204` responses are handled without JSON parsing.
- [x] Process memory stores versioned server sessions with bounded TTL.
- [x] Login rotates the opaque web session ID and stores both API tokens only
      server-side.
- [x] `/app` requires a valid session and loads `/v1/me` with `no-store`.
- [x] Eligible authenticated reads refresh and retry at most once.
- [x] Concurrent refresh calls coordinate within the single process and
      replace both rotated tokens atomically.
- [x] `403` never refreshes; unknown refresh outcomes invalidate the session.
- [x] Logout clears the cookie and memory record even if backend logout fails.
- [x] Server Actions validate their own input/session boundary and return only
      safe UI state.
- [x] No credential appears in browser storage, HTML, rendered React payloads,
      URLs, normal errors, logs, or client bundles.
- [x] Unit, build, harness, and browser gates pass after removing the external
      session service.

## Checklist

### Truthful baseline

- [x] Replace stale public copy, metadata, social images, tests, and product
      documentation with generic SaaS language.
- [x] Remove stale download/report/source-route assumptions.
- [x] Reconcile queued plans so they do not invent product decisions.

### API boundary

- [x] Validate generated response envelopes rather than data alone.
- [x] Add explicit empty-response normalization for logout.
- [x] Add typed refresh, logout, and `/v1/me` endpoint adapters.
- [x] Preserve request IDs, timeout/cancellation classification, and secret
      redaction.

### Session core

- [x] Add validated session configuration.
- [x] Define the minimal session model and store operations.
- [x] Implement process-memory persistence, atomic token replacement, locking,
      and bounded waits.
- [x] Implement cookie establish/read/clear operations in legal Next.js
      contexts.
- [x] Implement authenticated read composition with one refresh-and-retry
      cycle.

### Generic proof routes

- [x] Add a minimal password-login Server Action and form.
- [x] Add a protected `/app` Server Component showing only generic session
      proof and minimum current-user identity.
- [x] Add logout.
- [x] Keep routes thin and feature behavior private.

### Evidence

- [x] Add deterministic unit tests.
- [x] Run `pnpm verify`.
- [x] Run `pnpm verify:runtime`.
- [x] Inspect browser cookies/storage and rendered output for token leakage.
- [x] Run `pnpm install --frozen-lockfile` and `git diff --check`.
- [x] Update current-state documentation.

## Runtime Evidence

- Node `v24.18.0`
- `pnpm install --frozen-lockfile`: passed
- `pnpm verify`: passed; 60 Vitest tests, 6 contract-tool tests, production
  build, architecture harness, and public-page harness
- `pnpm verify:runtime`: passed; 6 Chromium tests without Docker
- Browser evidence verified an opaque 43-character `HttpOnly`,
  `SameSite=Lax` cookie and no fixture API token in rendered HTML,
  `localStorage`, or `sessionStorage`
- `git diff --check`: passed

## Rollback

The new routes remain isolated from undecided product workflows. Rollback
removes the generic auth routes and session modules and restores the previous
unexposed password-login adapter. Backend users and backend sessions remain
backend-owned.
