# Domain Rules

## Personas

Public customer scans a table QR code, browses the menu, submits one idempotent dine-in order, opens receipt, and may leave feedback.

Owner/admin manage branches, staff, menu, tables, analytics, payments, and settings.

Manager can manage operational menu/table/order/payment workflows within role rules.

Waiter creates and serves orders for assigned branch access.

Kitchen progresses active tickets through preparation statuses.

Cashier settles payments.

Platform admin manages customer portfolio, pending users, subscription grants, and demo onboarding from `src/app/admin`.

## Order Rules

`src/lib/supabase/orders.ts` requires active branch, verifies table for table orders, verifies all dishes are available through `branch_dishes`, calculates totals with organization tax settings, creates order items with server prices, creates a pending payment row, and uses `client_request_id` for idempotency.

`src/lib/supabase/order-status.ts` controls transitions and role gates. Kitchen can progress active tickets but cannot cancel accepted tickets. Waiter can serve ready orders and cancel only pending orders. Paid/refunded/failed/cancelled states are terminal for the board.

## Payment Rules

`src/lib/supabase/payments.ts` allows owner/admin/manager/cashier settlement, prevents completed-to-failed and refunded resettlement, updates order status, releases tables when completed, verifies Razorpay signatures, rejects stale/future webhook timestamps, and stores webhook events for idempotency.

## Demo Data

`docs/demo-data.md` defines deterministic demo restaurants: Lotus Tea Room, Masala Works, Harbour Spice Group, and Night Owl Bowls. Demo auth accounts use `demo.capp.local` and must only be created in disposable QA environments through `scripts/demo-accounts.mjs`.
