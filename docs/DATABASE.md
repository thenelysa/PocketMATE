# Database — Prisma

Postgres (Neon in production), accessed through Prisma. `prisma/schema.prisma`
is the **single source of truth**: it defines the tables, generates the
TypeScript types, and drives migrations.

## Case mapping — why no conversion code exists

Fields are camelCase in TypeScript; columns and tables keep their snake_case
names via `@map` / `@@map`:

```prisma
model Bill {
  dueDate    DateTime @map("due_date")
  isBusiness Boolean  @default(false) @map("is_business")
  @@map("bills")
}
```

So `bill.dueDate` in code, `due_date` in the database, and **no runtime
conversion anywhere**. An earlier version hand-rolled snake↔camel helpers; every
new column was a chance to forget one, and forgetting one wrote NULLs silently.
Prisma removes the whole class of bug.

When you add a column, add the `@map`. That is the one rule.

## ⚠️ There is no migration history yet

`prisma/schema.prisma` was produced by `prisma db pull` **from the live Neon
database**, not the other way round. `prisma/migrations/` is empty.

**Do not run `prisma migrate dev` or `prisma db push` against Neon.** Prisma
would treat the schema as the desired state and rewrite the database to match —
including dropping anything the schema does not describe.

Before anyone can migrate safely, the database has to be baselined once:

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init      # marks it as already applied
```

After that, `npm run db:migrate` creates new migrations normally and
`npm run db:deploy` applies them in CI.

Until then, work against a local copy:

```bash
docker run -d --name pocketmate-pg -e POSTGRES_PASSWORD=devpw \
  -e POSTGRES_DB=pocketmate -p 55432:5432 postgres:16
DATABASE_URL=postgresql://postgres:devpw@localhost:55432/pocketmate npx prisma db push
```

A real `DATABASE_URL` in the environment always beats the `.env` files — that is
what `prisma.config.ts` guarantees, so the command above is safe.

## Everyday workflow

```bash
npm run db:generate   # regenerate the client (also runs on npm install and npm run build)
npm run db:studio     # browse the data in a GUI
npm run db:migrate    # ONLY once the database is baselined — see the warning above
npm run db:deploy     # apply pending migrations — CI / production, never local
```

The Prisma CLI reads `DATABASE_URL` from the environment first, then `.env`, then
`.env.local` (via `prisma.config.ts`, which uses Node's own `process.loadEnvFile`
— no dotenv dependency).

## Querying

Import the shared client; never construct your own:

```ts
import { prisma } from '@/lib/db';

const bills = await prisma.bill.findMany({
  where: { userId },
  orderBy: { dueDate: 'asc' },
});
```

`src/lib/db.ts` does two things worth knowing about:

- **The client is cached on `globalThis`.** Next hot-reloads modules in dev, so a
  plain module-scope client would open a new connection pool on every file save
  until the database refuses more.
- **It is created lazily, on first property access** (via a `Proxy`). `next build`
  imports every route module while collecting page data, and a build machine has
  no `DATABASE_URL`; constructing eagerly crashes the build. It did, once.

### Partial updates

Prisma leaves a column alone when its value is `undefined`, so a partial update
needs no `COALESCE`:

```ts
await prisma.bill.update({
  where: { id },
  data: { status: body.status, paidAmount: body.paidAmount },  // omitted fields unchanged
});
```

A field sent as `null` still clears the column. That distinction is the whole
mechanism — don't collapse `undefined` to `null` on the way in.

### Raw SQL

Prisma's query API covers everything here today. When it genuinely doesn't —
window functions, recursive CTEs, bulk upserts — use Prisma's own escape hatch
rather than a second database client:

```ts
import { Prisma } from '@prisma/client';

const rows = await prisma.$queryRaw<{ month: string; total: number }[]>`
  SELECT to_char(due_date, 'YYYY-MM') AS month, SUM(amount) AS total
  FROM bills
  WHERE user_id = ${userId}
  GROUP BY 1 ORDER BY 1
`;
```

Rules for raw SQL:

- **Use the tagged template** (`` $queryRaw`…` ``). Interpolated values become
  bound parameters. `$queryRawUnsafe` takes a plain string and does not — do not
  use it with anything a user supplied.
- Raw results are **not** mapped: you get the database's snake_case column names
  and no generated types. Alias them (`AS "dueDate"`) or map them yourself, and
  declare the row type explicitly as above.
- Raw queries bypass the schema, so `prisma migrate` knows nothing about what
  they assume. Keep them close to the handler that needs them and comment why the
  query API wasn't enough.

## Schema notes

Eight tables, four of which the app does not use yet.

| Table | Used by | Notes |
|---|---|---|
| `users` | auth | `id` is the Google `sub`; `email` is unique and the upsert key |
| `bills` | bills | `status` is `'PAID'` or `'UNPAID'`. Money is `Decimal(10,2)` |
| `credit_cards` | cards | `statementDate` / `paymentDueDate` are days of the month, and **nullable** |
| `reminders` | reminders | **polymorphic** — see below |
| `bill_payments` | — | payment history against a bill |
| `card_payments` | — | payment history against a card |
| `card_transactions` | — | individual card charges |
| `user_profiles` | — | currency, monthly budget, reminder lead time |

The last four are modelled in `schema.prisma` so migrations do not drop them, but
no feature reads them yet. `user_profiles.preferred_currency` defaults to `NPR`,
which the UI ignores — it hardcodes `$`.

### reminders is polymorphic

It does **not** have `bill_id`. A reminder points at any record:

| Column | Meaning |
|---|---|
| `type` | NOT NULL — the app writes `'BILL'` |
| `referenceType` / `referenceId` | what it points at — the app writes `'bill'` + the bill id |
| `title` | NOT NULL |
| `remindAt` | one timestamp, not a separate date and time |

`src/features/reminders/types.ts` exports `BILL_REMINDER` and `BILL_REFERENCE`
for those two constants — use them rather than string literals.

Note `remind_at` is `timestamp without time zone`, so it stores a wall-clock
value with no offset. The UI renders it in the viewer's local zone, which will
drift for users in another timezone. Worth fixing when reminders actually send.

Money columns are `Decimal`, which is correct for storage but is not a JSON type:
`ok()` in `src/lib/api.ts` converts `Decimal` to a number on the way out, and the
wire types in `src/features/*/types.ts` declare `number` to match. Keep those two
in step if you add a money column.
