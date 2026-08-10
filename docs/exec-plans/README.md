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
   [Generic auth and session foundation](completed/2026-07-30_generic-auth-session-foundation.md)
3. **Completed:**
   [Password reset request](completed/2026-08-01_password-reset-request.md)
4. **Completed:**
   [Password reset confirmation](completed/2026-08-02_password-reset-confirmation.md)
5. **Completed:**
   [Email verification](completed/2026-08-02_email-verification.md)

## Agent Harness Sequence

The accepted direction is documented in the
[agent-first harness and loop engineering proposal](../planning/agent-harness-loop-engineering-proposal.md).

1. **Completed:**
   [Password registration](completed/2026-08-01_auth-password-registration.md)
2. **Active:**
   [Frontendkit CLI foundation](active/2026-08-11_frontendkit-cli-foundation.md)
3. **Queued:**
   [Canonical verification profiles](queued/2026-08-11_frontendkit-canonical-profiles.md)
4. **Queued:**
   [Read-only controls and doctor](queued/2026-08-11_frontendkit-doctor-controls.md)
5. **Queued:**
   [Task lifecycle and failure taxonomy](queued/2026-08-11_frontendkit-task-lifecycle.md)
6. **Queued:**
   [Verified handoff](queued/2026-08-11_frontendkit-verified-handoff.md)
7. **Queued:**
   [Controlled improvement machinery](queued/2026-08-11_frontendkit-controlled-improvement.md)
8. **Queued:**
   [Dogfood and completion audit](queued/2026-08-11_frontendkit-dogfood-completion.md)

Do not introduce product workflows until a real product decision exists.
