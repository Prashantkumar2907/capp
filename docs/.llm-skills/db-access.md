# DB Access Pattern

Use this before editing Supabase data access, SQL, or performance-sensitive queries.

## Files

- Schema and indexes: `supabase/01_schema.sql`
- Functions/triggers: `supabase/02_functions.sql`
- RLS policies: `supabase/03_rls.sql`
- Storage/realtime: `supabase/04_storage_realtime.sql`
- Admin client: `src/lib/supabase/admin.ts`
- Browser client: `src/lib/supabase/client.ts`
- Server cookie client: `src/lib/supabase/server.ts`
- Shared query reads: `src/lib/supabase/queries.ts`
- Trusted mutation services: `src/lib/supabase/*.ts`
- Current trusted services include onboarding, branch/staff management, menu dishes, order creation/status, payment settlement/webhooks, public menu/receipt/feedback, and table management.
- Platform admin data access lives in `src/lib/supabase/platform-admin.ts`.
- DB type contract: `src/types/database.ts`

## Rules

- Prefer service functions under `src/lib/supabase` for trusted writes and cross-table reads.
- Use the browser client for scoped authenticated reads only when RLS is sufficient and no trusted mutation is needed.
- Public routes that expose restaurant/customer data should validate params and use admin services with deliberately narrow selects.
- Table mutations should go through `src/lib/supabase/table-management.ts`; setting a table to `inactive` must also set `is_active=false` so public QR links stop resolving.
- Onboarding should go through `src/lib/supabase/onboarding.ts`; keep rollback behavior when adding new setup steps.
- App-creator/customer portfolio work should use `platform_admins` for authorization and `subscription_grants` for audit history.
- Manual subscription extensions should update both `subscriptions` and the denormalized `organizations.plan` / `organizations.subscription_status` fields.
- Add indexes for new hot filters before adding route or dashboard features that query by foreign key, status, branch, org, date, or idempotency key.
- Keep `src/lib/performance/budgets.ts` and `tests/unit/db-indexes.test.ts` aligned with new hot-path indexes.
- Security-definer functions should set a stable `search_path`.

## Platform Admin Tables

- `platform_admins`: app-creator users allowed to access `/admin`; seeded demo email is `admin@example.com`.
- `subscription_grants`: append-only audit records for manual grants after offline or external payment.
- Hot-path indexes: `idx_platform_admins_email`, `idx_platform_admins_user`, `idx_organizations_plan_status`, `idx_subscriptions_org_period`, `idx_subscription_grants_org_created`.

## Migration Style

This repo stores ordered reset SQL files rather than incremental timestamp migrations. Keep table definitions, indexes, functions, RLS, storage, and seed data in their existing files unless the project changes migration strategy.
