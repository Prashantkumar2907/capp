---
name: ui-conventions
description: Use for CAPP Tailwind UI primitives, route states, accessibility, responsive layout, and animation conventions.
---

# UI Conventions

## When to use this skill
Use this before changing dashboard/public pages, components, forms, tables, dialogs, loading/empty/error states, responsive behavior, or motion.

## Quick reference
| Concern | Pattern |
| --- | --- |
| Styling | Tailwind CSS 4 classes and CSS variables in `src/app/globals.css` |
| Primitives | Owned shadcn-style components in `src/components/ui` |
| Icons | `lucide-react` |
| Toasts | `sonner` via `src/components/shared/app-toaster.tsx` |
| Skeletons | `Skeleton` and `src/components/ui/loading-patterns.tsx` |
| Empty states | `src/components/shared/empty-state.tsx` |
| Dialogs | `src/components/ui/dialog.tsx` focus/escape behavior |
| Motion | CSS keyframes/classes; reduced-motion media query |

## Component anatomy
Reusable primitives are domain-neutral and typed, like `src/components/ui/button.tsx`.

Feature components accept data and callbacks, like `src/components/features/menu/dish-tile.tsx`, `src/components/features/cart/cart-panel.tsx`, and `src/components/features/orders/order-card.tsx`.

Page components compose data fetching, filters, mutations, and feature/shared components. Examples include `src/app/(public)/order/[branchId]/[tableNumber]/page.tsx` and `src/app/(dashboard)/dashboard/payments/page.tsx`.

See `references/component-patterns.md` for UI states and responsive examples.

## Accessibility and responsiveness
- Buttons with only icons need `aria-label`.
- Dialogs must preserve `aria-modal`, `aria-labelledby`, escape close, tab trapping, and focus restore.
- Loading states need `role="status"` or meaningful labels when the page otherwise looks frozen.
- Public QR pages must stay usable around 360 px width with no horizontal overflow.
- Preserve `prefers-reduced-motion` behavior in `src/app/globals.css`.

## Do not
- Do not introduce another styling system.
- Do not use raw SVG icons when a lucide icon exists.
- Do not add layout-affecting animations for route/page transitions; prefer opacity/transform classes already present.
- Do not hide API failures silently; use error UI or toasts.
