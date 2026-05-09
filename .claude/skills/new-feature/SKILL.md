---
name: new-feature
description: Use for adding CAPP features that cross route, API, Supabase service, state, UI, test, docs, or database layers.
---

# New Feature

## When to use this skill
Use when starting any feature that touches more than one layer, especially customer ordering, staff dashboard operations, platform admin, payment, menu, table, branch, staff, or subscription flows.

## Quick reference
1. Identify persona and domain rule in `docs/product-understanding.md` and `src/lib/constants.ts`.
2. Choose placement with `docs/architecture/file-structure.md`.
3. Add/extend schemas in `src/lib/validation/schemas.ts`.
4. Put trusted work in `src/lib/supabase`.
5. Add API routes beside existing handlers such as `src/app/api/orders/route.ts` when client mutation or trusted read is needed.
6. Build UI from `src/components/ui`, `src/components/shared`, and `src/components/features`.
7. Add TanStack Query/Zustand/realtime state only where existing patterns require it.
8. Update SQL/RLS/types if data shape changes.
9. Add tests in `tests/unit`, `tests/api`, and/or `tests/ui`.
10. Update docs/runbooks/performance budgets when the workflow becomes critical.

## End-to-end checklist
Follow `references/feature-checklist.md` before editing.

## Project-specific gates
- Trust boundary: never accept client-supplied price, total, role, payment state, subscription status, or tenant scope.
- UX states: loading, empty, error, disabled/pending mutation, desktop/tablet/mobile.
- Performance: check `src/lib/performance/budgets.ts` for route budgets and indexed hot paths.
- Security: check `supabase/03_rls.sql` and API permission helpers before exposing data.

## Do not
- Do not start with UI only when the feature has trusted writes.
- Do not duplicate business rules between pages and services.
- Do not add a new feature route without tests for validation, roles, or critical UI states.
- Do not update seed/demo data with real customer/payment/person data.
