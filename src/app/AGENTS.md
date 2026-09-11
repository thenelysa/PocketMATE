# app/ — routes only

Deep detail: `docs/ROUTING.md`. API handlers have their own file: `app/api/AGENTS.md`.

## Route groups are not URLs

```
app/(dashboard)/bills/page.tsx   →  /bills
app/(auth)/login/page.tsx        →  /login
```

Never write `/(dashboard)/...` or `/(auth)/...` in a `<Link href>`,
`router.push()`, `fetch()`, or a Playwright `goto()`. It 404s every time. This
project shipped that bug twice — once from a committed stale `.next/` build, once
from the e2e tests.

Verify with `npm run build`; its route table is the truth.

## What each filename does

| File | Effect |
|---|---|
| `page.tsx` | creates a URL |
| `layout.tsx` | wraps everything below it |
| `route.ts` | creates an API endpoint (cannot coexist with `page.tsx`) |
| `not-found.tsx`, `error.tsx`, `loading.tsx` | framework hooks |

Shared non-route code never belongs here:

- domain code (anything that knows what a bill is) → `src/features/<domain>/`
- generic primitives and providers → `src/components/`
- infrastructure (db, case conversion) → `src/lib/`

- **New signed-in screen** → `app/(dashboard)/<name>/page.tsx`, then add it to
  `navItems` in `app/(dashboard)/layout.tsx` with `href: '/<name>'`. Keep the page
  thin: fetch, hold open/closed state, render feature components. See
  `src/features/AGENTS.md`.
- **New public page** → `app/<name>/page.tsx`. Do not put it in `(dashboard)` —
  it would inherit the auth guard and bounce visitors to `/login`.
- **New endpoint** → see `app/api/AGENTS.md`.

## Server vs Client

`app/layout.tsx` is a Server Component and must stay one — `metadata` and
`next/font` only work server-side. Providers belong in `components/providers.tsx`,
never in the root layout.

Every screen under `(dashboard)` is `'use client'` because it uses `useAuth()` and
query hooks.

Pages compose, they do not implement. `bills/page.tsx` is 81 lines because the
modal and table live in `src/features/bills/components/`; it was 342 before.

## The auth guard

`app/(dashboard)/layout.tsx` redirects to `/login` only when `!isLoading && !user`.

The `isLoading` check is load-bearing: the session lives in `localStorage`,
readable only after mount, so there is one render where `user` is `null` but we do
not yet know the visitor is signed out. Dropping that check bounces signed-in
users straight back to `/login`.

The guard hides UI; it does not protect data.

## Styling

Tailwind v4, configured in `app/globals.css` via `@theme`. There is no
`tailwind.config.ts` and adding one does nothing. Nunito comes from
`next/font/google` in `layout.tsx`, exposed as `--font-nunito`.

Check new screens at 390px, 834px and 1440px.
