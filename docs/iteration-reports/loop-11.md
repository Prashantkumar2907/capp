# Loop 11 Report

## What was inspected
- Re-read the App Router entrypoints, dashboard shell, auth provider, Supabase clients, API helpers, validation schemas, RLS/index SQL, existing `.llm-skills`, and prior loop reports.
- Focused this pass on remaining direct or inconsistent mutation boundaries after the first ten hardening loops.

## What was missing or weak
- OAuth callback and sign-in redirects accepted raw `redirect` query values.
- Onboarding used inline route-handler database work, untyped request bodies, raw `NextResponse.json` errors, and no shared validation contract.
- Table creation and status changes were performed directly from the browser via Supabase.
- Setting a table status to `inactive` did not also set `is_active=false`, so public QR menu lookups could still find that table.
- Table status views did not have a branch/status index.

## What was implemented
- Added `safeRedirectPath` and applied it to sign-in and OAuth callback redirects.
- Added `onboardingSchema`, moved onboarding business logic into `src/lib/supabase/onboarding.ts`, standardized API responses, and added rollback for partial workspace setup.
- Added `tableCreateSchema`, `tableStatusUpdateSchema`, `src/lib/supabase/table-management.ts`, `src/app/api/tables/route.ts`, and `src/app/api/tables/[tableId]/route.ts`.
- Updated the Tables page to use trusted table API mutations and to show a clear load failure state.
- Added `idx_tables_branch_status` for table status/floor views.

## Tests added
- `tests/api/auth-contract.test.ts`
- `tests/api/onboarding-contract.test.ts`
- `tests/api/tables-contract.test.ts`
- Extended `tests/unit/utils.test.ts` for redirect sanitization.
- Extended `tests/unit/db-indexes.test.ts` for the new table status index.

## Tests run
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:api`

## Remaining risks
- Settings and category mutations still use direct browser Supabase writes. RLS scopes them, but service-backed APIs would make validation, errors, and audit logging more consistent.
- Client-side pagination remains on several dashboard pages and should become server pagination for high-volume restaurants.
- Full authenticated visual QA still depends on disposable Supabase demo accounts in a safe environment.
