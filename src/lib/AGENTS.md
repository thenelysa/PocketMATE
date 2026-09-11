# lib/ — infrastructure

Framework and cross-cutting plumbing only. **Nothing here knows what a "bill"
is** — domain code lives in `features/`.

| File | Role |
|---|---|
| `db.ts` | the shared Prisma client |
| `api.ts` | server half of the API contract — `route()`, `ok()`, error helpers |
| `api-client.ts` | browser half — `apiGet` / `apiPost` / `apiPut` / `apiDelete` |
| `api-types.ts` | the error shape both halves share (no dependencies) |

## db.ts

```ts
import { prisma } from '@/lib/db';
const bills = await prisma.bill.findMany({ where: { userId }, orderBy: { dueDate: 'asc' } });
```

Import this client; never construct your own. Two deliberate details — do not
"simplify" them away:

- **Cached on `globalThis`.** Next hot-reloads modules in dev, so a plain
  module-scope client opens a new connection pool on every file save until the
  database refuses more.
- **Created lazily on first property access** (via a `Proxy`). `next build`
  imports every route module while collecting page data, and a build machine has
  no `DATABASE_URL`; constructing eagerly crashes the build. It did, once.

Schema, migrations, partial-update semantics, and the `$queryRaw` escape hatch:
`docs/DATABASE.md`.

## api.ts — server

Handlers never write their own `try/catch` or `NextResponse.json`. See
`docs/API.md` for the full contract; the short version:

- `route(name, fn)` — wraps a handler. `ApiError` → its status; Prisma `P2025` →
  404; anything else → logged in full, generic 500 to the client.
- `ok(data, status?)` — success. Also converts Prisma `Decimal` to a JSON number.
- `requireParam` / `requireField` — 400 with a useful message instead of letting
  `undefined` reach the database.
- `badRequest` / `notFound` / `unauthorized` — the errors to throw.
- `optionalDate` — `undefined` stays undefined (leave column alone), `null`
  clears it, a string becomes a `Date`.

**Server-only.** It imports Prisma. That is why the shared error types live in
`api-types.ts` rather than here — so `api-client.ts` never pulls Prisma into the
browser bundle.

## api-client.ts — browser

Only `features/*/hooks.ts` should import this. It reads the
`{ error: { code, message } }` body on failure and throws an `ApiClientError`
carrying the server's message, so the UI can say what actually went wrong.

## What does NOT belong here

Row types, query hooks, anything domain-shaped. Those go in
`features/<domain>/`. `lib/` is for what every feature would use identically.
