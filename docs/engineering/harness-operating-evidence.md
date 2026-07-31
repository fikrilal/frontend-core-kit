# Harness Operating Evidence

This ledger is the bounded input for Phase 4.4 operating proof. It begins empty
on purpose: records represent independently reviewed real tasks, never synthetic
harness exercises or inferred outcomes.

Run `pnpm harness:evidence` to validate the ledger and print its aggregate
report. With fewer than three eligible records, the command reports
`insufficient` and names only missing evidence categories. It never recommends
autonomy expansion automatically.

Each record in [the JSON ledger](harness-operating-evidence.json) contains only:

- a lower-case task identifier and a local completed-plan path;
- risk, first-pass/eventual outcome, attempt count, and total gate duration;
- categorical repair/escalation and human-intervention reasons;
- boolean false-positive, CI-reproduction, and independent-review markers.

Do not store prompts, source diffs, raw logs, credentials, environment values,
user data, review text, PR URLs, or free-form notes. A record may be added only
after the task and its evidence have been independently reviewed.

## Current Report

No eligible records have been collected. Phase 4.4 therefore has insufficient
evidence for a Phase 5 recommendation.
