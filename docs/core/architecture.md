# Lamara Frontend Architecture

## Current system

Lamara Frontend is a single Next.js application. It currently serves one
statically rendered marketing page and metadata routes. It has no backend,
session, persistence, or authenticated runtime.

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
  Product-owned pages and behavior. Current feature: marketing.

src/components/layout/
  Cross-page layout chrome.

src/components/ui/
  Generic primitives, added only when an active feature needs them.

src/components/theme/
  Theme initialization, synchronization, and controls.

src/lib/
  Small product-independent utilities.

src/server/
  Reserved for implemented server-only integrations.

src/contracts/
  Reserved for implemented external contracts and generated artifacts.
```

Empty future folders are not required. Documentation must not claim a boundary
exists until code using it lands.

## Dependency direction

```text
app routes
  -> feature public APIs
  -> layout / UI / lib
```

When server integration exists:

```text
feature server module
  -> server adapter
  -> generated contract
  -> external service
```

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

The draft network architecture lives in
`docs/planning/api-core-network-proposal.md`. It is not implemented or
normative.
