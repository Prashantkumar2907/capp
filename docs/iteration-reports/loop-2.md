# Loop 2

## Inspected

Reviewed current route structure, API routes, validation schemas, Supabase query helpers, public QR ordering, waiter POS order creation, tests, and docs after loop 1.

## Missing Or Weak

`/api/orders` carried most business logic inline, validated requests manually, accepted client-shaped dish names and prices, allowed staff order sources without an authenticated staff context, and returned errors without stable codes. API tests only covered health.

## Implemented

Added `createOrderSchema`, API response helpers, and a reusable `createRestaurantOrder` service. The order API now validates inputs before database work, strips untrusted dish names/prices, recalculates totals from branch menu prices, verifies active tables, creates payment rows with error handling, and requires authenticated active staff for waiter and cashier order sources. Waiter and QR payment clients now send only dish IDs, quantities, and notes.

## File-Structure Or Architecture Changes

Added `src/lib/api/responses.ts` for consistent API response helpers and `src/lib/supabase/orders.ts` for trusted order creation. Kept route code thin and moved domain/database behavior out of the page/API file.

## Tests Run

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:api`, `npm run test:ui`, `npm audit --audit-level=moderate`, `npm run db:migrate`, and `npm run db:verify`.

## Demo Data Or Personas Used

Used the public customer QR ordering persona and waiter POS request shape. Tests use deterministic demo UUID-style IDs without real customer data.

## Skeleton States Added Or Verified

Re-ran the delayed public QR ordering skeleton test across desktop, tablet, and mobile widths to ensure loop 1 loading states still work after order API contract changes.

## Readability And Code Quality Cleanup

Reduced `/api/orders` from inline business logic to validation plus service delegation. Converted API tests to Node test runner so API contracts can grow cleanly.

## UI/UX And Animation Checks

Verified public landing, auth, and QR ordering remain responsive at desktop, tablet, and mobile widths. Primary add/review actions remained visible and reachable.

## API, Query, And Security Checks

Confirmed invalid order payloads return `VALIDATION_ERROR` before Supabase is touched. Confirmed client-provided prices and dish names are stripped by schema and no longer sent by order clients. Staff-created waiter/cashier orders now require active staff auth and branch access.

## Accessibility, Performance, Reliability, And Production Checks

API failure responses now have stable error codes for UI and observability. Payment row creation failure now cleans up the order instead of silently leaving an unpaid order without a payment record.

## Remaining Risks

Order creation still needs a database transaction or RPC for fully atomic order/items/payment/table updates, idempotency keys for duplicate submissions, and rate-limit middleware. Status transitions and payment settlement still need stronger server-side trust boundaries.
