# Loop 7 Report

## What was inspected
- Reviewed App Router structure, public QR ordering route, public payment route, cart store, order API, order service, Supabase schema, UI tests, API tests, docs, and iteration reports.
- Focused inspection on the public customer persona placing a QR dine-in order on desktop, tablet, and mobile.

## What was missing or weak
- Public order submissions did not include an idempotency key, so retries or duplicate clicks could create duplicate orders.
- The order API did not have a database-backed duplicate guard for public QR order creation.
- The public payment page showed totals from persisted cart state before hydration, which could produce server/client render mismatches.
- Branch metadata loading/error states on the payment page were too implicit for a customer flow.
- The UI test suite did not check duplicate-click submission or verify that trusted totals/prices stay out of the public order payload.

## What was implemented
- Added `client_request_id` to orders with a unique branch-scoped partial index.
- Added `clientRequestId` validation to the shared order schema.
- Updated the trusted order creation service to return existing orders for duplicate branch/request IDs and to catch unique constraint races.
- Added persisted cart submission keys that remain stable across retries, reset when the cart changes, and clear after success.
- Added duplicate-submit guarding with a ref on the public payment page.
- Added inline loading and error states for payment-page branch metadata.
- Added a mounted-state hook and used it to prevent persisted cart hydration mismatches on public order and payment pages.

## File-structure or architecture changes made
- Added `src/hooks/use-has-mounted.ts` for reusable client hydration gating.
- Kept idempotency logic in `src/lib/supabase/orders.ts` and route validation in `src/lib/validation/schemas.ts`.
- Kept schema/index ownership in `supabase/01_schema.sql`.

## Tests run
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:api`
- `npm run test:ui` with `NEXT_PUBLIC_APP_URL=http://localhost:3100` and `PORT=3100`
- `npm audit --audit-level=moderate`
- `npm run db:migrate`
- `npm run db:verify`

## Demo data or personas used
- Exercised the public customer persona on Masala Works table 1 using realistic QR cart data.
- Existing demo restaurants still cover tea shop, casual dining, multi-branch enterprise, and cloud kitchen personas.

## Skeleton states added or verified
- Verified public QR menu skeleton replacement under delayed `/api/public/menu` response.
- Added and verified payment-page inline skeleton for branch/payment context while metadata loads.
- Confirmed receipt skeleton still renders after redirected order placement.

## Readability/code-quality cleanup performed
- Kept client payload construction limited to branch/table/customer fields, notes, dish IDs, quantities, and item notes.
- Reused `readApiResponse` instead of open-coded response parsing on the payment page.
- Centralized cart idempotency state in the cart store rather than scattering request keys in components.

## UI/UX and animation checks performed
- Verified desktop, tablet, and mobile public QR ordering and payment layouts.
- Verified mobile fixed action button is reachable and does not cause horizontal overflow.
- Confirmed duplicate-click behavior leaves the submit button disabled while the request is in flight and navigates to receipt once.

## API/query/security checks performed
- Confirmed invalid idempotency keys are rejected before database work.
- Confirmed public order payloads do not include client prices or `unit_price`.
- Confirmed server-side order creation still recalculates totals from branch menu data.
- Confirmed branch-scoped unique index exists for idempotent retries.

## Accessibility, performance, reliability, and production-readiness checks performed
- Preserved form labels, button disabled states, empty cart state, and customer-facing error copy.
- Prevented hydration mismatch for persisted cart totals and items.
- Added retry-safe idempotency for network retry, duplicate click, and browser refresh during submission.
- UI tests inspect network behavior and ensure only one `/api/orders` request is sent during duplicate clicks.

## Remaining risks
- Idempotency is stored on the order row rather than a richer request ledger with processing/failed states.
- Receipt and feedback remain publicly readable/writeable through broad RLS policies and need tighter public-token scoping later.
- Playwright still reports Next.js smooth-scroll warnings, which should be addressed in a UI/accessibility pass.
