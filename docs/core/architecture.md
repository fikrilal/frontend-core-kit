# Lamara Web Architecture

## Purpose

This document defines the application architecture for Lamara Web.

It covers structure, module ownership, dependency rules, data-flow principles,
and long-term growth direction.

It does not define the technology stack, visual design, API schema, backend
architecture, deployment topology, or product roadmap. Those decisions belong in
separate documents.

## Product Context

Lamara Web begins as Lamara's public web presence:

- landing page,
- download page,
- privacy and product information,
- supported-source information,
- release and install guidance.

The same codebase should be able to grow into authenticated product surfaces:

- detailed usage reports,
- leaderboard,
- account settings,
- sync status,
- public profile or sharing surfaces.

The architecture must support this growth without forcing app-level complexity
into the first marketing and download pages.

## Architecture Style

Lamara Web uses a vertical-slice Next.js architecture with thin routes,
feature-owned modules, server-only integration adapters, and shared UI
primitives.

In practical terms:

- `src/app/` owns routing and route-level composition.
- `src/features/` owns product capabilities.
- `src/components/` owns shared presentation building blocks.
- `src/server/` owns server-only integrations and runtime boundaries.
- `src/contracts/` owns generated and validated external contracts.
- `src/lib/` owns small product-agnostic utilities.

Lamara Web uses one consistent boundary model, not one mandatory folder depth.
Simple features stay simple. Complex features add layers only when those layers
hide real complexity.

## Architectural Goals

- Ship landing and download pages quickly without throwaway architecture.
- Support authenticated reports and leaderboard later.
- Keep route files thin and easy to scan.
- Keep product behavior inside feature modules.
- Keep UI primitives free of business logic.
- Keep server-only code out of client components.
- Keep backend API integration behind generated contracts and server adapters.
- Avoid global state and package extraction until a real need appears.
- Preserve clear dependency direction as the product grows.
- Make important behavior testable at the lowest stable layer.

## Non-Goals

- Applying Clean Architecture mechanically to every frontend feature.
- Creating `domain`, `application`, `data`, and `presentation` folders for every
  page by default.
- Building backend business logic inside Next.js route handlers.
- Introducing a CMS before content volume requires one.
- Introducing a global client state library before cross-cutting client state
  exists.
- Starting with a monorepo or local packages before reuse is proven.
- Duplicating backend domain rules in the frontend.

## Top-Level Structure

Initial structure:

```text
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── download/
│   │   │   └── page.tsx
│   │   └── privacy/
│   │       └── page.tsx
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── global-error.tsx
├── features/
│   ├── marketing/
│   └── downloads/
├── components/
│   ├── ui/
│   └── layout/
├── server/
│   ├── config/
│   └── release-metadata/
├── contracts/
│   └── generated/
├── lib/
│   ├── format/
│   ├── validation/
│   ├── time/
│   └── url/
└── styles/
    └── globals.css
```

Future authenticated product surfaces may add:

```text
src/features/auth/
src/features/account/
src/features/reports/
src/features/leaderboard/
src/features/sync/
```

Future shared packages may be extracted only after a real second consumer or
clear ownership boundary exists.

## Ownership Rules

### `src/app/`

Owns Next.js route composition:

- routes,
- layouts,
- metadata,
- loading boundaries,
- error boundaries,
- not-found handling,
- route groups,
- route-level server composition.

Route files should be thin. They should compose feature entry points and provide
route-specific metadata or server-fetched props.

Example:

```tsx
import { DownloadPage } from "@/features/downloads";

export default function Page() {
  return <DownloadPage />;
}
```

Route files should not accumulate product rules, API mapping, formatting policy,
or complex UI behavior.

### `src/features/`

Owns product capabilities.

A feature may contain:

- feature page components,
- feature-specific presentational components,
- feature-specific hooks,
- feature-specific server loaders,
- feature-specific model and policy functions,
- feature-specific tests,
- feature-specific content data.

Each feature exports a small public API through `index.ts`.

Code outside a feature should not deep-import feature internals.

### `src/components/ui/`

Owns shared UI primitives.

Examples:

- button,
- badge,
- tabs,
- dialog,
- dropdown,
- tooltip,
- card,
- input,
- skeleton.

Rules:

- UI primitives are presentation-focused.
- UI primitives do not call APIs.
- UI primitives do not read environment variables.
- UI primitives do not import features.
- UI primitives do not know Lamara product rules.
- Radix primitives are wrapped here instead of being scattered through feature
  code.

