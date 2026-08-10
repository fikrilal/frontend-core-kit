# Frontend Core Kit Design Direction

## Product status

Frontend Core Kit is a SaaS starter under development. The detailed product position and
workflows are not finalized, so the current UI must remain neutral and
technically honest.

The foundation may communicate only:

- Frontend Core Kit exists and is under development;
- users can sign in with the implemented authentication mechanism;
- an authenticated session is active;
- users can sign out.

Do not invent wedding workflows, dashboards, analytics, reports, pricing,
download behavior, or unsupported calls to action.

## Visual language

The visual and interaction source of truth is the **pure shadcn default**
(official shadcn new-york components and token set as shipped). Frontend Core Kit
Frontend is a template-grade starter, so its UI must stay recognizable and
upgradeable: no custom design tokens, no hand-rolled primitives, no bespoke
styling layer.

The shadcn default provides:

- the neutral token set (`:root` / `.dark`) for colors, radii, and borders;
- standard component primitives (buttons, inputs, cards, alerts, badges) in
  `src/components/ui/**`;
- the default light/dark theme contract.

Customize only through documented shadcn conventions (variants, `cn()`, the
installed primitive set). The previous chanhdai/code-alchemy references are
superseded and are not used as a visual source of truth.

## Current composition

```text
Generic landing page
Minimal password-login card
Minimal authenticated session proof
```

Product design begins only after the first real workflow is decided.
