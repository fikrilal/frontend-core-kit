# 2026-08-01 Agent Harness Phase 3.3: Accessibility Fitness

**Plan version:** 1
**Status:** completed
**Owner:** primary agent
**Risk:** high
**Authority:** implement and verify repository-local accessibility tests and
narrow fixes to demonstrated defects; do not commit, push, deploy, mutate
external systems, or claim conformance without separate human review

## Objective

Add deterministic accessibility feedback for every implemented page state so
agents receive actionable browser evidence for detectable WCAG A/AA violations,
keyboard navigation, form errors, headings, and landmarks.

## Current Evidence

- Six Playwright scenarios cover public metadata, route protection, and the
  auth/session flow but do not run an accessibility engine.
- Existing tests use semantic role and label queries, but the baseline records
  accessibility automation as missing.
- The implemented browser surface is limited to `/`, `/login`, and protected
  `/app`; no future product routes should be invented for this phase.

## Decisions And Invariants

- Use the official `@axe-core/playwright` integration in the existing isolated
  browser runner; add no second browser harness.
- Scan the implemented landing, login, login-error, protected redirect, and
  authenticated states against Axe's WCAG 2 A/AA and 2.1 A/AA tags.
- Assert keyboard behavior and semantic structure separately because automated
  scans cannot prove keyboard usability or full accessibility.
- Fix only defects reproduced by these scenarios. Preserve the existing visual
  direction and auth/session behavior.
- Do not disable Axe rules or treat a passing automated scan as a conformance
  certification.

## Non-Goals

- Claiming WCAG conformance, replacing human or assistive-technology review, or
  testing every browser/OS/screen-reader combination.
- A visual redesign, screenshot regression system, or future product UI.
- Changing auth, session, API, CI, or deployment behavior.

## Acceptance Scenarios

1. Given each implemented page state, when the browser audit runs, then no
   Axe-detectable WCAG A/AA violation is reported.
2. Given the landing and login surfaces, when a keyboard user navigates, then
   links and fields receive focus in usable order and expose a visible indicator.
3. Given failed login, when the backend returns a known failure, then the safe
   error is visible and programmatically associated with both invalid fields.
4. Given an unauthenticated `/app` visit, when protection redirects, then the
   resulting login document retains a title and passes the same audit.
5. Given an authenticated `/app` visit, when content renders, then banner/main
   landmarks and one level-one heading are exposed.

## Risk And Authority

Risk is high because files under authentication and a dependency lockfile are
changed, even though product behavior changes are limited to accessibility.
The user authorized Phase 3.3 implementation. Commit, push, deployment, and any
external mutation remain excluded.

## Impact Areas

- `tests/e2e/accessibility.spec.ts`
- login and authenticated-foundation semantics/focus styles
- shared light-theme accent contrast
- Playwright development dependency and lockfile
- testing, harness, design, baseline, and execution-plan documentation

## Verification Matrix

| Acceptance                        | Evidence                                      |
| --------------------------------- | --------------------------------------------- |
| Detectable WCAG A/AA violations   | Axe scans in isolated Chromium scenarios      |
| Keyboard order and visible focus  | Playwright keyboard and computed-style checks |
| Login error relationship          | Role/label and ARIA browser assertions        |
| Protected/authenticated semantics | Redirect, title, landmark, and heading checks |
| Repository health                 | `pnpm verify`                                 |
| Complete runtime behavior         | `pnpm verify:runtime`                         |

## Checklist

- [x] Add the official Axe Playwright integration.
- [x] Cover all implemented page states and relevant keyboard semantics.
- [x] Correct only accessibility defects demonstrated by the new evidence.
- [x] Document the sensor scope, limitations, and durable UI requirements.
- [x] Run full and browser verification and record exact evidence.
- [x] Complete the plan after all local gates pass.

## Rollout And Rollback

The browser gate begins enforcing the added scenarios wherever
`pnpm verify:runtime` runs. Rollback removes the scenarios/dependency and reverts
the narrow semantic/style fixes; no persisted or backend state is affected.

## Decision And Deviation Log

- 2026-08-01: The initial audit found three concrete defects: insufficient light
  ember-text contrast, a banner nested inside `main`, and insufficiently robust
  login focus indicators. The implementation corrects those defects directly.
- 2026-08-01: Protected-route accessibility receives explicit coverage even
  though redirect behavior already had a separate browser test, because the
  resulting document state is the accessibility boundary.

## Verification

- `pnpm verify`: passed; formatting, generated-contract drift, lint, typecheck,
  60 Vitest tests, 6 contract tests, 25 harness/testing tests, production build,
  knowledge, architecture, maintainability, and public-page checks succeeded.
- The verification shell used Node `v22.22.0`, so pnpm emitted the expected
  engine warning for the repository's Node 24 requirement. Hosted CI remains the
  independent intended-runtime proof after a future authorized push.

## Runtime Evidence

- `pnpm verify:runtime`: passed in 7.9 seconds with all 10 Chromium scenarios,
  including the five implemented accessibility states.

## Follow-Up Debt

- Human keyboard, zoom/reflow, reduced-motion, and screen-reader review remains
  necessary before claiming conformance for a production product surface.
