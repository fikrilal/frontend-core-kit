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
exact generated-output drift detection, and the repository knowledge validator.

Knowledge-validator fixtures prove valid plan/link acceptance and actionable
failures for missing plan structure, status mismatches, incomplete completed
plans, broken links, and unindexed proposals.

Risk-classifier fixtures prove path tiers, declared/path maximum selection,
unknown-path escalation, invalid-plan failure, Git revision handling,
secret-safe summaries, aggregate CI outcomes, and stable workflow structure.

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
- password login, registration, non-enumerating password-reset requests,
  password-reset confirmation, clean reset redirect, opaque-cookie properties,
  authenticated current-user rendering, and logout;
- an arbitrary nonexistent-route response without naming hypothetical product
  routes.
- Axe scans for detectable WCAG 2 A/AA and 2.1 A/AA violations across the
  landing, login, login-error, registration, password-reset, protected-redirect,
  and authenticated states;
- keyboard navigation, visible login-field focus, form-error relationships,
  document titles, headings, and page landmarks.
- repository-owned visual comparisons for light/dark landing, default/error
  login, password-reset request/success, password-reset confirmation/error,
  login-reset-success, and authenticated-foundation states at a fixed desktop
  viewport.

Axe catches a useful subset of accessibility defects; it does not certify WCAG
conformance. Human keyboard, zoom/reflow, reduced-motion, and
assistive-technology review remain necessary as the product surface grows.

The local API fixture validates successful login, refresh, logout, current
user, and empty password-reset responses against generated Zod schemas before
sending them. Login, registration, password-reset request/confirmation,
refresh, and logout bodies are also generated-schema validated; invalid
requests receive a safe fixture problem.
The OpenAPI snapshot does not yet own problem response schemas, so those remain
a deliberately small handwritten test boundary.

## Commands

```bash
pnpm test
pnpm test:contracts
pnpm test:harness
pnpm contracts:check
pnpm knowledge:check
pnpm risk:classify -- --base <revision> --head <revision>
pnpm task:begin
pnpm task:verify
pnpm task:handoff -- --title "type(scope): summary" --dry-run
pnpm harness:evidence
pnpm test:e2e
pnpm test:e2e:update
pnpm verify:runtime
pnpm backend:preflight
```

Install Chromium once per machine:

```bash
pnpm exec playwright install chromium
```

Playwright runs on port 3100, starts an isolated Next.js dev output directory,
and a contract-faithful API fixture. The runner does not require Docker or
reuse a developer server.

`pnpm test:e2e:update` deliberately rewrites visual baselines. Use it only for
an intended visual change, inspect every changed PNG, and include the images in
human review. A failing comparison is evidence to investigate, not permission
to accept the current rendering. Generated diffs and actual images stay under
the ignored `test-results/` directory.

`pnpm backend:preflight` is an explicit, read-only developer diagnostic. It
loads `LAMARA_API_BASE_URL` from the process or `.env.local`, calls only
`GET /ready`, and validates the JSON with the committed generated schema. Output
reports only configuration, reachability, HTTP readiness, JSON, or contract
status; it never prints the configured origin or response body. It is not part
of default CI and does not prove login or whole-API compatibility.

`pnpm task:begin` captures pre-existing paths for one V2 active task;
`pnpm task:verify` selects existing gates only after scope, authority, maximum-
risk, and repair-budget preflight. Focused Node fixtures cover complete Git
change discovery, active-plan risk, runtime/browser prerequisites, structured
boundaries, pre-existing user changes, scope violations, repeated failures,
lane ordering, failure stop behavior, and secret-safe JSON summaries. These
commands never invoke live backend preflight automatically.

`pnpm task:handoff` fixture coverage proves action-specific stops, fresh
verification/scope requirements, clean-baseline checks, normal Git command
ordering, draft-only creation, matching-draft repair updates, body sanitization,
and no force-push. `pnpm harness:evidence` fixtures prove an empty ledger stays
insufficient, a diverse reviewed sample is only ready for human review, and
invalid plan sources or free-form fields are rejected.

## Growth

Add tests alongside an implemented boundary:

- utilities: Vitest;
- interactive components: Testing Library;
- route and browser behavior: Playwright;
- server integrations: injected HTTP-boundary tests plus focused integration
  evidence.

High-risk auth/session changes require failure-path, concurrency, and runtime
coverage.
