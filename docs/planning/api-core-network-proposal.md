# Lamara Web API Core Proposal

**Status:** Accepted for staged implementation; no runtime implementation yet
**Scope:** OpenAPI contracts, server-side HTTP transport, session ownership,
authentication refresh, and feature API adapters  
**Risk:** High for session/auth; medium for contract and transport work

## Recommendation

Build the API core inside Lamara first. Do not create a separate frontend core
kit yet.

The first implementation should have four boundaries:

1. a committed OpenAPI snapshot and reproducible generated TypeScript types;
2. a small server-only HTTP transport that owns protocol behavior;
3. a server-side session service that owns credentials and refresh
   coordination;
4. thin, feature-owned API adapters that make endpoint calls easy to read and
   test.

This preserves the useful property of `mobile-core-kit`: feature data sources
describe the endpoint, input, and parser while the core handles HTTP mechanics.
It does not copy the mobile repository, datasource/repository layers, Dio
interceptors, connectivity checks, or singleton service locator into Next.js.

Extract a reusable web core only after a second web product consumes the same
design. Until then, keep the reusable-looking code under `src/server/**` and
record which parts remain product-independent.

## Why the Previous Proposal Is Not Ready

The previous version had the right high-level instincts—server-only API calls,
problem-details parsing, request correlation, and browser-inaccessible
credentials—but it left several correctness gaps:

- It chose handwritten contracts even though
  [`docs/core/tech-stack.md`](../core/tech-stack.md) and
  [`docs/core/architecture.md`](../core/architecture.md) select generated
  OpenAPI contracts.
- It proposed copying `burnly-web` without identifying behavior that is unsafe
  to copy.
- `burnly-web` uses an in-memory refresh single-flight map. That only
  coordinates one Node.js process, not concurrent serverless instances.
- `burnly-web` may refresh during Server Component rendering and then ignore a
  cookie-write failure. Next.js does not allow cookie mutation during Server
  Component rendering. Because the backend rotates refresh tokens, failing to
  persist the new token can cause the next request to present the old token and
  trigger session revocation.
- It did not define timeouts, cancellation, `204` handling, Next.js cache
  behavior, write-retry rules, idempotency-key lifetime, or runtime contract
  validation.
- It placed all endpoint adapters under `src/server/auth`, which would
  eventually turn the core into a product API god-module.
- It claimed implementation plans and API/session phases were complete even
  though `src/server/api`, `src/server/auth`, and `src/contracts` did not
  exist. That copied integration document has been removed from the truthful
  baseline.

## Evidence and Constraints

### Backend contract

`backend-core-kit` is the protocol source of truth:

- `docs/openapi/openapi.yaml` is a committed, CI-checked OpenAPI 3 artifact.
- Successful JSON uses `{ data, meta? }`.
- Errors use `application/problem+json` with stable `code` and `traceId`.
- `X-Request-Id` is accepted and echoed.
- Access tokens are bearer JWTs.
- Opaque refresh tokens rotate on every successful refresh.
- Concurrent use of one refresh token is forbidden and reuse can revoke the
  session.
- Reads may be retried once after refresh.
- Writes may only be retried when their endpoint semantics and idempotency key
  make the retry safe.

### Frontend architecture

This repository requires:

- Server Components by default.
- Product behavior under `src/features/**`.
- Server-only integrations under `src/server/**`.
- Runtime validation at external boundaries.
- No raw `fetch` outside approved integration boundaries.
- No server modules imported into Client Components.
- No package extraction before a real second consumer exists.

### Mobile reference

The mobile core provides a useful developer experience:

```text
feature remote datasource
  -> ApiHelper
  -> configured client/interceptors
  -> backend
```

For example, `MeRemoteDataSource.getMe()` only selects an endpoint, auth mode,
and parser. The web implementation should preserve that simplicity, but use
web-native ownership:

```text
feature server adapter
  -> authenticated API facade
  -> typed transport
  -> backend
```

The mobile implementation is a reference, not a template. Browser/server trust
boundaries, Next.js rendering and caching, stateless deployment, and cookie
rules require a different implementation.

## Goals

- Make a normal feature endpoint adapter short and explicit.
- Detect backend contract drift deterministically.
- Validate untrusted response bodies at runtime.
- Normalize success envelopes, problem details, transport failures, and invalid
  responses into one result type.
- Keep access and refresh tokens unavailable to browser JavaScript.
- Coordinate refresh safely across concurrent requests and application
  instances.
- Make timeout, caching, retry, and idempotency behavior visible at call sites.
- Keep the core product-independent and feature endpoints feature-owned.
- Provide low-friction unit tests through dependency injection.

## Non-Goals

