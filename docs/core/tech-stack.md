# Lamara Frontend Technology Stack

## Active stack

| Concern         | Choice                  | Current use                          |
| --------------- | ----------------------- | ------------------------------------ |
| Framework       | Next.js App Router      | Static marketing and metadata routes |
| UI              | React Server Components | Default rendering model              |
| Language        | Strict TypeScript       | Application and tooling code         |
| Styling         | Tailwind CSS 4          | Tokens and component styling         |
| Package manager | pnpm 11.15              | Pinned in `package.json`             |
| Unit tests      | Vitest                  | Theme behavior                       |
| Component tests | Testing Library         | Interactive theme control            |
| Browser tests   | Playwright              | Public route and metadata smoke      |
| Quality         | ESLint and Prettier     | Type-aware lint and formatting       |

The repository uses local components. It does not depend on a runtime component
framework.

## Planned, not active

The following are not current stack commitments:

- API client generation;
- runtime API schemas;
- session storage;
- client-side query caching;
- global client state;
- charting or table libraries.

Select these only when the owning feature is approved. The network proposal
currently recommends generated OpenAPI types plus runtime validation, but that
decision remains under review.

## Framework guidance

- Prefer Server Components.
- Keep client boundaries small.
- Inspect the installed Next.js documentation before relying on unfamiliar
  framework behavior.
- Do not add packages for planned features.
