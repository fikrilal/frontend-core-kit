# API Integration

## Current status

The frontend has:

- a committed Lamara API compatibility snapshot;
- generated TypeScript operation types and Zod runtime schemas;
- a typed, server-only `openapi-fetch` client;
- Lamara-specific response normalization;
- auth adapters for password login, refresh, logout, and current user.

The login Server Action and protected Server Component invoke these adapters
through the process-memory session boundary. No Client Component imports the
API or receives API credentials.

## Owned contract artifacts

```text
src/contracts/lamara-api/openapi.yaml
  Exact frontend compatibility lock.

src/contracts/lamara-api/provenance.json
  Backend repository, commit, source path, and snapshot SHA-256.

src/contracts/lamara-api/generated.ts
  Generated TypeScript. Never edit directly.

src/contracts/lamara-api/runtime.generated.ts
  Generated Zod schemas. Never edit directly.

src/contracts/lamara-api/index.ts
  Public type-only export boundary.

src/contracts/lamara-api/runtime.ts
  Explicit runtime-schema export boundary.
```

The current snapshot comes from backend revision
`88f6c2f9a2f1307778759ed0869561165593194a`.

## Endpoint pattern

```text
feature server adapter
  -> generated operation input/output types
  -> openapi-fetch literal method and path
  -> explicit no-store and timeout policy
  -> generated complete-envelope schema
  -> ApiResult<TData, TMeta>
```

For example, `loginWithPassword(input)` derives its input and data types from
`operations["auth.password.login"]`, calls the generated path, and validates
the response with `AuthPasswordLoginResponse`.

`openapi-fetch` owns request construction and JSON serialization. The small
Lamara boundary adds request IDs and normalizes JSON-compatible content types,
complete envelopes, empty `204` responses, safe problem details, network
failures, timeout, cancellation, and invalid responses. It does not persist
tokens, set cookies, redirect, or choose user-facing copy.

Expected remote outcomes return a discriminated `ApiResult`. Invalid
configuration and unserializable internal requests throw as programmer errors.
Normal failures never contain request bodies, raw response bodies, schema issue
values, access tokens, or refresh tokens.

Feature error mappers interpret stable RFC7807 `code` values before using HTTP
status as a fallback. Server Actions return serializable semantic errors; UI or
localization code owns user-facing copy. Backend `title`, `detail`, and message
text are not presentation contracts.

Session ownership, refresh coordination, and authenticated retry stay above
this layer and are documented in
[Session management](session-management.md).

## Local configuration

```text
LAMARA_API_BASE_URL=http://127.0.0.1:4000
LAMARA_SESSION_TTL_SECONDS=2592000
```

These values are server-only. Never prefix them with `NEXT_PUBLIC_`.

## Normal verification

```bash
pnpm contracts:check
```

The check regenerates TypeScript and Zod artifacts from the committed snapshot
in a temporary directory and compares exact output. It does not require the
backend checkout or network access.

## Updating the contract

Select an intentional, committed backend revision. Confirm its OpenAPI artifact
is clean, then run:

```bash
pnpm contracts:sync -- --source /absolute/path/to/docs/openapi/openapi.yaml
pnpm contracts:generate
pnpm contracts:check
```

Review the snapshot, provenance, generated TypeScript, and generated Zod
changes together. CI and normal builds consume only committed frontend
artifacts; they never read a sibling checkout or download a live schema.

The backend contract currently lists error codes through `x-error-codes` but
does not describe error response bodies. `problem.ts` therefore keeps a small
handwritten safe subset until the backend contract can generate it.

The remaining demand-driven capabilities—raw responses, cache enforcement,
caller cancellation composition, idempotent mutations, generated problems,
and operational diagnostics—are tracked in
[API foundation coverage and roadmap](api-foundation-roadmap.md).
