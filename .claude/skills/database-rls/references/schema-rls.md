# Schema And RLS Reference

## Main Tables

Platform: `platform_admins`, `subscriptions`, `subscription_grants`.

Tenant setup: `organizations`, `branches`, `staff`.

Menu and tables: `categories`, `dishes`, `branch_dishes`, `tables`.

Operations: `orders`, `order_items`, `payments`, `webhook_events`, `activity_logs`, `feedback`.

## Important Indexes

`supabase/01_schema.sql` defines indexes used by performance budgets, including branch/date order, payment, feedback, staff org/branch/user, menu category/sort/dish, branch dishes, active table orders, client request idempotency, platform admin email/user, organization plan/status, and subscription period/grant history.

## RLS Expectations

`supabase/03_rls.sql` enables RLS on every application table.

Staff policies use `app_user_org_id()`, `app_user_role()`, and `app_user_can_manage_branch()`.

Public read policies are limited to active branch/menu/table data needed for QR ordering.

Order, order item, payment, feedback, webhook, platform admin, and subscription grant access must stay behind staff/platform/service boundaries.

## Tests To Update

Update `tests/unit/rls-hardening.test.ts` for policy/security changes.

Update `tests/unit/performance-budgets.test.ts` when a budgeted hot path requires a new index.

Update `tests/api/db.verify.ts` when adding application tables that must exist and have RLS enabled.
