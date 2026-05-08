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
- Every page must be checked at desktop, tablet, and mobile widths.
- Every role must be tested as a real user persona, not only by reading code.
- Demo data must look believable enough for sales, QA, and product review.
- Images/media must load, have fallbacks, and not break layout or performance.
- Query/API behavior must be checked for duplicate requests, avoidable waterfalls, missing indexes, and unsafe trust boundaries.

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

For each loop from 1 to 10:
1. Inspect the whole application structure, routes, components, API routes, Supabase SQL, docs, and tests.
2. Identify missing or weak implementation areas across:
   - roles and permissions
   - owner/admin/manager/waiter/kitchen/cashier workflows
   - public QR ordering
   - kitchen display
   - payments and Razorpay webhook readiness
   - menu, branch, staff, table management
   - onboarding, auth, OAuth readiness
   - analytics and operational insights
   - loading states, skeletons, empty states, errors, toasts
   - UI/UX hierarchy, spacing, responsiveness, dark mode, animation quality
   - Supabase schema, RLS, indexes, storage, realtime, and seed data
   - API design, validation, security, and duplicate request prevention
   - API response shapes, latency, pagination, caching, and error consistency
   - query optimization, indexes, N+1 patterns, realtime subscriptions, and cache invalidation
   - testing coverage and developer docs
   - demo restaurants, demo roles, demo images, and seed realism
   - button placement, card density, navigation ergonomics, form friction, and action discoverability
   - animation timing, reduced-motion friendliness, route transitions, modals, hover/press feedback, and skeleton motion
   - production readiness: logging boundaries, security, rate-limit readiness, webhook resilience, idempotency, observability, and deploy configuration
3. Rank findings by:
   - user impact
   - revenue/business impact
   - role/workflow coverage
   - security risk
   - implementation risk
   - testability
4. Implement the highest-value improvements for that loop. Prefer one coherent production improvement per loop over many shallow edits.
5. Add or update tests for the behavior changed. Include unit, API, DB, and UI tests where relevant.
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
11. Fix every failure introduced by the loop.
12. Write a short loop report in `docs/iteration-reports/loop-N.md` with:
   - what was inspected
   - what was missing or weak
   - what was implemented
   - tests run
   - demo data or personas used
   - UI/UX and animation checks performed
   - API/query/security checks performed
   - remaining risks
13. Commit that loop with message:
   `Improve CAPP loop N`

After loop 10:
- Run the full verification suite one final time.
- Confirm all six staff roles and the public customer persona were exercised.
- Confirm demo restaurants and images/media are production-looking and resilient.
- Confirm no secrets or ignored artifacts are staged.
- Summarize completed improvements, blocked items, remaining product gaps, and next recommended product bets.
- Push the branch only if all non-external checks pass and credentials are available.
```
