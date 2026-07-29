# 2026-07-28 Server Session Core

## Objective

Add production-safe server-side session ownership for Lamara API credentials,
including opaque browser cookies, Redis-backed session storage, distributed
refresh coordination, logout cleanup, and an authenticated API facade.

This phase provides infrastructure only. It does not add login/register pages,
account UI, or speculative authenticated routes.

## Decision Gates

Do not move this plan to `active/` until all gates are recorded:

- [ ] Select the frontend deployment topology and region.
- [ ] Select the managed Redis provider/connection model and dedicated Lamara
      Web key prefix.
- [ ] Define secret rotation and least-privilege operational ownership.
- [ ] Confirm production backend access- and refresh-token TTL configuration.
- [ ] Set frontend absolute session expiry no longer than backend refresh
      expiry. The backend core-kit default is currently 30 days, but deployment
      configuration—not the default—is authoritative.
- [ ] Decide whether an idle expiry is required. Recommended default: no
      additional idle expiry in the first version.
- [ ] Decide whether Redis-held tokens require application-level encryption for
      the selected trust model.

## Dependencies

- API contract foundation is completed.
- Typed server API client is completed.
- Backend refresh semantics still match the accepted proposal: refresh tokens
  rotate, reuse may revoke the session, and unknown outcomes require
  re-authentication.
- A production-like Redis instance is available for integration evidence.

## Acceptance Criteria

- [ ] Browser cookies contain only an opaque random session identifier.
- [ ] Cookies are `HttpOnly`, `SameSite=Lax`, `Path=/`, secure in production,
      bounded by the server session expiry, and rotated on privilege change.
- [ ] Access and refresh tokens never enter browser-readable storage, URLs,
      rendered props, logs, or client bundles.
- [ ] Session records have explicit version, expiry, and deletion semantics.
- [ ] Redis writes atomically persist both rotated tokens and the session
      version.
- [ ] Distributed locking ensures two application instances do not refresh the
      same token concurrently.
- [ ] Lock waiters re-read the session and use the winning refresh result.
- [ ] Terminal refresh failures delete the session.
- [ ] Definite transient `429`/`5xx` responses retain the session.
- [ ] Timeout/network refresh outcomes mark the session unusable and never
      retry the old refresh token.
- [ ] Authenticated reads retry at most once after successful refresh.
- [ ] `403` never triggers refresh.
- [ ] Writes are not retried by the authenticated facade unless a later feature
      supplies explicit idempotency policy and a stable key.
- [ ] Logout clears the local session even if remote logout fails.
- [ ] Unit tests and real-Redis integration tests prove concurrency and cleanup
      behavior.

## Risk Class

`high`

This phase handles long-lived credentials and cross-instance concurrency.
Incorrect refresh behavior can revoke valid user sessions or expose secrets.
Human review and production-like Redis evidence are required.

## Impact Areas

- `.env.example`
- `src/server/config/`
- `src/server/session/`
- `src/server/api/`
- cookie helpers and Server Action/Route Handler integration points
- Redis dependency and configuration
- architecture harness
- security, API, and testing documentation

## Checklist

### Session model and storage

- [ ] Define a minimal session record containing user ID, access token, refresh
      token, access expiry, absolute expiry, version, and required rotation
      metadata.
- [ ] Store only an opaque random session ID in the browser; hash lookup keys if
      required by the selected Redis model.
- [ ] Define a `SessionStore` interface around required atomic operations, not
      generic Redis commands.
- [ ] Implement a memory adapter for unit tests only.
- [ ] Implement the production Redis adapter with bounded command timeouts,
      namespaced keys, expiry, atomic replacement, and deletion.
- [ ] Implement cookie read/write/clear helpers restricted to legal Next.js
      mutation contexts.

### Refresh and authenticated facade

- [ ] Decode token expiry only for scheduling; never treat unverified claims as
      authorization evidence.
- [ ] Implement refresh locking, post-lock re-read, one refresh call, atomic
      token replacement, and lock release.
- [ ] Define terminal, definite-transient, and unknown-outcome policies exactly
      as the proposal specifies.
- [ ] Prevent use of a session marked unusable after an unknown refresh outcome.
- [ ] Implement authenticated `GET`/`HEAD` composition with at most one
      refresh-and-retry cycle.
- [ ] Preserve trace IDs through original, refresh, and retry attempts.
- [ ] Keep mutation retry disabled at this layer unless the later operation
      supplies stable idempotency context.
- [ ] Implement local-first logout cleanup with best-effort backend revocation.

### Security and evidence

- [ ] Import `server-only` from every credential-capable module.
- [ ] Add explicit metadata-only logging/redaction tests.
- [ ] Test cookie flags, rotation, expiry, clear behavior, and opaque contents.
- [ ] Test all refresh outcome classes and confirm no refresh on `403`.
- [ ] Test two concurrent requests in one process cause one refresh.
- [ ] Test two independent store/service instances against real Redis cause one
      refresh and both observe the new token pair.
- [ ] Test atomic persistence failure leaves no mixed old/new token pair.
- [ ] Confirm client bundle output contains no credential-bearing module.
- [ ] Update architecture, API integration, security, and testing documentation.
- [ ] Run `pnpm verify`, relevant browser tests, and Redis integration tests.
- [ ] Record human security review.
- [ ] Move this plan to `completed/` only after runtime evidence is attached.

## Decisions

- Production uses server-side sessions, not bearer tokens or refresh tokens in
  browser storage.
- Redis is the production coordination/store baseline.
- Refresh is an explicit session service operation, not a transport interceptor.
- Unknown refresh outcome invalidates the frontend session conservatively.
- A development-only encrypted-cookie token store is excluded from this plan;
  one storage model is safer until a real local need proves otherwise.

## Verification

- Command: not run yet
- Outcome: pending

## Runtime Evidence

- Required: production-like Redis concurrency, atomic token replacement, cookie
  inspection, and client-bundle secret-boundary evidence.
- Pending.

## Rollout and Rollback

- Introduce new session keys under a versioned prefix with bounded TTL.
- No public route consumes sessions until the next plan, so rollout can be dark.
- Rollback removes the unused integration and deletes its versioned Redis keys.
- Never reuse or reinterpret session records across incompatible versions.

## Follow-Up Debt

- The first authenticated feature must prove real login, `/v1/me`, logout, and
  browser trust boundaries.
