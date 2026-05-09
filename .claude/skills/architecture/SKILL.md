---
name: architecture
description: Use for CAPP file placement, module ownership, route grouping, and naming decisions in the Next App Router codebase.
---

# Architecture

## When to use this skill
Use this before adding or moving routes, components, service files, hooks, stores, schemas, migrations, tests, or docs.

## Quick reference
| Concern | Home |
| --- | --- |
| Public customer/auth routes | `src/app/(public)` |
| Staff dashboard routes | `src/app/(dashboard)/dashboard` |
| Platform-owner console | `src/app/admin` |
| API route handlers | `src/app/api` |
| Trusted Supabase services | `src/lib/supabase` |
| Zod schemas and input types | `src/lib/validation/schemas.ts` |
| Generic UI primitives | `src/components/ui` |
| Shared presentation | `src/components/shared` |
| Feature UI | `src/components/features` |
| Browser hooks and stores | `src/hooks`, `src/stores` |
| SQL/RLS/storage/realtime | `supabase` |
| Tests | `tests/unit`, `tests/api`, `tests/ui` |

## Directory ownership
Read `docs/architecture/file-structure.md` first, then inspect the nearest existing sibling file.

`src/app/(public)` is unauthenticated and includes the public ordering and receipt flow. Do not assume staff context here.

`src/app/(dashboard)/dashboard` is authenticated restaurant workspace UI rendered under `src/components/layouts/dashboard-shell.tsx`.

`src/app/admin` is platform-owner UI. It is authenticated separately from tenant staff roles and must call platform APIs.

`src/app/api` owns server route boundaries. Route handlers should be thin and delegate trusted work to `src/lib/supabase`.

`src/lib/supabase` owns query composition, service-role writes, permission checks, and business-rule enforcement.

See `references/project-map.md` for placement examples and route groups.

## Naming rules
- File and directory names are kebab-case, including route and component files.
- React components and exported types use PascalCase.
- Functions, variables, hooks, and query keys use camelCase.
- Path imports use the `@/*` alias from `tsconfig.json`.
- Keep route-level `loading.tsx` and `error.tsx` next to the route they protect.

## Do not
- Do not put trusted pricing, payment, role, subscription, or tenant checks inside client pages.
- Do not create a new top-level source folder when an existing owner directory matches.
- Do not add generic UI primitives under `src/components/features`.
- Do not edit `supabase/05_seed_demo.sql` for production-only schema changes.
