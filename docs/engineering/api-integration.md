# API Integration

## Current status

The frontend has a build-time Lamara API contract boundary. It does not make
runtime API requests yet.

```text
backend committed OpenAPI
  -> explicit local sync
  -> frontend committed snapshot
  -> deterministic TypeScript generation
  -> feature/server compile-time types
```

Owned files:

```text
src/contracts/lamara-api/openapi.yaml
  Exact frontend compatibility lock.

src/contracts/lamara-api/provenance.json
  Backend repository, commit, source path, and snapshot SHA-256.

src/contracts/lamara-api/generated.ts
  Generated TypeScript. Never edit directly.

src/contracts/lamara-api/index.ts
  Public type-only export boundary.
```

The committed snapshot currently comes from backend revision
`88f6c2f9a2f1307778759ed0869561165593194a`.

## Normal verification

```bash
pnpm contracts:check
```

The check generates types from the committed snapshot into a temporary
directory and compares them with the committed output. It does not require the
backend checkout or network access.

`pnpm verify:fast` and `pnpm verify` include this gate.

## Updating the contract

Select an intentional, committed backend revision. Confirm its OpenAPI artifact
is clean, then run:

```bash
pnpm contracts:sync -- --source /absolute/path/to/docs/openapi/openapi.yaml
pnpm contracts:generate
pnpm contracts:check
```

Review all three contract artifacts together:

- `openapi.yaml` shows protocol changes;
- `provenance.json` identifies their source;
- `generated.ts` shows the TypeScript impact.

CI and normal builds consume only these committed frontend files. They must not
read a sibling checkout or download a live schema.

## Boundary

Generated TypeScript prevents trusted frontend code from inventing paths,
parameters, bodies, and response types. It does not validate untrusted network
data at runtime.

Runtime schemas, HTTP transport, timeouts, caching, problems, sessions, and
authentication remain unimplemented. Their accepted sequence is tracked in
[`docs/exec-plans/README.md`](../exec-plans/README.md).
