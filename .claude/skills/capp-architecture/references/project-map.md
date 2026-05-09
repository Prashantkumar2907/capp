# CAPP Project Map

## Route Groups

`src/app/(public)` owns:
- Marketing homepage.
- Auth entry pages and OAuth callback.
- QR ordering: `/order/[branchId]/[tableNumber]`.
- Payment review: `/order/[branchId]/[tableNumber]/payment`.
- Public receipt: `/receipt/[orderId]`.

Public routes must work without an authenticated staff profile.

`src/app/(dashboard)` owns authenticated restaurant workspace routes:
- Overview, analytics, branches, kitchen, menu, orders, payments, settings, staff, tables, waiter.
- Pages render through `DashboardShell` and `AuthProvider`.
- Navigation and data visibility must remain role-aware.

`src/app/admin` owns platform-owner workflows:
- Customer portfolio.
- Pending users.
- Subscription grants and audit-backed manual extensions.
- Authorization is platform-admin scoped, not tenant staff scoped.

`src/app/api` owns API routes:
- Validate request input at the boundary.
- Use consistent `{ ok: true }` / `{ ok: false, code, error }` response shapes.
- Keep trusted writes in server-side service functions.

## Shared Layers

`src/components/ui`: reusable generic primitives.

`src/components/features`: domain-specific UI such as cart, dish tiles, order cards, and menu/kitchen/payment widgets.

`src/components/shared`: small reusable app components such as page headers, empty states, stat cards, status badges, providers, and app toasts.

`src/lib/supabase`: Supabase clients and server-side service/query helpers.

`src/lib/validation`: Zod schemas and request contracts.

`src/lib/performance`: machine-readable budgets for critical workflows.

`src/stores`: local browser state only. Never trust store values for prices, payment state, roles, permissions, or ownership.

`tests/unit`, `tests/api`, `tests/ui`: tests by risk area.

`supabase`: ordered SQL files. Destructive work must be local/disposable only.

## Placement Rules

Add API mutation endpoints under `src/app/api/...`, validate with `src/lib/validation`, and perform trusted Supabase work in `src/lib/supabase` or `src/lib/actions`.

Add public QR UI in `src/app/(public)/order/...` plus feature components under `src/components/features`.

Add dashboard UI inside the dashboard route group and reuse `DashboardShell`, `roleAccess`, and shared status/stat components.

Add schema changes as the next ordered SQL file in `supabase`, update `src/types/database.ts`, and add verification coverage.
