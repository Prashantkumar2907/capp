# Strict LLM Improvement Loop Command

Use this command with a coding LLM when you want repeated full-application review, implementation, and testing cycles.

```text
Act as a senior Next.js, Supabase, product, QA, performance, security, and UI/UX architect.

You are working inside this repository. Do not only review. Execute the loop below exactly 10 times unless a hard external blocker prevents progress. Treat the app as a real production SaaS for restaurants, not a demo shell. Build, test, and improve the product until it feels usable by real restaurants, staff, and customers.

Hard rules:
- Protect secrets. Never print `.env.local` values or commit credentials.
- Do not commit ignored folders such as `skills/`, `.next/`, `node_modules/`, `playwright-report/`, `test-results/`, or local env files.
- Do not remove user work unrelated to the current task.
- Prefer reusable components, typed utilities, shared enums, service functions, and server-side validation.
- No duplicate API calls when cached/query-backed state can be reused.
- No client-side trust for prices, roles, permissions, or payment status.
- Keep UI accessible, responsive, keyboard usable, and visually consistent in light and dark mode.
- Use subtle animations only where they clarify state changes or improve flow.
- After every implementation pass, run verification and fix failures before moving to the next pass.
- Every feature must have clear loading, empty, success, and error states.
- Every async page, table, card, form, drawer, modal, dashboard widget, and role workflow must use proper skeleton loaders that match the final layout. Do not rely on full-page spinners except for tiny inline actions.
- Every page must be checked at desktop, tablet, and mobile widths.
- Every role must be tested as a real user persona, not only by reading code.
- Demo data must look believable enough for sales, QA, and product review.
- Images/media must load, have fallbacks, and not break layout or performance.
- Query/API behavior must be checked for duplicate requests, avoidable waterfalls, missing indexes, and unsafe trust boundaries.
- Do not add implementation comments, commented-out code, or obvious narration in the codebase. Make code readable through clear names, small functions, typed helpers, reusable components, and simple control flow.
- Add documentation only in docs or README files unless a public API/function is genuinely hard to understand without a short docstring.
- Maintain a clean, explainable file structure. New files must live in the correct layer: routes in `src/app`, reusable UI in `src/components/ui`, feature UI in `src/components/features`, layouts in `src/components/layouts`, shared domain logic in `src/lib`, hooks in `src/hooks`, SQL in `supabase`, tests in `tests`, scripts in `scripts`, and product/architecture docs in `docs`.
- Do not place business logic directly inside page components when it belongs in services, actions, hooks, validation schemas, or reusable utilities.
- Keep server/client boundaries clear. Prefer server components and server actions for trusted work; use client components only for interactivity, browser APIs, optimistic UI, or realtime subscriptions.

Demo and testing data requirements:
- Create or improve seed/demo data for at least 4 restaurant types:
  - small cafe or tea shop on starter plan
  - casual dining restaurant on growth/pro plan
  - multi-branch restaurant on pro/enterprise plan
  - cloud kitchen or takeaway-first restaurant
- Include realistic branches, tables, categories, dishes, prices, prep times, veg/non-veg flags, item availability, orders, payments, subscriptions, feedback, and activity logs.
- Include realistic role coverage for owner, admin, manager, waiter, kitchen, and cashier.
- Include dish images or stable image placeholders with accessible alt text, public storage paths, and graceful fallback states.
- Use this demo data to test dashboards, QR ordering, kitchen, waiter POS, cashier payments, analytics, staff, menu, tables, branches, settings, and receipts.
- Never seed real personal data, real payment credentials, or real customer identifiers.

Architecture and file-structure requirements:
- Keep the App Router structure predictable:
  - `src/app/(public)` for public marketing, QR ordering, auth entry, and callback routes.
  - `src/app/(dashboard)` for authenticated restaurant workspace routes.
  - `src/app/api` for server-only API endpoints, webhooks, and integration boundaries.
  - each route that fetches data should have appropriate `loading.tsx`, `error.tsx`, and empty-state handling where relevant.
- Keep reusable UI small and composable:
  - `src/components/ui` for atoms such as buttons, inputs, cards, badges, dialogs, tables, skeletons, toasts, switches, tabs, and tooltips.
  - `src/components/layouts` for app shell, dashboard shell, auth shell, public shell, sidebars, navbars, and role-aware navigation.
  - `src/components/features/<feature>` for feature-specific organisms such as menu editor, kitchen board, QR ordering cart, payment panel, staff management, analytics widgets, and onboarding steps.
- Keep shared application logic out of components:
  - `src/lib/supabase` for browser client, server client, admin client, auth helpers, storage helpers, and typed DB services.
  - `src/lib/actions` for server actions with validation and permission checks.
  - `src/lib/validation` for schemas and form contracts.
  - `src/lib/types`, `src/lib/enums`, `src/lib/constants`, and `src/lib/utils` for reusable typed primitives.
  - `src/hooks` for client state hooks that avoid duplicate requests and wrap query/cache behavior.
- Keep data and operations traceable:
  - `supabase/*.sql` should be split into ordered, named migration/seed/policy/storage/realtime files.
  - `scripts` should contain only repeatable developer automation.
  - `tests/unit`, `tests/api`, `tests/db`, and `tests/ui` should make coverage easy to understand.
- Maintain or create `docs/architecture/file-structure.md` explaining every important folder, when to add files there, and examples of correct placement.
- When refactoring structure, update imports, tests, and docs in the same loop.

Production-readiness requirements:
- Security and access control:
  - enforce RBAC in both Supabase RLS and server-side code
  - verify every organization, branch, table, order, menu item, staff member, payment, and subscription query is tenant-scoped
  - validate all inputs with shared schemas before database writes
  - never trust client-provided totals, discounts, taxes, service charges, roles, permissions, branch IDs, payment status, or webhook payloads
  - include webhook signature verification, replay protection, idempotency keys, and safe retry behavior
  - add rate-limit readiness for auth, public QR ordering, payment creation, webhooks, and write-heavy APIs
  - check CORS, security headers, cookie settings, redirects, session expiry, sign-out, and protected-route behavior
  - ensure no secret, token, private key, service role key, database password, or customer PII is logged, rendered, committed, or exposed to the client bundle
- Data integrity and database quality:
  - use constraints, enums/checks, foreign keys, indexes, unique rules, created/updated timestamps, soft-delete fields where useful, and audit logs for important actions
  - verify migrations are repeatable, ordered, documented, and safe to run on a fresh database
  - verify seed data is deterministic and can be reset without damaging real environments
  - handle concurrent order edits, payment settlement races, kitchen status updates, stock availability changes, and duplicate submissions
  - add transaction boundaries or RPC functions where multi-table writes must succeed or fail together
  - include backup/restore notes and rollback guidance in docs
- Restaurant operations completeness:
  - support configurable taxes, service charge, discounts, tips, rounding, currency, timezone, business hours, table status, menu availability windows, and item out-of-stock behavior
  - support order lifecycle states from draft/cart through placed, accepted, preparing, ready, served, paid, cancelled, refunded, and failed where relevant
  - support dine-in QR, waiter-assisted ordering, takeaway, cloud-kitchen pickup, kitchen display, cashier settlement, receipts, and manager override flows
  - include cancellation/refund rules, payment failure recovery, duplicate payment prevention, split/partial payment readiness, and receipt reprint behavior
  - include staff invitation/onboarding, role changes, branch assignment, disabled staff access, and owner/admin safeguards
- UX, accessibility, and product quality:
  - meet WCAG AA basics: keyboard navigation, visible focus, contrast, semantic landmarks, labels, aria for dynamic regions, dialog focus trapping, and screen-reader friendly empty/error/loading states
  - support reduced motion, responsive layouts from small mobile to large desktop, touch targets, safe-area insets, and no horizontal overflow
  - use consistent information hierarchy, predictable primary actions, non-destructive defaults, confirmation for destructive actions, and undo/recovery where useful
  - include realistic microcopy for errors, empty states, confirmations, receipts, payment failures, permission denials, and offline/network problems
  - ensure skeletons do not cause layout shift and match the final UI shape
  - verify images are optimized, lazy-loaded where appropriate, accessible, cached, and resilient to broken URLs
- Performance and scalability:
  - set performance budgets for key pages and avoid unnecessary client components
  - prevent request waterfalls, duplicate fetches, unstable cache keys, over-fetching, and N+1 queries
  - paginate, filter, sort, and search server-side for large lists
  - use appropriate caching, revalidation, realtime subscriptions, optimistic updates, and invalidation strategies
  - inspect bundle size, image weight, database query plans for hot paths, and API latency for key flows
  - ensure realtime subscriptions are cleaned up and do not leak across role/branch changes
- Reliability and failure handling:
  - handle network failures, slow Supabase responses, expired sessions, permission changes during a session, duplicate clicks, browser refreshes mid-flow, and webhook retries
  - add idempotent writes for order creation, payment creation, webhook processing, and status transitions
  - show graceful degradation when realtime, storage images, payment provider, or analytics data is unavailable
  - include clear retry behavior and prevent stuck loading states
- Observability and operations:
  - add safe server logs around critical failures without secrets or PII
  - document monitoring hooks for errors, API failures, payment failures, webhook failures, slow queries, and auth issues
  - include health-check or smoke-test readiness where practical
  - add runbooks for migration, seeding, webhook setup, OAuth setup, Razorpay setup, Supabase storage setup, deployment, rollback, and incident triage
- Developer experience and maintainability:
  - keep TypeScript strict, avoid `any` unless isolated and justified, and prefer typed DTOs/results
  - keep domain enums/status transitions centralized
  - keep components under control by extracting reusable pieces when behavior repeats
  - keep tests deterministic, fast, and readable with clear fixtures
  - update README/docs whenever setup, scripts, env vars, migrations, roles, or workflows change
  - make CI-ready scripts available for lint, typecheck, build, unit tests, API tests, UI tests, DB verification, and audit

For each loop from 1 to 10:
1. Inspect the whole application structure, routes, components, API routes, Supabase SQL, docs, and tests.
2. Identify missing or weak implementation areas across:
   - file structure, route grouping, server/client boundaries, module ownership, and architecture documentation
   - roles and permissions
   - owner/admin/manager/waiter/kitchen/cashier workflows
   - public QR ordering
   - kitchen display
   - payments and Razorpay webhook readiness
   - menu, branch, staff, table management
   - onboarding, auth, OAuth readiness
   - analytics and operational insights
   - loading states, skeletons, empty states, errors, toasts
   - skeleton coverage across route loading files, dashboards, tables, cards, forms, modals, public QR ordering, kitchen display, and payment flows
   - UI/UX hierarchy, spacing, responsiveness, dark mode, animation quality
   - code readability, naming, module boundaries, reusable functions, comments, commented-out code, and avoidable complexity
   - Supabase schema, RLS, indexes, storage, realtime, and seed data
   - API design, validation, security, and duplicate request prevention
   - API response shapes, latency, pagination, caching, and error consistency
   - query optimization, indexes, N+1 patterns, realtime subscriptions, and cache invalidation
   - testing coverage and developer docs
   - demo restaurants, demo roles, demo images, and seed realism
   - button placement, card density, navigation ergonomics, form friction, and action discoverability
   - animation timing, reduced-motion friendliness, route transitions, modals, hover/press feedback, and skeleton motion
   - production readiness: logging boundaries, security, rate-limit readiness, webhook resilience, idempotency, observability, and deploy configuration
   - accessibility, keyboard navigation, focus states, contrast, screen-reader behavior, reduced motion, and touch target quality
   - operational edge cases: duplicate clicks, expired sessions, branch switching, item out of stock, payment failure, webhook retry, order cancellation, refund readiness, and staff access removal
   - business configuration: taxes, service charges, discounts, currency, timezone, business hours, menu availability, invoice/receipt numbering, and plan limits
   - reliability and maintainability: transaction boundaries, deterministic seeds, rollback docs, health checks, logs, runbooks, CI readiness, and dependency risk
3. Rank findings by:
   - user impact
   - revenue/business impact
   - role/workflow coverage
   - security risk
   - implementation risk
   - testability
   - production-readiness gap
4. Implement the highest-value improvements for that loop. Prefer one coherent production improvement per loop over many shallow edits.
   - If the highest-value issue is structural, refactor toward the documented architecture before adding more features.
5. Add or update tests for the behavior changed. Include unit, API, DB, and UI tests where relevant.
   - For UI changes, test loading skeletons with delayed/mock responses and verify skeletons are replaced by real content.
   - For shared code, test readable reusable utilities/services instead of duplicating logic inside pages.
6. Run automated product checks:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`
   - `npm run test:api`
   - `npm run test:ui`
   - `npm audit --audit-level=moderate`
7. If database connectivity is available, also run database checks:
   - `npm run db:migrate`
   - `npm run db:verify`
8. Run manual/browser QA for the most important changed flow:
   - inspect the page in the browser
   - check desktop and mobile screenshots or DOM state
   - verify primary buttons are visible and reachable
   - verify cards/tables/forms do not overflow or overlap
   - verify skeletons, empty states, toasts, dialogs, and disabled states
   - use slow-network or delayed-response checks where possible so skeleton loaders can be visually inspected
   - verify light and dark mode if the changed area is visual
9. Exercise at least one role or customer flow with demo data:
   - owner/admin/manager management flow
   - waiter order creation
   - kitchen order progression
   - cashier payment settlement
   - customer QR order and receipt
   Rotate the flow each loop so all roles are covered by loop 10.
10. Inspect network/API behavior for the changed flow:
   - no duplicate fetches caused by poor component structure
   - no client-trusted prices or payment status
   - consistent error responses
   - sensible cache invalidation
   - indexes exist for new filters or joins
   - safe behavior for retries, duplicate clicks, expired sessions, permission denial, and slow responses
11. Fix every failure introduced by the loop.
12. Write a short loop report in `docs/iteration-reports/loop-N.md` with:
   - what was inspected
   - what was missing or weak
   - what was implemented
   - file-structure or architecture changes made
   - tests run
   - demo data or personas used
   - skeleton states added or verified
   - readability/code-quality cleanup performed
   - UI/UX and animation checks performed
   - API/query/security checks performed
   - accessibility, performance, reliability, and production-readiness checks performed
   - remaining risks
13. Commit that loop with message:
   `Improve CAPP loop N`

After loop 10:
- Run the full verification suite one final time.
- Confirm all six staff roles and the public customer persona were exercised.
- Confirm demo restaurants and images/media are production-looking and resilient.
- Confirm skeleton loaders, empty states, errors, toasts, dialogs, forms, tables, and cards are consistent across the app.
- Confirm RBAC, RLS, tenant scoping, webhook idempotency, server-side totals, payment trust boundaries, and secret handling are verified.
- Confirm accessibility, responsive behavior, reduced motion, keyboard navigation, and light/dark mode are production quality.
- Confirm performance budgets, duplicate request checks, pagination/search/sort behavior, query indexes, and realtime cleanup are reviewed.
- Confirm docs include setup, env vars, file structure, Supabase migration order, OAuth, storage, Razorpay, demo data, testing, deployment, rollback, and runbooks.
- Confirm no secrets or ignored artifacts are staged.
- Summarize completed improvements, blocked items, remaining product gaps, and next recommended product bets.
- Push the branch only if all non-external checks pass and credentials are available.
```
