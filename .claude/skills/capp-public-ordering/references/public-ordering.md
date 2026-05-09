# Public Ordering Reference

## Source Files

Customer menu:
- `src/app/(public)/order/[branchId]/[tableNumber]/page.tsx`
- `src/app/api/public/menu/route.ts`
- `src/lib/supabase/public.ts`

Payment review:
- `src/app/(public)/order/[branchId]/[tableNumber]/payment/page.tsx`
- `src/app/api/orders/route.ts`
- `src/lib/supabase/orders.ts`

Receipt:
- `src/app/(public)/receipt/[orderId]/page.tsx`
- `src/app/api/public/receipt/route.ts`

Shared components/state:
- `src/components/features/cart/cart-panel.tsx`
- `src/components/features/menu/dish-tile.tsx`
- `src/components/features/menu/dish-image.tsx`
- `src/stores/cart-store.ts`

## Performance Budgets

`src/lib/performance/budgets.ts` is the source of truth.

Public QR menu:
- Initial JS budget: 190 KB.
- API P95 budget: 650 ms.
- Duplicate fetch allowance: 0.
- Image budget: 140 KB.
- Must have skeleton, empty, and error states.

Public QR payment:
- Initial JS budget: 200 KB.
- API P95 budget: 750 ms.
- One mutation request per submit intent.
- Must use server totals and server payment status.

## UX Checklist

- Test at desktop, tablet, and mobile widths.
- Confirm 360 px mobile has no horizontal overflow.
- Buttons with only icons need explicit accessible names.
- Dish images need meaningful alt text and fallback for failed media.
- Loading skeletons should match the final layout.
- Empty cart and no-search-results states must be obvious.
- Error states should be helpful but not expose raw provider details.

## Data Trust

The cart store is a convenience only. Treat these as untrusted:
- `unit_price`
- `dish_name`
- `payment status`
- `order total`
- `role`
- `permission`

Server code must re-read current dishes/branch availability and compute totals.

## Tests

Focused checks:

```bash
npm run test:ui -- tests/ui/public-order.spec.ts
npm run test:api
npm run test
```

Full release checks:

```bash
npm run verify
npm run db:verify
```
