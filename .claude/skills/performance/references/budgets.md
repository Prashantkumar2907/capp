# Performance Budgets

Source of truth: `src/lib/performance/budgets.ts`.

## Current Critical Routes

| ID | Route | Max API p95 | Max JS KB | Notes |
| --- | --- | ---: | ---: | --- |
| `public-qr-menu` | `/order/[branchId]/[tableNumber]` | 650 ms | 190 | Cached public menu, no duplicate fetches, skeleton/empty/error required. |
| `public-qr-payment` | `/order/[branchId]/[tableNumber]/payment` | 750 ms | 200 | One idempotent order mutation, server totals/payment trust boundary. |
| `dashboard-overview` | `/dashboard` | 800 ms | 230 | Branch/date summary without full-row client aggregation. |
| `dashboard-analytics` | `/dashboard/analytics` | 900 ms | 260 | Chart-ready analytics on date-window indexes. |
| `kitchen-display` | `/dashboard/kitchen` | 650 ms | 220 | Realtime cleanup and one status mutation per intent. |
| `waiter-pos` | `/dashboard/waiter` | 750 ms | 220 | Server-priced order creation and duplicate-click suppression. |
| `cashier-payments` | `/dashboard/payments` | 700 ms | 220 | Server-trusted settlement and paginated lists. |
| `staff-management` | `/dashboard/staff` | 700 ms | 210 | Tenant-scoped management and paginated lists. |
| `menu-management` | `/dashboard/menu` | 800 ms | 240 | Validated price/category/branch ownership and media resilience. |
| `platform-admin` | `/admin` | 900 ms | 240 | Platform portfolio and subscription grants behind admin auth. |

## Hot Path Indexes

Budget tests require indexes such as `idx_orders_branch_created`, `idx_orders_branch_status`, `idx_orders_branch_table_active`, `idx_branch_dishes_branch`, `idx_categories_org_sort`, `idx_payments_branch_created`, `idx_staff_org`, `idx_staff_branch`, `idx_platform_admins_email`, and subscription grant/period indexes.