### `src/components/layout/`

Owns shared layout components.

Examples:

- site header,
- footer,
- marketing shell,
- authenticated app shell,
- navigation containers.

Layout components may understand navigation structure, but they should not own
feature behavior or API policy.

### `src/server/`

Owns server-only runtime boundaries.

Examples:

- environment parsing and validation,
- backend API client construction,
- session and auth adapters,
- release metadata loading,
- GitHub release metadata adapters,
- observability and request context,
- server-only cache policy.

Rules:

- `process.env` is read only through `src/server/config/`.
- Raw `fetch` is limited to server adapters or generated clients.
- Server modules must not be imported by Client Components.
- Server modules should use `server-only` guards when appropriate.
- Backend business rules should not live here.

### `src/contracts/`

Owns external contracts.

Examples:

- generated OpenAPI client,
- generated API DTO types,
- contract fixtures,
- runtime schemas used at external boundaries.

Generated files must be reproducible and clearly marked as generated.

Handwritten code should not edit generated files.

### `src/lib/`

Owns small product-agnostic helpers.

Examples:

- date formatting,
- number formatting,
- URL helpers,
- validation helpers,
- string helpers with no product ownership.

Rules:

- `lib` must remain small and cohesive.
- `lib` does not import features.
- `lib` does not import `app`.
- `lib` does not import server-only modules.
- Product-specific logic belongs in features, not in generic helpers.

### `src/styles/`

Owns global styles and design-token wiring.

Feature-specific styling should stay near the feature unless it is a reusable
primitive or global token.

## Progressive Feature Depth

Lamara Web uses progressive feature architecture.

Features grow internally by complexity. Not every feature needs the same folder
depth.

### Level 1: Simple Feature

Use for content, simple display pages, and low-policy features.

```text
features/profile/
├── index.ts
├── ProfilePage.tsx
├── ProfileCard.tsx
├── get-profile.ts
└── profile-format.ts
```

Appropriate when:

- little or no product logic exists,
- one data source exists,
- backend owns most rules,
- no offline or reconciliation behavior exists,
- behavior can be tested directly through UI or small helper functions.

### Level 2: Moderate Feature

Use for features with local rules, forms, filters, charts, or reusable feature
logic.

```text
features/reports/
├── index.ts
├── ReportsPage.tsx
├── components/
├── server/
│   └── get-report-summary.ts
└── model/
    ├── report-period.ts
    └── report-filters.ts
```

Appropriate when:

- several components share feature logic,
- route or form state needs normalization,
- data requires meaningful transformation,
- behavior deserves unit tests outside UI tests.

### Level 3: Complex Feature

Use for features with substantial product-owned rules or workflow complexity.

```text
features/billing/
├── index.ts
├── domain/
│   ├── plan.ts
│   └── checkout-policy.ts
├── application/
│   └── start-checkout.ts
├── data/
│   └── billing-api.ts
└── presentation/
    ├── BillingPage.tsx
    └── PlanSelector.tsx
```

Appropriate when:

- multiple data sources are involved,
- durable product rules exist,
- failure handling is complicated,
- correctness bugs are expensive,
- logic must be tested independent of UI/framework code.

Clean Architecture and Hexagonal Architecture thinking may be used inside a
Level 3 feature, but it is not required for every feature.

## Dependency Rules

Required dependency direction:

```text
app
  -> features
  -> components/ui
  -> lib

app
  -> server
  -> contracts

features
  -> contracts
  -> lib
```

Forbidden dependencies:

- `components/ui/**` must not import `app`, `features`, `server`, or
  `contracts`.
- `components/layout/**` must not import feature internals.
- `lib/**` must not import `app`, `features`, or `server`.
- Client Components must not import `server/**`.
- Feature code must not deep-import another feature's internals.
- Generated contract files must not import product features.
- Raw backend API calls must not appear in route files or generic UI components.

Allowed dependencies:

- `app/**` may import feature public APIs and server route helpers.
- `features/**` may import shared UI, shared layout when needed, `lib`, and
  generated contracts.
- Feature-local server modules may import `server/**` adapters.
- `server/**` may import generated contracts and product-agnostic `lib` helpers.

## Route Composition

Routes are delivery concerns.

They should own:

- URL path,
- metadata,
- layout selection,
- route-level loading and error boundaries,
- route-level redirects,
- thin composition of feature entry points.

Routes should not own:

