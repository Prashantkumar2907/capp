# Deployment and Rollback

## Pre-Deploy Checklist
- Confirm `.env.local`, service keys, provider secrets, local reports, `.next`, `node_modules`, and test artifacts are not staged.
- Run `npm run verify`.
- Run `npm run db:verify` against the target database when credentials are available.
- Review pending SQL changes in `supabase/` and confirm they are safe for the target environment.
- Confirm Razorpay webhook URL, Google OAuth redirects, Supabase Auth redirect URLs, storage bucket policies, and realtime publication are configured for the target origin.

## Migration Order
Run SQL in this order:

1. `supabase/00_extensions.sql`
2. `supabase/01_schema.sql`
3. `supabase/02_functions.sql`
4. `supabase/03_rls.sql`
5. `supabase/04_storage_realtime.sql`
6. `supabase/05_seed_demo.sql`

Run `05_seed_demo.sql` only for local, sales demo, or disposable staging databases. Do not run demo seed data against a real production tenant database.

## Deployment
- Build with `npm run build`.
- Set all required environment variables from [env-vars.md](env-vars.md).
- Deploy the Next.js app to the hosting target.
- Run a smoke check against `/api/health`.
- Test a public QR order, staff sign-in, kitchen status update, cashier settlement, and receipt.

## Rollback
- Revert the app deployment to the previous build artifact or hosting release.
- If a SQL migration must be rolled back, prefer a forward corrective migration over manual edits.
- Restore from a Supabase backup only after confirming the blast radius and communicating downtime.
- Re-run `npm run db:verify` and `/api/health` after rollback.

## Backup and Restore Notes
- Enable automated Supabase backups for production.
- Keep a documented restore point before major schema changes.
- Validate restores in a staging project before using them for production recovery.
- Store exported backups in a restricted location with audit logging.
