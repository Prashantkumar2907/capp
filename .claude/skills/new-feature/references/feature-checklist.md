# Feature Checklist

## Discovery

- Persona: public customer, owner, admin, manager, waiter, kitchen, cashier, or platform admin.
- Route group: `src/app/(public)`, `src/app/(dashboard)/dashboard`, or `src/app/admin`.
- Domain invariants: check `src/lib/constants.ts`, `src/lib/supabase/order-status.ts`, `src/lib/supabase/payments.ts`, and `docs/product-understanding.md`.

## Data Contract

- Add or update Zod schema in `src/lib/validation/schemas.ts`.
- Add inferred type export if a service consumes the input.
- Update `src/types/database.ts` if schema changes.

## Trusted Boundary

- Route handlers such as `src/app/api/orders/route.ts` and `src/app/api/payments/[paymentId]/settle/route.ts` validate input and delegate.
- Services such as `src/lib/supabase/orders.ts` and `src/lib/supabase/payments.ts` use `createAdminSupabase()` only server-side.
- Staff operations call `getActiveStaffContext()` and role/domain checks.
- Platform operations call platform-admin checks.

## UI

- Reuse `src/components/ui/button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `skeleton.tsx`, `switch.tsx`, `textarea.tsx`, `pagination.tsx`, and shared components where applicable.
- Add domain components under `src/components/features` only when reused or too large for a page.
- Add route `loading.tsx`/`error.tsx` or component-level skeleton/error/empty states.

## State

- Use TanStack Query for server data.
- Use local `useState` for filters/dialogs/forms.
- Use `src/hooks/use-pagination.ts` for client pagination only when data size is bounded or current route already uses it.
- Use realtime only through cleanup-safe hooks.

## Tests And Docs

- Unit test pure rules/utilities/schema effects.
- API contract test invalid payloads and permission/trust boundary behavior.
- Playwright test public/customer-critical or role-critical UI flow.
- Update `docs/performance.md` and `src/lib/performance/budgets.ts` for new critical routes.
- Update `docs/deployment.md` or runbooks if release steps/env/integrations change.
