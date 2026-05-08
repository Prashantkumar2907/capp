# Loop 1

## Inspected

Reviewed the App Router structure, shared component folders, API route boundaries, Supabase SQL reset behavior, current tests, public QR ordering, receipts, dashboard loading behavior, and documentation coverage.

## Missing Or Weak

Public routes were not grouped under `src/app/(public)`, dashboard layout lived in `src/components/layout`, route-level loading files were missing, receipt and protected dashboard boot states used full-page spinners, and `npm run db:migrate` could reset a non-local database without an explicit safety flag.

## Implemented

Moved marketing, auth, OAuth callback, QR ordering, and receipt routes under `src/app/(public)`. Moved the dashboard shell to `src/components/layouts`. Added reusable skeleton loading patterns and route-level loading files for dashboard, QR ordering, payment review, and receipt pages. Replaced the dashboard boot spinner and receipt loading spinner with skeleton layouts. Added a safe default to `scripts/run-sql.mjs` so destructive SQL resets only run for local databases or when `ALLOW_DESTRUCTIVE_DB_RESET=1` is set.

## File-Structure Or Architecture Changes

Created `docs/architecture/file-structure.md` to document route groups, component ownership, data layers, SQL, scripts, tests, and placement examples.

## Tests Run

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:api`, `npm run test:ui`, `npm audit --audit-level=moderate`, `npm run db:migrate`, and `npm run db:verify`.

The first UI attempt exposed a port collision on `3000`; reran with `NEXT_PUBLIC_APP_URL=http://localhost:3100` and `PORT=3100`. The first new QR ordering test exposed a cart context render loop, which was fixed before the final passing run.

## Demo Data Or Personas Used

Inspected the existing demo restaurant seed and exercised the public customer QR ordering persona with mocked restaurant menu data in Playwright.

## Skeleton States Added Or Verified

Added dashboard, public menu, public payment, and receipt route skeletons. Verified shared skeleton patterns match final card, menu tile, stat, and receipt layouts. Added a delayed-response UI test that confirms public QR skeletons appear and are replaced by real menu content.

## Readability And Code Quality Cleanup

Moved layout code into the requested `components/layouts` layer and centralized reusable loading patterns.

## UI/UX And Animation Checks

Reduced reliance on full-page spinners for route-sized loading states. Existing subtle skeleton animation remains shared through the UI skeleton component. Checked public ordering at desktop, tablet, and mobile widths for visible primary actions and horizontal overflow.

## API, Query, And Security Checks

Identified destructive DB reset risk and made migration automation safe by default for non-local database URLs without printing connection details. Confirmed the QR loading test does not require real customer data or live provider credentials.

## Accessibility, Performance, Reliability, And Production Checks

Skeletons avoid layout collapse during slow data loading. The DB reset guard reduces operational risk for production-like Supabase projects. Fixed public cart context writes so unchanged branch/table context does not trigger repeat renders.

## Remaining Risks

API routes still need stronger validation, consistent response envelopes, rate-limit readiness, idempotency, and server-side permission checks. Demo seed data is still too small for sales and QA coverage.
