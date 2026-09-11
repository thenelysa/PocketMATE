# prisma/ — the schema is the source of truth

Full detail: `docs/DATABASE.md`.

`schema.prisma` defines the tables, generates the TypeScript types that
`src/features/*/types.ts` build on, and drives `migrations/`.

## Two rules

1. **Every snake_case column needs `@map`** (and every table `@@map`). Fields are
   camelCase in TypeScript; the database keeps its own spelling. This is why no
   case-conversion code exists in the app — do not reintroduce any.

   ```prisma
   dueDate DateTime @map("due_date")
   ```

2. **⚠️ There is no migration history yet.** This schema was introspected from
   the live database with `prisma db pull`. `migrations/` is empty.

   **Do not run `prisma migrate dev` or `prisma db push` against the real
   database** — Prisma would rewrite it to match the schema, dropping anything
   the schema does not describe. Baseline it first; the exact commands are in
   `docs/DATABASE.md`.

   Four tables (`bill_payments`, `card_payments`, `card_transactions`,
   `user_profiles`) exist in the database and are modelled here **only** so a
   future migration does not drop them. No feature uses them yet — do not delete
   them from the schema.

## After changing the schema

Run `npm run db:generate` so new fields appear in `@prisma/client`.

Then check whether the wire types in `src/features/<domain>/types.ts` need the
same change — they derive from the Prisma model but override `Decimal` and
`DateTime`, which JSON cannot carry.

## Money

Use `Decimal @db.Decimal(12, 2)`, never `Float`. `ok()` in `src/lib/api.ts`
converts `Decimal` to a JSON number at the API boundary, and the feature's wire
type declares `number`. Add a money column → update both.
