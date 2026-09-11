# app/api/ — route handlers

One `route.ts` per resource, exporting named HTTP methods. Full contract:
`docs/API.md`. `bills/route.ts` is the reference — it is the only one with all
four verbs.

## The shape every handler follows

```ts
import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField } from '@/lib/api';

export const GET = route('budgets.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const budgets = await prisma.budget.findMany({ where: { userId } });
  return ok(budgets);
});
```

## Rules

- **Wrap every handler in `route(name, fn)`.** No handler writes its own
  `try/catch`. It maps `ApiError` to its status, Prisma `P2025` to 404, and
  everything else to a logged, generic 500 — so stack traces, SQL, and
  connection strings never reach the client.
- **Return through `ok()`**, never `NextResponse.json` directly. `ok()` also
  converts Prisma `Decimal` to a JSON number; without it `84.20` ships as the
  string `"84.2"`.
- **Validate with `requireParam` / `requireField`** before touching the database,
  so a missing field is a 400 with a message rather than a 500 or a NULL.
- **Use the shared `prisma` client** from `@/lib/db`. Never construct one here.
- **Use Prisma's query API.** If you genuinely need raw SQL, use
  `prisma.$queryRaw` (the tagged template, which binds parameters) — never
  `$queryRawUnsafe` with user input, and never a second database client. See
  `docs/DATABASE.md`.

## Status codes

`200` read/update/delete · `201` created · `400` `VALIDATION_ERROR` ·
`401` `UNAUTHORIZED` · `404` `NOT_FOUND` · `500` `INTERNAL_ERROR`.

`DELETE` returns `{ id }` for the row it removed.

## Case

camelCase everywhere — in the request body, in the response, and in Prisma. The
snake_case column names live only in `prisma/schema.prisma` behind `@map`. There
is no conversion code in the app and none should be added.

## Partial updates

Prisma leaves a column untouched when its value is `undefined`, so omitting a
field from the body is a real partial update — no `COALESCE`. A field sent as
`null` still clears the column; keep that distinction intact.

## ⚠️ Current security hole

These handlers trust the `userId` they are given. `GET /api/bills?userId=<any
sub>` returns that person's bills, and the Google token is decoded client-side
without verification.

The fix: verify the credential in `POST /api/auth` (`google-auth-library`'s
`verifyIdToken`), set an httpOnly cookie, derive `userId` from that cookie in
every handler, and delete the `userId` parameter. See `docs/ARCHITECTURE.md`.

Until then, do not add endpoints exposing anything more sensitive than what is
already here.
