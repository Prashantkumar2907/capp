# State Patterns

## Query Examples

`src/app/(public)/order/[branchId]/[tableNumber]/page.tsx` uses `["public-menu", branchId, tableNumber]` and disables retry for public menu lookup errors.

`src/app/(public)/order/[branchId]/[tableNumber]/payment/page.tsx` uses `["public-menu-meta", branchId, tableNumber]` before submitting to `/api/orders`.

`src/app/(dashboard)/dashboard/menu/page.tsx` uses `["menu", organization?.id]`, local search/category filters, client pagination, and invalidates `["menu"]` after dish/category changes.

`src/app/(dashboard)/dashboard/payments/page.tsx` uses `["payments", branch?.id]`, refetches every 30000 ms, and invalidates `["payments"]` plus `["dashboard-summary"]` after settlement.

## Cart Store

`src/stores/cart-store.ts` persists under `capp-cart-v2`. It clears items when branch/table context changes and uses `submissionKey` to support idempotent order submission. Public payment sends only dish IDs, quantities, notes, table/order source, and client request ID to `/api/orders`.

## Auth Context

`src/features/auth/auth-provider.tsx` loads Supabase user, staff, organization, branch, role, and `canAccess()`. Dashboard shell redirects based on this hydrated state.

## Pagination

`src/hooks/use-pagination.ts` is local client pagination over an array. Performance budgets mark some routes as requiring server pagination as they grow; do not assume client pagination is enough for new large operational lists.
