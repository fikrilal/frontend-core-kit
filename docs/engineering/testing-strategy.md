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

Playwright covers:

- landing-page content and active anchor navigation;
- manifest, robots, sitemap, icon, and social-image endpoints;
- confirmation that deferred product routes remain unimplemented.

There are no login route, browser authentication, session, download, or report
tests because those runtime features do not exist.

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

Playwright starts `pnpm dev` automatically and reuses an existing local server
outside CI.

## Growth

Add tests alongside an implemented boundary:

- utilities: Vitest;
- interactive components: Testing Library;
- route and browser behavior: Playwright;
- server integrations: injected HTTP-boundary tests plus focused integration
  evidence.

High-risk auth/session work requires failure-path, concurrency, and runtime
coverage when it begins.
