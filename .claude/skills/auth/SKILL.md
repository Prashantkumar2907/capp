---
name: auth
description: Use for CAPP Supabase SSR auth, staff roles, platform admin authorization, protected routes, and tenant-scope security.
---

# Auth

## When to use this skill
Use before changing sign-in/sign-up, `src/proxy.ts`, auth callbacks, `AuthProvider`, staff role checks, platform admin checks, route protection, or permission-sensitive API routes.

## Quick reference
| Concern | File |
| --- | --- |
| Proxy route protection | `src/proxy.ts` |
| Client auth context | `src/features/auth/auth-provider.tsx` |
| Server session client | `src/lib/supabase/server.ts` |
| Service-role client | `src/lib/supabase/admin.ts` |
| Staff context and role helpers | `src/lib/supabase/permissions.ts` |
| Platform admin service | `src/lib/supabase/platform-admin.ts` |
| Roles and roleAccess | `src/lib/constants.ts` |
| Auth/RLS docs | `docs/.llm-skills/auth-pattern.md` |

## Auth flow
`src/proxy.ts` refreshes Supabase SSR cookies, lets public paths pass, redirects unauthenticated protected routes to `/sign-in?redirect=<path>`, and redirects signed-in users away from auth entry pages.

`AuthProvider` hydrates browser context with user, active staff row, organization, branch, role, `canAccess()`, `refresh()`, and `signOut()`.

Server route handlers that need staff access create an admin Supabase client, call `getActiveStaffContext()`, then use role helpers such as `requireOwnerOrAdmin()` or domain-specific role checks.

See `references/auth-flow.md` for route and role details.

## Security rules
- Public QR order creation is unauthenticated, but server services verify active branch/table/menu and calculate trusted totals.
- Tenant staff access is scoped by `org_id`, `branch_id`, role, and active staff status.
- Platform admin is not a tenant staff role; use `platform_admins` and `PLATFORM_ADMIN_EMAILS`.
- Only `NEXT_PUBLIC_*` values may be used in browser code.

## Do not
- Do not authorize platform admin with staff roles.
- Do not let client code decide tenant scope, role, payment status, or subscription status.
- Do not store or print service-role keys, Razorpay secrets, passwords, or `.env.local` values.
- Do not add protected app routes without considering proxy public-path behavior.
