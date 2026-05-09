# CAPP Project Map

## Route Groups

`src/app/(public)/(auth)` contains sign-in, sign-up, password reset, and callback entry points.

`src/app/(public)/order/[branchId]/[tableNumber]` and `src/app/(public)/order/[branchId]/[tableNumber]/payment` cover public QR menu browsing and order submission.

`src/app/(public)/receipt/[orderId]` renders public receipts and feedback.

`src/app/(dashboard)/dashboard` contains the authenticated tenant workspace: overview, analytics, branches, kitchen, menu, orders, payments, settings, staff, tables, and waiter.

`src/app/admin` is the platform admin console for customer portfolio and subscription grants.

`src/app/api` contains domain route handlers: branches, menu, onboarding, orders, payments, platform, public menu/receipt/feedback, staff, tables, health, and Razorpay webhooks.

## Placement Examples

For a new staff operation, mirror existing files such as `src/app/(dashboard)/dashboard/staff/page.tsx`, add request validation in `src/lib/validation/schemas.ts`, keep trusted writes in `src/lib/supabase/management.ts`, expose route handlers like `src/app/api/staff/[staffId]/route.ts`, and add contract tests under `tests/api`.

For a new public ordering behavior, keep the route under `src/app/(public)/order`, reuse `src/stores/cart-store.ts` only for local cart intent, and validate all trusted writes through `src/app/api/orders/route.ts` plus `src/lib/supabase/orders.ts`.

For a new shared visual primitive, extend `src/components/ui` only if it is domain-neutral. Use `src/components/shared` for reusable CAPP presentation such as page headers, empty states, stat cards, and status badges.

For a database change, add the next ordered SQL file or edit the correct existing setup file only when still pre-production. Update `src/types/database.ts`, service queries, and tests that assert RLS/index behavior.

## Existing High-Signal Files

- `README.md`
- `docs/architecture/file-structure.md`
- `docs/product-understanding.md`
- `docs/performance.md`
- `src/proxy.ts`
- `src/features/auth/auth-provider.tsx`
- `src/lib/constants.ts`
- `src/lib/performance/budgets.ts`
- `src/lib/validation/schemas.ts`
- `src/types/database.ts`
