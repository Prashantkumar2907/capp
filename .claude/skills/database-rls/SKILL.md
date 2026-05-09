---
name: database-rls
description: Use for CAPP Supabase SQL schema, RLS policies, security-definer helpers, storage/realtime setup, seed data, and DB verification.
---

# Database And RLS

## When to use this skill
Use before changing files under `supabase`, database types, RLS-sensitive service queries, storage buckets, realtime publication, indexes, seed data, or DB verification.

## Quick reference
| Concern | File |
| --- | --- |
| Extensions | `supabase/00_extensions.sql` |
| Schema and indexes | `supabase/01_schema.sql` |
| RLS helper functions | `supabase/02_functions.sql` |
| RLS policies | `supabase/03_rls.sql` |
| Storage and realtime | `supabase/04_storage_realtime.sql` |
| Demo seed | `supabase/05_seed_demo.sql` |
| DB verify | `tests/api/db.verify.ts` |
| RLS tests | `tests/unit/rls-hardening.test.ts` |
| DB types | `src/types/database.ts` |

## Migration rules
Apply SQL in numeric order. `scripts/run-sql.mjs` reads all `.sql` files from `supabase` and refuses destructive resets unless the database host is local or `ALLOW_DESTRUCTIVE_DB_RESET=1`.

Every application table should have RLS enabled and be checked by `tests/api/db.verify.ts`.

See `references/schema-rls.md` for table groups and policy expectations.

## Policy rules
Use helper functions from `supabase/02_functions.sql` for org, branch, role, and branch-management checks. Security-definer helpers must pin `search_path`.

Public QR clients may read active public menu/table data through policies, but they must not directly write orders, order items, payments, or feedback outside trusted server paths.

## Do not
- Do not add broad `using (true)` or `with check (true)` policies to order/payment/platform tables.
- Do not make `webhook_events` or `subscription_grants` browser-writable.
- Do not use real customer, staff, password, payment, or secret values in seed data.
- Do not add hot-path queries without matching indexes and tests.
