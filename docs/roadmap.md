# CAPP — Product & Implementation Roadmap (India-first)

> Status: active. Scope decided: **Indian restaurants — small to large. India only, UPI-first.**
> "Any business / any country" is explicitly deferred until 20+ paying restaurants.

---

## 0. Positioning

**Who:** Indian restaurants, from a 10-table family place to a 100-cover multi-branch operation.
**Wedge:** simplest, cheapest QR-ordering + KOT + roles system; go live in under an hour, self-serve.
**Against:** Petpooja/Posist on simplicity and price; paper registers on everything.

Two personas, one product:
- **Small (1–15 tables, 1–4 staff):** roles collapse into one or two people. QR menu, kitchen tablet, UPI QR. Zero training.
- **Large (multi-section / multi-branch):** captains take orders, KOT routes to stations (tandoor / chinese / bar), cashier settles, owner watches analytics across branches.

The same role-capability system serves both: small = one user holds all roles; large = many users, one role each.

---

## 1. Phase 0 — Foundations & fixes (current)

| Item | Status | Notes |
|---|---|---|
| Verify proxy.ts middleware | ✅ correct | Next 16 renamed middleware→proxy; build output confirms `ƒ Proxy (Middleware)` active |
| Upgrade Next 16.2.5 → 16.2.6+ | ✅ done | May 2026 release patched 13 CVEs incl. 3 auth-bypass |
| Audit API route self-auth | ✅ done | Found+fixed critical: status route had no auth on service-role client. New `requireStaff()` guard (src/lib/api/auth.ts). Other routes verified OK |
| Transactional order creation | ✅ done | `create_order()` fn (06_create_order_fn.sql), server-side pricing, tested against local PG16: atomicity + all error paths verified. API route rewired to RPC |
| Realtime publication check | ✅ done | orders/order_items/payments were present; added branch_dishes (live out-of-stock) + tables (live floor status) |
| Env validation on boot | ✅ existed | src/lib/env.ts already fails loudly |
| Multi-role schema (staff_roles) | ✅ done | 07_staff_roles.sql: backfill + sync trigger + app_user_roles()/app_user_has_role() + RLS, tested. UI/policy adoption is Phase 1 |

---

## 2. India feature catalog