- A standalone `frontend-core-kit` repository in this phase.
- A mobile-style repository/use-case/data-source hierarchy for every feature.
- Client-side API calls with bearer tokens.
- TanStack Query before a real interactive client-side server-state need exists.
- Automatic retries for every failure.
- Offline/network reachability checks. A reachability probe is not a reliable
  predictor of whether an HTTP request will succeed.
- Duplicating backend authorization or business rules in Next.js.
- Logging request bodies, response bodies, tokens, passwords, or cookies.

## Proposed Ownership

```text
src/contracts/lamara-api/
  openapi.yaml           # committed frontend contract lock
  generated.ts           # generated; never hand-edited
  runtime/               # handwritten Zod schemas for consumed payloads
  index.ts

src/server/config/
  env.ts                 # validated server environment

src/server/api/
  transport.ts           # fetch execution and protocol normalization
  result.ts              # ApiResult and failure taxonomy
  envelope.ts            # success envelope parsing
  problem.ts             # RFC 7807 extension parsing
  index.ts               # narrow public API

src/server/session/
  session-store.ts       # storage interface
  session-service.ts     # establish/read/clear/refresh coordination
  redis-session-store.ts # production implementation
  memory-session-store.ts# tests only
  index.ts

src/features/<feature>/server/
  <feature>-api.ts       # endpoint selection and feature response schemas
  <feature>-loader.ts    # feature composition/policy when needed
```

Do not create generic `repositories`, `use-cases`, `datasources`, or `models`
folders until a feature has enough policy to justify them.

### Dependency direction

```text
app route / Server Action
  -> feature public API
  -> feature server adapter
  -> server session + server API transport
  -> generated contract + runtime schema
  -> Lamara API
```

`src/server/api` must not import product features. Feature endpoint adapters may
import `src/server/api`, `src/server/session`, and `src/contracts`.

## Contract Strategy

### Contract lock

Commit the exact backend OpenAPI document consumed by the frontend at
`src/contracts/lamara-api/openapi.yaml`. This is a deliberate compatibility
lock, not an independently maintained specification.

Provide deterministic commands:

```text
pnpm contracts:generate
pnpm contracts:check
```

`contracts:generate` generates TypeScript types from the committed snapshot.
`contracts:check` regenerates to a temporary location and fails on drift.
`verify:fast` should include `contracts:check` once the pipeline exists.

Updating the frontend contract is an explicit operation:

1. copy or sync the backend's committed `docs/openapi/openapi.yaml`;
2. regenerate;
3. review the OpenAPI and generated-type diff;
4. update affected runtime schemas/adapters and tests.

CI must not depend on the sibling backend checkout or a live backend URL.

Use `openapi-typescript` for runtime-free path, parameter, body, and response
types. Do not handwrite endpoint path constants or duplicate request DTO types.

### Runtime validation

Generated TypeScript types do not validate network input at runtime. Each
consumed endpoint must also parse its successful `data` with a Zod schema.

Keep runtime schemas scoped to consumed data rather than generating and
shipping a second runtime representation of the backend's entire API on day
one. Constrain handwritten schemas against the corresponding generated type so
contract changes produce a compile-time failure as well as runtime protection.

The shared transport validates only protocol-wide shapes:

- success envelope;
- optional metadata;
- problem details;
- empty `204` responses.

Feature schemas validate feature payloads.

## HTTP Transport

The transport is a small wrapper around the native server-side `fetch`. It is
not a business API and must not contain endpoint-specific rules.

### Request responsibilities

- Resolve paths against one validated API base URL.
- Serialize path/query/body values according to generated contract types.
- Add `Accept: application/json`.
- Add `Content-Type: application/json` only when a JSON body exists.
- Generate or forward `X-Request-Id`.
- Attach a bearer token supplied by the authenticated facade.
- Attach an idempotency key supplied by the logical operation.
- Apply an explicit timeout with `AbortSignal`.
- Accept a caller signal and preserve cancellation.
- Require an explicit cache policy.

Default policy:

| Request                        | Cache                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| Authenticated or user-specific | `cache: "no-store"`                                              |
| Mutation                       | `cache: "no-store"`                                              |
| Public read                    | Caller must choose `no-store` or an explicit revalidation policy |

The core must not silently cache authenticated data, and feature code must not
depend on changing Next.js fetch defaults.

### Response responsibilities

- Treat every `2xx` status as success.
- Support `204 No Content` without attempting JSON parsing.
- Parse JSON based on response content, not assumptions.
- Unwrap `{ data, meta? }` for normal JSON endpoints.
- Allow an explicit raw-response mode for documented exceptions such as health
  or file responses.
- Parse non-2xx bodies as problem details and fall back safely when a proxy
  returns HTML, plain text, or an empty body.
- Prefer the response `X-Request-Id` as the trace ID.
- Run the feature Zod parser before returning success.
- Never throw for expected HTTP, timeout, network, or invalid-response
  outcomes.
- Allow programmer errors and violated internal invariants to throw.

