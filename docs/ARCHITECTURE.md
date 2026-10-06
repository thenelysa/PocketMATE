# Architecture

PocketMATE is a bill-and-credit-card tracker: a Next.js 15 App Router app talking
to a Neon Postgres database through its own `/api` routes, with Google OAuth for
sign-in. It was migrated from a Vite + React SPA; `docs/MIGRATION.md` records what
changed and what was deliberately dropped.

## Five-line version

1. `src/app/` holds every route. Route groups `(auth)` and `(dashboard)` organise
   files and share layouts — they are **not** URL segments (`docs/ROUTING.md`).
2. Domain code lives in `src/features/<domain>/` — row type, query hooks, and the
   components a route composes. Screens are thin Client Components.
3. Those hooks reach this app's own `/api/*` route handlers through
   `@/lib/api-client`, which surfaces the server's error message on failure.
4. Route handlers use the shared Prisma client from `src/lib/db.ts`.
5. Sign-in is Google OAuth decoded in the browser, mirrored into a `users` row,
   and persisted in `localStorage` via `src/features/auth/auth-context.tsx`.

## Directory map

```
src/
  app/                   routes ONLY — thin pages that compose features
    layout.tsx           root Server Component: <html>, font, metadata
    page.tsx             "/" landing page
    not-found.tsx        404
    global-error.tsx     crash screen for errors in the root layout
    globals.css          Tailwind v4 entry + @theme tokens
    (auth)/login/        "/login"
    (dashboard)/         shared shell for every signed-in screen
      layout.tsx         sidebar, top bar, auth guard
      dashboard|bills|cards|reminders|reports|settings/
    api/                 route handlers (auth, bills, cards, reminders)

  features/              one folder per business domain
    bills/     types.ts  hooks.ts  components/{bill-form,bill-table}.tsx
    cards/     types.ts  hooks.ts  components/{card-form,card-tile}.tsx
    reminders/ types.ts  hooks.ts  components/{reminder-form,reminder-list}.tsx
    auth/      auth-context.tsx

  components/
    providers.tsx        every client-side provider, one tree
    ui/                  Button, Card, Badge, and cn() — generic only

  lib/
    db.ts                lazy pg Pool + query()
    case.ts              snake_case -> camelCase for request bodies

public/                  static assets served from / (repo root)
docs/                    this documentation
tests/                   Playwright end-to-end specs
neon.ts                  Neon config-as-code (branch/TTL policy), not app code
```

Everything imports through the `@/` alias, which maps to `src/` (`tsconfig.json`).
So `@/features/bills/hooks`, `@/components/ui`, `@/lib/db`. Inside a feature, use
relative paths (`../hooks`, `./types`). Do not use `../../..` across directories.

**The layering rule:** `app/` may import from `features/`, `components/` and
`lib/`. `features/` may import from `components/` and `lib/`, and from another
feature's `types.ts`/`hooks.ts`. `components/ui/` and `lib/` import from neither —
they know nothing about the domain.

## Data flow, end to end

Adding a bill:

```
BillsPage                                  app/(dashboard)/bills/page.tsx
  └─ <BillForm>                            features/bills/components/bill-form.tsx
       └─ useCreateBill()                  features/bills/hooks.ts
            └─ apiPost('/api/bills', …)    lib/api-client.ts
                 └─ app/api/bills/route.ts  POST, wrapped in route()
                      └─ prisma.bill.create({ data })          lib/db.ts
                           └─ Postgres  (Neon in production)
                 ◀─ ok(bill, 201) — Decimal converted to a JSON number
            └─ queryClient.invalidateQueries(['bills', user.sub])
  └─ useBills() refetches, <BillTable> re-renders
```

Three invariants hold across every feature:

- **The query key is always `[resource, user.sub]`.** A mutation must invalidate
  the same key its list uses, or the UI shows stale data after a write.
- **Every list hook is `enabled: !!user?.sub`.** Without it the query fires before
  the session hydrates and requests `userId=undefined`.
- **Everything is camelCase** — component state, wire format, and Prisma. The
  snake_case column names exist only in `prisma/schema.prisma` behind `@map`, so
  no conversion code exists in the app. See `docs/DATABASE.md`.

## Auth

The custom Google button obtains an access token. `POST /api/auth` verifies it
with Google's token info endpoint (audience and expiry), fetches the verified
profile server-side, upserts the user, and sets a seven-day httpOnly session cookie.
Only a SHA-256 token hash is stored in the `sessions` table. Sign-out revokes it.

`AuthProvider` hydrates from `GET /api/auth`. The localStorage profile is only
an optional display cache; it never grants access. Every private API calls
`requireUser(request)` and filters writes by owner. Household operations also
check membership, owner, and payer permissions. Mutations reject cross-origin
requests. The layout's loading guard remains necessary during session loading.

The session table and other Money Studio tables must be migrated before this
version is activated. See [Money Studio](MONEY-STUDIO.md).

## Database

Postgres (Neon in production) through **Prisma**. `prisma/schema.prisma` is the
single source of truth: it defines the tables, generates the TypeScript types
that `src/features/*/types.ts` build on, and drives the migrations in
`prisma/migrations/`.

| Table | Notes |
|---|---|
| `users` | `id` is the Google `sub`; `email` is unique and the upsert key |
| `bills` | `status` is `'PAID'` or `'UNPAID'` — the dashboard counts on exactly those. Money is `Decimal(12,2)` |
| `credit_cards` | `statementDate` / `paymentDueDate` are days of the month (1–31) |
| `reminders` | `billId` is optional — a reminder can stand alone |

All child tables cascade on user delete; ids are UUIDs generated by Prisma.

Fields are camelCase in TypeScript, columns snake_case in the database, bridged
by `@map` in the schema — which is why there is no case-conversion code in the
application at all.

Full workflow (migrations, baselining an existing database, partial-update
semantics, the `$queryRaw` escape hatch): **`docs/DATABASE.md`**.

`src/lib/db.ts` caches the client on `globalThis` so Next's dev hot-reload does
not open a new connection pool on every file save, and builds it lazily on first
use so `next build` (which imports every route module and has no `DATABASE_URL`)
does not crash.

## API

Handlers return the resource directly on success and
`{ error: { code, message } }` on failure, with the status code distinguishing
them. Every handler is wrapped in `route()` from `src/lib/api.ts`, which maps
`ApiError` to its status, Prisma `P2025` to 404, and anything else to a logged,
generic 500. Clients call it through `src/lib/api-client.ts`, which surfaces the
server's message.

Full contract: **`docs/API.md`**.

## Styling

Tailwind **v4**, configured in CSS. `src/app/globals.css` has `@import "tailwindcss"`
and an `@theme` block. There is **no `tailwind.config.ts`** — a v3-style config
file is silently ignored by v4 unless referenced with `@config`, so the one left
over from the Vite app was deleted rather than left to mislead.

Colours are currently written as literal hex in class names (`bg-[#078D88]`). The
`@theme` tokens (`--color-teal`, `--color-navy`, …) exist but are barely used.
Preferring the tokens is a worthwhile cleanup; do not mix approaches inside one
component.

Nunito is loaded with `next/font/google` in `src/app/layout.tsx`, which exposes it as
`--font-nunito`; `globals.css` references that variable. (Before the migration
cleanup the CSS asked for `"Nunito"` by name and nothing ever loaded it, so every
page silently fell back to the system font.)
