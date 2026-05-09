# .claude

This directory gives Claude Code project-specific operating instructions for CAPP. It exists so future sessions load only the facts that matter for this repository: route ownership, trusted data boundaries, Supabase/RLS patterns, UI conventions, tests, performance budgets, deployment runbooks, and restaurant domain rules.

## Skill Model

Claude should use three instruction layers in this order:

1. Global skills in `~/.claude/skills` for personal or organization-wide practices.
2. Project skills in `.claude/skills` for CAPP-specific workflows.
3. `CLAUDE.md` for the always-loaded cockpit view of this repository.

Claude MUST read the relevant `SKILL.md` before acting on any task in that domain. If a task touches multiple domains, read the smallest set of relevant skills first, then inspect the cited source files before editing.

## Skill Index

| Skill | Description | When to load |
| --- | --- | --- |
| `architecture` | CAPP route/module/file ownership and placement rules derived from `docs/architecture/file-structure.md` and `src/app`. | Adding files, routes, components, services, hooks, stores, schemas, migrations, or docs. |
| `api-conventions` | API route, Zod validation, service result, Supabase client, and error response conventions. | Adding/modifying route handlers, service functions, payloads, mutations, or webhook boundaries. |
| `ui-conventions` | Tailwind token usage, owned UI primitives, loading/empty/error states, responsive layout, and motion rules. | Building or changing UI components, dashboard/public pages, dialogs, tables, forms, or animations. |
| `state-management` | TanStack Query, Zustand cart, auth context, pagination, and realtime order subscription rules. | Working with cache keys, invalidation, local cart persistence, form/page state, or realtime updates. |
| `auth` | Supabase SSR auth, staff context, role checks, platform admin authorization, and protected routes. | Touching login, proxy redirects, staff roles, tenant scope, platform admin, or permission checks. |
| `testing` | node:test, API contract, DB verification, Playwright UI, and route readiness coverage patterns. | Adding tests, fixing failing tests, changing business rules, or running verification. |
| `new-feature` | Cross-layer checklist for adding a CAPP feature from domain rule to route/API/UI/tests/docs. | Starting a feature that touches more than one layer. |
| `deployment` | Environment variables, migration order, release verification, smoke tests, and rollback steps from docs/runbooks. | Preparing release, debugging deployment, changing env/migrations/integrations, or smoke testing. |
| `performance` | Machine-readable budgets, route IDs, API latency/image/duplicate-fetch limits, and indexed hot paths. | Profiling, optimizing, paginating, adding critical routes, changing caches, or auditing Web Vitals-like behavior. |
| `database-rls` | Supabase SQL ordering, schema/RLS/storage/realtime/index conventions, and migration safeguards. | Changing database schema, policies, functions, storage buckets, realtime publication, or indexes. |
| `domain-restaurant-operations` | Restaurant personas, order/menu/table/payment/subscription invariants, and demo data rules. | Touching operational workflows, status transitions, menu pricing, payments, subscriptions, staff roles, or demos. |
| `commit-messages` | Commit and PR style inferred from repository history. | Writing commit messages, squashing, or drafting PR descriptions. |
