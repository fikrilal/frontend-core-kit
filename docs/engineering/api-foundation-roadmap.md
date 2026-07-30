# API Foundation Coverage And Roadmap

**Status:** Authenticated read foundation implemented; later capabilities are
demand-driven.

This document distinguishes the current boundary from intentionally deferred
work. It does not authorize speculative implementation.

## Implemented

```text
feature server adapter
  -> typed openapi-fetch client
  -> Lamara API
  -> shared response normalization
  -> generated Zod envelope validation
  -> ApiResult<TData, TMeta>
```

| Capability          | Current implementation                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| Configuration       | Validated server-only API origin and session TTL                           |
| Request typing      | Generated OpenAPI paths, bodies, response types, and runtime schemas       |
| Request correlation | Generated/forwarded `X-Request-Id`; response ID preferred                  |
| Endpoint policy     | Auth adapters explicitly use `no-store` and a 10-second timeout            |
| JSON success        | Complete generated envelope and JSON-compatible content-type validation    |
| Empty success       | Dedicated `204` reader used by logout                                      |
| Failures            | Safe problem, invalid-response, network, timeout, and cancellation results |
| Secret handling     | Normal results exclude raw bodies, request bodies, credentials, and issues |
| Sessions            | Opaque cookie; versioned in-memory record with bounded absolute TTL        |
| Authentication      | Bearer attachment, one eligible `401` refresh/retry, no refresh on `403`   |
| Concurrency         | In-process lock and compare-and-set replacement of rotated tokens          |

This is proven by password login, refresh, logout, `/v1/me`, session unit tests,
and browser runtime coverage.

## Deferred capabilities

### Raw or file responses

Add a separate raw adapter only when a real endpoint needs downloads, images,
or streams. Make media type and parsing explicit, preserve safe failure
normalization, and avoid buffering large files where streaming is appropriate.

### Cache-policy enforcement

Every endpoint adapter must select a cache policy. Authenticated reads and
mutations use `no-store`. A public read may choose explicit Next.js
revalidation. Add a harness rule only after multiple endpoints make reliable
enforcement worthwhile.

### Caller cancellation composition

Current endpoints own only their timeout. If a real caller needs cancellation,
compose it with the endpoint timeout using `AbortSignal.any` while preserving
timeout versus cancellation classification. Never retry a timeout or network
failure automatically because the remote outcome may be unknown.

### Idempotent mutations

When the first backend-supported product mutation arrives:

- create one idempotency key at the logical Server Action or feature boundary;
- preserve that key across any permitted authentication retry;
- retry after refresh only when the operation explicitly supports idempotency;
- never automatically retry timeout or network failures;
- keep conflict, replay, in-progress, and unknown-outcome behavior
  feature-owned.

Prove this with one real mutation before extracting a helper.

### Generated problems

The backend OpenAPI lists error codes but does not currently describe standard
problem response bodies. Add those schemas in the backend contract before
replacing the frontend’s small handwritten safe subset. Raw backend detail must
not automatically become user-facing copy.

### Operational diagnostics

Add logging or tracing only after the deployed runtime has a telemetry
destination. Record method, route template, status, duration, failure kind, and
request ID. Never record authorization, cookies, request bodies, raw response
bodies, passwords, or tokens.

## Required evidence

As capabilities land, prove the lowest relevant boundary:

| Area                 | Evidence                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| JSON responses       | Complete envelope, metadata, malformed data, and content type                 |
| Empty responses      | Valid `204`, unexpected status/body, and request ID                           |
| Request construction | Path/query encoding, body, request ID, timeout, and cache policy              |
| Failures             | Problem JSON, malformed JSON, proxy text/HTML, network, timeout, cancellation |
| Authentication       | Bearer attachment, no `403` refresh, one eligible `401` retry                 |
| Concurrency          | Single-process refresh and atomic rotated-token replacement                   |
| Mutations            | Stable idempotency key and no unsafe timeout/network retry                    |
| Privacy              | No credentials in client output, storage, URLs, logs, or normal errors        |

Use injected HTTP tests for deterministic transport behavior and Playwright for
browser-owned behavior.

## Delivery rule

The next API capability must be selected by a concrete product endpoint. Do not
create a generic request builder, repository hierarchy, retry engine,
client-side query layer, raw-response mode, or telemetry system in
anticipation of later phases.
