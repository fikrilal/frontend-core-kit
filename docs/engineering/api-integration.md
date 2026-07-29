# API Integration

## Current status

The frontend has:

- a build-time Lamara API contract boundary;
- a typed, server-only `openapi-fetch` client;
- Lamara-specific response normalization;
- one plain feature function for `POST /v1/auth/password/login`.

No route, form, Server Action, session, cookie, or Client Component invokes the
adapter. It is currently an integration experiment exercised through injected
tests.

Owned files:

```text
src/contracts/lamara-api/openapi.yaml
  Exact frontend compatibility lock.

src/contracts/lamara-api/provenance.json
  Backend repository, commit, source path, and snapshot SHA-256.

src/contracts/lamara-api/generated.ts
  Generated TypeScript. Never edit directly.

src/contracts/lamara-api/runtime.generated.ts
  Generated Zod 4 runtime schemas. Never edit directly.

src/contracts/lamara-api/index.ts
  Public type-only export boundary.

src/contracts/lamara-api/runtime.ts
  Explicit runtime-schema export boundary.
```

The committed snapshot currently comes from backend revision
`88f6c2f9a2f1307778759ed0869561165593194a`.

## Password-login slice

```text
loginWithPassword(input)
  -> openapi-fetch POST /v1/auth/password/login
  -> Lamara API
  -> shared Lamara response normalization
  -> generated Zod validation
  -> ApiResult<PasswordLoginData>
```

The feature derives its public input and validated output types from
`operations["auth.password.login"]`. `openapi-fetch` connects the literal
method, path, and body to generated `paths` at the call site.

`loginWithPassword(input)` has no public infrastructure parameter. It creates
the configured client lazily, calls `client.POST(...)`, and passes the response
to the generated `AuthResultWithMeDto` schema.

`openapi-fetch` owns request construction and JSON body serialization. The
small Lamara boundary adds request IDs and normalizes success envelopes,
problem details, network failures, timeout, cancellation, and invalid
responses. It does not retry, refresh, persist tokens, set cookies, redirect,
or choose user-facing copy.

Expected HTTP, network, timeout, cancellation, and invalid-response outcomes
return a discriminated `ApiResult`. Invalid configuration and unserializable
internal requests throw as programmer errors.

Token-bearing modules import `server-only`. Normal failure results never
contain request bodies, raw response bodies, schema issue values, access
tokens, or refresh tokens.

## Local configuration

Copy the documented value into `.env.local` when an actual server runtime
consumer is introduced:

```text
LAMARA_API_BASE_URL=http://127.0.0.1:4000
```

Do not prefix this variable with `NEXT_PUBLIC_`.

## Normal verification

```bash
pnpm contracts:check
```

The check generates TypeScript types and Zod schemas from the committed
snapshot into a temporary directory and compares them with the committed
outputs. It does not require the backend checkout or network access.

`pnpm verify:fast` and `pnpm verify` include this gate.

## Updating the contract

Select an intentional, committed backend revision. Confirm its OpenAPI artifact
is clean, then run:

```bash
pnpm contracts:sync -- --source /absolute/path/to/docs/openapi/openapi.yaml
pnpm contracts:generate
pnpm contracts:check
```

Review all four contract artifacts together:

- `openapi.yaml` shows protocol changes;
- `provenance.json` identifies their source;
- `generated.ts` shows the TypeScript impact.
- `runtime.generated.ts` shows the runtime-validation impact.

CI and normal builds consume only these committed frontend files. They must not
read a sibling checkout or download a live schema.

## Remaining boundary

The generated `paths` type prevents the password-login function from inventing
its method, path, or request body. Generated operation/component types constrain
the call at compile time. The corresponding generated Zod schema validates the
untrusted successful response at runtime.

The backend contract currently lists error codes through `x-error-codes` but
does not describe error response bodies. For that reason, problem-detail
parsing remains a small handwritten runtime boundary rather than an inferred
`openapi-fetch` error type.

Login UI, input validation at a Server Action boundary, session storage,
cookies, refresh coordination, logout, and authenticated requests remain
unimplemented. Their accepted sequence is tracked in
[`docs/exec-plans/README.md`](../exec-plans/README.md).

The complete coverage matrix and expected design for JSON envelopes, metadata,
`204`, raw responses, cache enforcement, cancellation, authentication,
idempotency, generated problems, and diagnostics are recorded in
[API foundation coverage and roadmap](api-foundation-roadmap.md).
