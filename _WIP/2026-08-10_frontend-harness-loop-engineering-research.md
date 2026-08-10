# Frontend Harness And Loop Engineering Research

**Date:** 2026-08-10  
**Status:** Investigation note; not a source of truth and not implementation authority  
**Scope:** `frontend-core-kit`, with `backend-core-kit` and `mobile-core-kit` as local comparisons

## Executive Finding

`frontend-core-kit` does not need a new harness strategy. It already implements
most of the useful inner loops described in current agent-engineering writing:

- repository-local architecture and product guidance;
- deterministic architecture, contract, maintainability, and knowledge checks;
- risk-selected verification with a bounded repair budget;
- browser, accessibility, and visual evidence;
- independently repeated CI;
- explicit task scope and external-action authority;
- a sanitized operating-evidence ledger.

The main opportunity is to finish the outer learning loop without making the
repository self-modifying. The next useful work is:

1. consolidate the scattered harness scripts behind a typed, repository-local
   `frontendkit` CLI while preserving pnpm compatibility aliases;
2. improve the fidelity of task outcomes and failure classification;
3. add a fail-closed, human-approved harness-improvement experiment contract;
4. add task recovery and isolation only when observed concurrency or dirty-tree
   friction justifies their cost;
5. defer autonomous event intake, agent swarms, blanket mutation testing, and
   auto-merge.

This is a narrower conclusion than “adopt loop engineering.” The repository has
already adopted it through Phases 1–4 of the accepted
[agent-first harness proposal](../docs/planning/agent-harness-loop-engineering-proposal.md).
The missing part is controlled hill climbing backed by enough real operating
evidence.

## Terms That Should Not Be Collapsed

| Practice            | Unit being improved         | Durable result                                               |
| ------------------- | --------------------------- | ------------------------------------------------------------ |
| Prompt engineering  | One instruction or response | Better task wording                                          |
| Context engineering | One model context           | Better selected facts, tools, and artifacts                  |
| Harness engineering | One agent run               | Guides, sensors, permissions, recovery, and a done condition |
| Loop engineering    | Repeated work across runs   | Triggers, state, verification, escalation, and learning      |

The boundaries overlap, but the distinction is operationally useful. A better
prompt cannot compensate for a missing test oracle. A larger context cannot
compensate for an unsafe publication path. A strong per-run harness does not
learn from repeated failures unless outcomes are captured and reviewed across
runs.

## Research Synthesis

### LangChain: nested loops, not a bigger prompt

