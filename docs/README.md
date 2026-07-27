# Burnly Web — Documentation

Docs are the source of truth for Burnly Web decisions. Code should follow these
docs; if code and docs diverge, fix the mismatch.

## Navigation

### Core

Project identity, foundation, stack, and architecture.

- `docs/core/README.md`
- `docs/core/project-foundation.md`
- `docs/core/tech-stack.md`
- `docs/core/architecture.md`

### Product

Public page scope and content ownership.

- `docs/product/README.md`
- `docs/product/initial-pages.md`

### Design

Visual direction and UI system rules.

- `docs/design/README.md`
- `docs/design/design-direction.md`
- `docs/design/design-system.md`

### Engineering

How we build, verify, and integrate with Burnly API.

- `docs/engineering/README.md`
- `docs/engineering/harness.md`
- `docs/engineering/testing-strategy.md`
- `docs/engineering/api-integration.md`
- `docs/engineering/usage-report-api-contracts.md` — dashboard/report usage + sync read contracts

### Planning

Proposals and not-yet-normative work.

- `docs/planning/README.md`
- `docs/planning/desktop-auth-web-handoff.md` — desktop auth via web (implementer handoff)

### Contributing

Contributor workflow rules.

- `docs/contributing/commit-conventions.md`

### Execution plans

Implementation tracking for non-trivial work.

- `docs/exec-plans/README.md`
- `docs/exec-plans/active/`
- `docs/exec-plans/queued/`
- `docs/exec-plans/completed/`

## Agent entrypoint

`AGENTS.md` stays short. Prefer this index for discovery, then the linked source
of truth docs.

## Conventions

- Prefer small, composable docs over one mega-file.
- Promote accepted `_WIP` proposals into the folders above.
- Use execution plans for multi-file or multi-gate implementation work.
- Do not invent empty doc categories before content exists.
