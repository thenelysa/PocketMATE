# Conventions

Follow these when adding code. They are descriptive of the existing codebase, not
aspirational — matching them keeps diffs small and reviews short.

## Server vs Client Components

Everything under `app/` is a **Server Component by default**. Add `'use client'`
only when the file needs state, effects, browser APIs, or event handlers.

- `app/layout.tsx` is a Server Component and must stay one. It is where `metadata`
  and `next/font` live, and both only work server-side.
- **All providers go in `components/providers.tsx`**, which is the single
  `'use client'` boundary near the root. Adding a provider directly to
  `app/layout.tsx` forces the whole root to become a Client Component and breaks
  `metadata`.
- Every screen under `(dashboard)` is a Client Component because it uses
  `useAuth()` and TanStack Query hooks.

## Data access — the hook layer

Components **never** call `fetch()` directly. Every read and write goes through
that domain's `src/features/<domain>/hooks.ts`, which uses the typed helpers in
`@/lib/api-client`. Copy `features/bills/` — it is the most complete example.

```ts
// features/budgets/types.ts — derived from the Prisma model
import type { Budget as BudgetRow } from '@prisma/client';
export type Budget = Omit<BudgetRow, 'limitAmount' | 'createdAt'> & {
  limitAmount: number;   // Decimal -> number (converted by ok() in @/lib/api)
  createdAt: string;     // DateTime -> ISO string
};
export type BudgetInput = Omit<Budget, 'id' | 'userId' | 'createdAt'>;

// features/budgets/hooks.ts
const budgetsKey = (userId?: string) => ['budgets', userId] as const;

export function useBudgets() {
  const { user } = useAuth();
  return useQuery<Budget[]>({
    queryKey: budgetsKey(user?.sub),
    queryFn: () => apiGet<Budget[]>(`/api/budgets?userId=${user!.sub}`),
    enabled: !!user?.sub,
  });
}

export function useCreateBudget() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budget: BudgetInput) =>
      apiPost<Budget>('/api/budgets', { ...budget, userId: user!.sub }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetsKey(user?.sub) }),
  });
}
```

Two invariants, and breaking either looks like a backend bug:

- **The query key is `[resource, user.sub]`**, and a mutation's
  `invalidateQueries` must use the *same* key. Get it wrong and the write
  succeeds while the list keeps showing stale data. Declaring the key once as a
  `…Key()` helper, as above, is what keeps them in step.
- **List hooks are `enabled: !!user?.sub`.** Without it the query fires before the
  session hydrates and requests `userId=undefined`.

### Case

**camelCase everywhere** — component state, request bodies, responses, and
Prisma. The database's snake_case column names appear only in
`prisma/schema.prisma`, behind `@map`:

```prisma
dueDate DateTime @map("due_date")
```

There is no case-conversion code in the application and none should be added. An
earlier version hand-rolled snake↔camel helpers; forgetting one wrote NULLs
silently across all three domains. See `docs/MIGRATION.md`.

### Where the code goes

| Kind of code | Home |
|---|---|
| Row type, query hooks, domain components | `src/features/<domain>/` |
| Generic primitive with no domain knowledge | `src/components/ui/` |
| Providers | `src/components/providers.tsx` |
| Infrastructure (db, case conversion) | `src/lib/` |
| Routes | `src/app/` |

A `page.tsx` over ~120 lines means something in it belongs in `src/features/`.

## API route handlers

The full contract is `docs/API.md`. The shape:

```ts
import { prisma } from '@/lib/db';
import { ok, route, requireParam, requireField } from '@/lib/api';

export const GET = route('budgets.GET', async (request: Request) => {
  const userId = requireParam(request, 'userId');
  const budgets = await prisma.budget.findMany({ where: { userId } });
  return ok(budgets);
});
```

- Wrap every handler in `route(name, fn)` — no handler writes its own
  `try/catch`. It logs real errors server-side and returns a generic 500, so
  stack traces and connection strings never reach the client.
- Return through `ok()`, never `NextResponse.json` directly; `ok()` converts
  Prisma `Decimal` to a JSON number.
- Validate with `requireParam` / `requireField` before touching the database.
- Use the shared `prisma` client from `@/lib/db`; never construct one.
- Prefer the Prisma query API. For genuine raw SQL use `prisma.$queryRaw` (the
  tagged template binds parameters) — never `$queryRawUnsafe` with user input.

## UI components

`src/components/ui/` holds small, unopinionated primitives (`Button`, `Card`,
`Badge`) plus `cn()` — the `clsx` + `tailwind-merge` helper that lets a caller's
class override a default instead of fighting it. Compose classes with `cn()`,
never with string concatenation.

Add a component to `src/components/ui/` when it is used in two or more places and
carries no business logic; export it from `src/components/ui/index.ts`. Anything
that knows what a bill or a card *is* goes in
`src/features/<domain>/components/`. If it imports a row type, it is not a
primitive.

Forms own their own mutations and state: they take the entity to edit (or `null`
to create) plus `onClose`, and are mounted only while open, seeding state from
props in a `useState` initialiser.

Layouts are mobile-first: the sidebar is `-translate-x-full` by default and
`lg:translate-x-0` on large screens, driven by a `sidebarOpen` state. Check a new
screen at 390px, 834px and 1440px before calling it done.

## Naming & files

| Thing | Convention | Example |
|---|---|---|
| Route directories | lowercase, matches the URL | `src/app/(dashboard)/bills/` |
| Feature directories | lowercase, plural noun | `src/features/bills/` |
| Component files | kebab-case | `src/features/bills/components/bill-form.tsx` |
| Components | PascalCase | `export function Providers()` |
| Hooks | `use` + PascalCase | `useCreateBill` |
| Database columns (schema.prisma only) | snake_case via `@map` | `@map("due_date")` |
| Everything in TypeScript and on the wire | camelCase | `dueDate`, `isBusiness` |
| Imports across directories | `@/` alias → `src/` | `@/features/bills/hooks` |
| Imports inside one feature | relative | `../hooks`, `./types` |

## Environment variables

- `NEXT_PUBLIC_*` is **inlined into the browser bundle**. Only public values.
  Currently: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Anything without the prefix is server-only and readable in route handlers.
  Currently: `DATABASE_URL`.
- Add new variables to `.env.example` with a comment saying where to get them, in
  the same commit that starts reading them. `.env.local` is gitignored and must
  never be committed.
- No `VITE_*` variables. They do nothing in Next.js. If you find one, it is a
  leftover — see `docs/MIGRATION.md`.

## Before you push

```bash
npm run typecheck             # tsc --noEmit — must be clean
npm run lint                  # eslint — must have 0 errors
npm run build                 # must succeed; also prints the real route table
npm run test:e2e              # Playwright, needs the app running or starts it
npm run db:migrate            # if you changed prisma/schema.prisma
```

`npm run build` is not optional. It is the only check that catches a Server/Client
Component boundary mistake, and its route table is how you confirm a new URL is
what you think it is.

Never commit: `.next/`, `node_modules/`, `.env.local`.
