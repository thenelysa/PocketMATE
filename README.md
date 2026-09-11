# PocketMATE

Bill and credit-card tracker. Next.js 15 (App Router) + Prisma + Postgres
(Neon) + Google OAuth.

## Requirements

- Node.js 20 or newer
- A Neon Postgres database
- A Google OAuth Client ID (Web application)

## Setup

```bash
npm install                 # also generates the Prisma client
cp .env.example .env.local  # then fill it in (see below)
npm run db:migrate          # create the tables
```

If your database **already has** the tables, baseline it instead of migrating:

```bash
npx prisma migrate resolve --applied "$(ls prisma/migrations | grep _init)"
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → your project → Connection Details → pooled connection string |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth Client ID (Web application). Add `http://localhost:3000` as an authorised JavaScript origin. |

`.env.local` is gitignored. Never commit it.

### No database handy?

Any Postgres works — the Prisma schema does not depend on Neon:

```bash
docker run -d --name pocketmate-pg -e POSTGRES_PASSWORD=devpw \
  -e POSTGRES_DB=pocketmate -p 55432:5432 postgres:16
# DATABASE_URL=postgresql://postgres:devpw@localhost:55432/pocketmate
npm run db:migrate
```

## Run

```bash
npm run dev        # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build — also prints the real route table |
| `npm start` | Serve the production build (run `build` first) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run db:migrate` | Create and apply a migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply pending migrations (CI / production) |
| `npm run db:studio` | Browse the data in a GUI |
| `npm run db:generate` | Regenerate the Prisma client |

`npm run build` must pass before you push. It is the only check that catches a
Server/Client Component boundary mistake.

## Routes

| URL | Purpose |
|---|---|
| `/` | Public landing page |
| `/login` | Google sign-in |
| `/dashboard` | Bill overview |
| `/bills`, `/cards`, `/reminders` | CRUD screens |
| `/reports`, `/settings` | Stubs |
| `/api/auth`, `/api/bills`, `/api/cards`, `/api/reminders` | JSON endpoints |

⚠️ `app/(dashboard)/` and `app/(auth)/` are **route groups**. The parentheses are
not part of any URL — it is `/bills`, never `/(dashboard)/bills`. Getting this
wrong is a guaranteed 404. See [`docs/ROUTING.md`](docs/ROUTING.md).

## Project layout

```
prisma/         schema.prisma + migrations — the database source of truth
src/
  app/          routes only — thin pages that compose features
  features/     one folder per domain (bills, cards, reminders, auth):
                  types.ts · hooks.ts · components/
  components/   providers.tsx + ui/ generic primitives
  lib/          infrastructure: db.ts (Prisma), api.ts, api-client.ts
public/         static assets
docs/           architecture, routing, conventions, migration notes
tests/          Playwright specs
```

Imports use the `@/` alias, which points at `src/`: `@/features/bills/hooks`.
Inside a feature, use relative paths (`../hooks`, `./types`).

Domain code lives in `src/features/`, never in a route file. A `page.tsx` over
~120 lines means something in it belongs in a feature folder.

## Documentation

**Agents start at [`AGENTS.md`](AGENTS.md)** in the repository root. It is short
by design and contains a task→document table; directory-level `AGENTS.md` files
(`app/`, `app/api/`, `lib/`, `components/`, `tests/`) carry the rules for each
subtree and load automatically when that code is touched. The `CLAUDE.md` files
are one-line `@AGENTS.md` imports, so there is a single source of truth.

Humans, read these in order:

1. [`docs/ROUTING.md`](docs/ROUTING.md) — App Router rules, route groups, the 404
   trap, how to add a route. **Start here.**
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how a request flows from a
   screen to Postgres, the database schema, and the known auth limitation.
3. [`docs/API.md`](docs/API.md) — the API response contract and how to write a
   handler.
4. [`docs/DATABASE.md`](docs/DATABASE.md) — Prisma schema, migrations, and the
   raw-SQL escape hatch.
5. [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — the patterns to follow when
   adding a hook, an API route, or a component.
6. [`docs/MIGRATION.md`](docs/MIGRATION.md) — what the Vite → Next.js migration
   removed and why, plus what is still open.

## Security status

This app is **not production-ready**. The Google ID token is decoded in the
browser without server-side verification, and the API routes trust a `userId`
query parameter, so any client can read any user's data. Use it with test data
only until that is fixed — the fix is written up in `docs/ARCHITECTURE.md`.
