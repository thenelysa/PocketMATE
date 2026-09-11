# Vite → Next.js migration: what was removed and why

The app began as a Vite + React SPA. The migration to Next.js 15 App Router left
behind artefacts that were quietly breaking things. This is the record of what
was removed, so nobody puts it back.

## Removed

| Removed | Why |
|---|---|
| `next.config.js` | A **second** config file alongside `next.config.ts`. Next loads one and ignores the other, so edits landed in a file nobody read. It also re-exported `VITE_GOOGLE_CLIENT_ID` / `VITE_DATABASE_URL`, neither of which any code reads. Its one real setting (the `lh3.googleusercontent.com` image host) was moved into `next.config.ts` as `remotePatterns` — `images.domains` is deprecated in Next 15. |
| `tailwind.config.ts` | Tailwind **v4** is in use and configures itself from CSS (`@import "tailwindcss"` + `@theme` in `app/globals.css`). A v3-style JS config is ignored unless a `@config` directive points at it. Editing it changed nothing, which is worse than not having it. |
| `.next/` from git (105 files) | **This caused the 404s.** A stale production build was committed; it predated the `/dashboard` and `/login` routes, so `npm start` served a build in which those URLs did not exist. Now gitignored and untracked. |
| `next-env.d.ts` from git | Regenerated on every build; tracking it creates pointless diffs. Matches `create-next-app`'s own `.gitignore`. |
| `context/` and `providers/` directories | Single-file top-level directories. `context/AuthContext.tsx` → `lib/auth-context.tsx`, `providers/index.tsx` → `components/providers.tsx`. |
| `react-hook-form`, `@hookform/resolvers`, `zod` | Zero imports. Forms are plain controlled inputs. |
| `jspdf`, `@types/jspdf`, `papaparse`, `@types/papaparse`, `pdfjs-dist` | Zero imports — PDF/CSV import-export was never migrated. |
| `recharts` | Zero imports — `/reports` is still a stub. |
| `dotenv` | Next loads `.env*` itself. |
| `autoprefixer`, `postcss` | Tailwind v4's `@tailwindcss/postcss` handles prefixing, and Next bundles postcss. |
| `@neon/env` | Zero imports. (`@neon/config` stays — `neon.ts` uses it.) |
| `pool` export from `lib/db.ts` | Replaced by `query()`. Also deleted `query`/`queryOne` helpers that nothing called. |

If you genuinely need one of the removed feature libraries — charts for `/reports`,
CSV import, PDF statements — reinstall it in the commit that starts using it.
Don't restore it "for later".

## Fixed

| Was | Now |
|---|---|
| `.env.example` documented `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_SHEETS_API_KEY`; the code reads `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `DATABASE_URL`. Following the example produced an app that could neither sign in nor reach the database. | Rewritten to document the two variables actually read, with where to get each. |
| `app/globals.css` set `font-family: "Nunito"`, but nothing ever loaded the font — every page fell back to the system font. | Loaded with `next/font/google` in `app/layout.tsx` and referenced as `var(--font-nunito)`. |
| `GoogleOAuthProvider` was mounted in `app/layout.tsx`, a Server Component. | Moved into `components/providers.tsx` with the other providers; the root layout stays a Server Component. |
| `new Pool(...)` at module scope — Next's dev hot-reload opened a new connection pool on every file save. | Cached on `globalThis`, constructed lazily on first query. |
| `.gitignore` listed Vite's `dist/` and `build/` and omitted `.next/`. | Rewritten for Next: `.next/`, `out/`, `.env*.local`, Playwright artefacts. |
| `npm run lint` ran `next lint` with no ESLint installed and no config — it never ran. | ESLint 9 flat config (`eslint.config.mjs`) with `next/core-web-vitals` + `next/typescript`; `npm run lint` is clean (0 errors). |
| `tests/e2e.spec.ts` navigated to `/(dashboard)/dashboard` and friends — literal route-group paths that always 404. | Uses real URLs. See `docs/ROUTING.md`. |
| No `typecheck` or `test:e2e` scripts. | Added. |

## The restructure (second pass)

The first cleanup got the app running; a follow-up pass fixed the *shape*.

**Symptom:** `lib/hooks.ts` was 229 lines holding three unrelated domains,
separated by `// ==== BILLS ====` banner comments — someone had already felt the
need to split it and reached for comments instead of files. Meanwhile
`bills/page.tsx` was 342 lines and `cards/page.tsx` 326, because a `BillForm` had
nowhere to live: `components/ui/` is correctly generic-only, so domain components
fell back into whichever route file needed them.

**Change:** everything moved under `src/`, and domain code moved into
`src/features/<domain>/` (`types.ts`, `hooks.ts`, `components/`). The `@/` alias
now points at `src/`.

| File | Before | After |
|---|---|---|
| `bills/page.tsx` | 342 | 81 |
| `cards/page.tsx` | 326 | 63 |
| `reminders/page.tsx` | 205 | 61 |
| `lib/hooks.ts` | 229 (3 domains) | deleted → 3 × `features/*/hooks.ts` |

Rules that came out of it are in `src/features/AGENTS.md`. The short version: a
`page.tsx` over ~120 lines means something in it belongs in a feature folder.

## The case-boundary bug (found during the restructure)

**Every write in the app was silently broken.** Pages built payloads in
snake_case (matching the row types), but the route handlers destructured
camelCase:

