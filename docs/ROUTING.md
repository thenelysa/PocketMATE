# Routing — App Router rules (read this before touching `app/`)

This is the file that explains the `(dashboard)` 404 the project hit after the
Vite → Next.js migration. Read it end to end before adding a route.

## 1. The one rule that causes 404s

A directory wrapped in parentheses is a **route group**. It organises files and
lets a subtree share a layout. **It is not part of the URL.**

```
src/app/(dashboard)/bills/page.tsx     →  /bills          ✅
src/app/(dashboard)/bills/page.tsx     →  /(dashboard)/bills   ❌ 404, always
```

So:

| You want to go to | Write | Never write |
|---|---|---|
| Dashboard | `/dashboard` | `/(dashboard)/dashboard` |
| Bills | `/bills` | `/(dashboard)/bills` |
| Login | `/login` | `/(auth)/login` |

This applies everywhere a URL is written: `<Link href>`, `router.push()`,
`redirect()`, `fetch()`, Playwright `page.goto()`, and anything you paste into
the browser bar.

**How to check what a URL actually is:** run `npm run build`. The route table it
prints is the source of truth:

```
├ ○ /bills        ← this is the real URL
├ ○ /dashboard
├ ○ /login
```

If a path is not in that list, it 404s. No exceptions.

## 2. Why this project 404'd

Two separate causes, both now fixed:

1. **A stale `.next/` build was committed to git.** The committed build predated
   the dashboard and login routes, so a production server (`npm start`) served a
   build in which `/dashboard` genuinely did not exist → 404. `.next/` is now in
   `.gitignore` and untracked. **Never commit `.next/`.** It is a build artifact;
   it goes stale the moment anyone edits a page.
2. **`tests/e2e.spec.ts` navigated to `/(dashboard)/dashboard`** — the literal
   route-group path. Playwright dutifully loaded a URL that cannot exist, and
   the 404 screenshot showed `(dashboard)` in the address bar. The tests now use
   real URLs.

If you ever see a 404 again, in this order:

```bash
rm -rf .next && npm run build   # 1. is the route in the printed table?
grep -rn "(dashboard)\|(auth)" src tests   # 2. literal group paths?
git ls-files .next               # 3. must print nothing
```

## 3. Current route map

| URL | File | Rendering |
|---|---|---|
| `/` | `src/app/page.tsx` | static, public landing page |
| `/login` | `src/app/(auth)/login/page.tsx` | static, public |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | static shell, auth-gated client-side |
| `/bills` | `src/app/(dashboard)/bills/page.tsx` | ″ |
| `/cards` | `src/app/(dashboard)/cards/page.tsx` | ″ |
| `/reminders` | `src/app/(dashboard)/reminders/page.tsx` | ″ |
| `/reports` | `src/app/(dashboard)/reports/page.tsx` | ″ (stub) |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | ″ (stub) |
| `/api/auth` | `src/app/api/auth/route.ts` | dynamic |
| `/api/bills` | `src/app/api/bills/route.ts` | dynamic |
| `/api/cards` | `src/app/api/cards/route.ts` | dynamic |
| `/api/reminders` | `src/app/api/reminders/route.ts` | dynamic |
| anything else | `src/app/not-found.tsx` | 404 page |

`(dashboard)` exists so that all six app screens share `src/app/(dashboard)/layout.tsx`
(sidebar, top bar, auth guard) without `/dashboard` becoming a URL prefix.
`(auth)` exists so a future `/register` or `/forgot-password` can share an auth
layout. Neither name appears in a URL.

## 4. Adding a route

**A new signed-in screen** (gets the sidebar + auth guard automatically):

```
src/app/(dashboard)/budgets/page.tsx     →  /budgets
```

Then add it to `navItems` in `src/app/(dashboard)/layout.tsx`:

```tsx
{ href: '/budgets', label: 'Budgets', icon: Wallet },   // no (dashboard) prefix
```

**A new public page:** put it at `app/about/page.tsx` → `/about`. Do not put it
inside `(dashboard)` — it would inherit the auth guard and bounce visitors to
`/login`.

**A new API endpoint:** `src/app/api/budgets/route.ts` → `/api/budgets`, exporting
named `GET` / `POST` / `PUT` / `DELETE` functions. See `docs/CONVENTIONS.md`.

**File names are fixed by Next.js.** `page.tsx` makes a URL. `layout.tsx` wraps
everything below it. `route.ts` makes an API endpoint. `not-found.tsx`,
`loading.tsx`, `error.tsx` are framework hooks. A file named anything else in
`app/` is just a module and creates no route — but prefer putting shared code in
`lib/` or `components/`.

`page.tsx` and `route.ts` cannot coexist in the same directory.

## 5. Auth redirect flow

```
/login  ──[Google credential OK]──▶  POST /api/auth        (upsert user row)
                                          │
                                          ▼
                                  login(userData)          (AuthContext + localStorage)
                                          │
                                          ▼
                                  router.push('/dashboard')
                                          │
                                          ▼
                    src/app/(dashboard)/layout.tsx mounts, sees a user, renders
```

The guard in `src/app/(dashboard)/layout.tsx` is:

```tsx
useEffect(() => {
  if (!isLoading && !user) router.push('/login');
}, [user, isLoading, router]);
```

`isLoading` matters. The session lives in `localStorage`, which is only readable
after mount, so there is one render where `user` is `null` but we do not yet know
whether the visitor is signed out. Redirecting during that window would bounce
signed-in users straight back to `/login`. The layout shows a spinner while
`isLoading` is true.

**This guard is client-side only.** It hides UI; it does not protect data. The
`/api/*` routes trust the `userId` query parameter and will return another user's
rows if asked. See the security note in `docs/ARCHITECTURE.md`.
