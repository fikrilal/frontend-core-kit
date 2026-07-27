# Burnly Web API Integration

## Purpose

This document is the durable source of truth for how Burnly Web talks to Burnly
API.

It covers ownership, network contracts, session/auth core, environment variables,
and how features should call the API.

It does not define login/register product UI details or usage report read APIs
(those must exist on burnly-api first).

Desktop sign-in is web-mediated (browser login → deep link → desktop token
exchange). Implementer plan: `docs/planning/desktop-auth-web-handoff.md`.
API: `POST /v1/auth/desktop/handoff` (web) and `POST /v1/auth/desktop/token`
(desktop only).

## Status

| Phase | Scope                                                            | Status      |
| ----- | ---------------------------------------------------------------- | ----------- |
| 1     | Server API client, envelope/problem-details, env base URL        | Done        |
| 2     | Session/auth core (cookie BFF, login/refresh/logout/me adapters) | Done        |
| 3     | Login/register UI + authenticated app routes                     | Not started |

Completed execution plans:

- `docs/exec-plans/completed/2026-07-10_api-core-phase-1.md`
- `docs/exec-plans/completed/2026-07-10_api-session-phase-2.md`

## Ownership

```text
src/server/config/     # validated env (including API + session secrets)
src/server/api/        # HTTP client, envelope/problem parsing, health smoke
src/server/auth/       # session store, refresh, auth adapters
src/contracts/         # paths + Zod schemas for Burnly API payloads
src/features/*/server/ # feature loaders that call server auth/api (when added)
src/app/               # thin routes only
```

Dependency direction:

```text
route / feature server loader
  -> src/server/auth (session helpers, auth adapters)
  -> src/server/api (HTTP client)
  -> src/contracts (paths + schemas)
  -> Burnly API
```

Forbidden:

- Client Components importing `src/server/**`
- UI primitives calling APIs
- `process.env` outside `src/server/config/`
- raw `fetch` outside `src/server/**`, `src/contracts/**`, scripts, and tests
- long-lived refresh tokens in `localStorage`, `sessionStorage`, or JS-readable
  cookies

Architecture background: `docs/core/architecture.md`.

## Network contract (aligned with burnly-api)

| Topic       | Rule                                                       |
| ----------- | ---------------------------------------------------------- |
| Success     | `{ data, meta? }`                                          |
| Error       | `application/problem+json` with stable `code` + `traceId`  |
| Auth        | `Authorization: Bearer <accessToken>` for protected routes |
| Refresh     | opaque refresh token; rotated on every successful refresh  |
| Correlation | `X-Request-Id` generated/attached by the web client        |
| Writes      | `Idempotency-Key` when safe retries matter                 |
| Versioning  | product routes under `/v1/*`                               |

API sources:

- OpenAPI: burnly-api `docs/openapi/openapi.yaml`
- Response standard: burnly-api `docs/standards/api-response-standard.md`
- Auth standard: burnly-api `docs/standards/authentication.md`
- Refresh/retry: burnly-api `docs/engineering/auth/token-refresh-and-request-retry.md`

## Phase 1 — API client

Location: `src/server/api/`

Public surface (via `src/server/api/index.ts`):

- `createBurnlyApiClient` / `getBurnlyApiClient`
- `getJson` / `postJson` / `putJson` / `patchJson` / `deleteJson`
- `parseEnvelope` / `parseProblem`
- `getApiHealth` (raw JSON, `envelope: false`)

Result type: `ApiResult<T>` = success `{ ok: true, data, meta?, status, traceId }`
or failure `{ ok: false, error: ApiProblem, status, traceId }`.

Options include `accessToken`, `idempotencyKey`, `requestId`, `envelope`
(default `true`), and optional `parse` for Zod or other validation.

Paths: `src/contracts/burnly-api/paths.ts`.

## Phase 2 — Session and auth core

Location: `src/server/auth/`

### Session model (cookie BFF)

```text
Browser
  -> httpOnly sealed session cookie
  -> Next.js server (session helpers + API client)
  -> Burnly API (Bearer access token)
```

- Default store: sealed JWE cookie (`jose`, `dir` + `A256GCM`)
- Interface: `SessionStore` (`read` / `write` / `clear`)
- Implementations: `createCookieSessionStore`, `createMemorySessionStore` (tests)
- Session payload stays minimal: `userId` + tokens (`accessToken`,
  `refreshToken`, `accessExpiresAtMs`)

### Session helpers

- `getSession()` — read store; refresh near expiry; clear on terminal refresh
  failure
- `requireSession()` — throws `SessionRequiredError` when unauthenticated
- `clearSession()` / `establishSession()`

### Auth API adapters (`createAuthApi`)

| Method                    | Endpoint                                      |
| ------------------------- | --------------------------------------------- |
| `loginWithPassword`       | `POST /v1/auth/password/login`                |
| `registerWithPassword`    | `POST /v1/auth/password/register`             |
| `exchangeOidc`            | `POST /v1/auth/oidc/exchange` (Google)        |
| `createDesktopHandoff`    | `POST /v1/auth/desktop/handoff` (Bearer)      |
| `refreshTokens`           | `POST /v1/auth/refresh`                       |
| `logoutRemote` / `logout` | `POST /v1/auth/logout` (+ always clear local) |
| `getMe`                   | `GET /v1/me`                                  |

