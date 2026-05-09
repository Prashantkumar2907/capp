# Auth Flow Reference

## Public Paths

`src/proxy.ts` treats `/`, auth pages, `/auth/callback`, `/order/*`, `/receipt/*`, `/api/*`, manifest/service-worker/offline/icon files, and common images as public.

Dashboard routes under `src/app/(dashboard)/dashboard` rely on proxy protection and `DashboardShell` redirects after `AuthProvider` loads.

## Staff Roles

Roles in `src/lib/constants.ts`: `owner`, `admin`, `manager`, `waiter`, `kitchen`, `cashier`.

Navigation role access is defined in `roleAccess`. API services add stricter rules where needed:

- Branch/staff management: owner/admin in `src/lib/supabase/management.ts`.
- Menu changes: owner/admin/manager in `src/lib/supabase/menu-management.ts`.
- Table changes: owner/admin/manager/waiter in `src/lib/supabase/table-management.ts`.
- Payment settlement: owner/admin/manager/cashier in `src/lib/supabase/payments.ts`.
- Order transitions: role and status matrix in `src/lib/supabase/order-status.ts`.

## Platform Admin

`src/lib/supabase/platform-admin.ts` requires a signed-in user whose row exists in `platform_admins` or whose email is configured in `PLATFORM_ADMIN_EMAILS`. Platform actions write subscription grant audit rows.

Platform admin must not be authorized through tenant staff membership.

## RLS Backstop

`supabase/03_rls.sql` enables RLS on application tables and uses helper functions from `supabase/02_functions.sql` such as `app_user_org_id`, `app_user_branch_id`, `app_user_role`, and `app_user_can_manage_branch`.
