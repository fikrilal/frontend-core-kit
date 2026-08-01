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

The accepted direction is documented in the
[API foundation roadmap](../engineering/api-foundation-roadmap.md).
Implementation is split into independently reviewable plans:

1. **Completed:**
   [API contract foundation](completed/2026-07-28_api-contract-foundation.md)
2. **Completed:**
   [Password login API client slice](completed/2026-07-28_password-login-api-client.md)
3. **Completed:**
   [Generated runtime contracts and Node 24](completed/2026-07-29_generated-runtime-contracts-node24.md)
4. **Completed:**
   [Generic auth and session foundation](completed/2026-07-30_generic-auth-session-foundation.md)

## Agent Harness Sequence

The accepted direction is documented in the
[agent-first harness and loop engineering proposal](../planning/agent-harness-loop-engineering-proposal.md).

1. **Active:**
   [Executable intent and knowledge](active/2026-08-01_agent-harness-phase-1.md)

Do not introduce product workflows until a real product decision exists.
