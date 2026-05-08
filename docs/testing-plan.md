# Testing Plan

## Static Checks

```bash
npm run typecheck
npm run lint
npm run build
npm run audit:moderate
```

## Unit Tests

```bash
npm run test
```

Covers money calculations, UPI links, formatting utilities, and role access expectations.

## Database Tests

```bash
npm run db:migrate
npm run db:verify
```

Database verification checks required tables and RLS status.

## API Tests

```bash
npm run test:api
```

The smoke test calls the Supabase-backed health route.

## UI Tests

```bash
npm run test:ui
```

Playwright starts the local Next.js app, checks the landing page, auth form, and runs desktop plus mobile projects.

The configured projects cover desktop, tablet, and mobile widths. Public QR tests verify delayed skeleton replacement, duplicate-click order submission, trusted order payload shape, and reduced-motion scroll behavior.

## Aggregate Checks

```bash
npm run verify
npm run verify:ci
```

`verify` runs lint, typecheck, build, unit tests, API tests, UI tests, and moderate audit. `verify:ci` also runs database verification.

## Manual Role QA

1. Owner signs up, completes onboarding, and checks dashboard, branches, staff, menu, tables, analytics, settings.
2. Admin verifies branch and staff management.
3. Manager verifies menu availability, tables, orders, kitchen, payments, analytics.
4. Waiter creates a table order from `/dashboard/waiter`.
5. Kitchen moves the same order through accepted, preparing, ready.
6. Cashier marks payment completed in `/dashboard/payments`.
7. Customer uses `/order/[branchId]/[tableNumber]`, places an order, opens receipt, and sends feedback.

Rotate these personas in manual QA so owner/admin/manager/waiter/kitchen/cashier and the public customer are all exercised before release.
