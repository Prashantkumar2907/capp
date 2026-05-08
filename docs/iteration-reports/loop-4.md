# Loop 4

## Inspected

Reviewed staff management, branch management, validation schemas, RLS policies, server auth helpers, API routes, tests, and dashboard role workflows.

## Missing Or Weak

Staff and branch pages performed browser-side Supabase writes. That meant org IDs, branch IDs, role changes, branch activation, and staff deletion depended too much on client behavior and RLS alone. Staff removal used hard delete instead of disabled access.

## Implemented

Added server-side management APIs for branch create/update and staff create/update/disable. Added active staff context resolution, owner/admin enforcement, tenant-scoped branch/staff checks, branch ownership checks, last-active-branch protection, owner/self access safeguards, and soft staff disable. Updated branch and staff pages to call API routes for mutations while keeping RLS-backed reads.

## File-Structure Or Architecture Changes

Added `src/lib/supabase/permissions.ts`, `src/lib/supabase/management.ts`, `src/lib/api/client.ts`, and API routes under `src/app/api/branches` and `src/app/api/staff`.

## Tests Run

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:api`, `npm run test:ui`, `npm audit --audit-level=moderate`, `npm run db:migrate`, and `npm run db:verify`.

## Demo Data Or Personas Used

Exercised owner/admin management assumptions, disabled staff readiness, branch activation safeguards, and the existing public customer UI test suite.

## Skeleton States Added Or Verified

Re-ran desktop, tablet, and mobile UI tests to verify existing skeleton and loading coverage still passes after management API changes.

## Readability And Code Quality Cleanup

Moved trusted staff/branch mutation rules out of page components into typed service functions. Added a small reusable client API response reader for dashboard mutations.

## UI/UX And Animation Checks

Verified public and auth flows remain responsive. Branch/staff pages now surface server validation and permission errors through existing toast error handling.

## API, Query, And Security Checks

Added API contract tests proving invalid owner-role creation and malformed branch IDs are rejected before auth/database work. Server now ignores client org IDs for branch/staff creation and uses the authenticated staff member's organization.

## Accessibility, Performance, Reliability, And Production Checks

Soft-disabling staff preserves auditability and avoids destructive account removal. Branch creation now creates starter tables server-side and rolls back the branch if table creation fails.

## Remaining Risks

List queries for staff and branches still happen client-side through Supabase; future loops should add paginated server-backed listing for larger tenants. Staff invitation emails, branch assignment UI, and explicit confirmation dialogs for destructive/disable actions still need product polish.
