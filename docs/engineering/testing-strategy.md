# Lamara Frontend Testing Strategy

## Principles

- Test implemented behavior only.
- Prefer the lowest stable layer that proves the requirement.
- Query visible UI by role, label, and text.
- Avoid broad snapshots and framework-internal assertions.
- Do not call real external services in the default suite.

## Current coverage

Unit and component tests cover theme preference and the theme control.

Playwright covers:

- landing-page content and active anchor navigation;
- manifest, robots, sitemap, icon, and social-image endpoints;
- confirmation that deferred product routes remain unimplemented.

There are no auth, session, API, download, or report tests because those
features do not exist.

## Commands

```bash
pnpm test
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
- server integrations: injected unit tests plus focused integration evidence.

High-risk auth/session work requires failure-path, concurrency, and runtime
coverage when it begins.
