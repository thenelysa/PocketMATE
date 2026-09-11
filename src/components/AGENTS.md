# components/

Deep detail: `docs/CONVENTIONS.md`.

## providers.tsx

The single `'use client'` provider boundary: `GoogleOAuthProvider` →
`QueryClientProvider` → `AuthProvider`.

**Add new providers here, not to `app/layout.tsx`.** A provider in the root layout
forces it to become a Client Component, which breaks `metadata` and `next/font`.

The `QueryClient` is created inside `useState(() => new QueryClient())` so it is
created once per client — not once per render, and not shared across requests on
the server.

## ui/

Small, unopinionated primitives — `Button`, `Card`, `Badge` — plus `cn()`
(`clsx` + `tailwind-merge`), which lets a caller's class override a default instead
of fighting it. Compose classes with `cn()`, never string concatenation.

Add to `ui/` only when something is used in two or more places **and** carries no
business logic; export it from `ui/index.ts`.

Anything that knows what a bill or a card *is* belongs in
`src/features/<domain>/components/`, not here. `BillForm` is a feature component;
`Button` is a `ui/` primitive. If it imports a row type, it is not a primitive.

## Styling

Tailwind v4 — tokens live in `@theme` in `app/globals.css`; there is no
`tailwind.config.ts`. Colours are currently literal hex (`bg-[#078D88]`) in most
components while the tokens sit mostly unused. Moving to tokens is a welcome
cleanup, but do not mix both inside one component.

Mobile-first. Verify at 390px, 834px and 1440px.
