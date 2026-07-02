---
name: api-contracts
description: Use for CAPP public routes, Next.js Route Handlers, Razorpay webhook changes, Supabase-facing contracts, and any REST/GraphQL/gRPC/tRPC/webhook/event compatibility work.
---

# API Contracts Skill

## When to Use
- Use for changes to `/api/v1/webhooks/razorpay`, public QR ordering routes, receipt routes, auth callback behavior, route params, response status codes, or payload shapes.
- Use when adding REST, GraphQL, gRPC, tRPC, webhook, event, or generated-client surfaces.
- Use before migrating routes, changing auth semantics, or altering database payloads consumed by UI routes.

## Required Discovery
- Inventory affected routes under `src/app`, including public routes and protected dashboard routes.
- Read `src/middleware.ts` for public/protected route behavior.
- Read `src/app/api/v1/webhooks/razorpay/route.ts` before payment webhook changes.
- Read `src/lib/validations.ts`, `src/lib/supabase/types.ts`, `supabase/001_setup.sql`, and affected UI consumers.
- Search for call sites with `rg` before renaming route params, table columns, event names, or status values.
- Check whether OpenAPI, protobuf, GraphQL, tRPC, generated clients, or contract tests exist. At scaffold time, none were detected.

## Non-Negotiable Rules
- Preserve route parity during migrations unless a breaking change is explicit and documented.
- Preserve status codes, payload shapes, auth/authorization semantics, pagination, filtering, sorting, error models, and idempotency semantics unless intentionally changed.
- Razorpay webhooks must verify signatures against the raw request body before trusting payloads.
- Do not log raw webhook payloads, secrets, full tokens, or sensitive customer data.
- Do not silently break QR codes, customer order flow, staff dashboards, or payment reconciliation.

## Workflow
1. Build a route inventory:
   - Public: `/`, `/order/[branchId]/[tableNumber]`, `/order/[branchId]/[tableNumber]/payment`, `/receipt/[orderId]`, auth pages, and `/auth/callback`.
   - Protected: `/dashboard` and dashboard subroutes.
   - API: `/api/v1/webhooks/razorpay`.
2. Capture current contract details: method, params, request body, response body, status codes, auth, RLS expectations, and side effects.
3. For migrations, keep old and new routes temporarily when feasible or document deprecation.
4. For payments/webhooks, require idempotent updates and explicit state transitions for `payments` and `orders`.
5. For future schemas, update the source schema first:
   - OpenAPI if REST docs are introduced.
   - Protobuf if gRPC is introduced.
   - GraphQL schema if GraphQL is introduced.
   - tRPC router/types if tRPC is introduced.
   - Supabase SQL/types when database contracts change.
6. Add or update contract tests when a harness exists. No configured test harness was detected, so mark test additions as a setup decision if needed.

## Verification
- Search for route and payload consumers using `rg`.
- Run `npm run lint`.
- Run `npm run build` when Next route handlers, middleware, or server/client boundaries changed.
- Exercise webhook logic with safe mocked payloads and signature generation if a local harness exists.
- Verify public ordering and receipt routes in a browser when route behavior changes.

## Common Failure Modes
- Parsing a webhook body before signature verification.
- Returning different error shapes or status codes during a refactor.
- Changing `order`, `payment`, or `staff` status values in UI but not SQL constraints.
- Breaking QR URL patterns used outside the app.
- Forgetting authorization parity between old and new routes.
- Regenerating clients from stale or guessed schema.
