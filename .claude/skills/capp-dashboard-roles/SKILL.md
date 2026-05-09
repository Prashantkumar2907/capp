---
name: capp-dashboard-roles
description: Use for CAPP dashboard routes, role-aware navigation, authenticated restaurant workflows, staff roles, kitchen, waiter, payments, and analytics.
---

# CAPP Dashboard Roles

Use this skill when changing authenticated dashboard behavior, role access, staff workflows, or dashboard navigation.

## Workflow

1. Read [references/dashboard-roles.md](references/dashboard-roles.md).
2. Check `roleAccess` in `src/lib/constants.ts` before exposing a route/action.
3. Keep authenticated dashboard pages inside `AuthProvider` and `DashboardShell`.
4. Enforce permissions server-side for API routes, not only in navigation.
5. Keep dashboard routes covered by loading and error states.

## Role-Aware Defaults

- Owner/admin can manage branches, staff, menu, tables, orders, payments, analytics, and settings.
- Manager can work operational routes but not branch/staff administration.
- Waiter focuses on tables, orders, and waiter POS.
- Kitchen focuses on kitchen/order progression.
- Cashier focuses on payments, orders, analytics, and settings.

## Avoid

- Do not rely on hidden nav links as authorization.
- Do not let public or platform routes inherit tenant staff assumptions.
- Do not add realtime subscriptions without cleanup on branch/user changes.