- reusable product logic,
- API response mapping,
- business rules,
- complex formatting,
- chart or table behavior,
- large presentational components.

## Server And API Boundary

Lamara Web should not become the primary backend.

Next.js server capabilities may be used for web-owned concerns:

- rendering,
- metadata,
- reading validated environment configuration,
- lightweight proxying when justified,
- release metadata loading,
- route-level auth checks,
- server-side API client construction.

Backend-owned concerns should live in a separate backend service:

- account data,
- sync ingestion,
- report aggregation,
- leaderboard ranking,
- billing state,
- durable business rules,
- admin workflows.

When Lamara Web integrates with Lamara API, the default path is:

```text
page/server component
  -> feature server loader
  -> server API adapter or generated client
  -> Lamara API
```

No raw `fetch` should be scattered through UI components.

## Client Components

Client Components should be interaction islands.

Appropriate Client Components:

- chart interactions,
- filters,
- dropdowns and menus,
- copy-to-clipboard buttons,
- platform detection,
- theme controls,
- interactive tables,
- optimistic form interactions.

Avoid:

- marking whole pages as Client Components by default,
- fetching all server data in the browser by default,
- storing server-renderable content in client state,
- moving route-level auth into browser-only code.

Client Components should be as small as practical and receive server-fetched
data as props when possible.

## State Management

Lamara Web should not start with a global client state library.

Default state ownership:

- URL search params for shareable filters and navigation state.
- React local state for component-local interactions.
- Server session for auth and account state.
- Server Components for server-known data.
- TanStack Query for interactive client-side server state.

Add a global client store only when there is a real cross-page, client-only
state need that cannot reasonably live in URL, server session, or local
component state.

## Content Strategy

Initial marketing and download content should be code-owned and typed.

Examples:

```text
features/marketing/content.ts
features/downloads/supported-sources.ts
features/downloads/install-commands.ts
```

Do not introduce a CMS for the first landing and download pages.

If Lamara later adds a substantial blog, changelog, documentation library, or
editorial workflow, a content system can be introduced with a separate decision.

## Download Data Strategy

The download page should initially use deterministic release metadata.

Acceptable early sources:

- static release metadata checked into the repo,
- generated release metadata artifact,
- GitHub release metadata loaded server-side with caching.

The page should distinguish:

- stable downloads,
- preview downloads,
- signed updater metadata,
- platform-specific install instructions,
- unsupported platform states.

Download analytics, account-linked downloads, and release entitlement checks are
not part of the initial architecture.

## Authentication And Future App Surfaces

Authenticated surfaces are expected later, but should not complicate the
initial marketing implementation.

When added, authentication should follow these rules:

- route groups separate public and authenticated surfaces,
- server-side session checks protect authenticated routes,
- auth state is not duplicated into broad client global state,
- backend API contracts define account and report data shapes,
- client-side auth helpers are thin UI affordances, not authoritative access
  control.

Expected future route groups:

```text
src/app/(marketing)/
src/app/(app)/
```

## Testing Strategy

Tests should prove behavior at the lowest stable layer.

Use unit tests for:

- formatting helpers,
- validation helpers,
- download platform detection,
- release artifact selection,
- report filter normalization,
- chart data mapping.

Use component tests for:

- user-visible states,
- accessible controls,
- forms,
- loading and error views,
- feature component behavior.

Use Playwright for:

- landing page smoke,
- download page smoke,
- main navigation,
- responsive rendering,
- critical authenticated workflows once they exist.

Do not use broad snapshots as a substitute for behavior tests.

## Verification Expectations

The repository should expose stable commands for:

```text
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm verify
```

Architecture checks should be added when manual review repeatedly catches the
same boundary mistake.

Expected future checks:

- UI primitives do not import features or server modules.
- Client Components do not import server-only modules.
- Raw environment access is limited to config.
- Raw API calls are limited to server adapters or generated clients.
- Feature deep imports are rejected.
- Generated contracts are not manually edited.

## Documentation Rules

Significant architecture changes should update this document or create a
decision record.

Docs should distinguish:

- technology choices,
- architecture rules,
- product roadmap,
- backend API contracts,
- deployment decisions.

Do not hide architecture changes inside implementation PRs without updating the
source-of-truth documentation.

## Decision Status

This architecture is approved for the initial Lamara Web foundation.

It should be revisited when Lamara Web adds authenticated app surfaces, backend
API integration, or a second deployable frontend surface.
