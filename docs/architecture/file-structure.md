# CAPP File Structure

CAPP is a production restaurant SaaS. Code should stay close to the route, feature, or shared layer that owns the behavior.

## Application Routes

`src/app/(public)` contains public experiences: the marketing homepage, auth entry pages, OAuth callbacks, QR ordering, payment review, and public receipts. These routes must not assume an authenticated staff profile.

`src/app/(dashboard)` contains authenticated restaurant workspace routes. Pages in this group render inside the dashboard shell and must enforce role-aware navigation and tenant-scoped data access.

`src/app/api` contains server-only API boundaries for public ordering, staff operations, health checks, webhooks, and integration callbacks. API routes must validate inputs, return consistent response shapes, avoid leaking provider details, and never trust client-supplied prices, totals, roles, payment state, or branch ownership.

Every route that fetches data should include a `loading.tsx` skeleton matching the final layout and an error/empty state at the component or route level.

## Components

`src/components/ui` contains reusable atoms and small molecules such as buttons, inputs, cards, badges, dialogs, typed data tables, form fields, skeletons, toasts, switches, tabs, tooltips, and shared loading patterns. UI components should be generic and unaware of restaurant domain rules.

`src/components/layouts` contains app shells and high-level navigation layouts, such as the dashboard shell and future public/auth shells.

`src/components/features/<feature>` contains feature-specific organisms such as the cart panel, dish tiles, kitchen board cards, payment panels, analytics widgets, staff management, and onboarding steps.

`src/components/shared` contains small cross-feature presentational pieces such as page headers, empty states, status badges, and stat cards.

## Application Logic

`src/lib/supabase` contains Supabase browser/server/admin clients, typed query helpers, storage helpers, and database service functions. Prefer this layer for query composition instead of duplicating Supabase calls across pages.

`src/lib/validation` contains Zod schemas and request contracts shared by forms, server actions, and API routes.

`src/lib/constants`, `src/lib/enums`, `src/lib/types`, `src/lib/utils`, and `src/types` contain domain enums, status transitions, typed DTOs, formatting helpers, text helpers, async helpers, and generated or hand-maintained database types. Keep reusable generic primitives in the folder-based shared layers so `@/lib/utils`, `@/lib/enums`, and `@/lib/types` remain stable imports across projects.

`src/lib/performance` contains machine-readable budgets for critical workflows. Add or update budgets when introducing high-traffic customer or staff routes so skeleton, pagination, duplicate-request, image, latency, index, and trust-boundary expectations stay testable.

`src/lib/actions` should be used for server actions that need validation, permission checks, audit logging, or trusted writes.

`src/hooks` contains client hooks that wrap query/cache behavior, realtime subscriptions, and browser-only state. Hooks must clean up subscriptions when role, branch, or tenant context changes.

`src/stores` contains local browser state such as the QR cart. Stores must not be treated as trusted sources for prices, payment state, roles, or permissions.

## Data, Tests, And Operations

`supabase` contains ordered SQL files. Keep schema, functions, policies, storage/realtime setup, and seed data split into named files. Destructive resets are allowed only for local or explicitly disposable demo databases.

`tests/unit`, `tests/api`, `tests/db`, and `tests/ui` keep coverage easy to scan by risk area. Unit tests should target shared utilities/services; API tests should verify response contracts and trust boundaries; UI tests should exercise real customer and staff workflows with loading, empty, and error states.

`scripts` contains repeatable developer automation only. Scripts must avoid printing secrets and should be safe by default against non-local production-like environments.

`docs` contains architecture notes, setup, environment, runbooks, migration order, deployment, rollback, and iteration reports. Product or operational explanations belong here instead of inline code comments.

## Placement Examples

Add a new cashier settlement endpoint in `src/app/api/payments/...`, validate its input with a schema in `src/lib/validation`, enforce trusted writes through a service in `src/lib/supabase` or `src/lib/actions`, and render the cashier UI in `src/components/features/payments`.

Add a new kitchen UI widget in `src/components/features/kitchen`, keep shared badges/buttons in `src/components/ui` or `src/components/shared`, and keep order transition rules centralized in `src/lib/constants` or a domain service.

Add menu mutations behind `src/app/api/menu/...`, validate request bodies in `src/lib/validation`, and keep trusted Supabase writes in `src/lib/supabase/menu-management.ts`. Client menu editors may upload media to public storage, but prices, category ownership, branch availability, and restaurant ownership must be verified server-side.

Add a new migration as the next ordered file in `supabase`, update `src/types/database.ts` if the application reads the new shape, and add a DB or API verification test in `tests`.
