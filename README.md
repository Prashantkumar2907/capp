# CAPP Restaurant Operations

CAPP is a production-oriented restaurant SaaS for QR ordering, waiter POS, kitchen display, cashier settlement, staff and branch management, analytics, receipts, and demo sales flows.

## Stack
- Next.js App Router with route groups for public and dashboard surfaces.
- Supabase Auth, Postgres, RLS, storage, realtime, and service-role server boundaries.
- TanStack Query for client cache behavior.
- Playwright, Node test runner, ESLint, TypeScript, and SQL verification scripts.

## Setup
1. Install dependencies with `npm install`.
2. Create `.env.local` from [docs/env-vars.md](docs/env-vars.md). Do not commit env files.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000`.

## Database
Run migrations in the documented order:

```bash
npm run db:migrate
npm run db:verify
```

The reset/seed script skips destructive work against non-local database hosts unless `ALLOW_DESTRUCTIVE_DB_RESET=1` is set for a disposable database.

## Verification
Use the individual commands while developing:

```bash
npm run lint
npm run typecheck
npm run build
npm run test
npm run test:api
npm run test:ui
npm run audit:moderate
```

For CI-style checks, run `npm run verify`. Add `npm run db:verify` or `npm run verify:ci` when database connectivity is available.

## Product Docs
- File structure: [docs/architecture/file-structure.md](docs/architecture/file-structure.md)
- Supabase setup and SQL order: [docs/supabase-setup.md](docs/supabase-setup.md)
- Environment variables: [docs/env-vars.md](docs/env-vars.md)
- Demo data: [docs/demo-data.md](docs/demo-data.md)
- Razorpay setup: [docs/razorpay-setup.md](docs/razorpay-setup.md)
- Google OAuth: [docs/google-oauth.md](docs/google-oauth.md)
- Testing plan: [docs/testing-plan.md](docs/testing-plan.md)
- Performance budgets: [docs/performance.md](docs/performance.md)
- Deployment and rollback: [docs/deployment.md](docs/deployment.md)
- Operations runbooks: [docs/runbooks/operations.md](docs/runbooks/operations.md)
