# Execution Plans

Execution plans track non-trivial implementation work.

Use an execution plan when a change spans multiple files, changes behavior,
touches architecture boundaries, or requires verification evidence across
multiple commands.

## Folders

```text
docs/exec-plans/active/
docs/exec-plans/queued/
docs/exec-plans/completed/
```

## Workflow

1. Copy `docs/exec-plans/_template.md`.
2. Place the plan in `active/` for current work or `queued/` for future work.
3. Keep checklist and decisions current during implementation.
4. Record commands and outcomes before completing the plan.
5. Move completed plans to `completed/`.

Tiny docs edits and small one-file mechanical changes do not need execution
plans.

## API Core Network Sequence

The accepted direction is documented in
[`docs/planning/api-core-network-proposal.md`](../planning/api-core-network-proposal.md).
Implementation is split into independently reviewable plans:

1. **Completed:**
   [API contract foundation](completed/2026-07-28_api-contract-foundation.md)
2. **Active:** [Server API transport](active/2026-07-28_server-api-transport.md)
3. **Queued:** [Server session core](queued/2026-07-28_server-session-core.md)
4. **Queued:** [First authenticated feature](queued/2026-07-28_first-authenticated-feature.md)

Complete and move each plan before promoting the next one to `active/`. Do not
start session or authenticated-feature work while its recorded decision gates
remain unresolved.
