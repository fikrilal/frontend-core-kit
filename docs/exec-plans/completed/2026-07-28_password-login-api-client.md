# 2026-07-28 Password Login API Client Slice

## Status

Completed on 2026-07-29. The first implementation passed verification, then
returned to active after its ergonomics review found that public transport
injection and handwritten OpenAPI typing were less idiomatic than necessary.

## Objective

Prove the generated OpenAPI contract in real feature code with a readable,
server-only adapter for `POST /v1/auth/password/login`.

Use `openapi-fetch` for method, path, and request-body inference. Use generated
operation/component types to constrain the runtime response schema. Retain only
Lamara-specific shared behavior: validated configuration, request IDs,
normalized failures, problem details, timeout/cancellation classification, and
feature-owned runtime validation.

Do not add a form, Server Action, route, cookie, session, refresh behavior,
token persistence, browser API call, or automatic retry.

## Acceptance Criteria

- [x] `loginWithPassword(input)` is a plain feature function with no public
      infrastructure dependency.
- [x] `openapi-fetch` binds the method, literal path, and request body to
      generated `paths`.
- [x] A feature-owned Zod schema remains constrained by generated response
      types and validates the real response.
- [x] Shared code normalizes Lamara problems and transport failures without
      returning secrets or raw bodies.
- [x] Server-only, no-store, timeout, request-ID, and architecture boundaries
      remain enforced.
- [x] Handwritten path-union and request-construction code that duplicates
      `openapi-fetch` is removed.
- [x] Tests cover the public feature function and shared client/response
      behavior through the HTTP boundary.
- [x] Documentation describes the implemented code rather than the superseded
      transport design.

## Risk Class

`high`

This unexposed slice parses token-bearing responses. It must not leak request
bodies, raw response bodies, access tokens, or refresh tokens in failures.

## Decisions

- Prefer a plain exported feature function over an auth service class,
  repository, data-source interface, or public dependency-injection parameter.
- Use the generated contract through the runtime client rather than manually
  reconstructing only a POST path union.
- Keep Zod because generated TypeScript is erased at runtime.
- Keep a small response normalizer because the current backend OpenAPI lists
  `x-error-codes` but does not declare error response bodies.
- Parse successful bodies as text before Zod validation so malformed JSON is a
  normal invalid-response result with its HTTP status and trace ID.
- Create the configured client lazily when the feature function runs so builds
  without runtime API configuration continue to work.
- No live login is required: credentials and backend session/rate-limit state
  are outside this adapter-only slice.

## Checklist

### Client and response boundary

- [x] Add `openapi-fetch`.
- [x] Add a configured `Client<paths>` factory with validated base URL,
      default `Accept`, request IDs, and injectable fetch for boundary tests.
- [x] Preserve response request IDs and the outbound ID as a fallback.
- [x] Normalize success envelopes, problems, invalid responses, network
      failures, timeouts, and cancellation.
- [x] Remove the handwritten `ApiTransport`, POST path union, and body
      serialization.

### Feature adapter

- [x] Remove the public transport parameter from `loginWithPassword`.
- [x] Call `client.POST()` directly with the literal generated path and body.
- [x] Keep the call site limited to endpoint policy and runtime schema parsing.
- [x] Keep token-bearing modules server-only.

### Tests and documentation

- [x] Update tests to exercise the configured public feature function.
- [x] Preserve malformed-response and secret-leakage coverage.
- [x] Update architecture/API/harness/testing documentation.
- [x] Run focused checks.
- [x] Run `pnpm verify`.
- [x] Run `pnpm peers check`.
- [x] Run `git diff --check`.
- [x] Record outcomes and move this plan to `completed/`.
- [x] Stop before session work.

## Verification

- `pnpm lint && pnpm typecheck && pnpm test`
  - Passed: ESLint, strict TypeScript, 24 Vitest tests, and 6 contract-tooling
    tests.
- `pnpm verify`
  - Passed: formatting, contract drift, lint, strict TypeScript, all tests,
    production build, architecture checks, and public-page checks.
- `pnpm peers check`
  - Passed with no peer dependency issues.
- `git diff --check`
  - Passed.

## Runtime Evidence

No browser or live-backend evidence is required because no runtime route invokes
the adapter. Production build and server-boundary verification are required.

## Rollback

Revert the client, feature adapter, dependencies, tests, config example, and
documentation. No user data, backend session, cookie, or migration exists.

## Follow-Up Debt

- Decide whether backend problem responses should be added to OpenAPI before
  more feature adapters are introduced.
- Keep session storage, refresh coordination, login UI, and authenticated
  requests queued until explicitly approved.
