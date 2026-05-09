# API And Supabase Boundaries

## Response Contract

Use `src/lib/api/responses.ts`:

- Success: `apiOk({ ... })` returns `{ ok: true, ...data }`.
- Expected failure: `apiError(code, message, status)` returns `{ ok: false, code, error }`.
- Validation failure: `apiValidationError(error)` returns code `VALIDATION_ERROR`.

Do not return raw Supabase errors to users.

## Validation

Schemas live in `src/lib/validation/schemas.ts`.

Important schemas:
- `publicMenuQuerySchema`
- `publicReceiptQuerySchema`
- `createOrderSchema`
- `orderStatusUpdateSchema`
- `paymentSettlementSchema`
- `platformClientOnboardingSchema`
- `platformSubscriptionGrantSchema`
- `staffSchema`, `staffUpdateSchema`
- `dishSchema`, `dishUpdateSchema`
- `tableCreateSchema`, `tableStatusUpdateSchema`

Malformed IDs should fail at validation, before auth or DB work where possible.

## Supabase Clients

`createAdminSupabase()` is server-only and uses the service-role key. Never import it into client components.

`createClient()` is browser-side and must use only public anon credentials.

`createServerClient` in proxy/auth code should only manage session state.

## Public Ordering

Public menu reads should return only UI-needed fields and use cache/coalescing for branch/table menu keys.

Order creation must:
- Reprice dishes server-side.
- Compute subtotal/tax/total server-side.
- Use bounded quantities.
- Accept idempotency keys.
- Ignore client dish names, unit prices, waiter IDs, and payment status.

## Platform Admin

Platform APIs are cross-tenant and must authorize through `platform_admins`, not restaurant staff roles.

Manual subscription grants should write audit-backed `subscription_grants` rows.

## Database And RLS

Keep RLS enabled and service-role operations inside server boundaries.

Hot paths should match indexes in `supabase/01_schema.sql` and `src/lib/performance/budgets.ts`.

Run:

```bash
npm run test:api
npm run db:verify
```