### 2.1 GST & compliance (Phase 2 — required before charging money)
- **CGST/SGST split** on every invoice (restaurants are intra-state; standard 5% without ITC → shown as 2.5% + 2.5%). Store as one rate, render as split.
- **GSTIN + FSSAI license number** printed on every receipt/invoice (org + branch settings fields).
- **Sequential invoice numbering** per branch per financial year (Apr–Mar), GST-compliant format.
- **Composition vs regular scheme** flag (composition restaurants can't show tax on invoice — different receipt template).
- **Service charge**: optional line item, clearly voluntary (CCPA guidelines), toggle per org, removable per bill.
- **Veg/non-veg indicators** on every dish (FSSAI-mandated green/brown marks). Add `dietary_type` to dishes: veg | non_veg | egg. Show dots on customer menu, filters ("pure veg" toggle).

### 2.2 Menu realities of Indian restaurants (Phase 1–2)
- **Variants**: Half / Full / Quarter plate with separate prices. This is non-negotiable for Indian menus — a `dish_variants` table (dish_id, name, price). Cart + KOT + billing all variant-aware.
- **Add-ons / modifiers**: extra cheese, butter/plain, spice level. `dish_addons` table, multi-select at order time.
- **Combos / thalis**: a dish composed of components (phase later; start with flat-priced combo dishes).
- **Time-based menus**: breakfast/lunch/dinner category visibility windows (simple `available_from/available_to` on category).
- **Out-of-stock**: kitchen toggles dish/variant off; customer menu greys it out live. (branch_dishes.is_available exists — extend to variants.)

### 2.3 Order-taking modes (Phase 1–2)
- **QR self-order** (exists): scan → menu → name + table → order.
- **Waiter/captain mode**: fast tap-to-add POS, per-table running order, add/remove items on an open order, search dishes, transfer table. Works on a phone.
- **Counter/QSR mode**: no table — token number ordering for quick-service places (order_type: dine_in | takeaway | counter).
- **Parcel/takeaway**: no table, customer name + phone, packing charge line item.

### 2.4 Kitchen — KOT system (Phase 1–2)
- **KOT tickets**: every confirmed order generates a KOT; item-level accept → preparing → ready (exists at item level — surface it properly).
- **KOT printing**: browser print to thermal printer (80mm CSS template) first; ESC/POS network printing later. Even QR-first restaurants want a paper ticket in the kitchen.
- **Station routing (large restaurants)**: tag categories/dishes to stations (tandoor, chinese, bar, dessert); each kitchen screen filters to its station.
- **Audio + visual alerts** on new KOT (exists — verify reliability).
- **Prep-time tracking**: timestamp accepted→ready for analytics later.

### 2.5 Billing & payments (Phase 2)
- **UPI QR direct** (exists) — zero fee, the wedge.
- **Cash** with tendered/change calculation.
- **Card / other** as manual-entry payment methods.
- **Split payment**: one bill, multiple payment rows (schema already supports N payments per order).
- **Split bill by items/equal** (large-restaurant ask; later in phase).
- **Discounts**: percentage or flat, with reason, permission-gated (manager+).
- **Day-end (Z) report**: totals by payment method, cash reconciliation, per-shift summary. Owners live by this.

### 2.6 Communication (Phase 3)
- **WhatsApp receipt + order-ready notification** (WhatsApp Business API via provider like Gupshup/Twilio). In India this beats email by a mile. Requires customer phone capture at order.
- SMS fallback for OTP-less receipt links. Email is tertiary.

### 2.7 Language (Phase 3)
- Staff UI in **Hindi first**, then Bengali/Tamil/Telugu/Marathi. next-intl; string extraction now costs little if we discipline ourselves early (wrap user-facing strings).
- Customer menu language toggle per branch.

### 2.8 Large-restaurant / multi-branch (Phase 3–4)
- Branch switcher + per-branch menu/pricing overrides (schema exists).
- **Cross-branch analytics**: revenue, top dishes, peak hours, branch comparison, ratings.
- **Staff shifts & basic attendance** (later; don't build payroll).
- **Table management**: merge/split tables, section/floor grouping.
- Activity log surfacing (audit trail exists in schema).

### 2.9 Subscriptions & monetization (Phase 4)
- Plans: **Starter** (1 branch, QR+KOT) / **Growth** (3 branches, analytics, WhatsApp) / **Pro** (unlimited, station routing, priority support).
- Razorpay subscription billing (webhook scaffold exists). 14-day trial → active → past_due lifecycle (schema exists).
- Feature gating by plan via a single `plan_features` map in constants.

### 2.10 Explicitly deferred (do NOT build yet)
- Zomato/Swiggy aggregator integration (API access is gated; revisit with real customers asking)
- Inventory / recipe costing / purchase orders
- Reservations, loyalty, CRM
- Native apps (PWA is enough), offline-first sync (do basic PWA caching only)
- Multi-currency / non-India tax / non-restaurant verticals

---

## 3. Phase sequence

**Phase 0 — Foundations** (§1 table). Exit: all items checked.

**Phase 1 — Core loop, India-ready basics. ✅ COMPLETE (pending real-restaurant exit test)**
- [x] Multi-role users end to end (staff_roles + union-based UI + 08_rls_multirole.sql, RLS-verified)
- [x] The Counter: unified one-screen home (live orders + earnings + out-of-stock toggles)
- [x] Dish variants (Half/Full) + add-ons: 09 migration, create_order v2 with server-side variant/addon pricing (tested: 2×(150+30)=360, cross-dish variant spoofing rejected), customer picker dialog, cart v3 (line-based, unit-tested), kitchen tickets show variant+addons, menu dialog editor for owners
- [x] Waiter POS: New-order tab (dine-in/takeaway/counter modes, variants) + Open-orders tab — add dishes to a running order, remove lines; totals + pending payment recomputed atomically in DB (add_order_items/remove_order_item, tested: 80→420→340, served orders locked)
- [x] Counter/token mode: order_type 'counter', token = order number suffix, shown on kitchen tickets
- [x] KOT kitchen polish: variant/addon/notes on tickets, cancelled lines hidden, token/takeaway labels
Exit criterion still open: one real restaurant runs a full service day.

**Phase 2 — Compliance & money.** (in progress)
- [x] GST core (10_gst_compliance.sql): FSSAI/service-charge/scheme org fields; sequential invoice numbers per branch per FY (INV/2627/000001, assigned on payment completion via triggers, idempotent, counter table locked from clients); create_order v3 + recompute with service charge; composition scheme = no GST on bill; invoice-safe rounding (printed parts always sum to total). Tested: exclusive 200→231, composition 200→220, FY boundaries Mar/Apr, counter increments, no reassignment, open-order edits preserve SC math
- [x] Receipt: invoice no., GSTIN, FSSAI, CGST/SGST split lines, service charge (voluntary), composition-scheme note, variant/addon display
- [x] Settings: GSTIN/FSSAI/GST rate/service charge %/scheme fields
- [x] calculateTotals mirrors DB math (unit-tested incl. parts-sum rule); service charge shown in cart previews (customer + waiter)
- [x] Role-login provisioning: POST/PATCH /api/staff/provision (owner/admin only, service-role server-side, synthetic handle@org-slug.staff.capp.app emails for staff without email, auth-user rollback if staff insert fails); staff page rebuilt — multi-role checkbox picker, generated readable passwords, credentials hand-over screen, password reset, deactivate/reactivate instead of delete, role badges from staff_roles
- [x] Cash settle: settle dialog with method picker + cash tendered/change calculation (blocks short payments); completing payment auto-assigns GST invoice number via DB trigger
- [x] Z-report: day summary (cash-in-drawer/UPI/card split, settled count, pending) with print
- [x] KOT thermal print: 80mm browser-print ticket (variant, addons, notes, counter token) from kitchen tickets — works with any thermal printer installed as a system printer
- [x] Split payments: record_split_payment() — pending row tracks remaining due after completed partials; settle dialog collects any amount up to due (part cash + part UPI); invoice assigned on first completed payment; overpay blocked. API cashier-gated
- [x] Discounts: order_totals_v3 discount pass (discount on ex-tax food value; SC + GST on discounted base; printed parts still sum); apply_discount() clamps + logs amount/reason to activity_logs; API manager-gated; waiter open-order panel has Apply/Edit discount for owner/admin/manager; recompute preserves discount on open-order edits

**Phase 2 exit criterion MET (pending live click-through): a restaurant can legally hand a customer our bill and close the till.**
Exit: a restaurant can legally hand a customer our bill.

**Phase 3 — Scale features.** (in progress)
- [x] Station routing (12_stations.sql): stations per branch (Settings card, manager+), categories map to stations (Menu page — categories now editable with station badges; edit was previously dead code), order items snapshot station_id/name at order time in both create_order and add_order_items (DB-tested: Naan→Tandoor, Noodles→Chinese, open-order adds snapshot too); kitchen board gets station filter pills — tickets show only that station's items, ticket/queue counts follow
- [x] Multi-branch analytics: owner/admin-only branch comparison (revenue bar chart + per-branch order counts over the selected window); auto-hides for single-branch orgs
- [x] Table transfer + merge (13_table_operations.sql): move_order_table (frees old table only when nothing else runs on it, blocks occupied targets), merge_orders (items move to target, totals recomputed, source cancelled + pending payment failed + table freed, deadlock-safe lock ordering); waiter open-order panel gets Move table… / Merge into… selectors. DB-tested end to end
- [x] WhatsApp scaffold: provider-abstracted sendWhatsApp (gupshup | meta | disabled default no-op), Indian phone normalization, fire-and-forget on order→ready with restaurant name + receipt link; env template added. BLOCKED ON: provider account + approved message templates for production
- [ ] Hindi staff UI (next-intl string extraction — dedicated session, touches every file)
Exit: a 50+ cover restaurant runs on it.

**Phase 4 — Monetization.**
Plans, Razorpay subscriptions, gating, billing lifecycle. Exit: first paid subscription.

**Phase 5 — Earned expansions.** Aggregators, inventory, more languages — driven by paying-customer demand only.

---

## 4. Schema changes queued (all additive)
1. `staff_roles (staff_id, role)` many-to-many + `app_user_roles()` / `app_user_has_role()` RLS helpers.
2. `dish_variants (id, dish_id, name, price, is_available)`; `order_items.variant_id` nullable FK + name/price snapshot columns.
3. `dish_addons (id, dish_id, name, price)`; `order_item_addons` snapshot table.
4. `dishes.dietary_type` enum-ish text: veg | non_veg | egg.
5. `orders.order_type`: dine_in | takeaway | counter (table nullable for non-dine-in).
6. Org/branch settings: `gstin`, `fssai_license`, `service_charge_percent`, `gst_scheme` (regular|composition).
7. `invoice_counters (branch_id, fy, last_number)` for sequential GST invoice numbers.
8. `stations (branch_id, name)` + `categories.station_id` (Phase 3).
9. `create_order()` Postgres function — transactional insert of order+items+addons+payment.

Migration discipline: additive first, backfill, switch reads, drop old columns later. Never destructive on live data.

---

## 5. Non-code risks (unchanged, still the real game)
1. **Distribution** — field presence/WhatsApp groups/local dealer network is how Petpooja wins. Plan before Phase 4.
2. **Reliability** — KDS down at Saturday 9pm = lost customer. Uptime + support channel.
3. **Onboarding** — live in under an hour, self-serve, in Hindi. This is the moat.
