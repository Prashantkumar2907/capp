---
name: api-conventions
description: Use for CAPP API route handlers, Zod contracts, Supabase service functions, response shapes, and trusted mutation boundaries.
---

# API Conventions

## When to use this skill
Use this when adding or changing files under `src/app/api`, service files under `src/lib/supabase`, request schemas, client mutations, or webhook handling.

## Quick reference
| Layer | Pattern |
| --- | --- |
| Route response | `apiOk`, `apiError`, `apiValidationError` from `src/lib/api/responses.ts` |
| Request validation | Zod schemas in `src/lib/validation/schemas.ts` |
| Client API reads | `fetch()` plus `readApiResponse()` from `src/lib/api/client.ts` |
| Browser Supabase | `createClient()` from `src/lib/supabase/client.ts` for allowed RLS reads |
| Server session | `createServerSupabase()` from `src/lib/supabase/server.ts` |
| Service role | `createAdminSupabase()` from `src/lib/supabase/admin.ts` only server-side |
| Staff context | `getActiveStaffContext()` and role helpers in `src/lib/supabase/permissions.ts` |

## Route handler anatomy
Follow `src/app/api/orders/route.ts`:

1. Read JSON or query params defensively.
2. Validate with `safeParse()`.
3. Return `apiValidationError()` on invalid input before database work.
4. Call a service function from `src/lib/supabase`.
5. Map `{ ok: false; status; code; message }` to `apiError()`.
6. Return the smallest needed payload with `apiOk()`.

## Service anatomy
Service files such as `src/lib/supabase/orders.ts`, `src/lib/supabase/payments.ts`, and `src/lib/supabase/menu-management.ts` own database writes and invariants. They return typed result unions, check staff/platform context, scope by org/branch, and use server-calculated values.

See `references/service-boundaries.md` for examples.

## Error handling
- Use stable uppercase error codes such as `VALIDATION_ERROR`, `ROLE_FORBIDDEN`, and `ORDER_STATUS_CONFLICT`.
- Return safe user-facing messages.
- Log server-only failures with safe metadata only, as in `src/app/api/health/route.ts`.
- Do not leak raw Supabase, Razorpay, or Postgres messages to the browser.

## Do not
- Do not let client payloads set prices, totals, roles, payment status, platform admin status, or branch ownership.
- Do not create order/payment/platform/staff/table/dish writes directly from browser components.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` in client components.
- Do not parse request bodies without schema validation.
