---
name: architecture
description: Use for CAPP system design, module boundaries, route ownership, clean architecture, and avoiding unsafe coupling across frontend, Supabase, payments, and state.
---

# Architecture Skill

## When to Use
- Use for changes that affect Next.js route groups, public ordering, dashboard features, shared components, hooks, Supabase access, state ownership, or payment flows.
- Use before introducing a new abstraction, data access layer, service module, workspace, worker, CLI, data pipeline, or long-lived architecture pattern.
- Use when a feature touches multiple domains: organizations, branches, staff, menu, tables, orders, payments, analytics, kitchen, waiter, settings, or onboarding.

## Required Discovery
- Read `CLAUDE.md`, `package.json`, `guide.md`, and the affected files under `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/stores`, and `supabase/`.
- Identify whether code runs in the browser, a Server Component, a Route Handler, middleware, or a script.
- Map data ownership for the affected tables in `supabase/001_setup.sql`.
- Check whether the change touches public routes, auth routes, protected dashboard routes, service-role access, or Razorpay webhooks.
- Check for existing component and hook patterns before adding new modules.

## Non-Negotiable Rules
- Keep browser code on anon Supabase clients; service-role access must remain server-only.
- Preserve tenant boundaries enforced by RLS and route-level auth.
- Prefer explicit TypeScript/Zod/database contracts over implicit shape assumptions.
- Do not add cross-feature hidden coupling through global stores, route params, or broad utility modules.
- Do not extract abstractions just to reduce line count.
- Do not invent background workers, queues, APIs, or providers that are not in the repo.

## Workflow
1. Create a route and domain inventory for the change.
2. Classify the affected layer: UI component, hook, validation, Supabase client/server helper, Route Handler, SQL/RLS, or script.
3. Define the owner of each mutable state transition, especially order, payment, table, staff, and menu availability state.
4. Keep frontend/backend separation explicit:
   - Browser/client components handle UI and anon Supabase operations allowed by RLS.
   - Server components and route handlers handle trusted server-only logic.
   - Webhooks validate provider signatures before parsing and mutating state.
5. Prefer type-safe contracts:
   - Use `src/lib/validations.ts` or local Zod schemas for user input.
   - Keep Supabase TypeScript types aligned with SQL.
   - Preserve database constraints and RLS as the final authority.
6. For large or irreversible decisions, propose an ADR location first. No ADR directory was detected, so mark ADR support as UNKNOWN unless one is added.
7. For future monorepo/workspace work, isolate ownership by app/service/package and avoid global commands when targeted commands exist.

## Verification
- Read back changed files and confirm imports, runtime layer, and ownership boundaries.
- Run `npm run lint` for TypeScript/Next lint checks when relevant.
- Run `npm run build` when route boundaries, server/client imports, or Next.js behavior are affected.
- Use browser/screenshot verification for visible UI changes.
- For SQL/RLS changes, use safe local/staging validation; never run `supabase/000_reset.sql` on shared environments without explicit approval.

## Common Failure Modes
- Using a service-role client in browser-reachable code.
- Moving logic into a shared helper that mixes UI, auth, database, and payment responsibilities.
- Adding a Zustand/global store for server-owned data that React Query or Supabase realtime should own.
- Changing public route params without preserving QR code compatibility.
- Updating TypeScript types but not the SQL schema, or changing SQL but not code assumptions.
- Treating planning docs as more authoritative than current `package.json`, `src/`, and `supabase/`.
