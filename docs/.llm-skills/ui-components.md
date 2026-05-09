# UI Component Pattern

Use this before changing CAPP screens or shared UI.

## Files

- Global theme/motion: `src/app/globals.css`
- Providers: `src/components/shared/providers.tsx`
- Dashboard shell: `src/components/layouts/dashboard-shell.tsx`
- UI primitives: `src/components/ui`
- Feature components: `src/components/features`
- Shared display components: `src/components/shared`

## Rules

- Every user-facing route should handle loading, empty, error, and success states.
- Prefer existing primitives: `Button`, `Card`, `Dialog`, `Input`, `Select`, `Skeleton`, `Pagination`, `EmptyState`, `PageHeader`, `StatCard`, and `RouteErrorState`.
- For page-level data fetch failures, prefer `EmptyState` or `RouteErrorState` with safe copy over raw provider error text.
- Use lucide icons in icon buttons and user actions.
- Keep operational SaaS screens compact and scannable. Avoid marketing-style hero layouts inside the dashboard.
- Keep `/admin` similarly operational: portfolio stats, customer rows, pending user rows, grant/onboarding dialogs, and concise status badges.
- Use subtle motion from existing CSS classes such as `animate-soft-rise` and `animate-popover-in`.
- Respect `prefers-reduced-motion`; global CSS already reduces animation and transition duration.
- Keep cards for repeated items, dialogs, and framed tools. Do not nest cards inside cards.
- Keep text sizes modest inside dashboard panels and avoid viewport-scaled font sizes.

## Verification

- Check desktop, tablet, and mobile widths for changed customer/staff flows.
- Watch for horizontal overflow at 360px.
- Confirm buttons have accessible names and loading actions disable duplicate requests.
- When moving a direct Supabase mutation behind an API route, update the UI to use `readApiResponse` so toast copy remains consistent with the shared server error contract.
- Platform admin UI should call `/api/platform/*`, use loading skeletons, an explicit forbidden/error empty state, empty customer/pending-user states, and success toasts after grants/onboarding.
