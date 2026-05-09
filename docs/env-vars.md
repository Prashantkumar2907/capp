# Environment Variables

Never commit `.env.local`, provider secrets, service role keys, database passwords, webhook secrets, or OAuth client secrets.

## Required
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL used by browser and server clients.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon or publishable key safe for browser use.
- `NEXT_PUBLIC_APP_URL`: Public app origin for redirects and Playwright, such as `http://localhost:3000`.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only Supabase service role key. Never expose with `NEXT_PUBLIC_`.
- `DATABASE_URL`: Postgres connection string for SQL verification and local/disposable migrations.

## Auth and OAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID configured in Supabase Auth.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret configured in Supabase Auth. Server/provider only.

## Payments
- `RAZORPAY_KEY_ID`: Razorpay public key ID for payment setup.
- `RAZORPAY_KEY_SECRET`: Razorpay server-side API secret.
- `RAZORPAY_WEBHOOK_SECRET`: Secret used to verify Razorpay webhook signatures.

## Optional Operations
- `ALLOW_DESTRUCTIVE_DB_RESET`: Set to `1` only for a disposable database when running destructive seed/reset SQL.
- `PLATFORM_ADMIN_EMAILS`: Optional comma-separated bootstrap allowlist for app-creator accounts that may access `/admin`; production should also keep matching rows in `platform_admins`.
- `PORT`: Local Next.js port override for Playwright, for example `3100`.

## Secret-Handling Rules
- Only `NEXT_PUBLIC_*` values may reach browser bundles.
- Do not log raw env values.
- Rotate `SUPABASE_SERVICE_ROLE_KEY`, Razorpay secrets, and OAuth secrets after any suspected exposure.
- Use separate Supabase and Razorpay projects for local/demo/staging/production.
