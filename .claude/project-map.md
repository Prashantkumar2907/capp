# CAPP Project Map

## What This Repository Appears to Do
- CAPP is a restaurant management application for owners and staff to manage branches, menus, tables, orders, kitchen workflow, staff, analytics, settings, payments, and customer QR ordering.
- Evidence: `guide.md`, `appdev.md`, `src/app`, `src/lib/constants.ts`, and `supabase/001_setup.sql`.

## Main Apps, Services, and Packages
- Single npm package: `capp`.
- Main app: Next.js 16 App Router in `src/app`.
- Public customer flow: `/order/[branchId]/[tableNumber]`, payment page, and `/receipt/[orderId]`.
- Protected staff/admin flow: `/dashboard` and subroutes for menu, orders, tables, branches, staff, analytics, payments, kitchen, waiter, and settings.
- API route: `/api/v1/webhooks/razorpay`.
- Backend data platform: Supabase/PostgreSQL/Auth/Realtime/Storage.

## How to Install Dependencies
- Use npm because `package-lock.json` exists.
- Command: `npm install`.

## How to Run Locally
- Copy `.env.example` to `.env.local` and fill values locally. Do not commit secrets.
- Command: `npm run dev`.
- Default local URL from docs: `http://localhost:3000`.
- Supabase schema setup is documented in `guide.md`; review SQL before running it.

## How to Test, Lint, Typecheck, Build
- Lint: `npm run lint`.
- Build: `npm run build`.
- Start built app: `npm run start`.
- Test command: UNKNOWN. No `test` script or test runner config was detected.
- Typecheck command: UNKNOWN. TypeScript is configured with `noEmit`, but no package script was detected.

## Key Directories
- `src/app`: Next.js routes, route groups, pages, layouts, and API handlers.
- `src/components/ui`: shadcn-style UI primitives.
- `src/components/dashboard`: dashboard navigation/layout components.
- `src/components/common`: shared app components.
- `src/hooks`: auth and realtime hooks.
- `src/lib`: helpers, constants, validation, and Supabase clients/types.
- `src/stores`: Zustand cart store.
- `supabase`: SQL reset, setup, and seed files.
- `scripts`: seed and SQL generation scripts.
- `.claude`: AI scaffold, skills, agents, project map, and report.

## Data Stores and Migrations
- Supabase/PostgreSQL schema is in `supabase/001_setup.sql`.
- Seed data is in `supabase/002_seed_data.sql`.
- Destructive reset SQL is in `supabase/000_reset.sql`.
- RLS policies, helper functions, triggers, indexes, storage policies, and realtime publication updates are in the SQL files.
- Migration workflow is UNKNOWN. Docs currently instruct manual SQL execution in Supabase SQL Editor.

## External Integrations
- Supabase Auth, Database, Realtime, and Storage.
- UPI QR payment flow.
- Optional Razorpay payment gateway and webhook secret.
- Deployment docs mention Vercel and Netlify.
- OAuth appears in auth UI through Supabase, including Google sign-in code paths.

## Deployment and IaC Surfaces
- No Terraform/OpenTofu/Pulumi/Kubernetes/Helm/Docker/CI files were detected.
- Deployment provider in active use is UNKNOWN.
- Docs mention Vercel and Netlify.
- Environment variables are listed by name in `.env.example` and `guide.md`.

## AI/LLM Surfaces
- No OpenAI, Anthropic, local LLM, RAG, vector store, eval, or tool-calling code was detected.
- If AI features are added, use `.claude/skills/multi-agent-systems/SKILL.md` first.

## Danger Zones
- `supabase/000_reset.sql` deletes data and drops tables; treat as local-only unless explicitly approved for another environment.
- `scripts/write_sql.py` contains generated reset/setup SQL text and should be inspected before use.
- `src/lib/supabase/server.ts` creates a service-role client; keep service role server-only.
- `src/app/api/v1/webhooks/razorpay/route.ts` handles payment events and must preserve raw-body signature verification and idempotency.
- Public QR ordering and receipt routes are unauthenticated; RLS and route-level validation matter.
- `scripts/seed-test-data.mjs` contains a hardcoded Supabase endpoint and anon token; review before any real use and do not copy values into docs.

## Unknowns to Confirm
- Production hosting provider and deployment process.
- CI provider and required checks.
- Database migration process beyond manual SQL editor instructions.
- Monitoring/alerting/logging provider.
- Automated test strategy and expected coverage.
- Owner/team boundaries.
- Whether demo seed credentials are acceptable in this repo long term.
