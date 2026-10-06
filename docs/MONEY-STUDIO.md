# Money Studio

The `/studio` route contains five connected tools. The dashboard also includes
Pip's data-based suggestion, a Ctrl/Cmd+K command dialog, and payment receipts.
The existing #274B44 brand and pistachio mascot are preserved.

## Included workflows

- **Plan ahead:** editable cash balance, pay frequency, buffer, and living costs;
  60-day cash-flow chart with an accessible table; purchase simulation; bill-date
  and card repayment sliders; costs grouped by payday. Currency is a display
  preference, not conversion. Re-enter cash when the balance snapshot is stale.
- **Scan a bill:** browser OCR for PNG/JPEG/WebP and text/scanned PDFs. English
  recognition, 15 MB and five-page limits. Ambiguous dates remain blank. Provider,
  amount, and due date must be reviewed before creating a bill. No document is
  uploaded. Recognition models download from the Tesseract CDN on first use.
- **Subscriptions:** CSV import (`date,merchant,amount`, dates YYYY-MM-DD), review,
  repeat-import deduplication, estimates for weekly/monthly/yearly merchants,
  price-change flags, bill creation, and renewal reminders. A positive amount is
  spending; negative amounts are excluded from recurrence detection. Repeated
  merchants are suggestions, not confirmed subscriptions. No bank sync or cancel
  operation is implied.
- **Household:** authenticated membership through expiring invitation codes;
  equal splits preserving cents; assigned payer; payer-recorded payment and
  reimbursement confirmation. Personal accounts remain private. Entries are
  separate from personal bills and use the household's agreed display currency.
- **Monthly story:** four swipeable/keyboard-accessible pages based on recorded
  payments, imported spending, and outstanding bills; downloadable text recap.
- **Quick commands:** bill-name search, “unpaid”, route shortcuts, and reviewed
  natural-text bill creation, e.g. `Add Internet 120 due tomorrow`.
- **Payment receipt:** shown after a successful payment update. The server
  atomically records a BillPayment and deducts the remaining bill amount from an
  existing cash plan. Repeating the same paid update does not deduct twice.

Forecasts exclude bank activity, interest, late fees, unlisted costs, and shared
household expenses. Same-day expenses precede income conservatively. Future
recurring bills are projections; the app does not create those rows automatically.
Payments and reimbursements are bookkeeping only, not money transfers.

## Database activation - completed

The migration creates six tables only: `sessions`, `studio_plans`, `households`,
`household_members`, `household_expenses`, and `household_shares`, plus their keys
and indexes. Existing financial tables are retained unchanged.

Migration: `prisma/migrations/20261006_money_studio/migration.sql`.
Baseline: `prisma/migrations/0_init/migration.sql`.

Both were tested on the schema-only Neon branch `pocketmate-studio`
(`br-muddy-glitter-axzwbuju`, expires 2026-10-13). Schema comparison reported no
differences. Integration tests created and removed temporary accounts, verified
ownership, rejected forged profiles, exercised optimistic plan conflicts,
confirmed payment idempotence, and tested household invitation/settlement rules.

The user explicitly approved production activation. The connected application
endpoint was verified against the PocketMATE `production` branch in project
`super-hill-34991074`. The original schema matched the baseline; `0_init` was
marked applied without executing its CREATE statements, then
`20261006_money_studio` was successfully deployed to production.
Post-deployment migration status is up to date, and schema comparison against
`prisma/schema.prisma` reports no differences. Build, typecheck, and lint passed
(two existing image warnings, no lint errors).

Do not execute the baseline SQL against populated tables, and do not use `db push`
or destructive schema synchronization. Existing users must sign in again to
establish a verified session.

## Verification

`npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e`.
`npx tsx --test src/features/studio/calculations.test.ts` tests calculations and parsers.
`tests/studio-api.spec.ts` is intentionally skipped without an isolated database
connection and `STUDIO_TEST_URL`; it must never seed the production database.
OCR runtime assets are copied from installed packages by `predev`/`prebuild` into
ignored `public/ocr`. Do not commit generated runtime assets or database secrets.

Google sign-in needs the existing `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and allowed
origins. Its successful interactive consent flow must be checked by the account
owner; tests cover unauthorized and forged-profile requests, not Google consent.
