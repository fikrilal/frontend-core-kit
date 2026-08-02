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
3. Replace every metadata placeholder. The folder and declared status must
   agree.
4. Define observable acceptance scenarios, explicit authority, non-goals, and
   evidence before implementation starts.
5. Keep the checklist and decision/deviation log current during implementation.
6. Record exact commands, outcomes, and runtime evidence before completion.
7. Check every required item, change status to `completed`, and move the plan
   to `completed/` in the same change.

New active and queued plans use schema version 2. They declare narrow allowed
paths, allowed actions, maximum risk, and repair limit in addition to the
existing plan contract. `pnpm knowledge:check` validates metadata, boundaries,
required sections, lifecycle state, completed-plan evidence, local Markdown
links, and the planning index. Historical completed plans remain readable
without being reformatted, but completed plans may not retain unchecked required
work.

Risk and authority are separate. Risk describes potential impact. Authority
records what the user has allowed for this change and must name exclusions such
as push, deploy, production mutation, or external communication when relevant.
A plan never grants permissions that were not already provided.

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
5. **Active:**
   [Password reset confirmation](active/2026-08-02_password-reset-confirmation.md)
6. **Queued:**
   [Password reset request](queued/2026-08-01_password-reset-request.md)

## Agent Harness Sequence

The accepted direction is documented in the
[agent-first harness and loop engineering proposal](../planning/agent-harness-loop-engineering-proposal.md).

1. **Completed:**
   [Executable intent and knowledge](completed/2026-08-01_agent-harness-phase-1.md)
2. **Completed:**
   [Independent integration proof](completed/2026-08-01_agent-harness-phase-2.md)
3. **Completed:**
   [Maintainability fitness](completed/2026-08-01_agent-harness-phase-3-1.md)
4. **Completed:**
   [Contract fixtures and backend preflight](completed/2026-08-01_agent-harness-phase-3-2.md)
5. **Completed:**
   [Accessibility fitness](completed/2026-08-01_agent-harness-phase-3-3.md)
6. **Completed:**
   [Repository-owned visual evidence](completed/2026-08-01_agent-harness-phase-3-4.md)
7. **Completed:**
   [Task-oriented verification](completed/2026-08-01_agent-harness-phase-4-1-task-verification.md)
8. **Completed:**
   [Scope and repair bounds](completed/2026-08-01_agent-harness-phase-4-2-scope-repair-bounds.md)
9. **Completed:**
   [Authorized PR loop](completed/2026-08-01_agent-harness-phase-4-3-authorized-pr-loop.md)
10. **Completed:**
    [Password registration](completed/2026-08-01_auth-password-registration.md)
11. **Queued:**
    [Operating proof](queued/2026-08-01_agent-harness-phase-4-4-operating-proof.md)

Do not introduce product workflows until a real product decision exists.
