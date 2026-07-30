# Lamara Frontend Testing Strategy

## Principles

- Test implemented behavior only.
- Prefer the lowest stable layer that proves the requirement.
- Query visible UI by role, label, and text.
- Avoid broad snapshots and framework-internal assertions.
- Do not call real external services in the default suite.

## Current coverage

Unit and component tests cover theme preference and the theme control. Node
tests cover contract-source argument validation, snapshot validation, hashing,
and exact generated-output drift detection.

HTTP-boundary server tests cover:

- validated API-origin configuration;
- typed password-login request construction;
- success-envelope and generated-schema validation;
- problem details and request-ID correlation;
- invalid/malformed responses without secret leakage;
- network, timeout, and caller-cancellation failures;
- invalid internal request bodies.
- code-first password-login failure mapping with HTTP-status fallback;
- separation between backend problem text and frontend-owned copy.

Session tests cover:

- session establishment and expiry;
- access-token reuse and rotation;
- concurrent single-refresh behavior;
- atomic replacement of both rotated tokens;
- transient, terminal, and unknown refresh outcomes;
- in-memory compare-and-set and lock behavior.

Playwright covers:

- generic landing-page content and sign-in navigation;
- manifest, robots, sitemap, icon, and social-image endpoints;
- protected-route redirection;
- password login, opaque-cookie properties, authenticated current-user
  rendering, and logout;
- an arbitrary nonexistent-route response without naming hypothetical product
  routes.

## Commands

```bash
pnpm test
pnpm test:contracts
pnpm contracts:check
pnpm test:e2e
pnpm verify:runtime
```

Install Chromium once per machine:

```bash
pnpm exec playwright install chromium
```

Playwright runs on port 3100, starts an isolated Next.js dev output directory,
and a contract-faithful API fixture. The runner does not require Docker or
reuse a developer server.

## Growth

Add tests alongside an implemented boundary:

- utilities: Vitest;
- interactive components: Testing Library;
- route and browser behavior: Playwright;
- server integrations: injected HTTP-boundary tests plus focused integration
  evidence.

High-risk auth/session changes require failure-path, concurrency, and runtime
coverage.
