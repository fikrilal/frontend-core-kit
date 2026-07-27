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
