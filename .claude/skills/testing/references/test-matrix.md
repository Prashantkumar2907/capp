# Test Matrix

## Existing Unit Coverage

`tests/unit/order-status.test.ts` covers role-based order transitions and item status derivation.

`tests/unit/performance-budgets.test.ts` verifies critical route budget IDs, persona coverage, skeleton/empty/error requirements, duplicate fetch limits, trust boundaries, and matching DB indexes.

`tests/unit/rls-hardening.test.ts` reads SQL to ensure anonymous clients cannot directly read/write order/payment tables, RLS helpers pin `search_path`, image writes are role-limited, and platform admin tables are not broadly exposed.

`tests/unit/accessibility-motion.test.ts` checks reduced-motion CSS and dialog accessibility hooks.

Other unit files cover access, dashboard summary, indexes, demo accounts, docs readiness, route loading/error readiness, media, order validation, pagination/PWA, payments, platform admin, realtime orders, utilities, and waiter flow.

## API Contracts

`tests/api/orders-contract.test.ts` verifies invalid order payloads and unsafe idempotency keys return `VALIDATION_ERROR` before database work.

`tests/api/payments-contract.test.ts` verifies malformed IDs and Razorpay signature/replay protections.

Other API contracts cover auth, management, menu, onboarding, order status, platform, public, smoke, and tables.

## UI

`tests/ui/public-order.spec.ts` mocks public menu/receipt/order APIs, checks skeleton replacement, no horizontal overflow, idempotent duplicate-click submission, and trusted payload shape without prices.

`tests/ui/public.spec.ts` covers public route behavior.

## Verification

`npm run verify` runs lint, typecheck, build, unit tests, API tests, UI tests, and moderate audit.

`npm run verify:ci` adds `npm run db:verify`, which requires `DATABASE_URL`.
