# Commit Conventions

Lamara Web uses semantic scoped commit messages for maintainability, review
clarity, and agent coordination.

## Format

```text
type(scope): message
```

Examples:

```text
feat(auth): add password login server adapters
fix(marketing): correct hero download href
docs(api): document session cookie BFF model
chore(harness): extend architecture boundary checks
test(api): cover problem-details parsing
```

Rules:

- `type` and `scope` are required.
- `message` is imperative mood, lowercase start preferred, no trailing period.
- Header max length: 100 characters.
- Body is optional; wrap freely when present.
- `Merge …` and `Revert …` commits are ignored by commitlint.

## Allowed Types

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `perf`
- `refactor`
- `revert`
- `style`
- `test`

## Allowed Scopes

Use the narrowest accurate scope for the change.

| Scope       | Use for                                                    |
| ----------- | ---------------------------------------------------------- |
| `api`       | Server API client, envelope/problem-details, health smoke  |
| `auth`      | Session/auth core, login/register/logout adapters, cookies |
| `contracts` | OpenAPI/path/Zod contracts under `src/contracts`           |
| `marketing` | Landing page / marketing feature                           |
| `downloads` | Download page / install commands                           |
| `privacy`   | Privacy page                                               |
| `sources`   | Supported sources page                                     |
| `ui`        | Shared UI primitives (`src/components/ui`)                 |
| `layout`    | Shared layout/chrome (topbar, footer, rail, shell)         |
| `seo`       | Metadata, sitemap, robots, OG/twitter images               |
| `app`       | App Router composition, route groups, root layout          |
| `config`    | Env, Next/TS/ESLint/Prettier project config                |
| `deps`      | Dependency adds/updates/removals                           |
| `harness`   | Architecture/public-page checks, verify scripts            |
| `docs`      | Documentation under `docs/` or agent guides                |
| `test`      | Unit/component tests and Vitest setup                      |
| `e2e`       | Playwright tests and browser gates                         |
| `ci`        | CI workflows                                               |
| `build`     | Build tooling and production build config                  |
| `release`   | Release/versioning notes when used                         |

If a change spans multiple scopes, prefer:

1. the primary user-facing or architectural scope, or
2. split into multiple commits when practical.

Do not invent one-off scopes without updating this doc and `commitlint.config.cjs`.

## Local Enforcement

Install dependencies, then install the local commit hook once per worktree:

```bash
pnpm install
pnpm run setup:hooks
```

This sets `core.hooksPath` to `.githooks` for the current repo.

Check the last commit:

```bash
pnpm run commitlint -- --from HEAD~1 --to HEAD
```

Check a range:

```bash
pnpm run commitlint -- --from origin/main --to HEAD
```

CI intentionally does not need to own commitlint. Prefer local hooks, agent
workflow, and review for message quality.

## Agent / Contributor Notes

- Prefer one logical change per commit.
- Do not commit secrets, `.env` files, or generated noise.
- Never commit or push unless explicitly instructed by the user.
- When documenting behavior, update source-of-truth docs in the same change
  when the commit changes architecture or contracts.
