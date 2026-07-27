# Lamara Web Design Direction

## Purpose

This document defines the initial visual and product-design direction for
Lamara Web.

It covers brand tone, page composition, asset strategy, content density, and UI
guardrails for the first public web release.

It does not define final copy, final component APIs, exact CSS tokens, or a full
design system.

## Product Design Positioning

Lamara Web should present Lamara as:

- a developer utility,
- a local-first privacy-conscious product,
- a lightweight tray companion,
- a practical token usage tracker,
- a product for people who use AI coding tools daily.

Lamara Web should not feel like:

- a generic SaaS analytics dashboard,
- an enterprise reporting suite,
- a crypto or gamified leaderboard product,
- a decorative landing page with little product signal,
- a heavy marketing site detached from the desktop app.

## Visual Tone

Target tone:

```text
sharp
compact
technical
polished
calm
trustworthy
```

The site should feel like a well-made developer tool with taste.

It should avoid oversized startup-marketing composition, vague claims, and
purely decorative visuals.

## Brand Message

The landing page should answer this quickly:

```text
What is Lamara?
Why should a developer install it?
Why is it safe to trust locally?
```

Initial message:

```text
Lamara is a local tray app for tracking AI coding-tool token usage.
```

Primary value:

```text
Know how much AI coding-tool usage you are burning through today without opening
a dashboard.
```

Supportive message:

```text
Lamara reads local usage from supported tools, stores data on your machine, and
keeps prompt, response, source code, and file content out of collection.
```

## Visual System Direction

Lamara should use a restrained product palette.

Recommended direction:

- near-black and off-white foundations,
- neutral surfaces,
- ember or signal-orange accent,
- green only for success/available states,
- red only for destructive/error states,
- blue only for links or informational states where needed.

Avoid:

- one-note purple or blue SaaS gradients,
- beige/cream product themes,
- dark navy dashboards as the whole identity,
- orange overload,
- abstract gradient blobs,
- decorative orb/bokeh backgrounds.

The "burn" metaphor can inform accents and motion, but it should not dominate
the interface.

## Typography Direction

Typography should be clear and compact.

Recommended:

- high-quality sans-serif for body and UI,
- restrained display treatment for hero headings,
- tight but readable content rhythm,
- no negative letter spacing,
- no viewport-width font scaling.

Text hierarchy should match the surface:

- hero headings can be large,
- download and source pages should be denser,
- cards and compact panels should use modest headings.

## Hero Direction

The first viewport must make Lamara the primary signal.

Recommended hero elements:

- product name,
- concise value proposition,
- primary download CTA,
- secondary GitHub or supported-sources CTA,
- product-faithful tray panel visual,
- hint of the next section visible below the fold.

The hero should not rely on abstract SVG art or generic dashboard mockups.

Avoid:

- split hero where one side is a decorative card and the other side is text,
- purely gradient hero backgrounds,
- large abstract illustration as the main product signal,
- marketing copy that hides what Lamara actually does.

## Asset Strategy

Use product-real or product-faithful visuals.

Preferred assets:

- actual tray panel screenshots from Lamara desktop,
- polished product mockups derived from the real tray UI,
- platform download visuals,
- small status/source visuals based on real product states.

Acceptable supporting assets:

- generated bitmap imagery when it reinforces the product,
- subtle textures or screenshots when they do not obscure product details.

Avoid:

- generic stock imagery,
- fake analytics dashboards unrelated to Lamara's actual UI,
- dark blurred screenshots that cannot be inspected,
- SVG illustrations where real product visuals would communicate better.

## Landing Page Composition

Recommended landing page sequence:

```text
Hero
  Product name, value prop, download CTA, product visual

Core Value
  Today/week/month usage, model allocation, freshness/status

Supported Sources Preview
  Supported and experimental tool signals

Local-First Privacy
  Clear statement of what Lamara does and does not collect

Download CTA
  Platform-aware or direct link to download page
```

The page should be concise. The goal is to create confidence and drive download,
not explain every future feature.

## Download Page Composition

The download page should be practical and dense.

Recommended sections:

```text
Platform Download
  Linux, Windows, macOS options

Install Commands
  Copyable commands where appropriate

Preview Caveats
  Windows unsigned preview, macOS unsigned preview, platform notes

Updater Notes
  Explain in-app update behavior

Integrity And Source
  Official GitHub releases and checksum/signature notes when available
```

The download page should prioritize clarity over visual drama.

Users should be able to answer:

```text
Which file do I download?
Is this preview/signed?
How do I install it?
Where is the official source?
```

## Privacy Page Composition

The privacy page should be plain and specific.

It should clearly state:

- local app does not require an account,
- usage data is stored locally,
- prompts are not collected,
- responses are not collected,
- source code is not collected,
- file contents are not collected,
- future sync/social features are opt-in,
- local project metadata can be sensitive and is handled deliberately.

Avoid vague claims such as:

```text
Your privacy is our priority.
```

Prefer concrete statements about behavior.

## Supported Sources Page Composition

The supported sources page should clearly distinguish support levels.

Recommended support states:

```text
Supported
Experimental
Not supported yet
Not planned
```

The page should explain that different tools store usage differently and that
experimental sources may require updates when upstream formats change.

This page should be useful for both users and future maintainers.

## Interaction Direction

Interactions should be precise and lightweight.

Use:

- icon buttons for compact actions,
- copy buttons for install commands,
- clear hover/focus states,
- platform selectors only when needed,
- tooltips for unfamiliar icon-only actions.

Avoid:

- excessive animation,
- scroll-jacking,
- novelty interactions that obscure download/install tasks,
- full-page client-side animation requirements.

Motion should respect reduced-motion preferences.

## Responsiveness

Pages must work well on mobile and desktop.

Mobile priorities:

- quick product explanation,
- obvious download path,
- readable install commands,
- no horizontal overflow,
- no text trapped inside tiny buttons or cards.

Desktop priorities:

- clear product visual,
- scannable sections,
- dense but calm download information,
- no oversized whitespace that makes the page feel empty.

## Accessibility

Design must support:

- semantic landmarks,
- one clear `h1` per page,
- keyboard navigation,
- visible focus states,
- sufficient color contrast,
- reduced-motion preferences,
- specific link and button labels,
- readable code/install command blocks.

Accessibility is part of the design direction, not a separate polish phase.

## Design System Starting Point

Initial shared components should be minimal and driven by page needs.

Likely first primitives:

- button,
- badge,
- card or panel,
- link,
- copy button,
- code block,
- platform download option,
- source status indicator,
- page shell,
- section header.

Do not build a broad design system before the first pages reveal actual
component needs.

## Content Voice

Lamara copy should be:

- direct,
- specific,
- technically honest,
- concise,
- calm.

Avoid:

- hype,
- vague AI productivity claims,
- enterprise buzzwords,
- exaggerated privacy promises,
- jokes that make the product feel less trustworthy.

Good example:

```text
Lamara reads local usage data from supported AI coding tools and stores usage
summaries on your machine.
```

Weak example:

```text
Unlock unparalleled AI productivity insights with next-generation analytics.
```

## Decision Status

Approved for the initial Lamara Web visual direction.

Revisit this document after the first landing and download page implementation
is visually reviewed on mobile and desktop.
