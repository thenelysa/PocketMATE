# docs/

Detailed reference. **Read on demand, not upfront** — start at the root
`AGENTS.md`, which says which of these your task needs.

| File | Read it when |
|---|---|
| [`ROUTING.md`](ROUTING.md) | Adding or moving a page, debugging a 404, writing any URL. Explains route groups, the full route map, and the auth redirect flow. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | You need the whole picture: request flow from screen to Postgres, the known auth hole, styling setup. |
| [`API.md`](API.md) | Adding or changing an endpoint. Response contract, status codes, `route()` / `ok()` / validation helpers, and the client side. |
| [`DATABASE.md`](DATABASE.md) | Adding a table or column. Prisma schema, migrations, camelCase mapping, partial updates, and the raw-SQL escape hatch. |
| [`CONVENTIONS.md`](CONVENTIONS.md) | Adding a pattern the directory-level `AGENTS.md` files do not already cover — naming, env vars, Server/Client boundaries, pre-push checks. |
| [`MIGRATION.md`](MIGRATION.md) | Something is missing and you want to know whether it was deliberate. Records what the Vite → Next.js cleanup removed, what it fixed, and what is still open. |

Directory-level guidance lives next to the code — `prisma/AGENTS.md`,
`src/app/AGENTS.md`, `src/app/api/AGENTS.md`, `src/features/AGENTS.md`,
`src/lib/AGENTS.md`, `src/components/AGENTS.md`, `tests/AGENTS.md` — and is
loaded automatically when you touch that subtree. Those come first; these
documents are the depth behind them.
