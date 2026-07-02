# Supabase Setup

## Required Values

Find these in Supabase Dashboard > Project Settings > API:

- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable or anon key safe for browser use.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret key. Never expose with `NEXT_PUBLIC_`.

Find the database URL in Supabase Dashboard > Project Settings > Database > Connection string:

- `DATABASE_URL`: direct or pooler Postgres connection string with `sslmode=require`.

If the direct host looks like `db.<project-ref>.supabase.co` and your machine cannot reach IPv6, use the Session pooler connection string instead. Supabase shows it under Project Settings > Database > Connection Pooling. The pooler host usually looks like `aws-0-<region>.pooler.supabase.com`.

## Local Env

Place values in `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...
```

## SQL Order

Run files in this order through `npm run db:migrate` or the Supabase SQL editor:

1. `supabase/00_extensions.sql`
2. `supabase/01_schema.sql`
3. `supabase/02_functions.sql`
4. `supabase/03_rls.sql`
5. `supabase/04_storage_realtime.sql`
6. `supabase/05_seed_demo.sql`

## Verification

Run:

```bash
npm run db:verify
npm run test:api
```

The verification checks expected tables and RLS state. API smoke checks the Supabase-backed health route.
