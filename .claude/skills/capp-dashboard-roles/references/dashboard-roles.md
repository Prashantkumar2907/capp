# Dashboard Roles Reference

## Source Files

- `src/components/layouts/dashboard-shell.tsx`
- `src/features/auth/auth-provider.tsx`
- `src/lib/constants.ts`
- `src/app/(dashboard)/dashboard/...`
- `src/hooks/use-realtime-orders.ts`
- `src/lib/supabase/queries.ts`

## Role Matrix

From `roleAccess`:

- `dashboard`: owner, admin, manager, waiter, kitchen, cashier
- `analytics`: owner, admin, manager, cashier
- `branches`: owner, admin
- `staff`: owner, admin
- `menu`: owner, admin, manager
- `tables`: owner, admin, manager, waiter
- `orders`: owner, admin, manager, waiter, cashier, kitchen
- `kitchen`: owner, admin, manager, kitchen
- `waiter`: owner, admin, manager, waiter
- `payments`: owner, admin, manager, cashier
- `settings`: owner, admin, manager, waiter, kitchen, cashier

## Workflow Expectations

Overview:
- Dashboard summary should be chart-ready and avoid full-row client aggregation.

Kitchen:
- Realtime subscriptions must clean up on branch changes.
- Status updates should update local state without duplicate refetches.

Waiter:
- Order creation must use server prices and duplicate-click protection.

Payments:
- Settlement must trust server payment state and webhook signature boundaries.
- Lists should be paginated/range-limited.

Menu:
- Server validates price, branch, category ownership, and media URL shape.

Staff:
- Tenant-scoped and role-scoped management only.

## Tests

Use:

```bash
npm run test
npm run test:api
npm run test:ui
```

For role/access changes, inspect unit tests around `access`, `waiter-flow`, `realtime-orders`, and `performance-budgets`.
