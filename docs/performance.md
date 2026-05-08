# Performance Budgets

These budgets guide implementation and QA for the production restaurant workflows.

## Key Pages
- Public QR menu: first useful menu content within 2.5 seconds on a typical 4G device after the API responds, no horizontal overflow at 360 px, and no more than one menu request per branch/table cache key.
- Public payment: one order creation request per submit attempt, duplicate clicks suppressed, receipt navigation within 1 second after API success.
- Dashboard overview: summary query window defaults to 7 days and selects only chart/stat columns; cards and recent order list render without layout shift.
- Analytics: selectable 7, 14, and 30 day windows use branch/date indexes and chart-ready summary data rather than client-side full-row aggregation.
- Kitchen display: realtime subscriptions must be cleaned up on branch changes and status PATCH responses should update local state without a duplicate manual refetch.

## Data Access
- Branch/date hot paths need composite indexes for orders, order items, payments, and feedback.
- Large operational lists should be paginated or range-limited before adding new filters.
- Client components should reuse query-backed state and stable query keys instead of issuing duplicate API calls for the same branch workflow.
- Public clients must never submit trusted totals, item prices, payment status, roles, or permission decisions.

## Browser QA
- Check desktop, tablet, and mobile widths for every changed customer or staff flow.
- Use delayed mocked responses for skeleton inspection.
- Watch network requests for duplicate fetches, avoidable waterfalls, and repeated mutations.
- Verify reduced-motion behavior when adding animation or route transition effects.
