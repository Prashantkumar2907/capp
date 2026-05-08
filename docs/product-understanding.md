# CAPP Product Understanding

## Core Value Proposition

CAPP is a multi-tenant restaurant operations SaaS for QR table ordering, waiter POS, kitchen order progression, cashier settlement, menu management, staff/branch administration, receipts, customer feedback, and operational analytics.

The product value is speed and trust at service time: customers can order without waiting, staff can progress orders from a focused dashboard, and owners can see branch performance without letting client-side prices, roles, totals, or payment state become trusted data.

## Target Architecture

### Frontend

- Next.js App Router with route groups: `src/app/(public)` for marketing/auth/customer QR flows and `src/app/(dashboard)` for authenticated staff workflows.
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

### Database

- Supabase Postgres schema is stored in ordered reset files under `supabase/`.
- RLS is enabled for every app table, with staff policies scoped by organization/branch helper functions.
- Hot paths are documented in `src/lib/performance/budgets.ts` and checked against `supabase/01_schema.sql`.
- Service-role server routes are used for public QR ordering, receipt lookup, and feedback so anonymous clients do not need direct table-write permissions.

## Critical File Path

- Entrypoints: `src/app/layout.tsx`, `src/proxy.ts`, `src/components/shared/providers.tsx`.
- Public routes: `src/app/(public)/page.tsx`, `src/app/(public)/(auth)/*`, `src/app/(public)/order/[branchId]/[tableNumber]/page.tsx`, `src/app/(public)/order/[branchId]/[tableNumber]/payment/page.tsx`, `src/app/(public)/receipt/[orderId]/page.tsx`.
- Dashboard routes: `src/app/(dashboard)/layout.tsx`, `src/components/layouts/dashboard-shell.tsx`, `src/app/(dashboard)/dashboard/**/page.tsx`.
- API routes: `src/app/api/orders/route.ts`, `src/app/api/orders/[orderId]/status/route.ts`, `src/app/api/public/*`, `src/app/api/menu/dishes/*`, `src/app/api/branches/*`, `src/app/api/staff/*`, `src/app/api/payments/[paymentId]/settle/route.ts`, `src/app/api/v1/webhooks/razorpay/route.ts`.
- Data access: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/queries.ts`, and trusted service modules in `src/lib/supabase/*.ts`.
- Auth and authorization: `src/features/auth/auth-provider.tsx`, `src/lib/supabase/permissions.ts`, `src/lib/constants.ts`, `src/proxy.ts`.
- Validation and API contract: `src/lib/validation/schemas.ts`, `src/lib/api/responses.ts`, `src/lib/api/client.ts`.
- DB schema/RLS/realtime/storage: `supabase/01_schema.sql`, `supabase/02_functions.sql`, `supabase/03_rls.sql`, `supabase/04_storage_realtime.sql`.
- Tests: `tests/unit`, `tests/api`, `tests/ui`, `playwright.config.ts`.

## Identified Gaps (The Audit)

### Security Risks

- Public receipt and menu endpoints were not fully aligned with the shared API response and validation pattern.
- Customer feedback was written directly from the browser through Supabase instead of passing through a server-side validation and order-ownership check.
- RLS still allowed anonymous direct select/insert access to orders, order items, payments, and feedback even though the app now has server API routes for those public workflows.
- Storage policies allowed any signed-in user to write dish images, instead of limiting writes to menu-capable staff roles.
- Security-definer RLS helper functions should pin `search_path` to reduce SQL search-path risk.

### Missing DB Indexes / Performance Bottlenecks

- Table release checks filter active orders by `branch_id`, `table_number`, and operational status. A partial active-table index should support this path.
- Menu/category ordering reads can benefit from an organization/sort index as the menu grows.
- Dish management reads order by organization/name and should have an index that matches the query shape.

### UI/UX Dead Ends

- Public menu search/category filters could render an empty grid without an explicit empty state.
- Waiter POS could render an empty dish grid or hide menu query failures instead of presenting an actionable state.
- Dashboard route changes had no shell-level transition, so navigation felt abrupt despite existing component-level motion.
- Analytics should surface query errors explicitly instead of silently rendering zeroed charts.

### Code Smells

- Public route handlers contained inline Supabase query composition, making response contracts and validation less consistent than staff mutation routes.
- Direct Supabase mutations still exist in lower-risk authenticated settings/tables/category flows; the highest-risk public feedback path should move first, and future passes can continue migrating admin mutations into service-backed APIs.
- Several dashboard pages still duplicate loading skeleton markup instead of consistently reusing `DashboardRouteSkeleton`.
