# 2026-07-28 Server API Transport

## Status

Active after completion of the API contract foundation.

## Objective

Implement a small server-only HTTP boundary that owns Lamara's shared protocol
mechanics: URL resolution, request identity, timeouts, cancellation, cache
policy, success envelopes, problem details, empty responses, and runtime
validation.

The transport must make feature adapters short without becoming a product API
or hiding endpoint policy. It must not add sessions, refresh, automatic retry,
browser API calls, or product routes.

## Dependencies

- The API contract foundation plan is completed.
- The committed OpenAPI snapshot includes `/health`, `/ready`, and the standard
  envelope/problem schemas used by the backend.
- A local backend may be used for runtime health evidence, but normal unit tests
  must use an injected `fetch`.

## Acceptance Criteria

- [ ] Server configuration validates one API base URL in one approved module.
- [ ] Modules capable of network access are server-only.
- [ ] Every request declares an explicit cache policy.
- [ ] The transport supports caller cancellation and an explicit timeout
      without confusing the two failure cases.
- [ ] Request IDs are generated or forwarded and the response request ID is
      preserved as `traceId`.
- [ ] All `2xx` responses are handled, including `204 No Content`.
- [ ] Standard `{ data, meta? }` success responses are unwrapped.
- [ ] Documented raw responses such as `/health` can bypass envelope parsing
      explicitly.
- [ ] Non-2xx JSON problem details, malformed JSON, HTML/text errors, empty
      errors, network failures, timeouts, and invalid successful payloads map to
      a discriminated `ApiResult`.
- [ ] Expected remote failures return results; programmer errors and violated
      internal invariants may throw.
- [ ] Feature-provided Zod schemas validate successful payloads.
- [ ] No automatic retry, refresh, user-facing copy, redirects, or toast
      behavior exists in the transport.
- [ ] Raw `fetch` is allowed only in the transport implementation, scripts, and
      tests.
- [ ] Unit tests cover all stable protocol behavior without a live backend.
- [ ] A real `/health` request through the transport is recorded against a local
      backend before completion.

## Risk Class

`medium`

This becomes a shared failure boundary for every future API feature. Incorrect
timeout, cache, parsing, or redaction behavior would have broad impact, but this
phase does not yet hold credentials.

## Impact Areas

- `.env.example`
- `package.json`
- `pnpm-lock.yaml`
- `src/server/config/`
- `src/server/api/`
- `src/contracts/lamara-api/runtime/`
- `scripts/harness/check-architecture.mjs`
- unit and optional integration tests
- API integration and testing documentation

## Checklist

### Configuration and types

- [ ] Add `server-only` and Zod with exact ownership documented.
- [ ] Add a single validated server config module for the API base URL.
- [ ] Document local configuration in `.env.example` without adding secrets.
- [ ] Define `ApiResult<T>`, `ApiFailure`, `ApiProblem`, response metadata, and
      request option types without invented HTTP status values.
- [ ] Keep feature payload schemas out of the generic transport.

### Protocol implementation

- [ ] Implement safe base URL plus relative path resolution.
- [ ] Encode path/query/body values using generated contract types at call sites.
- [ ] Add `Accept` and conditional JSON `Content-Type` headers.
- [ ] Add request-ID forwarding/generation and response correlation.
- [ ] Combine caller cancellation with a bounded timeout and clean up listeners
      and timers.
- [ ] Require callers to choose `no-store` or an explicit public revalidation
      policy.
- [ ] Parse `2xx`, `204`, JSON envelopes, raw responses, problem details, and
      non-JSON fallbacks.
- [ ] Validate successful data with a caller-provided Zod schema.
- [ ] Redact authorization, cookies, bodies, and token-like values from any
      diagnostics.
- [ ] Export only the narrow transport API from `src/server/api/index.ts`.

### Tests and harness

- [ ] Use injected `fetch` responses for object, list, metadata, raw, and `204`
      success tests.
- [ ] Cover standard problems, missing fields, malformed JSON, HTML/text, empty
      errors, and invalid successful payloads.
- [ ] Cover URL/query encoding, headers, request IDs, cache settings, timeout,
      caller abort, and network failure.
- [ ] Prove secrets and raw bodies are absent from returned failures and
      diagnostics.
- [ ] Narrow the architecture harness raw-fetch allowlist from all of
      `src/server/api/` to the transport file.
- [ ] Add an opt-in integration test that calls `/health` through the transport
      when a local API URL is supplied.
- [ ] Do not force a public mutation or auth endpoint merely to obtain live
      envelope evidence; unit tests own envelope proof until a real feature
      consumes one.

### Documentation and completion

- [ ] Add current-state API integration documentation describing only shipped
      transport behavior.
- [ ] Update architecture and testing docs.
- [ ] Run focused unit tests.
- [ ] Run `pnpm verify`.
- [ ] Run the local-backend health integration test and record endpoint,
      backend revision, and outcome without recording secrets.
- [ ] Run `git diff --check`.
- [ ] Move this plan to `completed/`.
- [ ] Promote the server-session plan only after its decision gates are closed.

## Decisions

- Native server-side `fetch` remains the HTTP engine.
- The transport is dependency-injected for tests instead of mocking globals.
- Cache policy is mandatory at each call site.
- Transport never retries automatically. Auth refresh and idempotent retry
  belong to later, explicit layers.
- `/health` is an explicit raw-response exception. Envelope behavior is proven
  with deterministic unit tests until a real enveloped feature exists.
- No Next.js route is added only to expose or demonstrate the transport.

## Verification

- Command: not run yet
- Outcome: pending

## Runtime Evidence

- Required: one local-backend `/health` request made through the implemented
  transport.
- Pending.

## Rollback

Revert the transport change and remove its environment variable. No session,
cookie, user data, or backend migration exists in this phase.

## Follow-Up Debt

- Authenticated request composition and retry remain owned by the server-session
  plan.
- Feature-specific runtime schemas remain owned by their features.
