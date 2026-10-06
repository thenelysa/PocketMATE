# tests/ — Playwright end-to-end

```bash
npm run test:e2e      # starts the dev server if one is not already running
```

`playwright.config.ts` uses `reuseExistingServer: true`, so it attaches to a dev
server on :3000 if you already have one.

## The rule these tests already broke once

**Navigate to real URLs, never route-group paths.**

```ts
await page.goto(`${BASE_URL}/dashboard`);            // ✅
await page.goto(`${BASE_URL}/(dashboard)/dashboard`); // ❌ 404 by construction
```

The original suite used the second form throughout. Playwright loaded URLs that
cannot exist, every assertion was written loosely enough to pass anyway, and the
resulting 404 screenshots were mistaken for an app bug. See `docs/ROUTING.md`.

## Writing a test

- Get the real URL from the `npm run build` route table, not from the file path.
- Mock `GET /api/auth` with `{ sub, email, name, picture }` to test signed-in UI,
  then mock the domain APIs. A localStorage profile alone must not authenticate.
  See `studio.spec.ts`. Real API integration uses temporary users and hashed
  session tokens on an explicitly guarded isolated database branch; see
  `studio-api.spec.ts`. Never seed production for tests.
- Assert something that fails when the app breaks. `expect(url.includes('/bills')
  || url.includes('/login'))` passes in both directions and catches nothing —
  several existing tests are that weak and are worth tightening.

## Known environment-dependent failures

With placeholder values in `.env.local`, pages render but:

- `/api/*` returns 500 (`DATABASE_URL` does not resolve)
- Google sign-in logs a 403 and `[GSI_LOGGER]: The given client ID is not found`

Both are configuration, not code. Real credentials clear them.

If every route suddenly 500s with `__webpack_modules__[moduleId] is not a
function`, something deleted `.next/` underneath a running dev server. Restart it.
