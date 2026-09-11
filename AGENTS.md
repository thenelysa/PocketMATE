# PocketMATE — agent entry point

Bill and credit-card tracker. **Next.js 15 App Router + Neon Postgres + Google OAuth.**
Migrated from Vite + React; see `docs/MIGRATION.md`.

Read this file first. Then read **only** the one or two documents your task needs —
the table below says which. Do not read all of `docs/`.

## The rule that breaks things most often

`app/(dashboard)/` and `app/(auth)/` are **route groups**. Parentheses group files
and share a layout; they are **never** part of a URL.

```
app/(dashboard)/bills/page.tsx  →  /bills               ✅
                                →  /(dashboard)/bills   ❌ 404, always
```

`npm run build` prints the real route table. It is the only source of truth for
which URLs exist.

## Architecture in five lines

1. `app/` holds routes only. Screens are Client Components.
2. Domain code lives in `src/features/<domain>/` — row type, query hooks, and
   the components that route files compose.
3. Those hooks call this app's own `/api/*` route handlers through
   `@/lib/api-client`.
4. Handlers use the shared Prisma client from `src/lib/db.ts` against Postgres.
5. Google OAuth → `users` row → `localStorage` via `src/features/auth/`.

## Where to look — by task

| Your task | Read | Then edit |
|---|---|---|
| Add or move a page, fix a 404, change a URL | `docs/ROUTING.md` | `src/app/**/page.tsx` |
| Add or change an API endpoint | `src/app/api/AGENTS.md` → `docs/API.md` | `src/app/api/*/route.ts` |
| Add or change a table or column | `prisma/AGENTS.md` → `docs/DATABASE.md` | `prisma/schema.prisma` |
| Add a feature, hook, query, mutation, or domain component | `src/features/AGENTS.md` | `src/features/<domain>/` |
| Touch the database client or connection | `src/lib/AGENTS.md` → `docs/DATABASE.md` | `src/lib/db.ts` |
| Auth, session, redirect-after-login | `docs/ROUTING.md` § 5 | `src/features/auth/`, `src/app/(dashboard)/layout.tsx` |
| Add a generic UI primitive or a provider | `src/components/AGENTS.md` | `src/components/` |
| Styling, colours, fonts | `docs/ARCHITECTURE.md` § Styling | `src/app/globals.css` |
| Write or fix a test | `tests/AGENTS.md` | `tests/e2e.spec.ts` |
| "Why is this dependency/file missing?" | `docs/MIGRATION.md` | — |
| Any new pattern not covered above | `docs/CONVENTIONS.md` | — |

Directory-level `AGENTS.md` files (`src/app/`, `src/app/api/`, `src/features/`,
`src/lib/`, `src/components/`, `tests/`) carry the rules for that subtree. Start
there, not in `docs/`.

Tool-specific entry points — `CLAUDE.md` (next to every `AGENTS.md`), `GEMINI.md`,
`.github/copilot-instructions.md` — are pointers back to these files, so every
tool reads the same text. **Edit `AGENTS.md` only**; the pointers carry no content
of their own.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # must pass; prints the route table
npm run lint       # 0 errors expected (7 <img> warnings are known and deliberate)
npm run typecheck
npm run test:e2e
npm run db:migrate   # after editing prisma/schema.prisma
```

Requires `.env.local` with `DATABASE_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
(see `.env.example`). Run `typecheck`, `lint` and `build` before claiming done.

## Layout

```
prisma/         schema.prisma + migrations — the database source of truth
src/
  app/          routes ONLY — thin pages that compose features
  features/     one folder per domain: bills, cards, reminders, auth
                  types.ts · hooks.ts · components/
  components/   providers.tsx + ui/ generic primitives
  lib/          infrastructure: db.ts (Prisma), api.ts, api-client.ts
docs/           detailed docs, read on demand
tests/          Playwright
public/         static assets (stays at repo root)
```

Imports use the `@/` alias → `src/`: `@/features/bills/hooks`, `@/components/ui`.
Inside a feature, use relative paths (`../hooks`, `./types`).

## Non-negotiables

- Never commit `.next/`, `node_modules/`, or `.env.local`. A committed stale
  `.next/` is what caused this project's 404s.
- No `VITE_*` env vars, no `tailwind.config.ts` (Tailwind v4 is CSS-configured),
  no second `next.config.*` file. All three were removed for a reason.
- `app/layout.tsx` stays a Server Component. Providers go in `components/providers.tsx`.
- **camelCase everywhere** in TypeScript and on the wire. snake_case column
  names live only in `prisma/schema.prisma` behind `@map`. There is no
  case-conversion code in the app; do not add any.
- Use the Prisma query API. If raw SQL is genuinely needed, use
  `prisma.$queryRaw` (tagged template — binds parameters), never
  `$queryRawUnsafe` with user input.
- Every API handler goes through `route()` and `ok()` from `@/lib/api`; the
  response contract is in `docs/API.md`.
- A `page.tsx` over ~120 lines means something belongs in `src/features/`.
- Auth is **not** production-ready — `/api/*` trusts a `userId` query parameter,
  so any client can read any user's rows. See `docs/ARCHITECTURE.md` § Auth.
