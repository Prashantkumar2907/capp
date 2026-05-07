# CAPP Implementation Guide

CAPP is a multi-tenant restaurant operating system for QR ordering, waiter POS, kitchen display, cashier payments, analytics, branches, tables, staff, and menu operations.

## Architecture

- `src/app` contains App Router pages, route groups, public QR routes, and server API routes.
- `src/components/ui` contains reusable primitives inspired by shadcn-style copy-owned components.
- `src/components/features` contains reusable restaurant workflows such as order cards, dish tiles, and cart panels.
- `src/features/auth` owns Supabase-backed auth context, role hydration, and permission helpers.
- `src/lib/supabase` centralizes browser, server, admin, and query helpers.
- `src/types/database.ts` is the version-controlled Supabase schema contract.
- `supabase/*.sql` contains ordered SQL files for extensions, schema, functions, RLS, storage, realtime, and demo seed data.

## Personas

- Owner controls organization settings, branches, staff, analytics, subscriptions, and all operations.
- Admin manages the restaurant workspace, branches, staff, menu, tables, and service flow.
- Manager runs daily branch operations, menu availability, tables, orders, kitchen, payments, and analytics.
- Waiter creates table orders and monitors service handoff.
- Kitchen accepts, prepares, and releases tickets.
- Cashier settles payments, monitors completed collections, and handles pending or failed payments.
- Customer scans a table QR code, orders from the menu, tracks receipt status, pays, and leaves feedback.

## Product Surfaces

- `/dashboard` shows live revenue, active orders, recent tickets, and top dishes.
- `/dashboard/orders` provides a real-time order board with status and source filters.
- `/dashboard/kitchen` provides a kitchen rail from new to ready.
- `/dashboard/waiter` provides a fast table POS.
- `/dashboard/payments` handles cash, UPI, card, and Razorpay payment states.
- `/dashboard/menu`, `/dashboard/tables`, `/dashboard/staff`, and `/dashboard/branches` handle operations setup.
- `/order/[branchId]/[tableNumber]` is the customer QR ordering flow.
- `/receipt/[orderId]` is the customer receipt, payment, and feedback page.

## Patterns Used

- Next.js App Router route groups for auth, dashboard, public, and API boundaries.
- Supabase SSR clients for auth cookies and admin client only inside server routes.
- Server-side order pricing to prevent client price spoofing.
- RLS-enabled schema with role-aware policies.
- Reusable primitives with typed props, `className`, accessible labels, disabled states, skeleton loaders, and theme support.
- Subtle Tailwind animations for modal and panel motion, with Framer Motion available for richer transitions.
