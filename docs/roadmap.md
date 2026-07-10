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
| Verify proxy.ts middleware | ✅ correct | Next 16 renamed middleware→proxy; our file follows the new convention properly |
| Upgrade Next 16.2.5 → 16.2.6+ | ☐ | May 2026 release patched 13 CVEs incl. 3 auth-bypass |
| Audit API route self-auth | ☐ | proxy excludes /api/* by design (proxy = UX layer, not security boundary). Every route handler must verify user + org itself. Public routes (menu, order create, receipt, webhook) stay anon but must validate inputs hard |
| Transactional order creation | ☐ | Move orders+items+payments insert into one Postgres function |
| Realtime publication check | ☐ | orders, order_items, branch_dishes |
| Env validation on boot | ☐ | fail loudly on misconfig |
| Multi-role schema (staff_roles) | ☐ | prerequisite for everything below |

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

**Phase 1 — Core loop, India-ready basics.**
Multi-role users → variants + add-ons → waiter POS (open orders, add/remove, search) → KOT screen with accept/cooking/ready + out-of-stock toggle → cashier mark-paid/complete → order types (dine-in/takeaway/counter). Exit: one real restaurant runs a full service day.

**Phase 2 — Compliance & money.**
GST split + GSTIN/FSSAI on receipts + invoice numbering → service charge + discounts → cash/split payments → Z-report → veg/non-veg marks → KOT thermal print (browser) → role-login provisioning UI (owner-generated credentials, server-only admin API). Exit: a restaurant can legally hand a customer our bill.

**Phase 3 — Scale features.**
Station routing → multi-branch analytics → WhatsApp notifications → Hindi UI → table merge/split. Exit: a 50+ cover restaurant runs on it.

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
