# Lamara Frontend Design System

## Current foundation

Lamara uses:

- Tailwind CSS 4;
- local CSS variables in `src/app/globals.css`;
- local React components;
- light and dark themes;
- `clsx` plus `tailwind-merge` through `cn`;
- a neutral palette with one ember accent.

The current shared components are limited to active landing-page needs:

```text
src/components/brand/lamara-mark.tsx
src/components/layout/marketing-shell.tsx
src/components/layout/rail.tsx
src/components/layout/section-divider.tsx
src/components/layout/site-footer.tsx
src/components/layout/site-topbar.tsx
src/components/theme/*
```

There is no broad component library yet.

## Adoption rules

When an active feature needs a reusable primitive:

1. inspect matching patterns in the two pinned reference repositories;
2. start with shadcn-compatible conventions where useful;
3. copy the smallest required behavior into local source;
4. remove unused variants, dependencies, and motion;
5. keep product language in the owning feature;
6. preserve accessibility and reduced-motion behavior;
7. add tests for meaningful interaction.

Do not preinstall registry packages or retain components for hypothetical pages.
`components.json` records CLI aliases and reference registries; it does not make
those registries runtime dependencies.

## Component boundaries

- `components/layout`: cross-page chrome.
- `components/theme`: browser theme behavior.
- `components/ui`: generic primitives only when active use exists.
- `features/<feature>`: product copy, product panels, and feature behavior.

Default to Server Components. A leaf component becomes client-side only when it
needs a browser API or event handler.

## Tokens

The current token set covers:

- background and foreground;
- muted surface and text;
- border and soft structural line;
- product surface;
- ember accent;
- success signal;
- font and radius roles.

Add tokens only after repeated use demonstrates a stable role.
