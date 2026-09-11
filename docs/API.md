# API standard

Every route handler under `src/app/api` follows this. The server half lives in
`src/lib/api.ts`, the browser half in `src/lib/api-client.ts`, and the shared
error types in `src/lib/api-types.ts`.

## Response contract

**Success — the resource itself, no envelope.**

```jsonc
// 200 GET /api/bills
[{ "id": "9a2e…", "userId": "demo-1", "name": "Electric Bill", "amount": 84.2, … }]

// 201 POST /api/bills
{ "id": "9a2e…", "userId": "demo-1", "name": "Electric Bill", … }
```

**Failure — always this shape.**

```jsonc
// 400
{ "error": { "code": "VALIDATION_ERROR", "message": "userId is required" } }
```

The status code already tells the caller which shape arrived, so success is not
wrapped in `{ data }` — clients read the resource directly instead of unwrapping.

| Status | `code` | When |
|---|---|---|
| 200 | — | read, update, delete succeeded |
| 201 | — | a resource was created |
| 400 | `VALIDATION_ERROR` | missing or malformed input; `message` is safe to show the user |
| 401 | `UNAUTHORIZED` | not signed in, or not allowed to touch this row |
| 404 | `NOT_FOUND` | the row does not exist |
| 500 | `INTERNAL_ERROR` | a bug — logged server-side, generic message to the client |

`DELETE` returns `{ "id": "…" }` for the row it removed, so the client can
confirm which one went.

## Writing a handler

```ts
import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField } from '@/lib/api';

export const GET = route('budgets.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const budgets = await prisma.budget.findMany({ where: { userId } });
  return ok(budgets);
});

export const POST = route('budgets.POST', async (request: Request) => {
  const body = await request.json();
  const budget = await prisma.budget.create({
    data: {
      userId: requireField<string>(body, 'userId'),
      name: requireField<string>(body, 'name'),
      limitAmount: body.limitAmount ?? 0,
    },
  });
  return ok(budget, 201);
});
```

What each piece does:

- **`route(name, handler)`** wraps the handler so none of them needs its own
  `try/catch`. An `ApiError` becomes its declared status; a Prisma `P2025`
  ("record not found") becomes a 404; anything else is logged in full under
  `[api:<name>]` and returns a generic 500. **Stack traces, SQL, and connection
  strings never reach the client.**
- **`requireParam` / `requireField`** throw a 400 with a useful message instead
  of letting `undefined` reach the database.
- **`ok(data, status?)`** serialises the response. It converts Prisma `Decimal`
  to a JSON number — without it, `84.20` would go out as the string `"84.2"`.
- **`badRequest` / `notFound` / `unauthorized`** build the `ApiError` to throw.

Do not `return NextResponse.json(...)` directly and do not write your own
`try/catch`. If you need a status the helpers do not cover, add it to
`src/lib/api.ts` rather than one-offing it in a handler.

## Calling it from the client

Only `src/features/*/hooks.ts` talks to the API, and only through
`src/lib/api-client.ts`:

```ts
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';

const bills = await apiGet<Bill[]>(`/api/bills?userId=${userId}`);
const created = await apiPost<Bill>('/api/bills', { ...bill, userId });
```

These read the `{ error: { code, message } }` body on a failure and throw an
`ApiClientError` carrying the server's message, so the UI can show what actually
went wrong instead of a generic "Failed to fetch". Components never call `fetch`.

## Case

**camelCase everywhere in TypeScript and on the wire.** The database's
snake_case columns are mapped in `prisma/schema.prisma` with `@map`, so
snake_case never appears in application code. See `docs/DATABASE.md`.

## ⚠️ Not yet enforced: ownership

Handlers trust the `userId` they are given. `GET /api/bills?userId=<any sub>`
returns that person's rows. Fixing it means verifying the Google token in
`POST /api/auth`, setting an httpOnly cookie, deriving `userId` from that cookie
in every handler, and deleting the `userId` parameter. See
`docs/ARCHITECTURE.md` § Auth. Do not add endpoints that expose more than what is
already here until that is done.
