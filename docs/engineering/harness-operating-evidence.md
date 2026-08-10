# Harness Operating Evidence

This ledger is the bounded input for Phase 4.4 operating proof. It begins empty
on purpose: records represent independently reviewed real tasks, never synthetic
harness exercises or inferred outcomes.

Run `pnpm harness:evidence` to validate the ledger and print its aggregate
report. With fewer than three eligible records, the command reports
`insufficient` and names only missing evidence categories. It never recommends
autonomy expansion automatically.

Each record in [the JSON ledger](harness-operating-evidence.json) uses schema
version 3 and contains only:

- a lower-case task identifier and a local completed-plan path;
- an exact candidate Git revision;
- risk, first-pass/eventual outcome, attempt count, and total gate duration;
- categorical repair/escalation and human-intervention reasons;
- repair count, selected risk-owned lanes, stable stop family, and terminal
  reason;
- a categorical failed verification boundary (`none`, `unknown`, `preflight`,
  `fast`, `full`, or `runtime`);
- boolean false-positive, CI-reproduction, and independent-review markers.

Do not store prompts, source diffs, raw logs, credentials, environment values,
user data, review text, PR URLs, or free-form notes. A record may be added only
after the task and its evidence have been independently reviewed.

## Current Report

Three eligible records have been collected for password registration,
password-reset confirmation, and email verification. All three were
independently reviewed and reproduced in hosted CI; registration completed
after repair, while the two reset/verification tasks completed on their first
hosted gate. The historical registration boundary is explicitly `unknown`
because the original evidence did not preserve a safe lane category; it is not
inferred. Phase 4.4 still has insufficient evidence because all three records
are high-risk; one additional reviewed task from a second risk class is
required before broader operating claims or autonomy decisions.

The human owner accepted this bounded limitation for narrow Phase 5 planning
only. Phase 5 must first improve the quality of future repair evidence and must
not expand merge or deployment autonomy.
