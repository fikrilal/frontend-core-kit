# Lamara Frontend Architecture

## Current system

Lamara Frontend is one Next.js application with a generic public page and a
narrow authenticated infrastructure proof.

```text
browser
  -> Next.js App Router
     -> marketing feature
     -> auth feature
        -> server API adapters
        -> session service
           -> process-memory store
        -> generated Lamara API contract
           -> Lamara backend
```

Implemented routes:

- `/`: generic under-development landing page;
- `/login`: email/password login;
- `/app`: protected current-user proof, not a product dashboard;
- `/app/profile`: authenticated profile editor through `PATCH /v1/me`, with a
  profile-image upload-plan action through `POST /v1/me/profile-image/upload`
  and upload confirmation through `POST /v1/me/profile-image/complete`;
- `/app/sessions`: authenticated sessions list through `GET /v1/me/sessions`
  with per-session revocation through `POST /v1/me/sessions/{sessionId}/revoke`;
- `/app/password`: authenticated change-password form through
  `POST /v1/auth/password/change`;
- `/app/account-deletion`: authenticated account-deletion request through
  `POST /v1/me/account-deletion/request`, with cancellation of a pending
  request through `POST /v1/me/account-deletion/cancel`.

Theme preference is the only client-owned application state and lives in
`localStorage`. Authentication state is server-owned.

## Ownership

```text
src/app/
  Thin routes, layouts, metadata, and route-level composition.

src/features/
  User-visible behavior. Marketing owns the public page. Auth owns login,
  protected loading, logout, and its endpoint adapters. Users owns the
  authenticated profile flow and its endpoint adapters.

src/components/
  Cross-page layout, branding, theme behavior, and business-free primitives.

src/server/api/
  Shared typed HTTP construction and Lamara response normalization.

src/server/session/
  Opaque-cookie sessions, process-memory token storage, token rotation, and
  single-process refresh coordination.

src/server/config/
  Validated access to server-only environment.

src/contracts/
  Committed OpenAPI compatibility lock and generated types/runtime schemas.
```

Features expose a small public API through `index.ts`. Routes import that public
API; feature internals may import their own private modules. The session layer
does not depend on the auth feature, which prevents shared server
infrastructure from depending upward on user-facing code.

### Auth feature layout

Auth is organized by user flow rather than by file type. Each flow keeps its
page, form, Server Action, state, tests, and flow-specific failure mapper
together:

```text
src/features/auth/
  index.ts                         public route entry points
  server/                          shared contract-backed auth API adapters
  login/                           sign-in flow
  register/                        account-creation flow
  password-reset/                  request and confirmation flows
  password-change/                 authenticated change-password flow
  email-verification/              public verification-link flow
  session/                         session establishment, loading, logout
```

`server/` is intentionally small. It owns the shared `auth-api.ts` adapter and
its transport-contract tests; a failure mapper stays beside the flow state it
produces instead of becoming a generic server bucket. The root `index.ts` only
exports route-level pages, so App Router files remain thin and flow internals
stay private.

### Users feature layout

The users feature follows the same per-flow organization and owns the
authenticated `/v1/me/*` account surface, starting with profile:

```text
src/features/users/
  index.ts                         public route entry points
  server/                          shared contract-backed users API adapters
  profile/                         profile update flow
  profile-image/                   profile image upload-plan flow
  sessions/                        sessions list and revoke flows
  account-deletion/                account-deletion request flow
```

The existing auth `session/` flow continues to own session establishment and
loading; the users feature adds profile editing without touching it.

## Contract and request boundary

```text
backend OpenAPI artifact
  -> explicit contracts:sync
  -> committed snapshot + provenance
  -> generated TypeScript and Zod
  -> feature endpoint adapter
  -> shared response normalization
```

The committed snapshot is an intentional frontend compatibility revision.
Normal builds never read a sibling checkout or download a live contract.
Generated types constrain method, path, body, and response at compile time.
Generated complete-envelope schemas validate successful responses at runtime.

Feature endpoint adapters explicitly select timeout and cache policy. The
shared boundary handles request IDs, JSON-compatible content types, normal
envelopes, empty `204` responses, safe problem details, network outcomes, and
invalid responses. It does not own product copy or sessions.

## Authentication and rendering

Login and logout use Server Actions. `/app` is a Server Component and loads the
current user on the server. The browser stores only a random opaque
`HttpOnly` cookie. API tokens remain in the Next.js server process.

The authenticated read flow is:

```text
cookie -> memory session -> usable access token -> /v1/me
                         -> expiring/401 -> coordinated refresh -> retry once
```

The application deliberately supports one Next.js process. Its in-memory store
coordinates concurrent refreshes inside that process. Restarting or
redeploying it invalidates every frontend session and requires users to sign in
again. See
[`docs/engineering/session-management.md`](../engineering/session-management.md).

## Dependency and growth rules

- Route files compose feature entry points and metadata only.
- Server Components are the default.
- Client Components are limited to browser APIs, local interaction, and event
  handlers.
- Client Components never import server-only modules.
- Raw network access stays behind server adapters or generated contracts.
- External data is runtime validated.
- `process.env` is read only by approved config/runtime files.
- No global client state, query cache, repository/use-case hierarchy, or
  product app shell exists without a concrete requirement.
- Add feature layers only when current behavior benefits from them.

Detailed product positioning and workflows remain undecided. The authenticated
proof must not grow into invented navigation or features.