### Result contract

Use a discriminated result:

```ts
type ApiResult<T> =
  | {
      ok: true;
      data: T;
      meta?: unknown;
      status: number;
      traceId: string;
    }
  | {
      ok: false;
      failure:
        | { kind: "problem"; problem: ApiProblem }
        | { kind: "network"; message: string }
        | { kind: "timeout"; outcome: "unknown"; message: string }
        | { kind: "invalid-response"; message: string };
      status: number | null;
      traceId: string;
    };
```

Do not encode client failures as invented HTTP statuses such as `0`, `-1`, or
`-2`. `kind` carries client-side failure semantics; `status` is only an actual
HTTP status.

Do not expose raw response bodies on the normal result. They can contain
sensitive data and encourage UI code to depend on invalid contracts.

## Feature Adapter Ergonomics

A feature adapter should state only the operation-specific facts:

- generated path/method;
- path/query/body input;
- whether auth is required;
- runtime schema;
- cache policy;
- idempotency policy for a write.

Conceptually:

```ts
export async function getMe(context: AuthenticatedApiContext) {
  return context.get("/v1/me", {
    schema: meSchema,
    cache: "no-store",
  });
}
```

The exact generic signatures should be proven with `/v1/me` and one paginated
endpoint before generalizing. Do not build separate `getOne`, `getList`,
`getPaginated`, `postPaginated`, and verb-specific abstractions unless repeated
call sites show they remove real duplication. The backend envelope already
allows one parser to handle object and list `data`.

Feature loaders translate `ApiResult` into feature behavior. Shared transport
must not decide user-facing copy, redirects, toast messages, or feature failure
types.

## Session and Authentication

### Trust boundary

- The browser owns only an opaque, random session identifier in an `httpOnly`,
  `Secure` production cookie.
- The Next.js server owns access and refresh tokens.
- Lamara API remains the authorization authority.
- No token is placed in `localStorage`, `sessionStorage`, a JS-readable cookie,
  a URL, rendered props, logs, or client-component data.

Cookie defaults:

```text
HttpOnly
Secure in production
SameSite=Lax
Path=/
bounded Max-Age aligned with server session expiry
```

Rotate the opaque web session identifier on login and other privilege changes.
Clear the cookie and server record on logout or terminal session failure.

### Production session store

Use a server-side store for production. Redis is the recommended first
implementation because production `backend-core-kit` already treats Redis as
required infrastructure and refresh coordination needs cross-instance
atomicity.

Use a dedicated key prefix and least-privilege credentials; do not share
undocumented backend keys. Store only:

```text
session id hash / lookup key
user id
access token
refresh token
access expiry
absolute session expiry
minimal rotation/version metadata
```

Encrypt sensitive session values at rest when the Redis trust model requires
it. Never store tokens in the browser-side cookie.

An encrypted cookie containing both tokens may be implemented only as an
explicit local-development adapter. It is not the production default because
rotating refresh tokens require durable cross-request coordination.

### Refresh algorithm

Refresh is a session operation, not an HTTP interceptor side effect:

1. Read the session by opaque session ID.
2. If the access token is not near expiry, return it.
3. Acquire a short distributed lock for that session.
4. Re-read the session after acquiring the lock.
5. If another request already refreshed it, use the newer access token.
6. Otherwise call `/v1/auth/refresh` once.
7. Atomically persist both rotated tokens and increment the session version.
8. Release the lock.

Waiters must re-read the session after the lock holder completes. They must not
reuse the token value captured before waiting.

Token `exp` may be decoded without signature verification only to schedule
refresh. It is not authorization evidence; Lamara API validates the token.

Refresh outcomes:

| Outcome                                    | Session behavior                          |
| ------------------------------------------ | ----------------------------------------- |
| Success                                    | Persist both new tokens atomically        |
| Terminal refresh problem                   | Delete session and require sign-in        |
| `429` or `5xx` with a definite response    | Keep session; surface transient failure   |
| Timeout/network error with unknown outcome | Mark session unusable and require sign-in |

The conservative unknown-outcome rule follows the backend contract: the server
may have consumed the refresh token even when the frontend did not receive the
response.

### Request retry

- Retry an authenticated `GET`/`HEAD` once after a successful refresh.
- A protected `401 UNAUTHORIZED` is safe to retry because backend guards run
  before handlers.
- Never refresh on `403`.
- Retry a write after `401` only when the endpoint supports idempotency and the
  same logical operation retains the same idempotency key.
- Do not automatically retry timeout/network failures in the transport.
- `IDEMPOTENCY_IN_PROGRESS` handling belongs to the feature operation because
  polling/backoff is product behavior.

Generate an idempotency key at the Server Action or feature operation boundary,
not inside each HTTP attempt. Reuse that key for every attempt of the same
logical mutation.

## Security and Privacy Invariants

