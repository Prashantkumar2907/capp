# UI Patterns

## Tokens

`src/app/globals.css` defines semantic CSS variables: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--info`, `--border`, `--input`, and `--ring`.

Use Tailwind semantic classes such as `bg-background`, `text-muted-foreground`, `border-border`, `text-primary`, `bg-card`, `text-destructive`, `text-success`, and `focus-ring`.

## Existing Primitive Style

`src/components/ui/button.tsx` uses `class-variance-authority`, rounded full buttons, `focus-ring`, loading spinner, disabled handling, and lucide icons.

`src/components/ui/dialog.tsx` is custom and already implements modal focus behavior. Preserve that behavior when extending dialogs.

`src/components/ui/loading-patterns.tsx` provides route skeleton compositions for dashboard views, menus, order cards, tables, receipts, and analytics.

## Route State Pattern

Routes that fetch data should expose:

- `loading.tsx` or visible skeletons matching the final layout.
- Empty state with `EmptyState` when no data remains after filters.
- Error state with safe copy and retry/recovery.
- Disabled/loading button state during mutations.

Examples: public order skeletons in `src/app/(public)/order/[branchId]/[tableNumber]/page.tsx`, payment list skeleton/empty state in `src/app/(dashboard)/dashboard/payments/page.tsx`, and dashboard route skeleton helpers in `src/components/ui/loading-patterns.tsx`.

## Motion

Current motion is CSS-based:

- `animate-soft-rise`
- `animate-popover-in`
- `skeleton-shine`
- `transition-colors duration-150`

`framer-motion` is installed in dependencies but is not used in `src`. Prefer existing CSS motion unless a future feature establishes a Framer pattern with tests.
