# Frontend Core Kit Technology Stack

## Active stack

| Concern         | Choice                         | Current use                                       |
| --------------- | ------------------------------ | ------------------------------------------------- |
| Runtime         | Node.js 24 LTS                 | Development, CI, and production                   |
| Framework       | Next.js App Router             | Public and authenticated routes                   |
| UI              | React Server Components        | Default rendering model                           |
| Language        | TypeScript 5.9, strict         | Application and tooling code                      |
| Styling         | Tailwind CSS 4                 | Tokens and component styling                      |
| API contracts   | openapi-typescript 7.13, Orval | Generated types and Zod schemas                   |
| API validation  | Zod 4                          | Generated response validation                     |
| HTTP client     | openapi-fetch 0.17             | Typed server-only Example API calls               |
| Session store   | Process memory                 | Single-instance sessions and refresh coordination |
| Package manager | pnpm 11.15                     | Pinned in `package.json`                          |
| Unit tests      | Vitest and Node test           | UI/utilities and contract tooling                 |
| Component tests | Testing Library                | Interactive theme control                         |
| Browser tests   | Playwright                     | Public and authentication runtime                 |
| Quality         | ESLint and Prettier            | Type-aware lint and formatting                    |

The repository uses local components. It does not depend on a runtime component
framework.

## Planned, not active

The following are not current stack commitments:

- client-side query caching;
- global client state;
- charting or table libraries.

Select these only through the staged execution plans. The generated client
supports the contract's methods. Implemented adapters remain limited to the
authentication proof: password login and registration, email verification and
resend, password-reset request and confirmation, refresh, logout, and current
user.

## Framework guidance

- Prefer Server Components.
- Keep client boundaries small.
- Inspect the installed Next.js documentation before relying on unfamiliar
  framework behavior.
- Do not add packages for planned features.
