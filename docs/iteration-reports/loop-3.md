# Loop 3

## Inspected

Reviewed Supabase schema, seed data, database verification, database types, order statuses, route tests, and docs after the order API refactor.

## Missing Or Weak

Seed data only represented one generic restaurant and lacked realistic plan diversity, branch diversity, role coverage, payment states, feedback, activity logs, image placeholders, disabled staff, and cloud-kitchen/takeaway scenarios. The order status model did not include paid, refunded, or failed states.

## Implemented

Expanded the demo seed to cover Lotus Tea Room, Masala Works, Harbour Spice Group, and Night Owl Bowls across starter, growth, enterprise, and pro plans. Added realistic branches, tables, categories, dishes, image placeholders, availability differences, staff roles, disabled staff, orders, order items, payments, subscriptions, feedback, and activity logs. Extended order statuses to include `paid`, `refunded`, and `failed` in SQL, constants, TypeScript types, queries, and badges.

## File-Structure Or Architecture Changes

Added `docs/demo-data.md` and kept seed coverage in `supabase/05_seed_demo.sql`. Added seed-focused unit tests in `tests/unit`.

## Tests Run

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:api`, `npm run test:ui`, `npm audit --audit-level=moderate`, `npm run db:migrate`, and `npm run db:verify`.

## Demo Data Or Personas Used

Covered small cafe owner, casual dining admin/waiter, multi-branch manager/kitchen, cloud-kitchen cashier, disabled staff, and public customer QR scenarios.

## Skeleton States Added Or Verified

Re-ran the delayed public QR ordering skeleton test across desktop, tablet, and mobile. No new skeleton files were needed in this loop.

## Readability And Code Quality Cleanup

Centralized expanded order statuses in constants/types so seed, UI badges, queries, and schema use one vocabulary.

## UI/UX And Animation Checks

Verified public ordering and auth flows still pass responsive browser checks at desktop, tablet, and mobile widths after status and seed changes.

## API, Query, And Security Checks

Added tests to ensure demo UUIDs are database-valid, fake emails are used, all roles are represented, and paid/failed/refunded statuses exist in centralized status constants. `db:migrate` safely skipped destructive reset against the non-local configured database.

## Accessibility, Performance, Reliability, And Production Checks

Demo media uses stable placeholders with existing UI fallback behavior. Seed data now includes payment failure, refund, disabled staff, out-of-stock activity, and branch-specific availability scenarios for reliability and access-control review.

## Remaining Risks

The expanded seed was not applied to the configured non-local database because destructive reset is guarded. A disposable local or demo Supabase database should be migrated with `ALLOW_DESTRUCTIVE_DB_RESET=1` to fully validate SQL execution and refreshed demo records.
