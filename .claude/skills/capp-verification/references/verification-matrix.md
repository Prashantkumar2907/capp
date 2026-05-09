# Verification Matrix

## Static And Build

Run after TypeScript, routing, import, or config changes:

```bash
npm run typecheck
npm run lint
npm run build
```

## Unit Tests

Run after utility, role, performance-budget, validation, realtime, payment, docs-readiness, or schema-index logic changes:

```bash
npm run test
```

## API Tests

Run after API route, validation schema, Supabase service, auth, webhook, payment, onboarding, platform, table, staff, menu, order, or health changes:

```bash
npm run test:api
```

## UI Tests

Run after public route, auth form, QR ordering, payment review, mobile responsiveness, loading state, reduced-motion, or duplicate-click changes:

```bash
npm run test:ui
```

## Database Verification

Run after SQL, RLS, storage, realtime, index, schema, or DB connectivity changes:

```bash
npm run db:verify
```

## Security/Audit

Run after dependency or package-lock changes:

```bash
npm run audit:moderate
```

## Full Gates

Use for release-ready confidence:

```bash
npm run verify
npm run verify:ci
```

`verify:ci` includes database verification.

## Manual QA Rotation

When credentials/disposable data are available:

1. Owner signs up and completes onboarding.
2. Admin checks branch/staff management.
3. Manager checks menu, tables, orders, kitchen, payments, analytics.
4. Waiter creates an order.
5. Kitchen progresses the order.
6. Cashier settles payment.
7. Customer places a QR order, opens receipt, and sends feedback.

## Performance Evidence

For public QR work, collect:
- Number of `/api/public/menu` calls.
- Payload bytes.
- Initial script transfer size.
- Horizontal overflow at mobile width.
- Duplicate mutation count on submit.
