# 2026-07-28 First Authenticated Feature

## Objective

Prove the contract, API client, and session boundaries through one real
authenticated product workflow: sign in, load `/v1/me`, perform one explicitly
idempotent profile mutation, and sign out.

This plan owns the first authenticated routes and user-facing behavior. It must
not begin until the product flow and visual references are selected.

## Decision Gates

- [ ] Select the first sign-in mechanism. Recommended default: Google OIDC
      because the backend is OIDC-primary; password login requires an explicit
      product decision.
- [ ] Select the authenticated route and navigation model. Do not assume
      `/dashboard`, `/account`, or a full app shell without product approval.
- [ ] Define the minimum `/v1/me` fields displayed by the first surface.
- [ ] Select the idempotent write. Recommended default: a narrow supported field
      in `PATCH /v1/me`, using the backend's documented idempotency behavior.
- [ ] Inspect and select matching UI patterns from the repositories pinned in
      `AGENTS.md`.
- [ ] Define unauthenticated, suspended, unverified-email, expired-session, and
      backend-unavailable UX.

## Dependencies

- API contract foundation is completed.
- Typed server API client is completed.
- Server session core is completed with production-like evidence.
- The selected backend auth and `/v1/me` contracts match the committed frontend
  snapshot.

## Acceptance Criteria

- [ ] Sign-in credentials/assertions are handled only by server-owned
      integration points.
- [ ] Successful sign-in rotates the opaque web session ID and stores API
      credentials only in the server session store.
- [ ] A feature-owned server adapter loads `/v1/me` using generated endpoint
      types and its generated runtime schema.
- [ ] Feature loaders translate `ApiResult` into explicit product states without
      leaking HTTP-client details into UI components.
- [ ] One real mutation generates its idempotency key at the logical Server
      Action boundary and reuses it for any permitted retry.
- [ ] Authenticated data uses `no-store`.
- [ ] Logout clears local state even if backend logout is unavailable.
- [ ] No access or refresh token appears in HTML, React Server Component
      payloads, browser storage, JS-readable cookies, URLs, logs, or client
      bundles.
- [ ] `401` can refresh and retry an allowed operation once; `403` never
      refreshes.
- [ ] Only routes implemented by this plan are added to navigation and browser
      tests.
- [ ] Unit, integration, browser, and human review evidence cover the complete
      workflow.

## Risk Class

`high`

This is the first user-visible authentication and credential workflow. It
changes routes, cookies, server actions, persistence, error handling, and
security boundaries.

## Impact Areas

- `src/app/` selected auth and authenticated routes
- `src/features/auth/`
- `src/features/account/` or the approved owning feature
- `src/server/session/`
- generated runtime schemas and feature-owned server adapters
- layout/navigation only where the approved routes require it
- browser tests and runtime evidence
- product, architecture, API, security, and testing documentation

## Checklist

### Product and route foundation

- [ ] Record the approved sign-in mechanism, route names, redirect policy, and
      first authenticated page.
- [ ] Update `docs/product/initial-pages.md` before adding routes or tests.
- [ ] Port the approved visual patterns from the pinned local references.
- [ ] Keep route files composition-only and expose features through `index.ts`.

### Authentication workflow

- [ ] Implement the selected sign-in Server Action or origin-validated Route
      Handler.
- [ ] Allowlist internal return destinations; reject external redirect targets.
- [ ] Establish and rotate the opaque session after backend authentication.
- [ ] Map backend problems into explicit form/product states without rendering
      raw backend detail.
- [ ] Implement logout with local cleanup as the guaranteed outcome.

### First protected read and write

- [ ] Add a feature-owned `getMe` adapter using generated contract types and
      the generated `/v1/me` response schema.
- [ ] Add a loader that owns redirect/error/product-state policy.
- [ ] Render the minimum approved account information as a Server Component.
- [ ] Add one approved `PATCH /v1/me` operation.
- [ ] Generate a stable idempotency key once per logical action and preserve it
      across the one allowed authenticated retry.
- [ ] Handle validation, conflict, rate-limit, suspended, and unknown-outcome
      states explicitly.

### Tests and evidence

- [ ] Unit-test generated-schema integration, result mapping, redirect
      allowlist, and idempotency-key ownership.
- [ ] Integration-test login/session establishment, `/v1/me`, refresh-and-retry,
      mutation retry, logout, and backend failure mapping.
- [ ] Browser-test the real routes and remove assertions for anything still
      deferred.
- [ ] Inspect cookies, local/session storage, HTML, RSC payloads, URLs, logs, and
      production client bundles for token leakage.
- [ ] Run `pnpm verify` and `pnpm verify:runtime`.
- [ ] Record human review for authentication, accessibility, and UI fidelity.
- [ ] Move this plan to `completed/`.

## Decisions

- Endpoint adapters remain feature-owned; the shared API client cannot become an
  auth/account god-module.
- Runtime validation uses the generated endpoint schema; feature code selects
  the fields it consumes after validation.
- Server Components own the initial authenticated read unless the approved UX
  proves a client-side refresh requirement.
- No global client state or query library is introduced by default.
- Idempotency keys belong to logical operations, not individual HTTP attempts.

## Verification

- Command: not run yet
- Outcome: pending

## Runtime Evidence

- Required: real browser sign-in, protected read, idempotent mutation, logout,
  forced refresh, failure states, cookie inspection, and client-bundle
  inspection.
- Pending.

## Rollout and Rollback

- Keep new routes unlinked until the end-to-end workflow passes.
- Roll out with the server session prefix introduced by the previous plan.
- Rollback removes the routes and feature entry points, then invalidates the
  versioned frontend sessions. Backend user accounts and backend sessions remain
  backend-owned.

## Follow-Up Debt

- Do not schedule a reusable web-core extraction until a second web product
  implements the same boundaries and a comparison identifies genuine shared
  code.
