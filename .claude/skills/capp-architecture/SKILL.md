---
name: capp-architecture
description: Use for CAPP codebase orientation, route ownership, file placement, and deciding where a Next.js or Supabase change belongs.
---

# CAPP Architecture

Use this skill before moving files, adding new routes, or deciding where project-specific behavior belongs.

## Workflow

1. Read [references/project-map.md](references/project-map.md) for the current route and ownership map.
2. Keep behavior close to the route, feature, or shared layer that already owns it.
3. Prefer existing local helpers over new abstractions.
4. Check whether the touched route needs matching `loading.tsx`, `error.tsx`, skeleton, empty, and error states.
5. Keep public surfaces separate from authenticated staff/platform concerns.

## CAPP Defaults

- Public customer routes live in `src/app/(public)`.
- Authenticated restaurant routes live in `src/app/(dashboard)`.
- Platform-owner routes live in `src/app/admin`.
- API boundaries live in `src/app/api`.
- Shared UI atoms live in `src/components/ui`.
- Feature-specific UI belongs in `src/components/features/<feature>`.
- Supabase query/service composition belongs in `src/lib/supabase`.
- Request validation belongs in `src/lib/validation`.

## Avoid

- Do not put restaurant domain rules into generic UI primitives.
- Do not make public QR routes depend on staff auth/profile providers.
- Do not add broad project-wide abstractions for one route's needs.
