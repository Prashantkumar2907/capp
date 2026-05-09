---
name: deployment
description: Use for CAPP env setup, Supabase migrations, build verification, release smoke tests, and rollback procedures documented in this repo.
---

# Deployment

## When to use this skill
Use when preparing a release, changing env vars, running migrations, debugging deployed health, configuring OAuth/Razorpay/Supabase, or planning rollback.

## Quick reference
| Task | Command or path |
| --- | --- |
| Local verify | `npm run verify` |
| CI verify with DB | `npm run verify:ci` |
| Build | `npm run build` |
| Start | `npm run start` |
| DB migrate | `npm run db:migrate` |
| DB verify | `npm run db:verify` |
| Health | `/api/health` or `/api/health?ready=1` |
| Env docs | `docs/env-vars.md` |
| Deployment docs | `docs/deployment.md` |
| Ops runbook | `docs/runbooks/operations.md` |

## Environment
Required values are documented in `docs/env-vars.md`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL`.

Auth uses `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Payments use `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Platform admin may use `PLATFORM_ADMIN_EMAILS`.

No CI provider config, Dockerfile, deployment platform, or branch-to-environment map is present in the repository. Use `docs/deployment.md` and `docs/runbooks/operations.md` as the documented release source of truth.

See `references/release-runbook.md` for release and rollback steps.

## Migration order
Run SQL in order through `npm run db:migrate` or the Supabase SQL editor:
`00_extensions`, `01_schema`, `02_functions`, `03_rls`, `04_storage_realtime`, `05_seed_demo`.

`scripts/run-sql.mjs` refuses destructive resets on non-local hosts unless `ALLOW_DESTRUCTIVE_DB_RESET=1` is set.

## Do not
- Do not commit `.env.local`, `.next`, `node_modules`, Playwright reports, or test results.
- Do not run destructive DB reset against production-like databases.
- Do not expose service-role or Razorpay secrets to browser env vars.
- Do not treat `/api/health` without `ready=1` as a database readiness check.
