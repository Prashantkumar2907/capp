# Platform Admin Pattern

Use this before changing `/admin`, `/api/platform/*`, app-creator permissions, customer onboarding, or subscription grants.

## Purpose

Platform admin is for the CAPP app creator, not restaurant tenant admins. It answers:

- How many customer workspaces exist.
- Which logged-in users still need onboarding.
- When each subscription ends.
- Which subscriptions are active, trial, past due, expired, or cancelled.
- How much GMV and collected payment volume customer restaurants generated this month.
- Which manual grants were given after offline or external payment.

## Files

- UI: `src/app/admin/page.tsx`, `src/app/admin/loading.tsx`, `src/app/admin/error.tsx`
- APIs: `src/app/api/platform/overview/route.ts`, `src/app/api/platform/clients/route.ts`, `src/app/api/platform/subscriptions/grant/route.ts`
- Service: `src/lib/supabase/platform-admin.ts`
- Validation: `platformClientOnboardingSchema`, `platformSubscriptionGrantSchema` in `src/lib/validation/schemas.ts`
- Tables: `platform_admins`, `subscription_grants`, `organizations`, `subscriptions`

## Rules

- Never authorize platform access from tenant `owner` or `admin` roles.
- Always call `requirePlatformAdmin(admin)` before cross-tenant reads or writes.
- A client must sign in once before platform onboarding, so a Supabase Auth user exists.
- Manual grants must update `subscriptions`, sync `organizations.plan` and `organizations.subscription_status`, and insert `subscription_grants`.
- Keep `/admin` compact, scannable, and operational; use dialogs for onboarding and grant workflows.
- Avoid exposing provider details or secrets in UI errors.

## Bootstrap

- Demo seed inserts `admin@example.com` into `platform_admins`.
- Production can bootstrap with `PLATFORM_ADMIN_EMAILS`, then keep explicit `platform_admins` rows for durable access control.
