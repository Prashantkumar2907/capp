# Strict LLM Improvement Loop Command

Use this command with a coding LLM when you want repeated full-application review, implementation, and testing cycles.

```text
Act as a senior Next.js, Supabase, product, QA, and UI/UX architect.

You are working inside this repository. Do not only review. Execute the loop below exactly 10 times unless a hard external blocker prevents progress.

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
   - testing coverage and developer docs
3. Rank findings by user impact and implementation risk.
4. Implement the highest-value improvements for that loop.
5. Add or update tests for the behavior changed.
6. Run:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - `npm run test`
   - `npm run test:api`
   - `npm run test:ui`
   - `npm audit --audit-level=moderate`
7. If database connectivity is available, also run:
   - `npm run db:migrate`
   - `npm run db:verify`
8. Fix every failure introduced by the loop.
9. Write a short loop report in `docs/iteration-reports/loop-N.md` with:
   - what was inspected
   - what was missing or weak
   - what was implemented
   - tests run
   - remaining risks
10. Commit that loop with message:
   `Improve CAPP loop N`

After loop 10:
- Run the full verification suite one final time.
- Summarize completed improvements, blocked items, and next recommended product bets.
- Push the branch only if all non-external checks pass and credentials are available.
```
