# Operations Runbooks

## Health Check
1. Open `/api/health`.
2. Confirm the response is successful and includes database-backed health state.
3. If health fails, check Supabase connectivity, env variables, and recent deploy changes.

## Supabase Migration
1. Confirm the target database is local or disposable before destructive resets.
2. Run SQL in the order documented in [deployment.md](../deployment.md).
3. Run `npm run db:verify`.
4. Check RLS policies for organizations, branches, staff, menu, tables, orders, order items, payments, subscriptions, activity logs, feedback, and webhook events.

## Demo Seeding
1. Use only local, demo, or disposable staging databases.
2. Set `ALLOW_DESTRUCTIVE_DB_RESET=1` only after confirming the database is safe to reset.
3. Run `npm run db:migrate`.
4. Verify the four demo restaurant types in [demo-data.md](../demo-data.md).

## Supabase Storage
1. Confirm the `dish-images` bucket exists.
2. Confirm public read policy and authenticated staff write policies are installed from `supabase/04_storage_realtime.sql`.
3. Test dish image fallback behavior with a broken image URL.

## Realtime
1. Confirm `orders`, `order_items`, `tables`, and `branch_dishes` are in the Supabase realtime publication.
2. Open kitchen display and waiter/order views in separate sessions.
3. Update an order status and confirm subscriptions update without leaking after branch changes.

## Google OAuth
1. Configure provider credentials in Supabase Auth.
2. Add local, staging, and production callback URLs.
3. Confirm sign-in, callback redirect, onboarding redirect, sign-out, and expired-session behavior.

## Razorpay Webhooks
1. Configure webhook target `/api/v1/webhooks/razorpay`.
2. Set `RAZORPAY_WEBHOOK_SECRET`.
3. Send a signed test event.
4. Confirm invalid signatures are rejected, duplicate event IDs are idempotent, and `webhook_events` records processed/ignored/failed states.

## Payment Incident Triage
1. Search safe logs for payment or webhook failure codes without exposing provider payload secrets.
2. Check `webhook_events` for duplicate, failed, and ignored events.
3. Compare `payments.status`, `orders.status`, and provider dashboard status.
4. Retry provider webhooks when signature and event ID are valid.
5. Escalate manual settlement only to owner/admin/manager/cashier roles.

## Slow Query Triage
1. Identify the branch, route, date range, and filters.
2. Confirm branch/date composite indexes cover the query.
3. Check whether the page is fetching full rows instead of summary columns.
4. Add pagination, server-side filters, or a database RPC before increasing client polling.

## Auth and Access Incident
1. Disable the affected staff row by setting `is_active=false`.
2. Confirm dashboard access stops after refresh or session renewal.
3. Rotate provider credentials if a secret was involved.
4. Review activity logs and staff role changes.

## Rollback
1. Roll back the app deployment first if the issue is application-only.
2. Use a forward SQL correction for schema issues when possible.
3. Restore from backup only when data integrity requires it.
4. Run `npm run verify`, `npm run db:verify`, and a role-flow smoke test after recovery.
