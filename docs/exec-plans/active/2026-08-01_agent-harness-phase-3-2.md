# 2026-08-01 Agent Harness Phase 3.2: Contract Fixtures And Backend Preflight

**Plan version:** 1
**Status:** active
**Owner:** primary agent
**Risk:** high
**Authority:** implement, verify, and commit repository-local fixture and
preflight changes; do not push, run hosted workflows, access credentials, alter
backend state, deploy, or mutate external systems

## Objective

Make authentication browser fixtures mechanically conform to the committed
generated contract and provide one sanitized local command that distinguishes
missing/invalid configuration, backend reachability, readiness status, and
readiness-contract drift without exposing configuration or response data.

## Current Evidence

- `scripts/testing/run-e2e.mjs` manually constructs login, refresh, current-user,
  logout, and problem responses without validating them against generated Zod
  schemas.
- Generated runtime schemas already exist for password-login input and the
  successful login, refresh, current-user, logout, and readiness responses.
- The OpenAPI snapshot does not describe problem response bodies, so the safe
  handwritten problem subset cannot yet be generated or contract-validated.
- The default browser suite is deterministic and must remain independent of a
  real backend.

## Decisions And Invariants

- Generated runtime schemas are the fixture oracle; do not duplicate models.
- Invalid fixture responses fail before being sent. Invalid incoming fixture
  requests receive a safe problem without logging request values.
- Preflight is read-only and calls only `GET /ready`; it never logs the API URL,
  environment values, headers, bodies, cookies, or credentials.
- Preflight validates the live readiness response against the committed
  `ReadyGetResponse` schema. It does not claim whole-API compatibility.
- `.env.local` may supply local configuration, while an existing process value
  remains usable. Missing files and values receive actionable safe diagnostics.
- Real-backend CI, login smoke tests, database setup, and test credentials remain
  deferred until the backend has a reproducible isolated startup contract.

## Non-Goals

- Calling login or any mutation on the real backend.
- Adding secrets, CI services, Docker, database initialization, or repository
  rules.
- Inventing a runtime schema for backend problems before OpenAPI owns it.
- Replacing the existing server API client or browser fixture.

## Acceptance Scenarios

1. Given each successful auth fixture response, when it is sent, then its
   generated response schema accepts it first.
2. Given fixture JSON that drifts from a generated schema, when validation runs,
   then it fails with only the fixture boundary name and no payload values.
3. Given missing or invalid API configuration, when preflight runs, then it
   fails before network access with a sanitized remediation message.
4. Given an unreachable, non-ready, malformed, or contract-incompatible backend,
   when preflight runs, then it reports the failing boundary without raw data.
5. Given a ready compatible backend, when preflight runs, then it succeeds
   without credentials or state mutation.
6. Given normal `pnpm verify:runtime`, when browser tests run, then all existing
   auth/session scenarios remain deterministic against the local fixture.

## Risk And Authority

This is high risk because the fixture is an auth acceptance oracle and unsafe
diagnostics could leak sensitive configuration. The user authorized Phase 3.2
implementation and a local commit but explicitly prohibited push. All backend
interaction during automated tests uses injected local servers; running the
manual preflight against the user's background backend is permitted only as the
requested local verification and performs one read-only readiness request.

## Impact Areas

- `scripts/testing/run-e2e.mjs`
- `scripts/testing/api-fixture-contracts.mjs`
- `scripts/testing/backend-preflight.mjs`
- `scripts/testing/check-backend-readiness.mjs`
- focused Node tests
- `package.json`
- API, testing, harness, and execution-plan documentation

## Verification Matrix

| Acceptance                           | Evidence                  |
| ------------------------------------ | ------------------------- |
| Fixture schemas reject drift safely  | Node negative fixtures    |
| Preflight classifies failures safely | Injected HTTP/fetch tests |
| Real local backend readiness         | `pnpm backend:preflight`  |
| Existing browser behavior            | `pnpm verify:runtime`     |
| Repository remains healthy           | `pnpm verify`             |

## Checklist

- [x] Add generated-schema helpers for fixture request/response boundaries.
- [x] Wire existing auth fixtures through those helpers.
- [x] Add sanitized readiness preflight and focused failure tests.
- [x] Document scope, usage, and diagnostic privacy.
- [x] Run targeted, full, browser, and real local readiness verification.
- [ ] Commit locally without pushing.
- [ ] Leave the plan active until remote CI is explicitly authorized and proven.

## Rollout And Rollback

Fixture validation activates inside the existing browser runner. Preflight is an
explicit developer command and never runs in default CI. Rollback removes the
helpers/command and restores the prior fixture construction; no backend or
application state is changed.

## Decision And Deviation Log

- 2026-08-01: Phase 3.2 uses `/ready`, not login, for live preflight because
  readiness is read-only and requires no test credentials or database mutation.
- 2026-08-01: Problem responses remain manually safe because the committed
  OpenAPI contract does not define their response schema.
- 2026-08-01: The repository now declares ESM explicitly because Node 24 warned
  when test tooling imported generated TypeScript; existing CommonJS tooling
  already uses explicit `.cjs` extensions.
- 2026-08-01: Vitest initially discovered the Node test fixtures and rejected
  them as empty Vitest suites. `scripts/testing/**` now follows the same explicit
  Vitest exclusion as contract and harness Node tests.

## Verification

- `node --test scripts/testing/*.test.mjs`: passed, 7 tests covering fixture
  acceptance/drift privacy and all preflight outcome classes.
- `pnpm verify`: passed under Node `v24.18.0`; 60 Vitest, 6 contract, and 25
  combined harness/testing Node tests plus production build and harness checks.

## Runtime Evidence

- `pnpm backend:preflight`: passed against the locally configured background
  backend without printing its origin or response.
- `pnpm verify:runtime`: passed; all 6 Chromium auth/session scenarios used the
  generated-schema-validated fixture.

## Follow-Up Debt

- Real-backend CI waits for a reproducible backend startup and isolated data
  contract.
- Generated problem validation waits for problem response schemas in OpenAPI.
