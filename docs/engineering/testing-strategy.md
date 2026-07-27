# Lamara Web Testing Strategy

## Purpose

This document defines how Lamara Web tests behavior.

Tests should reduce the cost of change without coupling the codebase to
implementation details.

## Principles

- Test observable behavior and stable invariants.
- Use the lowest stable layer that proves the requirement.
- Keep tests deterministic.
- Prefer small focused tests over broad snapshots.
- Do not hit real external services in tests unless the integration itself is
  the behavior under test.
- Add regression tests for bug fixes at the layer where the bug was introduced.

## Test Layers

### Unit Tests

Use unit tests for:

- formatting helpers,
- validation helpers,
- route/content helpers,
- download platform rules,
- release artifact selection,
- report filter normalization,
- chart/table data mapping.

Tooling:

```text
Vitest
```

### Component Tests

Use component tests for user-visible component behavior:

- controls,
- forms,
- empty/loading/error states,
- accessibility labels,
- feature-local UI behavior.

Tooling:

```text
React Testing Library
Vitest
jsdom
```

Tests should query through roles, labels, and visible text rather than component
internals.

### Browser And End-To-End Tests

Use Playwright for behavior that needs a real browser:

- page rendering,
- route navigation,
- responsive layout smoke,
- browser APIs,
- copy-to-clipboard,
- authenticated app flows (session cookie fixtures; not live Google in default
  CI).

Tooling:

```text
Playwright
```

Run with:

```bash
pnpm verify:runtime
```

## Current Required Coverage

Current baseline:

- unit test coverage for at least one utility to prove test setup,
- server auth unit coverage for session refresh, OIDC exchange, and error mapping,
- Playwright smoke coverage for public marketing routes:
  - `/`,
  - `/download`,
  - `/privacy`,
  - `/supported-sources`,
- Playwright auth smoke (`tests/e2e/auth-smoke.spec.ts`), without live Google:
  - guest marketing topbar **Sign in**,
  - unauthenticated `/dashboard` → `/login`,
  - `/login` and `/register` render,
  - signed-in cookie fixture: marketing **Dashboard** control,
  - signed-in `/dashboard` shell + **Sign out** clears access.

Auth e2e uses a sealed session cookie fixture
(`tests/e2e/helpers/session-cookie.ts`) aligned with `SESSION_SECRET` (same
default as `src/server/config/env.ts` when unset). Do not call real Google in
default CI.

As product behavior grows, tests should follow the changed behavior, not chase a
global coverage percentage.

## What To Avoid

Avoid:

- broad UI snapshots,
- tests that assert Tailwind class strings as the primary contract,
- mocking Next.js internals when route-level behavior can be tested through a
  browser,
- testing private implementation details,
- real network calls from unit or component tests,
- large shared test helpers that become another framework.

## Fixtures

Future API fixtures should live under:

```text
tests/fixtures/
```

Fixtures must be:

- minimal,
- deterministic,
- sanitized,
- named after the scenario they prove.

## Required Tests By Risk

### Low Risk

Docs and narrow static changes may need only targeted checks.

### Medium Risk

Feature behavior, route behavior, download metadata, content policy, and API
integration need tests at the owning boundary.

Run:

```bash
pnpm verify
```

Run browser evidence when the behavior is visible in the browser:

```bash
pnpm verify:runtime
```

### High Risk

Auth/session, billing, sync/privacy, leaderboard publication, release/download
security, and deployment changes need:

- unit or integration tests for rules,
- browser/runtime tests for user-visible workflows,
- failure-path coverage,
- full verification,
- human review.

## Related Docs

- `docs/engineering/harness.md`
- `docs/core/architecture.md`
- `docs/core/project-foundation.md`
- `docs/engineering/api-integration.md`
