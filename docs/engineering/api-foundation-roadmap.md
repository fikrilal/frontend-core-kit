# API Foundation Coverage And Roadmap

**Status:** Accepted direction; partially implemented
**Scope:** Gaps between the current unauthenticated JSON API foundation and the
initial authenticated product slice.

This document records what `src/server/api/**` supports now and how missing
capabilities should be introduced. It does not authorize speculative
implementation. Add each capability when an active product endpoint needs it,
and track that work in an execution plan when the change is non-trivial.

## Current Boundary

The implemented path is:

```text
feature-owned server endpoint
  -> typed openapi-fetch client
  -> Lamara API
  -> shared response normalization
  -> generated Zod data validation
  -> ApiResult<T>
```

It is currently proven only by
`POST /v1/auth/password/login`. No route, session, cookie, authenticated
request, refresh workflow, or mutation retry invokes this boundary.

### Implemented

| Capability          | Current implementation                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| API origin          | Server-only and validated as an HTTP(S) origin                                |
| Request typing      | Generated OpenAPI paths, bodies, and response types                           |
| HTTP transport      | Server-only `openapi-fetch` client backed by native `fetch`                   |
| JSON requests       | Default `Accept`; JSON serialization and `Content-Type` when a body exists    |
| Request correlation | Generated or forwarded `X-Request-Id`; response ID preferred                  |
| Endpoint policy     | Password login explicitly selects `no-store` and a 10-second timeout          |
| Success handling    | `{ data }` envelopes for ordinary JSON responses                              |
| Runtime validation  | Generated Zod schema validates successful `data`                              |
| Error handling      | Problem, invalid-response, network, timeout, and cancellation results         |
| Secret handling     | Normal failures exclude request bodies, raw bodies, tokens, and schema issues |
| Programmer errors   | Invalid configuration and internal serialization failures may throw           |

This is sufficient for the current password-login integration experiment. It
is not the complete authenticated API foundation.

## Missing Capabilities And Expected Design

### Complete envelope validation

**Current gap:** `readApiResult` validates `data`, but it accepts `meta` as
unvalidated `unknown`. It also checks the envelope structure independently of
the generated OpenAPI response schema.

**Expected implementation:**

- Pass the generated complete response schema, such as an Orval operation
  response alias, from the feature endpoint to the response reader.
- Validate `{ data, meta? }` as one external boundary.
- Return validated `data` and typed metadata through an `ApiResult` generic.
- Keep endpoint functions responsible for selecting the generated schema; do
  not create handwritten copies.
- Treat an invalid envelope, invalid metadata, or invalid data as
  `invalid-response` without returning the raw payload or Zod issues.

Conceptually:

```ts
return readJsonApiResult(request, AuthPasswordLoginResponse);
```

The exact generic signature should be selected when a paginated endpoint proves
both data and metadata requirements.

### Empty success responses

**Current gap:** A successful `204 No Content` is treated as an invalid
`{ data }` envelope.

**Expected implementation:**

- Add a separate empty-response reader when the first documented `204`
  endpoint is consumed.
- Return a successful `ApiResult<void>` without attempting JSON parsing.
- Reject an unexpected body when the contract requires an empty response.
- Preserve status and request correlation.
- Do not weaken the normal JSON reader to accept missing data.

An explicit `readEmptyApiResult` is preferable to a large response function
with loosely related flags.

### Raw and file responses

**Current gap:** The foundation has no path for downloads, images, streams, or
other responses that do not use the Lamara JSON envelope.

**Expected implementation:**

- Add a separate raw-response adapter only when a real endpoint requires one.
- Make the expected media type and parser explicit at the feature call site.
- Preserve timeout, cancellation, request ID, and HTTP failure normalization.
- Never include an error response body in the normal result.
- Avoid buffering large files when streaming is supported by the consuming
  route.

Health endpoints are not a frontend requirement and must not be used merely to
justify a raw mode.

### Content-type validation

**Current gap:** Successful bodies are parsed from text as JSON without first
requiring a JSON-compatible response media type.

**Expected implementation:**

- Normal JSON endpoints should accept `application/json` and structured
  `application/*+json` media types.
- A non-empty success response with an unexpected media type should become
  `invalid-response`.
- Empty and raw responses should use their dedicated readers.
- Proxy-generated HTML, plain text, malformed JSON, and empty error bodies must
  continue to fail safely without exposing their contents.

### Cache-policy enforcement

**Current gap:** Password login explicitly uses `cache: "no-store"`, but
`openapi-fetch` does not require future endpoint adapters to state a cache
policy.

**Expected implementation:**

- Every feature endpoint must select a cache policy at its call site.
- Authenticated, user-specific, and mutation requests must use `no-store`.
- Public reads must choose either `no-store` or an explicit Next.js
  revalidation policy.
- Add a harness or lint rule only when it can enforce this reliably without
  false confidence.
- Do not introduce a caching abstraction before a real public read needs one.

### Timeout and caller cancellation composition

**Current gap:** An endpoint can pass one `AbortSignal`; the foundation does not
compose an endpoint timeout with a caller-provided cancellation signal.

