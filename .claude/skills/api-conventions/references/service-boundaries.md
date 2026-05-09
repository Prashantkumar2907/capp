# Service Boundaries

## Existing Examples

`src/app/api/orders/route.ts` validates `createOrderSchema`, then calls `createRestaurantOrder()` in `src/lib/supabase/orders.ts`.

`src/lib/supabase/orders.ts` verifies the branch and active table, resolves staff actor rules for waiter/cashier orders, loads branch dish prices, calculates totals with organization tax settings, inserts the order, items, and pending payment, and handles `client_request_id` idempotency.

`src/app/api/orders/[orderId]/status/route.ts` validates route params/body and delegates to `transitionOrderStatus()` in `src/lib/supabase/order-status.ts`.

`src/lib/supabase/order-status.ts` centralizes allowed transitions and role gates. It synchronizes order item status and releases tables when orders become idle.

`src/app/api/payments/[paymentId]/settle/route.ts` validates IDs/status before calling `settlePayment()` in `src/lib/supabase/payments.ts`.

`src/app/api/v1/webhooks/razorpay/route.ts` verifies webhook signatures/replay windows before database writes. `src/lib/supabase/payments.ts` stores webhook events for idempotency.

`src/app/api/platform/*` delegates to `src/lib/supabase/platform-admin.ts`, which authorizes against `platform_admins` or `PLATFORM_ADMIN_EMAILS` and writes `subscription_grants`.

## Client Mutation Pattern

Dashboard pages use TanStack Query mutations:

- Build a small payload from form state.
- `fetch()` the API route.
- `await readApiResponse(response)`.
- Invalidate the relevant scoped query key.
- Show `sonner` success/error toasts.

Examples: `src/app/(dashboard)/dashboard/menu/page.tsx`, `src/app/(dashboard)/dashboard/payments/page.tsx`, `src/app/(dashboard)/dashboard/staff/page.tsx`.

## Known Transitional Pattern

Some category/settings code still performs direct browser Supabase mutations protected by RLS. Do not expand this pattern for trusted writes. New price, branch, staff, payment, order, platform, and table mutations should use API routes and service files.
