---
name: state-management
description: Use for CAPP TanStack Query cache keys, Zustand cart persistence, auth context, pagination, and realtime order state.
---

# State Management

## When to use this skill
Use when changing query keys, cache invalidation, mutations, local cart state, auth context, form/page state, pagination, or realtime subscriptions.

## Quick reference
| State type | Existing pattern |
| --- | --- |
| Server state | TanStack Query in client pages |
| Query defaults | `src/components/shared/providers.tsx` staleTime 30000, retry 1, no refetch on focus |
| Local durable cart | Zustand persist in `src/stores/cart-store.ts` |
| Auth/session profile | React context in `src/features/auth/auth-provider.tsx` |
| Realtime orders | `src/hooks/use-realtime-orders.ts` |
| Client pagination | `src/hooks/use-pagination.ts` |
| Page controls | `useState` in pages for filters/dialogs/forms |

## Server state
Use scoped query keys that include tenant identifiers such as `branch?.id`, `organization?.id`, route params, or filters. Invalidate broad domain roots after mutations only when existing pages do so, such as `["menu"]`, `["payments"]`, or `["dashboard-summary"]`.

Client mutations should call API routes for trusted writes, then invalidate relevant queries and show a toast.

## Local state
Use `useState` for search filters, category/status filters, dialogs, edit forms, and pending buttons. Use `usePagination()` for client-side pagination of already-loaded rows.

Use Zustand only for browser-persistent cart context and items. The cart stores `branchId`, `tableNumber`, `submissionKey`, and item intent; server code recalculates prices and totals.

See `references/state-patterns.md` for examples.

## Realtime
`useRealtimeOrders()` subscribes to `orders` and `order_items` by branch, cleans channels on branch changes, queues refreshes while one is in flight, and exposes `applyStatusUpdate()` for local optimistic status alignment.

## Do not
- Do not add global state for data TanStack Query can own.
- Do not treat Zustand cart values as trusted totals or menu prices.
- Do not subscribe to realtime without cleanup.
- Do not use unscoped query keys for tenant data.
