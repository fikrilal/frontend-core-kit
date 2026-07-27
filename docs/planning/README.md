# Planning Docs

Use this folder for proposals and handoffs that are not yet normative source of
truth.

When a plan is accepted and implemented, promote durable decisions into
`docs/core/`, `docs/product/`, `docs/design/`, or `docs/engineering/`, and keep
execution evidence under `docs/exec-plans/`.

Drafts may also live temporarily in `_WIP/` at the repo root. Prefer
`docs/planning/` for work that should be reviewable next to product docs.

## Active handoffs

- `docs/planning/desktop-auth-web-handoff.md` — **web slice shipped**; desktop signs in on web (Google), then deep-link return
- `docs/planning/desktop-auth-web-implementation-plan.md` — big-view plan for lamara-web (historical phases 1–3 done)
- **Next (desktop repo):** lamara `docs/planning/desktop-auth-via-web-handoff.md` — PKCE, browser open, callback, token exchange, keychain
