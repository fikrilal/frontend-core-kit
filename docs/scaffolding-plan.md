# Frontend Scaffolding Plan (lamara-web as reference)

This document outlines the plan for building the `lamara-frontend` core kit, using `lamara-web` as our blueprint. The goal is to establish a rigorous, feature-driven, and highly maintainable Next.js foundation that matches the standards of `lamara-backend`.

## 1. What to Port from `lamara-web`

We will copy and adapt the following foundational elements from `lamara-web`:

### 1.1 Core Stack & Dependencies
- **Framework:** Next.js 16 (App Router) + React 19.
- **Styling:** Tailwind CSS v4, `shadcn/ui`, Radix UI primitives.
- **Motion:** Framer Motion (`motion` package).
- **State & Data:** Jotai for local state, Zod for validation.
- **Testing:** Vitest (Unit) and Playwright (E2E).

### 1.2 Configuration Files
- `package.json` (Scripts, dependencies, and devDependencies).
- `tsconfig.json` (Strict TypeScript compiler options).
- `eslint.config.mjs` & `prettier.config.mjs` (Code quality rules).
- `postcss.config.mjs` (For Tailwind v4 processing).
- `components.json` (shadcn/ui configuration).
- `playwright.config.ts` & `vitest.config.ts`.

### 1.3 Developer Experience (DX) & CI/CD
- **Harness Scripts:** The custom `scripts/harness` directory (e.g., `check-architecture.mjs`) to enforce architectural boundaries.
- **Git Hooks:** `commitlint` and the `scripts/install-git-hooks.cjs` setup to enforce semantic commits.
- **AGENTS.md & CLAUDE.md:** Adapting the agent instructions so AI assistants maintain the strict architecture.

### 1.4 Architectural Scaffolding
- **Folder Structure:**
  - `src/app/` (Thin routing layer).
  - `src/components/ui/` (Dumb, reusable shadcn components).
  - `src/features/` (Domain-driven feature modules).
  - `src/contracts/` (API types and validation schemas).
  - `src/server/` (Server-only utilities, actions, and data fetching).
  - `src/lib/` (General frontend utilities like `cn()`).

## 2. What to Scaffold Fresh (Specific to Lamara)

While the foundation is ported, the product itself needs to be uniquely scaffolded for Lamara:

### 2.1 Project Meta & Branding
- **README.md:** specific to the Lamara frontend.
- **Environment Variables:** Define `.env.example` specific to Lamara's backend API and authentication needs.
- **Public Assets:** Favicons, fonts, and global CSS (`src/app/globals.css`) specific to Lamara's design system.

### 2.2 API & Data Fetching Integration
- We need to establish how `lamara-frontend` will talk to `lamara-backend`. 
- Since `lamara-backend` uses Swagger/OpenAPI, we will want to scaffold an OpenAPI client generator (e.g., `orval` or `openapi-fetch`) to auto-generate `src/contracts` directly from the backend.

### 2.3 Initial Routes & Layouts
- **Root Layout:** `src/app/layout.tsx` with Lamara's font (e.g., Inter/Geist) and core providers.
- **Initial Pages:** A basic landing page (`/`) and a dashboard/auth placeholder, rather than porting Lamara's specific product pages.

## 3. Execution Plan

1. **Phase 1: Foundation Initialization**
   - Copy over base configs (`package.json`, `tsconfig.json`, linters, harness scripts).
   - Install dependencies.
2. **Phase 2: UI & Architecture Setup**
   - Setup Tailwind v4 and `shadcn/ui` base components.
   - Create the `src/{app,features,components,contracts,server}` folder structure.
3. **Phase 3: Integration & Tooling**
   - Set up API client generation pointing to `lamara-backend`.
   - Verify all harness checks (`pnpm verify`) pass with the empty foundation.
4. **Phase 4: Agent & Documentation Setup**
   - Write the Lamara-specific `AGENTS.md` and update `docs/`.