`exchangeOidc` accepts `{ provider: "GOOGLE", idToken, deviceId?, deviceName? }`,
parses `AuthResultWithMe`, and establishes the sealed session cookie — same
session path as password login. UI must obtain the Google `idToken` (e.g. GIS)
and call this only from a Server Action / route handler.

`createDesktopHandoff` posts
`{ redirectUri, codeChallenge, codeChallengeMethod: "S256", state, client: "desktop" }`
with the session access token and returns `{ code, expiresIn, redirectUri, state }`.
Web does not call `/v1/auth/desktop/token` (desktop only).

### Desktop post-login branch

After Google OIDC establishes the web session cookie:

| Context                     | Navigation                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Browser (no desktop params) | `/dashboard?welcome=1`                                                                    |
| Desktop params + handoff OK | `redirectUri?code=&state=` (http(s) directly; custom schemes via `/login/desktop-return`) |
| Desktop handoff fail        | `/login/desktop-error?reason=<code>` or inline error on the Google button                 |

Already signed-in users who open a valid `/login?client=desktop&…` link skip Google and run handoff immediately.

Contracts: `src/contracts/burnly-api/auth.ts`, `src/contracts/burnly-api/me.ts`.

### Refresh rules

- Single-flight per refresh token (no concurrent reuse)
- Successful refresh persists **both** new access and refresh tokens
- Terminal codes clear session: `AUTH_REFRESH_TOKEN_*`, `AUTH_SESSION_REVOKED`,
  `UNAUTHORIZED` on refresh
- Transient failures (`5xx`, network) do not clear the refresh token
- `withAuthRetry` may refresh once and retry **reads** after `401 UNAUTHORIZED`

## Environment

Configured in `src/server/config/env.ts` and documented in `.env.example`:

| Variable                       | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `BURNLY_API_BASE_URL`          | Burnly API origin (default `http://127.0.0.1:4000`)      |
| `NEXT_PUBLIC_SITE_URL`         | Public site origin for metadata                          |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google GIS web client ID (optional; enables Google UI)   |
| `SESSION_SECRET`               | Sealed cookie key (min 32 chars; required in production) |
| `SESSION_COOKIE_NAME`          | Optional cookie name (default `burnly_session`)          |
| `ACCESS_TOKEN_SKEW_SECONDS`    | Refresh this many seconds before JWT exp (default 30)    |

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is public by design (browser GIS). The same ID
must be listed in burnly-api `AUTH_OIDC_GOOGLE_CLIENT_IDS`. Never put secrets in
`NEXT_PUBLIC_*`.

## How features should call the API

Prefer server loaders / server actions:

```ts
import { createAuthApi, createCookieSessionStore } from "@/server/auth";

const auth = createAuthApi({ store: createCookieSessionStore() });

// Login (Server Action / route handler — mutable cookie context)
const login = await auth.loginWithPassword({ email, password });

// Google OIDC (Server Action — idToken from GIS in the browser)
const oidc = await auth.exchangeOidc({
  provider: "GOOGLE",
  idToken,
});

// Protected load
const session = await auth.session.requireSession();
const me = await auth.getMe(session.tokens.accessToken);

// Logout
await auth.logout();
```

For unit tests, inject `createMemorySessionStore()` and
`createBurnlyApiClient({ fetch: mockFetch, baseUrl })`.

## Google sign-in flow (web)

```text
Browser GIS (id_token)
  -> Server Action signInWithGoogleIdToken
  -> auth.exchangeOidc (POST /v1/auth/oidc/exchange)
  -> sealed session cookie
  -> redirect /dashboard?welcome=1
```

Feature entry: `src/features/auth/actions/sign-in-with-google.ts`,
`GoogleSignInButton`.

Authenticated home (placeholder): `/dashboard` via `src/features/dashboard`.
Requires a session cookie; unauthenticated users redirect to `/login`.
`?welcome=1` shows a one-shot signed-in banner (query cleared client-side).

OIDC / network failures are mapped in `mapOidcErrorToMessage` (never raw
`fetch failed`).

## Sign out

Server Action `signOut` (`src/features/auth/actions/sign-out.ts`) calls
`auth.logout()` (remote logout best-effort + clear cookie) then redirects to
`/login`. UI: `SignOutButton` on the dashboard header.

## Marketing session chrome

`(marketing)` layout resolves the session cookie and passes `signedIn` /
`userLabel` into `SiteTopbar`: guests see **Sign in**, signed-in users see
**Dashboard** (and email/name on large screens).

## What is intentionally not here yet

- Full authenticated app shell (nav, settings)
- Real usage/report widgets on the dashboard
- GitHub OAuth (API does not support it yet)
- OIDC connect / password link UI for `AUTH_OIDC_LINK_REQUIRED`
- Reports enhancements: device filter UI, CSV export, custom date ranges
  (base reads all wired — dashboard + `/reports` + `/reports/[date]` +
  per-tool rollup; see `docs/engineering/usage-report-api-contracts.md`)
- OpenAPI-generated client pipeline (handwritten contracts are OK for now)
- TanStack Query as default data layer

## Related docs

- Architecture: `docs/core/architecture.md`
- Tech stack: `docs/core/tech-stack.md`
- Harness: `docs/engineering/harness.md`
- Testing: `docs/engineering/testing-strategy.md`
- Usage/report contracts: `docs/engineering/usage-report-api-contracts.md`
