# Lamara Frontend Technology Stack

## Active stack

| Concern         | Choice                  | Current use                          |
| --------------- | ----------------------- | ------------------------------------ |
| Framework       | Next.js App Router      | Static marketing and metadata routes |
| UI              | React Server Components | Default rendering model              |
| Language        | TypeScript 5.9, strict  | Application and tooling code         |
| Styling         | Tailwind CSS 4          | Tokens and component styling         |
| API contracts   | openapi-typescript 7.13 | Generated compile-time API types     |
| Package manager | pnpm 11.15              | Pinned in `package.json`             |
| Unit tests      | Vitest and Node test    | UI/utilities and contract tooling    |
| Component tests | Testing Library         | Interactive theme control            |
| Browser tests   | Playwright              | Public route and metadata smoke      |
| Quality         | ESLint and Prettier     | Type-aware lint and formatting       |

The repository uses local components. It does not depend on a runtime component
framework.

## Planned, not active

The following are not current stack commitments:

- HTTP transport;
- runtime API schemas;
- session storage;
- client-side query caching;
- global client state;
- charting or table libraries.

Select these only through the staged execution plans. Generated OpenAPI types
are active; runtime validation begins only with the transport and real feature
schemas.

## Framework guidance

- Prefer Server Components.
- Keep client boundaries small.
- Inspect the installed Next.js documentation before relying on unfamiliar
  framework behavior.
- Do not add packages for planned features.
