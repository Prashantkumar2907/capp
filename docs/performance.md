# Performance Budgets

These budgets guide implementation and QA for the production restaurant workflows.

## Machine-Readable Contract

The source of truth for critical workflow budgets is `src/lib/performance/budgets.ts`.

Each budget declares the route pattern, personas, desktop/tablet/mobile QA coverage, API latency budget, image budget, maximum duplicate fetch allowance, maximum mutation requests per intent, required skeleton/empty/error states, cache key, trust boundaries, and required database indexes.

The current critical route IDs are:

| Route ID | Route | Personas | Primary budget |
| --- | --- | --- | --- |
| `public-qr-menu` | `/order/[branchId]/[tableNumber]` | public customer | One cached menu request per branch/table, resilient dish media, no horizontal overflow |
| `public-qr-payment` | `/order/[branchId]/[tableNumber]/payment` | public customer | One idempotent order mutation per submit intent, server totals, server payment status |
| `dashboard-overview` | `/dashboard` | owner, admin, manager | Chart-ready summary data without full-row client aggregation |
| `dashboard-analytics` | `/dashboard/analytics` | owner, admin, manager | Date-windowed analytics on branch/date indexes |
| `kitchen-display` | `/dashboard/kitchen` | owner, admin, manager, kitchen | Clean realtime subscription lifecycle and one status mutation per intent |
| `waiter-pos` | `/dashboard/waiter` | owner, admin, manager, waiter | Server-priced order creation with duplicate-click suppression |
| `cashier-payments` | `/dashboard/payments` | owner, admin, manager, cashier | Server-trusted settlement state, webhook signature boundary, paginated lists |
| `staff-management` | `/dashboard/staff` | owner, admin, manager | Tenant-scoped staff management with paginated lists |
| `menu-management` | `/dashboard/menu` | owner, admin, manager | Server-validated price, branch, and category ownership with resilient media |

## Key Pages
- Public QR menu: first useful menu content within 2.5 seconds on a typical 4G device after the API responds, no horizontal overflow at 360 px, and no more than one menu request per branch/table cache key.
- Public payment: one order creation request per submit attempt, duplicate clicks suppressed, receipt navigation within 1 second after API success.
- Dashboard overview: summary query window defaults to 7 days and selects only chart/stat columns; cards and recent order list render without layout shift.
- Analytics: selectable 7, 14, and 30 day windows use branch/date indexes and chart-ready summary data rather than client-side full-row aggregation.
- Kitchen display: realtime subscriptions must be cleaned up on branch changes and status PATCH responses should update local state without a duplicate manual refetch.

## Data Access
- Branch/date hot paths need composite indexes for orders, order items, payments, and feedback.
- Table release checks need the active table index `idx_orders_branch_table_active` because payment settlement and cancellations verify whether another active order still occupies the table.
- Menu management and public menu reads should use category sort and dish-name indexes as menus grow.
- Large operational lists should be paginated or range-limited before adding new filters.
- Client components should reuse query-backed state and stable query keys instead of issuing duplicate API calls for the same branch workflow.
- Public clients must never submit trusted totals, item prices, payment status, roles, or permission decisions.

## Browser QA
- Check desktop, tablet, and mobile widths for every changed customer or staff flow.
- Use delayed mocked responses for skeleton inspection.
- Watch network requests for duplicate fetches, avoidable waterfalls, and repeated mutations.
- Verify reduced-motion behavior when adding animation or route transition effects.

## Test Gate

`tests/unit/performance-budgets.test.ts` verifies that all critical route budgets are present, all six staff roles plus the public customer persona are covered, route budgets require skeleton/empty/error states, duplicate fetch allowance remains zero, ordering and payment trust boundaries stay server-side, and every budgeted hot path has a matching schema index.
