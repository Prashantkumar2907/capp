---
name: data-state
description: Use for CAPP Supabase/PostgreSQL schema, RLS, migrations, realtime, storage, payments, order/table state, caches, queues, backfills, and distributed consistency.
---

# Data and State Skill

## When to Use
- Use for changes to `supabase/*.sql`, `src/lib/supabase/*`, order/payment/table/menu/staff status logic, storage, realtime subscriptions, React Query, Zustand, or seed/reset scripts.
- Use before adding migrations, backfills, queues, caches, event streams, jobs, or data pipelines.
- Use for public ordering or webhook flows that write multiple tables.

## Required Discovery
- Read `supabase/001_setup.sql`, `supabase/002_seed_data.sql`, and `supabase/000_reset.sql` when schema or seed behavior is involved.
- Read affected Supabase clients: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/types.ts`.
- Read relevant state code: `src/hooks/use-realtime-orders.ts`, `src/stores/cart-store.ts`, and React Query usage in affected pages.
- Identify RLS policy impact, indexes, constraints, triggers, and realtime publication tables.
- Identify all status transitions and write paths for the affected entity.

## Non-Negotiable Rules
- Treat `supabase/000_reset.sql` as destructive. Never run it against shared or production projects without explicit approval.
- Do not weaken RLS to make UI code work.
- Keep public insert/read policies intentional and least-privilege.
- Every mutable state transition needs one clear owner and idempotency story.
- Avoid dual writes without a transaction, PostgreSQL function, outbox/inbox, or explicit reconciliation strategy.
- Do not hardcode production endpoints, service-role keys, or private credentials in scripts.

## Workflow
1. Classify the change:
   - Schema migration.
   - RLS/auth policy.
   - Realtime behavior.
   - Storage bucket/policy.
   - UI state/cache.
   - Payment/order consistency.
   - Seed/reset/backfill.
2. Check migration safety:
   - Is the change backward compatible?
   - Is rollback possible, or is forward-fix safer?
   - Are existing rows valid under new constraints?
   - Are indexes needed before read/write path changes?
3. For query changes, check indexes and likely query shape. Use `EXPLAIN` in a safe database when available.
4. Prevent N+1 patterns in Supabase selects and per-row client fetches.
5. Use transactions or PostgreSQL functions for multi-table changes when consistency matters.
6. Make consumers idempotent:
   - Webhooks should safely handle duplicate provider events.
   - Realtime handlers should tolerate out-of-order updates.
   - Backfills and scripts should be restartable.
7. Plan cache invalidation for React Query and Zustand state.
8. Document backfill/batch job limits, retry behavior, and verification.

## Verification
- Read back changed SQL and TypeScript files.
- Run `npm run lint` for TypeScript changes.
- Run `npm run build` for route/server/client boundary changes.
- Validate SQL in a local or staging Supabase/Postgres environment when available.
- Confirm RLS behavior for each role affected: owner, admin, manager, waiter, kitchen, cashier, and unauthenticated customer.
- Verify realtime updates on `orders` and `order_items` when touched.

## Common Failure Modes
- Updating `orders` and `payments` separately without idempotency or reconciliation.
- Adding a column in SQL without updating TypeScript types or UI assumptions.
- Changing status enums in UI but not SQL `CHECK` constraints.
- Missing indexes for dashboard analytics or realtime-heavy queries.
- Assuming public QR routes can read private branch/customer data.
- Running reset SQL or seed scripts against the wrong Supabase project.
