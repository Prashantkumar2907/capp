# CAPP Product Understanding

## Core Value Proposition

CAPP is a multi-tenant restaurant operations SaaS for QR table ordering, waiter POS, kitchen order progression, cashier settlement, menu management, staff/branch administration, receipts, customer feedback, operational analytics, and platform-level customer/subscription administration.

The product value is speed and trust at service time: customers can order without waiting, staff can progress orders from a focused dashboard, owners can see branch performance, and the app creator can manage SaaS customers/subscriptions without letting client-side prices, roles, totals, payment state, or subscription status become trusted data.

## Target Architecture

### Frontend

- Next.js App Router with route groups: `src/app/(public)` for marketing/auth/customer QR flows and `src/app/(dashboard)` for authenticated staff workflows.
- Platform-owner workflows live outside tenant dashboards at `src/app/admin` so CAPP operators can see customers, pending logged-in users, subscription expiries, and client portfolio analytics without needing a tenant staff profile.
- Client UI uses shared primitives in `src/components/ui`, feature components in `src/components/features`, and layout components in `src/components/layouts`.
- TanStack Query is the client cache layer for Supabase reads and API-backed mutations.
- Loading, empty, error, and success states should be present on every operational route. Skeletons live in `src/components/ui/loading-patterns.tsx`; route error boundaries use `src/components/ui/route-error.tsx`.
- Motion is intentionally subtle: CSS keyframes in `src/app/globals.css`, component hover states, modal entry animation, and reduced-motion protections.

### Backend

- Next.js route handlers in `src/app/api` are the trusted mutation boundary.
- Supabase admin client usage is isolated to server-only service files under `src/lib/supabase`.
- Shared response helpers in `src/lib/api/responses.ts` produce `{ ok: true }` and `{ ok: false, code, error }` contracts.
- Zod schemas in `src/lib/validation/schemas.ts` are the first gate for route input validation.
- Payment webhooks validate Razorpay signatures and replay windows before writing.
- Platform admin APIs in `src/app/api/platform/*` must call a platform-specific authorization service before reading all-tenant data or changing subscriptions.

### Database

- Supabase Postgres schema is stored in ordered reset files under `supabase/`.
- RLS is enabled for every app table, with staff policies scoped by organization/branch helper functions.
- Platform admin state is intentionally separate from tenant staff roles. `platform_admins` bootstraps app-creator access by email/user id, and `subscription_grants` records manual subscription extensions.
- Hot paths are documented in `src/lib/performance/budgets.ts` and checked against `supabase/01_schema.sql`.
- Service-role server routes are used for public QR ordering, receipt lookup, and feedback so anonymous clients do not need direct table-write permissions.

## Critical File Path

- Entrypoints: `src/app/layout.tsx`, `src/proxy.ts`, `src/components/shared/providers.tsx`.
- Public routes: `src/app/(public)/page.tsx`, `src/app/(public)/(auth)/*`, `src/app/(public)/order/[branchId]/[tableNumber]/page.tsx`, `src/app/(public)/order/[branchId]/[tableNumber]/payment/page.tsx`, `src/app/(public)/receipt/[orderId]/page.tsx`.
- Dashboard routes: `src/app/(dashboard)/layout.tsx`, `src/components/layouts/dashboard-shell.tsx`, `src/app/(dashboard)/dashboard/**/page.tsx`.
- Platform routes: `src/app/admin/page.tsx`, `src/app/api/platform/overview/route.ts`, `src/app/api/platform/clients/route.ts`, `src/app/api/platform/subscriptions/grant/route.ts`.
- API routes: `src/app/api/orders/route.ts`, `src/app/api/orders/[orderId]/status/route.ts`, `src/app/api/public/*`, `src/app/api/menu/dishes/*`, `src/app/api/branches/*`, `src/app/api/staff/*`, `src/app/api/payments/[paymentId]/settle/route.ts`, `src/app/api/v1/webhooks/razorpay/route.ts`.
- API routes added in the hardening pass: `src/app/api/onboarding/route.ts`, `src/app/api/tables/route.ts`, `src/app/api/tables/[tableId]/route.ts`.
- Data access: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/queries.ts`, and trusted service modules in `src/lib/supabase/*.ts`.
- Auth and authorization: `src/features/auth/auth-provider.tsx`, `src/lib/supabase/permissions.ts`, `src/lib/constants.ts`, `src/proxy.ts`.
- Validation and API contract: `src/lib/validation/schemas.ts`, `src/lib/api/responses.ts`, `src/lib/api/client.ts`.
- DB schema/RLS/realtime/storage: `supabase/01_schema.sql`, `supabase/02_functions.sql`, `supabase/03_rls.sql`, `supabase/04_storage_realtime.sql`.
- Tests: `tests/unit`, `tests/api`, `tests/ui`, `playwright.config.ts`.

## Identified Gaps (The Audit)

### Security Risks

- Gap before this pass: tenant `owner/admin` roles could not safely represent the app creator. Platform administration needs a separate allowlist/table check before service-role access to all customers.
- Gap before this pass: manual subscription grants need an audit trail so offline payments do not become undocumented database edits.
- Open redirect risk is mitigated by `safeRedirectPath` in the OAuth callback and sign-in redirect flow.
- Onboarding now validates with `onboardingSchema`, returns the shared API error contract, and rolls back partial workspace creation.
- Table creation and table status changes now go through trusted API/service code with role and branch checks.
- Remaining risk: authenticated settings and category edits still use direct browser Supabase mutations. RLS scopes these, but future passes should move them behind service-backed APIs for consistent validation and audit logging.
- Remaining risk: public receipt URLs are bearer-style identifiers. They avoid direct anonymous table access, but a future pass should consider short-lived receipt tokens for stricter sharing control.

### Missing DB Indexes / Performance Bottlenecks

- Platform customer lists need indexes on platform admin email/user id, subscription expiry, organization plan/status, and subscription grant history.
- Table release checks filter active orders by `branch_id`, `table_number`, and operational status. A partial active-table index should support this path.
- Menu/category ordering reads can benefit from an organization/sort index as the menu grows.
- Dish management reads order by organization/name and should have an index that matches the query shape.
- Table status and waiter floor views now have `idx_tables_branch_status` for branch/status filtering.
- Remaining risk: payments, menu, and staff pages paginate client-side after fetching full branch/org result sets. This is acceptable for the demo scale but should become server pagination before high-volume production use.

### UI/UX Dead Ends

- Gap before this pass: the app creator had no first-party console for SaaS customers, pending logged-in users, expiring subscriptions, manual grants, or cross-customer analytics.
- Tables now show an explicit error empty state if branch table data cannot load.
- Route-level skeletons and error boundaries cover dashboard and public QR flows.
- Remaining risk: some form dialogs still rely on toast errors only. Future passes should add inline field validation feedback while preserving server validation as the source of truth.
- Remaining risk: the public marketing homepage is less operationally important than the app shell, but its hero is still more static than the dashboard surfaces.

### Code Smells

- Gap before this pass: subscription changes could only be made through lower-level database/API work, not a dedicated domain service with validation and audit logging.
- Onboarding business logic has been moved from the route handler into `src/lib/supabase/onboarding.ts`.
- Table mutation logic lives in `src/lib/supabase/table-management.ts` instead of inside `TablesPage`.
- Remaining smell: settings and category mutations still sit in page components; move them into `src/lib/supabase/settings-management.ts` and `src/lib/supabase/category-management.ts` in a future pass.
- Remaining smell: several dashboard pages still duplicate loading skeleton markup instead of consistently reusing `DashboardRouteSkeleton`.
