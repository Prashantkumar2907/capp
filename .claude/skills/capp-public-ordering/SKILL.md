---
name: capp-public-ordering
description: Use for CAPP public QR menu, cart, payment review, receipt, customer mobile UX, accessibility, and performance work.
---

# CAPP Public Ordering

Use this skill when changing customer-facing QR ordering, cart state, payment review, public receipts, feedback, or public performance.

## Workflow

1. Read [references/public-ordering.md](references/public-ordering.md).
2. Keep the public ordering flow independent of staff/auth dashboard providers.
3. Preserve one menu request per branch/table cache key and one order mutation per submit intent.
4. Verify mobile responsiveness, no horizontal overflow, loading states, empty states, and error states.
5. Run the focused public UI tests after changes.

## Critical Routes

- `/order/[branchId]/[tableNumber]`
- `/order/[branchId]/[tableNumber]/payment`
- `/receipt/[orderId]`

## Must Preserve

- Server-priced order totals.
- Idempotent order submission.
- Duplicate-click suppression.
- Accessible icon buttons and dish images.
- Resilient image fallback.
- No retries for deterministic public 400/404 query states.
