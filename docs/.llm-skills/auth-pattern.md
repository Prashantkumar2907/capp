# Auth Pattern

Use this before changing CAPP authentication or staff authorization.

## Where Auth Lives

- `src/proxy.ts` refreshes Supabase auth cookies and redirects unauthenticated staff routes to `/sign-in`.
- `src/features/auth/auth-provider.tsx` hydrates the client user, active staff record, organization, branch, role, and `canAccess` helper.
- `src/lib/supabase/server.ts` creates the SSR Supabase client from cookies.
- `src/lib/supabase/permissions.ts` is the server-side staff context and role guard layer.
- `src/lib/supabase/platform-admin.ts` is the separate app-creator/platform authorization layer.
- `safeRedirectPath` from `src/lib/utils` must sanitize any user-controlled `redirect` parameter before calling `router.push` or `NextResponse.redirect`.

## Rules

- Never trust a role, branch id, org id, waiter id, payment status, price, or total from the browser.
- Never treat tenant `owner` or `admin` as platform-admin access.
- Staff mutations should call `getActiveStaffContext(admin)` from server code, then enforce role and branch/org scope.
- Owner/admin-only checks use `requireOwnerOrAdmin`.
- Feature-specific checks use `requireStaffRole(staff, [...roles])`.
- Dashboard navigation can hide links client-side, but API routes must enforce the same role rules server-side.
- Public customer flows should use explicit public API routes and service-role server checks, not anonymous direct table writes.
- OAuth callbacks and auth UI must only redirect to same-origin relative paths. Never pass raw query-string redirects to navigation APIs.
- Platform admin APIs must call `requirePlatformAdmin` in `src/lib/supabase/platform-admin.ts`; the check is backed by `platform_admins` rows and optional `PLATFORM_ADMIN_EMAILS` bootstrap emails.

## Safe Pattern

1. Route handler validates params/body with Zod.
2. Service function creates `createAdminSupabase()`.
3. Service function calls `getActiveStaffContext(admin)` for staff workflows.
4. Service function checks tenant/branch ownership before reading or writing.
5. Route returns `apiOk`, `apiError`, or `apiValidationError`.

## Platform Admin Pattern

1. Route validates params/body with Zod.
2. Service creates `createAdminSupabase()`.
3. Service calls `requirePlatformAdmin(admin)`.
4. Service reads or writes cross-tenant data.
5. Subscription grants must write `subscription_grants` audit rows.
