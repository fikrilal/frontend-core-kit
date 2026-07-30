# Lamara Frontend Architecture

## Current system

Lamara Frontend is a single Next.js application. It currently serves one
statically rendered marketing page and metadata routes. It also owns a
build-time snapshot of the backend OpenAPI contract and one server-only
password-login adapter used only by tests. It has no login route, session,
persistence, or authenticated runtime.

```text
browser
  -> Next.js App Router
  -> marketing route
  -> marketing feature
  -> local layout and theme components
```

Theme preference is the only client-owned state. It is stored in
`localStorage`.

## Ownership

```text
src/app/
  Routes, layouts, metadata, and route-level composition.

src/features/
  Product-owned pages and behavior. Current runtime feature: marketing.
  Auth currently owns only an unexposed server adapter experiment.

src/components/layout/
  Cross-page layout chrome.

src/components/ui/
  Generic primitives, added only when an active feature needs them.

src/components/theme/
  Theme initialization, synchronization, and controls.

src/lib/
  Small product-independent utilities.

src/server/
  Validated server configuration and shared HTTP protocol behavior.

src/contracts/
  Committed external contract locks and generated types/runtime schemas.
```

Empty future folders are not required. Documentation must not claim a boundary
exists until code using it lands.

## Contract boundary

```text
backend-core-kit OpenAPI artifact
  -> explicit contracts:sync
  -> committed frontend snapshot + provenance
  -> deterministic TypeScript types + Zod runtime schemas
```

The backend owns the protocol. The frontend snapshot selects an intentional
compatible revision and makes drift reviewable. Normal verification generates
from that committed snapshot and never depends on the sibling backend checkout.

Generated TypeScript types provide compile-time evidence. Generated Zod schemas
validate untrusted network responses at runtime. Both artifacts come from the
same committed OpenAPI snapshot and are checked for drift.

## Dependency direction

```text
app routes
  -> feature public APIs
  -> layout / UI / lib
```

Current server integration:

```text
feature server module
  -> typed server API client + Lamara response normalization
  -> generated contract
  -> external service
```

No route reaches this path yet. Tests exercise it through the HTTP boundary.

Rules:

- Route files stay thin and compose feature entry points.
- Product behavior belongs to its feature.
- Generic UI components contain no Lamara business rules.
- Client Components do not import server-only code.
- `process.env` is read only through approved runtime configuration.
- Raw network calls live behind server adapters.
- External data is validated at runtime.
- Features expose a small public API through `index.ts`.
- Do not add state managers, repositories, use cases, or packages before a real
  requirement exists.

## Rendering and state

Use Server Components by default. Add a Client Component only for browser APIs,
local interaction state, or event handlers. Keep client boundaries as low as
practical.

Prefer state in this order:

1. server data;
2. URL state;
3. component-local state;
4. shared client state only for a proven cross-tree need.

## Growth rule

Add structure progressively:

- a display feature may need only a page component and `index.ts`;
- a feature with forms or data loading may add `components/` and `server/`;
- domain/application/data layers are reserved for behavior complex enough to
  benefit from those boundaries.

The remaining accepted network direction lives in
`docs/engineering/api-foundation-roadmap.md`. Sessions, refresh, authentication
routes, additional HTTP methods, and user-facing authenticated features are not
implemented.
