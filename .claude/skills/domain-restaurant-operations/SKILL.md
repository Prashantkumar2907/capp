---
name: domain-restaurant-operations
description: Use for CAPP restaurant domain rules covering QR ordering, staff roles, menu pricing, tables, payments, subscriptions, platform admin, and demo data.
---

# Restaurant Operations Domain

## When to use this skill
Use before changing ordering, order statuses, menu availability/prices, table occupancy, waiter/kitchen/cashier workflows, subscriptions, platform admin, public receipts, feedback, or demo seed data.

## Quick reference
| Domain | Source |
| --- | --- |
| Roles and statuses | `src/lib/constants.ts` |
| Order creation | `src/lib/supabase/orders.ts` |
| Order transitions | `src/lib/supabase/order-status.ts` |
| Payment settlement/webhooks | `src/lib/supabase/payments.ts` |
| Platform admin/subscriptions | `src/lib/supabase/platform-admin.ts` |
| Menu management | `src/lib/supabase/menu-management.ts` |
| Branch/staff management | `src/lib/supabase/management.ts` |
| Demo data | `docs/demo-data.md`, `supabase/05_seed_demo.sql` |

## Core invariants
- Server calculates menu prices, taxes, discounts, totals, order numbers, payment rows, and trusted status changes.
- QR customer orders must be dine-in and linked to an active table.
- Order transitions follow `pending -> confirmed -> preparing -> ready -> served`; terminal states cannot move from the order board.
- Completed/refunded payments cannot be casually reversed through staff UI.
- Active table release checks must consider other active orders for the same branch/table.
- Platform admin subscription grants must write audit rows.

See `references/domain-rules.md` for personas and rules.

## Do not
- Do not allow clients to submit `price_at_order`, `unit_price`, `total`, payment status, role, org ID, or subscription status as trusted data.
- Do not let platform admin behavior depend on restaurant staff membership.
- Do not seed real PII, credentials, or payment identifiers.
- Do not change order statuses without updating tests and UI labels.
