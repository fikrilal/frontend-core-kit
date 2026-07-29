# 2026-07-28 API Contract Foundation

## Status

Completed on 2026-07-28.

## Objective

Create a deterministic frontend contract lock from the backend core kit's
committed OpenAPI artifact. Generated TypeScript types become the compile-time
source for endpoint paths, parameters, request bodies, and response shapes.

This plan implements only the contract boundary from Phase 1 of the accepted
[API core network proposal](../../planning/api-core-network-proposal.md). It
does not add HTTP transport, runtime schemas, environment configuration,
sessions, authentication, or product routes.

## Dependencies

- Backend protocol source:
  `/home/fikrilal/devs/core/backend-core-kit/docs/openapi/openapi.yaml`
- Backend revision inspected while writing this plan:
  `88f6c2f9a2f1307778759ed0869561165593194a`
- The backend working tree was clean when that revision was recorded.
- Recheck the backend revision and working tree before copying the snapshot.

## Acceptance Criteria

- [x] `src/contracts/lamara-api/openapi.yaml` is an intentional byte-for-byte
      snapshot of the selected backend artifact.
- [x] Contract provenance records the backend repository, selected commit, and
      snapshot SHA-256 without requiring the sibling checkout at build time.
- [x] `openapi-typescript` deterministically generates a committed
      `generated.ts` from the committed snapshot.
- [x] `src/contracts/lamara-api/index.ts` exposes the generated contract without
      handwritten endpoint or DTO duplication.
- [x] `pnpm contracts:generate` updates generated output from the committed
      snapshot.
- [x] `pnpm contracts:check` generates into a temporary location and fails when
      committed generated output has drifted.
- [x] `pnpm contracts:sync -- --source <path>` requires an explicit source path,
      copies the snapshot, and updates provenance; it has no implicit dependency
      on a sibling repository.
- [x] `pnpm verify:fast` includes `contracts:check`.
- [x] Current-state documentation describes the contract pipeline as
      implemented while keeping transport and authentication planned.
- [x] Required verification and command outcomes are recorded in this plan.

## Risk Class

`medium`

Contract drift can silently mis-type every future API consumer. The work does
not change runtime behavior, credentials, or production traffic.

## Impact Areas

- `package.json`
- `pnpm-lock.yaml`
- `scripts/contracts/`
- `src/contracts/lamara-api/`
- `docs/core/tech-stack.md`
- `docs/core/architecture.md`
- `docs/engineering/`
- repository verification scripts

## Checklist

### Source lock

- [x] Confirm the backend OpenAPI file is committed and the backend worktree is
      clean.
- [x] Record the selected backend commit and SHA-256 in a small machine-readable
      provenance file next to the snapshot.
- [x] Add `scripts/contracts/sync-openapi.mjs` with explicit `--source`
      validation, readable error messages, and atomic replacement of the
      snapshot and provenance.
- [x] Keep the sync operation local and intentional; CI must never reach into
      `/home/fikrilal/devs/core/backend-core-kit`.

### Generation and drift

- [x] Add `openapi-typescript` as a pinned development dependency.
- [x] Add a deterministic generator script that reads only the committed
      snapshot and writes `src/contracts/lamara-api/generated.ts`.
- [x] Mark generated output as generated and never hand-edit it.
- [x] Add a drift checker that generates to a temporary directory, compares
      bytes with the committed output, removes its temporary files, and exits
      non-zero with a corrective command.
- [x] Export generated types through `src/contracts/lamara-api/index.ts`.
- [x] Add package scripts for sync, generation, and checking.
- [x] Add `contracts:check` to `verify:fast` before TypeScript consumers run.

### Harness and documentation

- [x] Add a focused automated test for source-path validation and drift
      detection, or make the scripts' pure comparison/parsing helpers directly
      testable.
- [x] Ensure formatting/lint configuration handles generated output without
      disabling checks for handwritten contract files.
- [x] Update architecture and technology-stack documentation with implemented
      status and update instructions.
- [x] Document that generated TypeScript types do not perform runtime
      validation; Zod belongs to the transport/feature phases.

### Verification and completion

- [x] Run `pnpm contracts:generate`.
- [x] Run `pnpm contracts:check`.
- [x] Run focused contract-script tests.
- [x] Run `pnpm verify`.
- [x] Run `git diff --check`.
- [x] Record outcomes below.
- [x] Move this plan to `docs/exec-plans/completed/`.
- [x] Move the server API transport plan from `queued/` to `active/`.

## Decisions

- The backend remains the protocol owner. The frontend snapshot is a
  compatibility lock, not a forked specification.
- The initial selected backend revision is
  `88f6c2f9a2f1307778759ed0869561165593194a`; implementation must explicitly
  confirm or replace it.
- `openapi-typescript` is the generator because it produces runtime-free
  TypeScript types from OpenAPI 3 without introducing a client runtime.
- TypeScript is pinned to `5.9.3`, the latest 5.9 patch, because
  `openapi-typescript@7.13.0` declares TypeScript 5.x support. Next.js accepts
  that compiler version and `pnpm peers check` reports no mismatch.
- Generated output is committed so contract changes are reviewable and builds
  do not depend on the backend checkout or network access.
- Runtime validation is intentionally deferred. Generated types only constrain
  trusted code at compile time.

## Verification

- `pnpm contracts:sync -- --source
/home/fikrilal/devs/core/backend-core-kit/docs/openapi/openapi.yaml`: passed;
  selected backend commit `88f6c2f9a2f1307778759ed0869561165593194a`
  and SHA-256
  `851c912c46d35255e06c28ca0e7cccee003e8f40ce0c974ca7d7f075b6b93e08`.
- `pnpm contracts:generate`: passed.
- `pnpm contracts:check`: passed.
- `pnpm test:contracts`: 6 tests passed.
- `pnpm verify`: passed; 7 application tests and 6 contract-tooling tests,
  production build, architecture check, and public-page check passed.
- `pnpm peers check`: no peer dependency issues.
- Markdown-link validation: 24 documentation files checked.
- `git diff --check`: passed.

Outcome: complete.

## Runtime Evidence

- Not required. This plan changes build-time artifacts only.

## Rollback

Revert the contract-foundation change. No runtime data, environment, route, or
backend deployment requires migration.

## Follow-Up Debt

- Implement runtime validation only for payloads consumed by real feature
  adapters.
- Revisit extraction only after a second web product proves identical contract
  tooling needs.