LangChain describes four nested loops in
[The Art of Loop Engineering](https://www.langchain.com/blog/the-art-of-loop-engineering):

1. the agent calls tools until it considers the task complete;
2. a verifier grades the outcome and returns actionable feedback;
3. events or schedules invoke the application loop;
4. traces and outcomes improve the inner harness over time.

The fourth loop is the compounding loop because its output changes prompts,
tools, context, or graders used by later runs. It is also the highest-risk loop.
An unreviewed agent that changes its own grader can optimize for passing the
grader rather than producing a better product.

The article also keeps humans at natural control points: sensitive actions,
semantic grading, end-user output approval, and changes to the harness itself.
That matches this repository's authority model better than a fully autonomous
interpretation of “loop engineering.”

### OpenAI: legibility and enforcement create autonomy

OpenAI's
[Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)
reports a development model in which humans specify intent and agents write the
repository. The highest-leverage lessons for these kits are:

- when an agent struggles, ask which capability, abstraction, diagnostic, or
  constraint is missing instead of asking it to try harder;
- make the application itself inspectable: isolated runtime instances, UI
  control, logs, metrics, and traces are agent context;
- use a concise entry point and progressively disclosed repository knowledge;
- enforce architectural invariants mechanically and allow local freedom inside
  those boundaries;
- make linter failures remediation-oriented because diagnostics become the next
  agent input;
- treat recurring cleanup as garbage collection, not an occasional rewrite;
- do not assume another repository can copy the reported autonomy level without
  making the same investment in structure and tooling.

The frontend already follows much of this: thin route composition, feature
public APIs, typed server adapters, runtime boundary validation, structural
checks, Playwright control, and repository-owned screenshots. The missing
application-legibility capability is not another UI test framework; it is
stronger task isolation and reconstructable task state if concurrent or
long-running agent work becomes common.

### Bockeler: guides and sensors regulate different qualities

Birgitta Bockeler's
[Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html)
provides the clearest control-system vocabulary:

- **guides** steer before action;
- **sensors** observe outcomes and support correction;
- **computational** controls are deterministic and generally cheap;
- **inferential** controls apply semantic judgment but are probabilistic and
  more expensive.

The article separates maintainability, architecture fitness, and behavior.
This matters because the first two are comparatively easy to constrain with
types, linters, dependency rules, and measurements. Behavior remains difficult:
an agent can misunderstand a requirement and encode the same misunderstanding
in both implementation and tests.

The frontend's approved scenarios, generated OpenAPI snapshot, contract-checked
fixture, existing regressions, and runtime evidence are therefore more important
than adding another review agent. Independence comes from the source of the
oracle and the execution environment, not merely from using a second model
session.

### Anthropic: durable handoffs, external outcomes, and removable scaffolding

Anthropic's
[Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
identifies two relevant failures: an agent tries to complete too much before its
context ends, or a later session mistakes partial progress for completion. The
countermeasure is small increments plus durable handoff state that a fresh
context can reconstruct.

[Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
adds planner/generator/evaluator separation for work near the edge of a model's
capability. Its equally important finding is that harnesses become bulky and
stale: each component encodes an assumption about what the model cannot do, so
components should be tested and removed one at a time when they stop adding
value.

[Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
distinguishes a transcript from an outcome. “Done” in an agent trace is not
proof; the repository state, browser behavior, external contract, or deployed
state is the outcome. It also distinguishes capability evals from regression
evals. This repository currently has product regression sensors, but only a
small operating sample for evaluating whether its _agent harness_ is improving.

### Robert C. Martin: useful pressure, unsafe as a literal policy

The widely discussed Robert C. Martin post is available at
[X](https://x.com/unclebobmartin/status/2080257779395154409), but X did not
expose its text to the research tooling. Secondary reporting attributes to him
the position that he no longer reads agent-generated code line by line and
instead relies on strong automated tests and structural measures. That exact
wording should not be treated as a verified normative source.

His current public work gives a more useful and verifiable picture. The official
[SwarmForge repository](https://github.com/unclebob/swarm-forge) defines small
role sets that separate specification, coding, cleanup, architecture,
hardening, and QA. Its documented role packs also emphasize Gherkin/QA
procedures, acceptance tests, and mutation hardening.

The transferable ideas are:

- humans should spend more attention on feature meaning and QA specifications;
- implementation and acceptance tests should be separate streams;
- cleanup, architecture review, hardening, and QA are distinct concerns;
- mutation testing can challenge whether important tests detect meaningful
  faults;
- specialization is useful when a concern is substantial enough to deserve an
  independent pass.

The unsafe interpretation is “green tests eliminate review.” Tests only prove
what their oracles express. For this frontend, human review remains material for
acceptance meaning, auth/session risk, accessibility beyond automated checks,
and visual/product judgment. Selective mutation testing may be useful for stable
critical pure logic, but there is no evidence for imposing it on every change.

## Frontend System And Harness Map

The application is a Next.js starter with Server Components by default. Thin
route files compose feature entry points. Product behavior lives in
`src/features/`; shared server transport and configuration live in
`src/server/`; generic shadcn components remain business-free. The representative
login path is:

```text
route page
  → auth feature page/form
  → server action
  → feature-owned auth API adapter
  → shared typed server client
  → generated OpenAPI runtime schema
  → opaque HttpOnly session cookie / safe UI state
```

The architecture is described in
[architecture.md](../docs/core/architecture.md) and mechanically reinforced by
[check-architecture.mjs](../scripts/harness/check-architecture.mjs). The harness
is not a wrapper around weak code; the code's clear ownership and typed
boundaries are themselves part of the harness.

### Current loop coverage

| Loop                       | Current frontend implementation                                                  | Assessment                                                  |
| -------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Human intent and authority | V2 execution plans, risk, allowed paths/actions, non-goals, acceptance scenarios | Strong                                                      |
| Agent work                 | repository instructions, progressive docs, standard tools                        | Strong for supervised work                                  |
| Verification and repair    | `task:begin`, risk-selected `task:verify`, stable lane failures, repair budget   | Strong; outcome categories can improve                      |
| Integration                | frozen clean CI, aggregate required status, Playwright runtime lane              | Strong                                                      |
| Event-driven operation     | PR/push CI triggers only                                                         | Partial; no repository task intake or maintenance scheduler |
| Hill climbing              | reviewed operating ledger and queued Phase 5                                     | Correctly inactive; insufficient risk diversity             |

### Measured current state

The current [harness guide](../docs/engineering/harness.md) documents:

- `verify:fast`, `verify`, and separate runtime verification;
- task scope and risk enforcement;
- bounded repeated-failure handling;
- safe draft handoff with separate publication authority;
- knowledge, architecture, contracts, maintainability, and public-page checks;
- independent CI and browser evidence.

On 2026-08-10, `pnpm harness:evidence` reported:

- 3 eligible, independently reviewed, CI-reproduced tasks;
- all 3 eventually completed, 2 on the first pass;
- 5 attempts and 410 seconds of total gate time;
- 1 repair whose historical failure boundary is unknown;
- 0 recorded false positives;
- insufficient evidence because all records are high risk.

The command's recommendation was to collect a second risk class and not expand
autonomy or change policy. `pnpm knowledge:check` passed. Both commands also
warned that the active Node 22 runtime did not meet the repository's Node 24
engine requirement. Task verification detects this strictly, but a read-only
doctor command would make the mismatch visible before a task starts.

## Cross-Kit Comparison

This comparison distinguishes committed frontend behavior from sibling worktree
state. Both sibling repositories contain uncommitted harness work, so their new
code is useful design evidence but not yet a stable shared dependency.

| Capability           | Frontend                                       | Backend                                                                  | Mobile                                         |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Canonical profiles   | Established pnpm lanes, but no typed CLI owner | Mature typed `backendkit` profiles                                       | In-progress Phase 1 typed `mobilekit` profiles |
| Architecture fitness | Next.js boundary script + ESLint               | Dependency Cruiser, architecture smells, backend-specific gates          | Extensive custom Clean Architecture lints      |
| Runtime evidence     | Contract fixture + Playwright + screenshots    | Docker-backed integration/E2E                                            | Device/emulator evidence, logs, goldens        |
| Task authority/scope | V2 plan + ignored task state                   | Typed lifecycle controller                                               | Proposed, not yet implemented                  |
| Repair loop          | Risk-selected, bounded by task fingerprint     | Typed stop taxonomy and lifecycle                                        | Proposed                                       |
| Workspace isolation  | Baseline protects paths in current tree        | Linked worktree controller                                               | Proposed                                       |
| Event intake         | CI events only                                 | Queued, deduplicated, single-flight intake                               | Proposed                                       |
| Operating evidence   | 3 reviewed high-risk tasks                     | Stronger schema, but real ledger still below activation threshold        | Proposed                                       |
| Hill climbing        | Queued Phase 5                                 | Implemented fail-closed analyzer/hypothesis contract in current worktree | Proposed                                       |

### What should be borrowed from backend

- one typed repository CLI that owns command parsing, profile composition,
  structured outcomes, and safe process execution;
- stable stop-reason taxonomy rather than only broad lane names;
- task state transitions that distinguish authorized, verifying, repairing,
  ready for review, handed off, escalated, and terminal outcomes;
- a read-only harness doctor;
- an improvement hypothesis with named baseline tasks, target component,
  metric, minimum expected improvement, rollback boundary, and shadow tasks;
- human `keep`/`revert` judgment after deterministic shadow evaluation;
- linked worktrees if real concurrent work demonstrates the need.

### What should not be copied yet

- a second general-purpose orchestration platform;
- repository code that launches or manages coding models;
- event intake without an agreed source of trusted queued work;
- a large shared cross-kit runtime package;
- backend-specific Docker, database, migration, or API controls;
- mobile-specific device and SDK lifecycle controls.

The reusable asset should initially be a small **contract specification**:
terminology, states, evidence privacy, authority invariants, and conformance
fixtures. Runtime implementations should remain native to TypeScript/Node and
Dart until at least two stable implementations demonstrate an actual shared
maintenance benefit.

## Findings And Recommended Priority

### P0 — Establish `frontendkit` as the canonical harness surface

The frontend currently exposes capable but separate pnpm scripts and Node entry
points. This works, but command composition, argument parsing, terminal output,
and machine-readable outcomes can drift. Backend and mobile provide a better
operator model: one repository-native CLI with typed commands and profiles.

`frontendkit` should be a thin control surface over existing frontend-specific
modules, not a new agent framework. It should own doctor, verification profiles,
risk, task lifecycle, handoff, evidence, and improvement analysis. Existing
`pnpm verify:*`, `task:*`, and harness commands should remain compatibility
aliases that delegate to the same owners. Development commands such as
`pnpm dev` and `pnpm start` do not need to move behind it.

### P0 — Separate observation repair from hill climbing

The one current steering signal is weak evidence quality: a repaired task has an
`unknown` failure boundary. Fixing future attribution is justified now because
it improves observation without changing a grader or policy.

Actual hill climbing is not justified yet. It requires:

- evidence eligibility across at least two risk classes;
- a recurring stable stop reason, not a single anecdote;
- a pre-registered metric and baseline task set;
- an isolated high-risk implementation plan;
- shadow evaluation on later real tasks;
- an explicit human keep/revert decision.

### P1 — Add pre-task diagnostics and lifecycle recovery

`task:begin` fails if task state already exists and tells the operator to archive
it, but there is no repository-owned completion/recovery command. A small
read-only doctor should validate runtime versions, Git/worktree state, active
plan count, ignored private-state policy, browser availability when applicable,
and stale task records. Any future cleanup command must identify an exact
terminal task and require explicit authority; it must not erase evidence merely
to bypass a guard.

### P1 — Improve failure attribution before adding more sensors

The current `fast`, `full`, and `runtime` boundaries are useful but coarse. A
stable taxonomy should distinguish environment/preflight, knowledge, scope,
contracts, architecture, maintainability, unit behavior, build, browser
behavior, visual evidence, and external integration. It should map deterministic
command failures to one owner and one remediation without storing raw output.

This is more valuable than adding an LLM reviewer because it makes existing
failures cheaper to repair and produces better steering data.

### P2 — Add worktree isolation only when concurrency is real

The current baseline deliberately protects pre-existing paths but admits it
cannot identify overlapping line edits inside a pre-existing file. A linked
worktree per task would provide a stronger ownership boundary and per-change
runtime instance. It also adds branch, cleanup, dependency-cache, port, and
recovery complexity.

Adopt it when one of these becomes observed:

- parallel agents commonly work in the same repository;
- user-owned dirty changes repeatedly block or contaminate tasks;
- long-running tasks need resumable workspace identity;
- per-change application instances are needed for reliable UI evidence.

### P2 — Treat CI as the current event loop

PR and push CI already provide event-driven verification. A repository task
intake queue or scheduled maintenance agent should wait until there is a trusted
source of tasks, a single-flight policy, deduplication, recoverable state, and an
operator. The first scheduled operation, if needed, should be read-only
knowledge/entropy detection that opens no PR and changes no policy by itself.

### P2 — Strengthen behavioral independence selectively

For medium/high-risk behavior, retain at least one independent oracle:

- a human-approved acceptance scenario;
- the generated backend contract;
- an approved fixture or existing regression;
- browser/device state observed outside the implementation unit;
- human visual or accessibility review where automation is incomplete.

Mutation testing should begin only as a focused pilot on stable, critical pure
logic with a measured runtime budget and known fault model. Snapshot regeneration
must remain an intentional human-inspected action.

### P3 — Evaluate agent roles by concern, not fashion

A planner, implementer, evaluator, security reviewer, or QA agent can be useful
when the task has a genuinely separable concern. A swarm is not inherently more
independent or correct: all roles may share the same flawed requirement and
generate correlated mistakes.

Prefer deterministic sensors first. Use a fresh evaluator context with an
explicit rubric for semantic scope, architecture, or visual judgment only when
the expected reduction in human review exceeds the added latency and token
cost.

## Human And Agent Operating Split

Humans should own:

- product direction and priority;
- observable acceptance meaning and non-goals;
- new architecture boundaries and risk acceptance;
- security/privacy decisions and destructive/external authority;
- visual taste, accessibility judgment, and release decisions;
- approval and keep/revert decisions for harness changes.

Agents should own, within an approved task boundary:

- repository discovery and implementation;
- focused tests and documentation updates;
- deterministic verification and bounded repair;
- reproducible runtime evidence;
- narrow review responses and handoff artifacts;
- proposals to codify repeated friction.

The supervisor should review the contract and evidence, not attempt to manually
reproduce every tool call. Human code review can become risk- and
evidence-weighted, but responsibility for the resulting system does not move to
the agent.

## Conclusion

The frontend harness is already good because its codebase, docs, tests, and
controller reinforce one another. A canonical `frontendkit` CLI should make
that controller explicit and consistent; it should not become a second product.
The next leverage point after that is not more rules or more autonomous agents.
It is a controlled outer loop that can answer, with evidence:

> Which recurring failure are we trying to reduce, what change do we predict
> will reduce it, and what later outcomes will make us keep or revert that
> change?

Until the operating ledger contains a second risk class and a recurring signal,
the correct hill-climbing state is **disabled**. Improving observation quality,
pre-task diagnostics, and recoverability is worthwhile now; autonomy expansion
is not.
