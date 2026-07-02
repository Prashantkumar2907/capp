---
name: testing-quality
description: Use for CAPP test discovery, regression coverage, quality strategy, CI gates, deterministic fixtures, mocks, and verification evidence.
---

# Testing and Quality Skill

## When to Use
- Use before fixing bugs, changing public/customer workflows, modifying payments, schema/RLS, auth, realtime, or shared UI components.
- Use when adding a test harness, improving coverage, or deciding which checks are enough for a change.
- Current state: `package.json` has `dev`, `build`, `start`, and `lint`; no configured `test`, `typecheck`, Playwright, Vitest, Jest, or CI workflow was detected.

## Required Discovery
- Read `package.json`, `eslint.config.mjs`, `tsconfig.json`, and any nearby test files.
- Search with `rg --files | rg '(test|spec|vitest|jest|playwright|cypress)'`.
- Identify manual verification needed for Next.js UI, Supabase behavior, Razorpay webhooks, and realtime flows.
- Check existing fixtures: `src/lib/supabase/test-data.ts` and `scripts/seed-test-data.mjs`.

## Non-Negotiable Rules
- Prefer targeted tests/checks first, then broader suites when risk warrants.
- Do not claim tests exist or ran unless they actually do.
- Mock external services by default: Supabase, Razorpay, email/OAuth, and any future LLM/provider calls.
- Keep fixtures deterministic and tenant-safe.
- Do not use production data or live payment providers for routine tests.
- Do not add flaky sleeps where deterministic waiting or mocking is possible.

## Workflow
1. Determine risk:
   - Low: isolated copy/UI style.
   - Medium: shared component, hook, validation, route behavior.
   - High: auth/RLS, payments/webhooks, order state, schema, destructive scripts, public routes.
2. Select checks:
   - `npm run lint` for code quality.
   - `npm run build` for Next.js compilation and server/client boundary issues.
   - Browser checks for UI changes.
   - SQL validation for schema/RLS changes.
   - Mock webhook tests or manual local probes for payment flows when a harness exists.
3. Add regression tests for bug fixes if a test harness exists or if adding one is in scope.
4. For future test pyramid:
   - Unit: pure helpers, validation, state reducers.
   - Component: forms and shared UI behavior.
   - Integration: Supabase data access with mocks or local database.
   - E2E: auth, onboarding, QR ordering, kitchen, payments, receipt.
5. Record exact commands and outcomes in final response.

## Verification
- Run the narrowest relevant command first.
- Run `npm run lint` for TS/React changes.
- Run `npm run build` for routes, server/client components, middleware, and deployment-sensitive changes.
- For UI, verify with browser or screenshots across relevant viewports.
- For SQL, verify in local/staging and include role/RLS cases.
- If a check is skipped, state why and what was done instead.

## Common Failure Modes
- Relying on a successful lint as proof that Supabase RLS or webhook behavior works.
- Adding tests that depend on live Supabase or live Razorpay by default.
- Ignoring public unauthenticated customer flows during auth changes.
- Missing regression coverage for duplicate webhooks or order/payment state transitions.
- Dumping huge logs instead of reporting the failing command and concise cause.
