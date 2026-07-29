# 2026-07-29 Generated Runtime Contracts And Node 24

## Status

Completed.

## Objective

Remove handwritten duplication of backend response models by generating Zod 4
schemas from the committed Lamara OpenAPI snapshot. Keep `openapi-typescript`
and `openapi-fetch`; use Orval only as a build-time runtime-schema generator.

Move the project baseline from EOL Node 20 to Node 24, the current Active LTS
line.

## Acceptance Criteria

- [x] `package.json`, local version guidance, and documentation select Node 24.
- [x] Contract generation deterministically produces both TypeScript types and
      Zod 4 schemas from the committed snapshot.
- [x] Contract drift checking compares both generated artifacts without network
      or sibling-repository access.
- [x] Generated runtime schemas are committed and never manually edited.
- [x] Password login imports a generated response-data schema.
- [x] `password-login-schema.ts` is removed.
- [x] Adding a normal endpoint does not require manually recreating its backend
      response model in Zod.
- [x] Existing request IDs, timeout, problem normalization, secret handling,
      and server-only boundaries remain unchanged.
- [x] The full verification gate passes under Node 24.

## Risk Class

`high`

This changes the contract toolchain and the runtime validator for a
token-bearing response. Generated output must remain deterministic, and the
login adapter must not expose invalid or secret data through failure results.

## Decisions

- Node 24 is selected because it is the current Active LTS release line. Node
  20 is EOL.
- Orval is a development-only dependency and generates only Zod schemas. It
  does not replace `openapi-typescript`, `openapi-fetch`, or feature functions.
- Use classic Zod 4 output because the schemas are server-only and readable
  generated output is more valuable than client-bundle tree shaking here.
- Generate reusable component schemas plus operation response aliases.
- Generated validators follow OpenAPI exactly. Missing formats or constraints
  must be fixed in the backend contract, not patched in frontend-generated
  output.
- Backend problem schemas remain handwritten until error response bodies are
  modeled in OpenAPI.

## Checklist

### Runtime and generation

- [x] Upgrade the Node engine and add a pinned local Node version.
- [x] Add Orval with an explicit, narrow build-script permission.
- [x] Generate `runtime.generated.ts` atomically.
- [x] Include runtime schemas in `contracts:check`.
- [x] Keep exact byte-level drift detection shared across both artifacts.

### Login migration

- [x] Move generated login input/output type aliases into the feature function
      module.
- [x] Replace the handwritten Zod schema with `AuthResultWithMeDto`.
- [x] Keep public exports stable.
- [x] Preserve login and failure-path tests.

### Documentation and verification

- [x] Update contract workflow, architecture, technology, and testing docs.
- [x] Run focused contract generation and drift checks.
- [x] Run `pnpm verify` under Node 24.
- [x] Run `pnpm peers check`.
- [x] Run `git diff --check`.
- [x] Record outcomes and move this plan to `completed/`.
- [x] Stop before session or UI work.

## Verification

- Node: `v24.18.0`
- `pnpm contracts:check`: passed.
- `pnpm verify`: passed, including formatting, contract drift, lint, strict
  TypeScript, 24 Vitest tests, 6 contract-tool tests, production build, and
  both harness checks.
- `pnpm peers check`: passed with no peer dependency issues.
- `git diff --check`: passed.

## Runtime Evidence

No browser or live-backend evidence is required. No route invokes the login
function. Production build and generated-artifact evidence are required.

## Rollback

Revert the runtime generator, generated artifact, Node baseline, login imports,
dependencies, and documentation. Restore the handwritten login schema if
runtime schema generation is removed.

## Follow-Up Debt

- Add standard problem response bodies to backend OpenAPI so error validation
  can also be generated.
- Improve backend OpenAPI formats and constraints when generated schemas expose
  missing semantics.
