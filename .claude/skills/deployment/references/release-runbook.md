# Release Runbook

## Predeploy

- Confirm `.env.local`, secrets, `.next`, `node_modules`, `playwright-report`, and `test-results` are not staged.
- Run `npm run verify`.
- Run `npm run db:verify` when `DATABASE_URL` is configured for the target.
- Review SQL migrations and ensure seed data is used only for local/demo/disposable staging.
- Confirm Supabase URL/anon/service-role values, Google OAuth redirect URLs, Razorpay webhook URL, and `NEXT_PUBLIC_APP_URL`.

## Deploy

- Build with `npm run build`.
- Set required environment variables from `docs/env-vars.md`.
- Deploy the Next app to the chosen hosting platform.
- Apply Supabase SQL in documented order if database setup changed.

## Smoke Tests

- `/api/health` for app process health.
- `/api/health?ready=1` for DB-backed readiness.
- Public QR menu and order path.
- Staff sign-in and dashboard shell.
- Kitchen order status transition.
- Cashier payment settlement.
- Public receipt and feedback.
- Platform admin overview/subscription grant if platform changes shipped.

## Rollback

- Roll back the app first when behavior regresses.
- Prefer a forward SQL corrective migration after database changes.
- Restore database backup only after clear blast-radius communication.
- Rerun health checks and `npm run db:verify` after rollback/correction.
