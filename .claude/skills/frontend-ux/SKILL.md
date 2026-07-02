---
name: frontend-ux
description: Use for CAPP Next.js UI, shadcn-style components, Tailwind CSS v4, accessibility, responsive behavior, state management, and browser/screenshot verification.
---

# Frontend UX Skill

## When to Use
- Use for UI changes under `src/app`, `src/components`, `src/hooks`, `src/stores`, and `src/app/globals.css`.
- Use for dashboard, kitchen, waiter, table, menu, staff, analytics, payments, public ordering, receipt, auth, onboarding, and landing page changes.
- Use when adding components, changing design tokens, state management, animations, forms, charts, QR codes, or responsive behavior.

## Required Discovery
- Read affected pages/components and nearby patterns before editing.
- Read `components.json` for shadcn-style settings: `base-nova`, Tailwind CSS path `src/app/globals.css`, `@/` aliases, lucide icons, and RSC enabled.
- Read `src/app/globals.css` for color tokens, dark mode, animations, surface utilities, and card styles.
- Read shared components in `src/components/ui`, `src/components/common`, and dashboard layout components.
- Identify state ownership: React Query for server state, Zustand for cart state, Supabase realtime for live orders.

## Non-Negotiable Rules
- Keep operational views dense, scannable, and workflow-focused.
- Do not default to marketing-page layouts for dashboard/kitchen/waiter/admin tools.
- Use existing components and tokens before inventing new visual systems.
- Use lucide icons where existing UI patterns use icons.
- Preserve accessibility: labels, focus states, keyboard paths, contrast, semantic controls, and screen-reader names.
- Do not expose secrets or server-only values to client components.

## Workflow
1. Classify the UI:
   - Public marketing.
   - Auth/onboarding.
   - Operational dashboard.
   - Kitchen display.
   - Waiter/table workflow.
   - Customer QR ordering/payment/receipt.
2. Reuse existing primitives: button, card, dialog, input, textarea, tabs, switch, badge, separator, scroll area, skeleton, common empty/stat/section components.
3. Keep state predictable:
   - Server data through Supabase/React Query.
   - Cart-local state through Zustand.
   - Form state through React Hook Form and Zod.
   - Realtime orders through `useRealtimeOrders`.
4. For forms, validate with Zod and keep error messages consistent.
5. For responsive behavior, check mobile and desktop breakpoints, especially dashboard nav, cards, tables, charts, and QR/payment flows.
6. For charts, preserve Recharts responsiveness and empty states.
7. For animations, use existing Framer Motion/Tailwind animation patterns sparingly and avoid layout jank.

## Verification
- Run `npm run lint`.
- Run `npm run build` for route/component boundary changes.
- Use browser or screenshot verification for visible UI changes.
- Check keyboard navigation and visible focus for new interactive elements.
- Verify text does not overlap or overflow in compact/mobile states.
- Verify loading, empty, error, and success states.

## Common Failure Modes
- Making a dashboard page feel like a landing page.
- Adding a client component where a server component would be simpler, or importing server-only helpers into client code.
- Breaking mobile nav or dense operational workflows.
- Adding controls without labels or focus states.
- Overusing animations on high-frequency kitchen/order screens.
- Forgetting unauthenticated customer QR flows while focusing on staff dashboard views.
