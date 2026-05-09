# CLAUDE.md

## Project
CAPP is a production restaurant operations SaaS for QR ordering, waiter POS, kitchen display, cashier settlement, staff/branch management, analytics, receipts, demo sales, and platform subscription administration.
Stack: TypeScript 5.9.3 · Next.js 16.2.5 App Router · React 19.2.4 · Supabase SSR/Auth/Postgres/RLS · Tailwind CSS 4.2.2/shadcn-style UI · TanStack Query 5.96.0/Zustand 5.0.12 · node:test/Playwright 1.59.1

## Commands
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `npm run dev` |
| Dev for Playwright | `npm run dev -- --webpack` |
| Build | `npm run build` |
| Start built app | `npm run start` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | Not configured |
| Test (unit) | `npm run test` |
| Test (api) | `npm run test:api` |
| Test (e2e) | `npm run test:ui` |
| Test (single unit) | `node --import tsx --test tests/unit/order-status.test.ts` |
| Test (single UI) | `npx playwright test tests/ui/public-order.spec.ts` |
| Test (watch) | Not configured |
| DB migrate | `npm run db:migrate` |
| DB verify | `npm run db:verify` |
| Full local verify | `npm run verify` |
| CI-style verify | `npm run verify:ci` |
| Demo accounts | `npm run demo:accounts` |

## Structure
`src/app/(public)` - unauthenticated homepage, auth, QR ordering, payment review, receipts.
`src/app/(dashboard)` - authenticated tenant dashboard routes inside `DashboardShell`.
`src/app/admin` - platform-owner console; must authorize through platform-admin APIs.
`src/app/api` - route handlers for public, staff, platform, health, and Razorpay webhook boundaries.
`src/components/ui` - generic shadcn-style primitives owned in-repo.
`src/components/features` - feature organisms such as cart, dish tiles, order cards.
`src/components/shared` - cross-feature presentation: headers, empty states, stats, toasts, badges.
`src/features/auth` - client auth context, staff/org/branch hydration, role access helper.
`src/lib/supabase` - Supabase clients, service functions, trusted mutation/query logic.
`src/lib/validation` - Zod request/form contracts and inferred input types.
`src/lib/performance` - machine-readable critical route budgets.
`supabase` - ordered SQL schema, functions, RLS, storage/realtime, seed.
`tests` - unit, API contract, DB verification, and Playwright UI coverage.
`docs` - setup, architecture, env, testing, performance, deployment, runbooks.

## Code Rules
- Treat the client as untrusted for prices, totals, roles, tenant scope, payment state, subscription state, and branch ownership.
- Validate API input with Zod schemas from `src/lib/validation/schemas.ts`; return `apiOk`, `apiError`, or `apiValidationError`.
- Use service-role Supabase only from server-side files under API/service boundaries; browser code uses `createClient()`.
- Add `loading.tsx` skeletons and recoverable error UI for route-level data fetching changes.
- Keep docs in `docs`; code comments are sparse and only for non-obvious logic.

### File Placement
- New public routes go under `src/app/(public)`; staff routes under `src/app/(dashboard)/dashboard`; platform routes under `src/app/admin`.
- New route handlers follow existing domains such as `src/app/api/orders/route.ts` and delegate trusted work to `src/lib/supabase`.
- New shared UI primitives go in `src/components/ui`; reusable presentation in `src/components/shared`; domain UI follows existing folders like `src/components/features/cart`.
- New schemas and inferred input types go in `src/lib/validation/schemas.ts`.
- New hooks go in `src/hooks`; local browser stores go in `src/stores`; reusable domain constants go in `src/lib/constants.ts`.
- Files use kebab-case; React components and exported types use PascalCase; functions/variables use camelCase.

### Code Style
- Prefer small typed functions, `async`/`await`, early returns, and `Promise.all` for independent queries.
- Use `type` aliases for result unions like `{ ok: true } | { ok: false; status; code; message }`.
- Surface safe user messages and stable error codes; do not expose raw provider/database errors to the browser.
- Keep trusted business rules in service files such as `src/lib/supabase/orders.ts`, not inline in pages.

### UI / UX
- Style with Tailwind classes and CSS variables from `src/app/globals.css`; do not introduce another styling system.
- Use lucide icons and existing `src/components/ui` primitives before adding new UI.
- Current animation pattern is CSS keyframes/classes plus `prefers-reduced-motion`; Framer Motion is installed but unused in `src`.
- Preserve desktop/tablet/mobile coverage and avoid horizontal overflow at public QR widths.
- Dialogs and controls need labels, focus handling, keyboard escape/tab behavior, visible loading, empty, and error states.

### State
- Server state belongs in TanStack Query with scoped query keys and invalidation after mutations.
- Local durable cart state is Zustand persist in `src/stores/cart-store.ts`; never trust it for prices or totals.
- `useState` is enough for transient filters, dialogs, forms, and page controls unless state crosses routes/features.
- Realtime order subscriptions must clean up on branch changes and avoid duplicate refreshes.

### API Layer
- Pattern: route handler parses JSON/query params -> Zod `safeParse` -> service function -> `apiOk`/`apiError`.
- Never bypass server services for order creation, payment settlement, platform admin, staff, branch, table, or dish writes.
- Use `readApiResponse()` in client mutations so API error codes/messages become safe UI toasts.

### Auth & Security
- `src/proxy.ts` refreshes Supabase SSR cookies and redirects unauthenticated protected routes to `/sign-in`.
- `AuthProvider` loads user, staff, organization, branch, role, and `canAccess()` for client navigation.
- Staff route handlers call `getActiveStaffContext()` and role helpers; platform routes call platform-admin service checks.
- Only `NEXT_PUBLIC_*` env vars may reach the browser; never log `.env.local`, service-role keys, Razorpay secrets, or customer/payment identifiers.

### Testing
- Unit tests cover utilities, service rules, validation, RLS/performance contracts, route readiness, and motion/accessibility.
- API contract tests validate bad inputs and trust boundaries before database work.
- Playwright tests cover public QR loading, responsive content, reduced motion, and duplicate-click order suppression.
- Update tests when changing status transitions, schemas, RLS policies, budgets, API contracts, auth, or critical UI states.

### Git
- Recent history uses concise Conventional Commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `perf:`.
- Prefer small PRs scoped to one route/domain/service change plus tests/docs.
- Never force-push to `main`, `master`, or `develop`.

## Skills
| Skill | When to load |
| --- | --- |
| architecture | Adding files, routes, modules, or unsure where behavior belongs |
| api-conventions | Adding or modifying route handlers, API payloads, or service functions |
| ui-conventions | Building or editing UI components, route states, responsive layout, or animation |
| state-management | Working with TanStack Query, Zustand cart state, auth context, or realtime orders |
| auth | Touching sign-in, proxy redirects, staff roles, platform admin, guards, or permissions |
| testing | Writing/running unit, API, DB, or Playwright checks |
| new-feature | Starting a cross-layer feature from route/API/state/UI/test/docs |
| deployment | Building, releasing, env setup, migrations, smoke tests, or rollback |
| performance | Profiling critical routes, budgets, pagination, caching, or duplicate fetches |
| database-rls | Changing schema, migrations, RLS, storage, realtime, or indexes |
| domain-restaurant-operations | Touching ordering, menu, tables, payments, subscriptions, staff roles, or demos |
| commit-messages | Writing commit messages or PR descriptions |