**Expected implementation:**

- Keep a required timeout for every remote request.
- When a caller signal exists, combine it with the timeout using
  `AbortSignal.any`.
- Preserve the cause so timeout remains `timeout` and caller cancellation
  remains `cancelled`.
- Never automatically retry a timeout or network failure because the remote
  outcome may be unknown.

Add a shared signal helper only when a real endpoint accepts caller
cancellation.

### Authentication and session ownership

**Current gap:** The low-level client does not attach bearer tokens, persist
credentials, refresh access, or retry after authentication failure.

**Expected implementation:**

- Keep credentials in a server-side session store; the browser receives only
  an opaque `httpOnly`, `secure`, `sameSite` session cookie.
- Build an authenticated facade above `src/server/api`, rather than adding
  session behavior to `createLamaraApiClient`.
- Let the facade attach the current bearer token.
- On an eligible `401`, coordinate one distributed refresh, atomically persist
  both rotated tokens, and retry an allowed operation at most once.
- Never refresh on `403`.
- Never retry an old refresh token after an unknown refresh outcome.
- Keep tokens out of HTML, React Server Component payloads, browser storage,
  URLs, logs, and normal errors.

The detailed ownership and concurrency requirements remain in the queued
[server session plan](../exec-plans/queued/2026-07-28_server-session-core.md).

### Idempotent mutations

**Current gap:** The client can transport arbitrary typed headers, but there is
no implemented ownership rule for `Idempotency-Key` or safe write retry.

**Expected implementation:**

- Generate the key once at the logical mutation boundary, normally a Server
  Action or feature operation.
- Preserve the same key across any permitted authenticated retry.
- Retry a write after refresh only when the backend operation explicitly
  supports idempotency.
- Never automatically retry network failures or timeouts.
- Keep conflict, in-progress, replayed, and unknown-outcome behavior
  feature-owned.
- Prove this design with one real mutation before extracting a general helper.

### Generated problem responses

**Current gap:** Successful response validation is generated, but backend
OpenAPI currently lists error codes without describing error response bodies.
`problem.ts` therefore owns a small handwritten safe subset.

**Expected implementation:**

- Add standard problem response schemas to the backend OpenAPI.
- Sync and regenerate the frontend contract.
- Replace handwritten problem-shape duplication with the generated schema when
  it is expressive enough.
- Continue returning only the safe fields required by feature code; raw backend
  details must not become user-facing copy.

### Operational diagnostics

**Current gap:** Request IDs are preserved, but the foundation does not emit
structured request lifecycle telemetry.

**Expected implementation:**

- Add operational logging or tracing only when a deployed runtime has a defined
  telemetry destination.
- Record method, route template, status, duration, failure kind, and request ID.
- Never record authorization, cookies, request bodies, raw response bodies,
  passwords, access tokens, or refresh tokens.
- Keep user-facing errors independent from transport logging.

## Required Coverage As Capabilities Land

The stable boundary should eventually prove:

| Area                 | Required evidence                                                                    |
| -------------------- | ------------------------------------------------------------------------------------ |
| JSON responses       | Object, list, complete envelope, pagination metadata, malformed data                 |
| Empty responses      | Valid `204`, unexpected body, request-ID preservation                                |
| Raw responses        | Expected media type, streaming/buffering behavior, safe failure                      |
| Request construction | Path and query encoding, JSON body, request ID, cache policy                         |
| Failures             | Problem JSON, malformed JSON, HTML/text proxy errors, network, timeout, cancellation |
| Authentication       | Bearer attachment, no refresh on `403`, one refresh and retry on eligible `401`      |
| Concurrency          | Distributed single refresh and atomic rotated-token persistence                      |
| Mutations            | Stable idempotency key and no unsafe timeout/network retry                           |
| Privacy              | No credentials in client bundles, browser storage, rendered payloads, URLs, or logs  |

Use injected `fetch` for deterministic transport tests. Session concurrency
requires integration evidence against the selected production-like session
store. Browser evidence begins only when real authentication routes exist.

## Delivery Order

1. Validate complete generated JSON envelopes before the first paginated
   endpoint.
2. Add empty-response handling with the first `204` consumer.
3. Implement the server session core and authenticated facade.
4. Prove authenticated read and refresh behavior with the first protected
   endpoint.
5. Prove idempotency ownership with the first supported mutation.
6. Add raw/file handling and operational telemetry only when concrete product
   requirements introduce them.

Each step must leave unused future capabilities unimplemented. Do not create a
generic request builder, repository hierarchy, retry engine, or client-side
query layer in anticipation of later phases.

## Completion Conditions

The API foundation is complete for the initial authenticated product slice
when:

- every consumed success response is validated by its generated runtime
  contract;
- all consumed response kinds—JSON, empty, or raw—have explicit handling;
- authenticated data is server-owned and uncached;
- refresh coordination is correct across concurrent application instances;
- writes retry only with stable backend-supported idempotency;
- expected remote failures return safe discriminated results;
- transport, session, privacy, and relevant browser evidence pass;
- documentation describes only behavior that is actually implemented.
