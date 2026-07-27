# Lamara Web Technology Stack

## Purpose

This document records the technologies selected for Lamara Web.

It does not define application architecture, folder structure, route ownership,
data flow, backend contracts, deployment topology, or product roadmap. Those
decisions belong in separate documents.

## Product Scope

Lamara Web starts as the public web presence for Lamara:

- landing page,
- download page,
- product and privacy information,
- release and install guidance.

The same codebase should be able to grow into authenticated web surfaces later,
including detailed reports, account settings, sync status, and leaderboards.

## Runtime And Framework

### Next.js App Router

Next.js App Router will provide the web application framework.

It was selected because Lamara Web needs strong support for public SEO-oriented
pages now and authenticated product surfaces later. App Router provides
file-based routing, nested layouts, metadata support, server rendering, React
Server Components, and clear deployment support on Vercel.

Lamara Web should default to Server Components for route composition and static
or server-rendered content. Client Components should be used only when the UI
needs browser APIs, local interaction state, event handlers, or client-side
data refresh.

### React

React will be used for UI composition.

It aligns with the existing Lamara desktop frontend and keeps the future web app
surface close to the interaction model already used in the product.

### TypeScript

TypeScript will be the primary language for Lamara Web.

The project should use strict TypeScript settings. Runtime boundary data must be
validated instead of trusted only through compile-time types.

## Styling And Design System

### Tailwind CSS

Tailwind CSS will provide styling utilities and design-token application.

It is a good fit for Lamara's product UI because it supports fast iteration,
responsive layouts, and a small owned design system without adopting a large
component framework.

### UI component sources

Lamara Web owns UI in-repo via a **shadcn-compatible** local model. Primary
sources (configured in `components.json`):

| Source                  | Use for                                                 |
| ----------------------- | ------------------------------------------------------- |
| **shadcn/ui**           | Base primitives and CLI conventions                     |
| **chanhdai** (`@ncdai`) | Polished blocks (auth layouts, command/code, nav craft) |
| **beUI** (`@beui`)      | Motion (press feedback, springs, animated controls)     |

Full adoption rules: `docs/design/design-system.md`.

### Radix UI

Radix UI will provide accessible, unstyled primitives where behavior is
non-trivial, such as dialogs, popovers, dropdown menus, tooltips, tabs, and
switches.

Lamara Web should wrap Radix primitives in Lamara-owned UI components rather
than exposing Radix usage throughout feature code.

### Lucide

Lucide will provide interface icons.

It matches the existing Lamara desktop icon direction and is suitable for
product UI, marketing affordances, navigation, and download actions.

### Motion

The `motion` package (and beUI-derived tokens/helpers such as `src/lib/ease.ts`)
powers intentional press and page transitions. Prefer subtle feedback; always
respect `prefers-reduced-motion`.

## Data Validation And Contracts

### Zod

Zod will validate runtime data at application boundaries.

Expected uses include environment variables, route/search parameters, API
responses not produced by generated clients, form payloads, and content
metadata.

### OpenAPI-Generated API Client

When Lamara Web integrates with a backend, API types and client helpers should
be generated from the backend OpenAPI contract.

Handwritten fetch shapes should not become the long-term integration model.
Generated contracts reduce drift between Lamara Web and Lamara API.

## Data Fetching And State

### Server Components First

Server Components should be the default data-loading and composition model for
public pages and authenticated pages that can be rendered from server-known
state.

This keeps client JavaScript smaller and avoids unnecessary client-side state
for content that is not interactive.

### TanStack Query

TanStack Query will be used for client-side server state only when a view needs
interactive refresh, optimistic updates, polling, background refetching, or
cache-aware client interactions.

It should not be used by default for static marketing content or simple
server-rendered pages.

### Local UI State

Local React state is sufficient for component-local interaction state.

Introduce shared client state only when multiple independent UI areas need to
coordinate state that cannot reasonably live in the URL, server session, or
component tree.

## Data Visualization

### Apache ECharts

Apache ECharts will provide charts for future reports and leaderboard surfaces.

It aligns with Lamara desktop's selected visualization direction and supports
the interactive charts likely needed for token usage reports.

### TanStack Table

TanStack Table will provide table behavior for future report and leaderboard
views.

It should be used for sorting, pagination, column composition, and dense data
surfaces. Simple marketing tables do not require it.

## Testing

### Vitest

Vitest will run TypeScript unit tests for utilities, validation, formatting,
small UI logic, and other fast deterministic behavior.

### React Testing Library

React Testing Library will test user-visible component behavior.

Tests should prefer roles, labels, text, and observable state over component
internals.

### Playwright

Playwright will provide end-to-end and smoke coverage for critical web flows.

Initial coverage should include landing page rendering, download page rendering,
basic navigation, and important responsive breakpoints.

## Code Quality

### ESLint

ESLint will enforce TypeScript, React, accessibility, import, and architectural
rules.

Lamara Web should add local architecture checks where ESLint alone is not
enough, especially around generated contracts, server-only modules, UI-only
components, and feature boundaries.

### Prettier

Prettier will provide consistent formatting for supported source and
documentation files.

### TypeScript Type Checking

Type checking must be part of the default verification command.

The project should not use `any` or unsafe type assertions to silence compiler
errors.

## Package Management

### pnpm

pnpm will manage JavaScript and TypeScript dependencies.

It aligns with the existing Lamara desktop repository and supports a future
workspace layout if Lamara Web later needs local packages.

## Deployment

### Vercel

Vercel will be the default deployment target for Lamara Web.

It is the lowest-friction deployment path for Next.js and supports preview
deployments, production deployments, edge caching, and future server-rendered
web app surfaces.

The backend API should remain separately deployable. Lamara Web should not
depend on colocating backend business logic inside Next.js route handlers.

## Explicitly Not Selected

### Astro

Astro is not selected as the primary framework.

It is excellent for content-heavy sites and low-JavaScript marketing pages, but
Lamara Web is expected to grow into authenticated reports, leaderboard, account,
and sync surfaces. Starting with Next.js avoids introducing a second app
framework when the product becomes more interactive.

### Vite SPA

A Vite single-page React app is not selected as the primary framework.

It is a strong choice for fully client-rendered applications, but Lamara Web
needs SEO, metadata, server rendering, and public landing pages from the start.

### React Router Framework Mode

React Router Framework Mode is not selected for the initial Lamara Web stack.

It is viable, but Next.js currently provides a more complete default for the
combination of public website, authenticated app, metadata, deployment, and
server-rendered product surfaces.

### Large Component Frameworks

Large component frameworks such as Material UI or Ant Design are not selected.

Lamara should own its product feel and interface density. Accessible primitives
plus Lamara-owned components are a better fit than adopting a broad visual
framework.

### Next.js Route Handlers As The Main Backend

Next.js route handlers are not selected as the primary backend architecture.

They may be used for narrow web-owned concerns when appropriate, but Lamara's
future sync, account, report, and leaderboard backend should live in a separate
backend service with explicit contracts.

## Decision Status

These choices are approved for the initial Lamara Web foundation.

They may be revisited when product requirements reveal a concrete limitation.
Changes should be based on measured needs rather than speculative future
flexibility.
