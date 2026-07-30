# Initial Product Foundation

## Product status

Lamara is a SaaS product under development. Detailed positioning, wedding
workflows, roles, pricing, and public product pages are not finalized and must
not be invented by the frontend.

## Implemented surfaces

- `/`: generic development-state landing page;
- metadata routes and light/dark theme support.

The auth/session foundation also includes:

- `/login`: password authentication;
- `/app`: generic authenticated proof using the current-user API.

These routes prove infrastructure only. `/app` is not a product dashboard and
must not introduce navigation, reports, account management, or wedding
features.

## Copy rules

- Describe Lamara only as a SaaS product under development.
- Do not claim product capabilities until they are explicitly decided and
  implemented.
- Do not carry forward desktop, AI usage, download, local-first, report, or
  developer-tool language from copied projects.
- Keep auth copy functional: sign in, signed in, sign out, and safe error
  messages.

## Next product decision

Product discovery will define the first real wedding-organizer workflow after
the generic authentication/session foundation is proven. Until then, no product
route beyond the generic proof surfaces is planned.