```ts
// page sent            // handler read          // result
{ due_date: '…' }       const { dueDate } = body  // undefined -> column NULL
{ bank_name: 'Chase' }  const { bankName }        // undefined -> column NULL
{ paid_amount: 42 }     const { paidAmount }      // undefined -> COALESCE kept old
```

Consequences: creating a bill wrote a NULL due date; creating a card wrote NULL
into **every** column; "mark as paid" flipped the status but left `paid_amount`
at 0.

**Fix:** `src/lib/case.ts` exports `toApiBody()`, applied in every mutation hook —
the hook is the layer that owns the wire contract, so the conversion belongs
there rather than in each page. Components keep working in the row shape they
already read. Covered by `src/lib/case.test.ts`.

## Prisma (third pass)

Raw `pg` + hand-written SQL was replaced with Prisma. What that bought:

| Before | After |
|---|---|
| Row types hand-written in `features/*/types.ts`, kept in step with the database by memory | Generated from `prisma/schema.prisma`; the wire types derive from them |
| No migrations at all — schema changes applied by hand in the Neon console | `prisma/migrations/`, committed and replayable |
| A hand-rolled `toApiBody()` snake↔camel converter on every mutation | `@map` in the schema; **no conversion code in the app** |
| `COALESCE($n, column)` in every UPDATE to fake a partial update | Prisma leaves `undefined` fields alone natively |
| Ids as `` `${Date.now()}-${Math.random()…}` `` in three route files | `@default(uuid())` |
| `try/catch` + `console.error` copy-pasted into each handler | one `route()` wrapper |

The raw-SQL escape hatch is still there when the query API is not enough —
`prisma.$queryRaw`, documented in `docs/DATABASE.md`. It is Prisma's own, so
there is still exactly one database client.

Prisma 7 specifics worth knowing: the connection URL lives in `prisma.config.ts`,
not the schema, and the client needs a driver adapter (`@prisma/adapter-pg`).
`prisma.config.ts` loads `.env.local` with Node's own `process.loadEnvFile`, so
no `dotenv` dependency came back.

Note `latest` on npm currently points at an 8.0.0 release candidate; both
packages are pinned to 7.10.0 deliberately.

## The API response standard (third pass)

Handlers used to return bare arrays, `{ user }`, `{ success: true }`, or
`{ error: 'string' }` depending on which one you read, each with its own
`try/catch`. Now every handler follows one contract — resource on success,
`{ error: { code, message } }` on failure — via `route()` and `ok()` in
`src/lib/api.ts`, with `src/lib/api-client.ts` as the matching client. Errors
surface the server's actual message to the UI instead of a generic
"Failed to fetch". Full contract in `docs/API.md`.

Two bugs fell out of writing it:

- **`POST /api/cards` never inserted `current_outstanding` or `card_status`.**
  The column list omitted them, so the balance a user typed was silently dropped.
- **Card and reminder ids** were generated with `Math.random().toString(36).substr(…)`
  — `substr` is deprecated and the values are not collision-safe.

## What the live database actually contained

Adopting Prisma meant introspecting the real Neon database, which turned up two
things the code had been wrong about since before the Next.js migration:

1. **`reminders` is polymorphic, and the app assumed it was bill-specific.** The
   real table has `type`, `reference_id`, `reference_type`, `title` and
   `remind_at`. It has **no** `bill_id`, `remind_date` or `remind_time` — exactly
   the columns every version of the code was inserting. The reminders feature
   could never have worked against this database; it would fail on
   "column does not exist", and `type` and `title` are NOT NULL so an insert
   omitting them fails anyway. Now mapped: `type: 'BILL'`,
   `referenceType: 'bill'`, `referenceId: <bill id>`, date+time combined into
   `remindAt`, and a Title field added to the form.

2. **Four tables nobody mentioned**: `bill_payments`, `card_payments`,
   `card_transactions`, `user_profiles`. They are now in `schema.prisma` purely
   so a migration will not drop them. No feature reads them.

Several columns are also nullable in reality where the code assumed a value
(`bills.is_business`, `credit_cards.statement_date`, `payment_due_date`), which
TypeScript only surfaced once the types came from introspection rather than by
hand.

There is **no migration history**, and generating one naively would be
destructive. `docs/DATABASE.md` has the baselining procedure.

## Still open

Ordered by how much they matter:

1. **Server-side auth.** The Google ID token is decoded in the browser and never
   verified; `/api/*` trusts a `userId` query parameter, so any client can read
   any user's rows. See the security section in `docs/ARCHITECTURE.md` for the
   two-part fix. Do this before real data goes in.
2. **Baseline the database.** Prisma is wired up, but `prisma/migrations/` is
   empty and the schema was introspected from the live database. Until someone
   runs the baselining steps in `docs/DATABASE.md`, no migration can be applied
   safely — and `migrate dev` / `db push` against Neon would be destructive.
3. **`<img>` instead of `next/image`** at 7 call sites — the remaining lint
   warnings. Converting needs explicit `width`/`height` per site and will shift
   layout slightly, so it was left as a deliberate, visible follow-up rather than
   bundled into the cleanup.
4. **`/reports` and `/settings` are stubs.**
5. **Colour literals.** Hex values like `bg-[#078D88]` are scattered through the
   components while `@theme` tokens sit mostly unused.
6. **No card or reminder update endpoint.** Both are create/delete only, which is
   why `CardForm` and `ReminderForm` are create-only modals.
7. **Weak e2e assertions.** Several tests assert
   `url.includes('/bills') || url.includes('/login')`, which passes in both
   directions and catches nothing.