- All modules that can access tokens import `server-only`.
- Session cookies are opaque and contain no API credentials or user profile.
- Login/logout and authenticated mutations use Server Actions where practical
  so Next.js same-origin checks apply. Route Handlers that mutate cookie-backed
  state must perform equivalent origin/CSRF validation.
- Request and response logging is metadata-only and redacts authorization,
  cookies, tokens, passwords, and request bodies by default.
- Validation details may be returned to feature code; raw backend details must
  not be shown directly to users.
- `traceId` is safe to show in support-oriented error UI and must be preserved
  end to end.
- Redirect targets are allowlisted; auth flows must not accept arbitrary
  external return URLs.
- Session records have idle/absolute expiry and are removed on logout.

## Testing and Harness

### Contract

- Generated files reproduce exactly from the committed OpenAPI snapshot.
- Contract drift fails `contracts:check`.
- Generated files are marked as generated and excluded from manual formatting
  rules only when necessary.

### Transport

Test:

- object, list, metadata, raw, and `204` success;
- problem details and malformed/non-JSON errors;
- timeout, cancellation, and network failures;
- request ID propagation;
- auth and idempotency headers;
- runtime schema rejection;
- URL/query encoding;
- explicit cache behavior;
- secret redaction.

Use an injected `fetch` implementation. Do not require a live backend for unit
tests.

### Session

Test:

- cookie attributes and opaque contents;
- session ID rotation;
- terminal/transient/unknown refresh outcomes;
- atomic persistence of both rotated tokens;
- two concurrent requests cause one refresh;
- a waiting request re-reads the updated session;
- distributed behavior using the real Redis adapter in an integration test;
- logout clears local state even if remote logout fails;
- no refresh on `403`;
- read retry once and idempotent-write retry once.

### Architecture harness

Extend the existing harness to enforce:

- no Client Component imports from `src/server/**`;
- no raw `fetch` outside the transport, scripts, and tests;
- no direct `process.env` outside config;
- generated contracts are not manually edited;
- feature endpoint adapters remain under feature-owned server modules.

The current raw-fetch allowlist is broader than the intended end state and
should be narrowed when the transport lands.

## Delivery Sequence

### Phase 0: Promote accepted decisions

- Record acceptance before implementation begins.
- Create staged execution plans for implementation.
- Add current-state API integration documentation only as working behavior
  lands.

### Phase 1: Contract and unauthenticated transport

- Add the committed OpenAPI contract lock and generation/check commands.
- Implement result, envelope, problem, timeout, and transport behavior.
- Prove the boundary with a health request and one normal enveloped endpoint
  using injected-fetch tests.

### Phase 2: Production session core

- Add the opaque cookie, session-store interface, Redis implementation, and
  distributed refresh coordination.
- Implement login, refresh, logout, and authenticated request facade.
- Add integration evidence for concurrent refresh.

### Phase 3: First real feature

- Implement `/v1/me` through an auth feature/account feature adapter.
- Implement one idempotent write to prove key ownership and retry behavior.
- Add browser evidence that no tokens are readable from JavaScript or rendered
  payloads.

### Phase 4: Reuse review

After Lamara and one second web product use the same boundary, compare them.
Extract only code that is genuinely product-independent. Keep product
contracts, feature schemas, endpoint adapters, copy, and UI in each product.

Detailed file-by-file tasks and command evidence belong in an execution plan
after this proposal is accepted.

## Acceptance Criteria

- The frontend contract snapshot matches an intentionally selected backend
  OpenAPI revision and generates deterministically.
- Normal feature adapters do not call raw `fetch` or manually parse envelopes,
  problems, auth headers, or request IDs.
- Every consumed response payload is runtime-validated.
- Authenticated data is explicitly uncached.
- Browser JavaScript cannot access Lamara API tokens.
- Production refresh coordination is correct across concurrent requests and
  instances.
- A refresh success atomically persists both rotated tokens.
- Unknown refresh outcome never retries an old refresh token.
- Reads retry at most once after refresh; writes require a stable idempotency
  key to retry.
- Transport and session behavior are covered at their stable boundaries.
- `pnpm verify` and relevant runtime/integration gates pass before the work
  is considered complete.

## Decisions Needed Before Implementation

1. **Redis provider and deployment topology.** Recommended default: a managed
   Redis compatible with the Next.js deployment region, using a dedicated
   Lamara Web key prefix and credentials.
2. **Session expiry policy.** It must not exceed backend refresh-token/session
   policy. Recommended default: align absolute expiry with the backend and add a
   shorter idle expiry only if product requirements justify it.
3. **Contract update mechanism.** Recommended default: a local sync script that
   accepts an explicit source path, while CI only verifies the committed
   frontend snapshot and generated output.

These choices affect configuration and operations, but they do not change the
module boundaries recommended above.
