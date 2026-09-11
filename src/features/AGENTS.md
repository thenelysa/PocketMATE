# features/ — one folder per business domain

This is where domain code lives. `app/` holds routes, `components/ui/` holds
generic primitives, `lib/` holds infrastructure — **everything that knows what a
"bill" or a "card" is belongs here.**

## Shape

```
features/<domain>/
  types.ts               row type, snake_case, mirroring the database table
  hooks.ts               TanStack Query hooks — the only place that fetch()es
  components/            domain UI used by that domain's routes
    <domain>-form.tsx
    <domain>-table.tsx
```

Current domains: `bills`, `cards`, `reminders`, `auth` (auth has only
`auth-context.tsx` — it has no table of its own).

## Adding a domain

1. `features/budgets/types.ts` — the row type, snake_case, matching the columns.
2. `features/budgets/hooks.ts` — `useBudgets`, `useCreateBudget`, … Copy
   `features/bills/hooks.ts`; it is the most complete example (all four verbs).
3. `features/budgets/components/budget-form.tsx` — the modal or inline form.
4. `app/api/budgets/route.ts` — see `app/api/AGENTS.md`.
5. `app/(dashboard)/budgets/page.tsx` — a *thin* page that composes the above.

## Rules

- **Pages compose, they do not implement.** A route file should fetch, hold
  "which modal is open" state, and render feature components. If a `page.tsx`
  passes ~120 lines, something in it belongs in `features/`. (The three pages
  here were 342 / 326 / 205 lines before extraction; they are now 81 / 63 / 61.)
- **Only `hooks.ts` calls `fetch()`.** Components never do.
- **Forms own their own mutations and state.** They take the entity to edit (or
  `null` to create) plus `onClose`, and are mounted only while open — they seed
  state from props once, in a `useState` initialiser.
- **Cross-feature imports go through the public files** (`../types`, `../hooks`),
  never into another feature's `components/`. `reminders` importing
  `@/features/bills/types` is fine and expected; the reminder form needs a bill
  list.
- Inside a feature use relative imports (`../hooks`, `./types`); across features
  use the alias (`@/features/bills/types`).

## Types come from Prisma

`types.ts` does not hand-write the row shape. It derives it from the Prisma model
so a schema change propagates automatically, overriding only the two things JSON
cannot carry:

```ts
import type { Bill as BillRow } from '@prisma/client';

export type Bill = Omit<BillRow, 'amount' | 'dueDate' | …> & {
  amount: number;    // Decimal -> number, converted by ok() in @/lib/api
  dueDate: string;   // DateTime -> ISO string
};

export type BillInput = Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
```

Add a column to `prisma/schema.prisma`, run `npm run db:migrate`, then check
whether the override list here needs it too.

## Case

**camelCase everywhere.** The database's snake_case column names live only in
`prisma/schema.prisma` behind `@map`. There is no conversion code in the app —
an earlier version hand-rolled snake↔camel helpers and silently wrote NULLs
whenever someone forgot one. Do not reintroduce any.

## Talking to the API

Hooks use `apiGet` / `apiPost` / `apiPut` / `apiDelete` from `@/lib/api-client`,
never bare `fetch`. They surface the server's error message, so a failed mutation
can show something useful. The contract is in `docs/API.md`.
