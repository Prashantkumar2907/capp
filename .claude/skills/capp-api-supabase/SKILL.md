---
name: capp-api-supabase
description: Use for CAPP API routes, Supabase service functions, validation schemas, RLS policies, and server-side trust boundaries.
---

# CAPP API And Supabase Boundaries

Use this skill when adding or reviewing API routes, database access, validation, auth checks, RLS policies, or trusted mutations.

## Workflow

1. Read [references/api-supabase-boundaries.md](references/api-supabase-boundaries.md).
2. Validate all external input with a schema in `src/lib/validation/schemas.ts`.
3. Return responses through `apiOk`, `apiError`, or `apiValidationError`.
4. Put trusted Supabase reads/writes in `src/lib/supabase` or `src/lib/actions`.
5. Add or update API/unit/DB tests for the trust boundary being changed.

## Trust Rules

- Never trust client-submitted prices, totals, roles, payment status, branch ownership, waiter identity, or permission decisions.
- Use service-role/admin Supabase clients only on server boundaries.
- Public APIs may read public/order data only through deliberately scoped server routes.
- For list APIs, paginate or range-limit before adding filters.

## Review Checklist

- Does malformed input fail before database work?
- Are error messages safe and consistent?
- Does the route leak provider details or raw Supabase errors?
- Are hot queries backed by documented indexes?
- Are idempotency keys used for order/payment mutation paths?
