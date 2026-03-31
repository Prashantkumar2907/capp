# CAPP Restaurant Management — Bug & Issue Report

**Generated:** 2026-04-01  
**Scope:** Full code review (all source files + 3 SQL migrations), browser testing (4 sessions on port 3001)

---

## 📸 Browser Testing Evidence

### Landing Page (Light Mode)
![Landing page hero](file:///Users/prashant/.gemini/antigravity/brain/df7f4766-0486-47ce-9434-e17658f2e8fc/capp_landing_page_initial_1774988024786.png)

### Mobile Responsiveness (375px)
![Mobile nav at 375px](file:///Users/prashant/.gemini/antigravity/brain/df7f4766-0486-47ce-9434-e17658f2e8fc/capp_landing_page_mobile_375px_1774988062272.png)

### Sign-In Page (Dark Mode)
![Sign-in page](file:///Users/prashant/.gemini/antigravity/brain/df7f4766-0486-47ce-9434-e17658f2e8fc/capp_sign_in_page_initial_1774988118514.png)

### Browser Test Recordings
- ![Landing & auth flow test](file:///Users/prashant/.gemini/antigravity/brain/df7f4766-0486-47ce-9434-e17658f2e8fc/landing_auth_test_1774987999735.webp)
- ![Sign-up & onboarding flow test](file:///Users/prashant/.gemini/antigravity/brain/df7f4766-0486-47ce-9434-e17658f2e8fc/signup_dashboard_flow_1774988796392.webp)

---

## 🔴 Critical Issues

### 1. Onboarding — Organization creation fails silently on retry (409 Conflict)
**Severity:** 🔴 Critical — **Verified via browser test**  
**File:** `src/app/onboarding/page.tsx` (lines 42-60)  
When a user submits the onboarding form, the org is inserted but the UI occasionally shows a validation error ("Organization name is required") despite the field being populated. If the user retries, the org insert returns a **409 Conflict** (duplicate slug), but the error message is vague and the spinner stays indefinitely.

**Root cause:** The Zod validation + react-hook-form interaction has a race condition. The org gets created on the first submit, but the form shows a validation error (likely due to a render timing issue with `useForm`). The second submit then fails with 409 Conflict because the org already exists, but the branch/staff creation never runs.

**Impact:** New users are permanently stuck — they can't reach the dashboard because their org exists but they have no staff record.

**Fix:** Add idempotency to the onboarding flow:
- Check if the user already has an org before inserting
- Use `upsert` or wrap in a check for existing org
- Add error recovery: if org already exists, proceed to branch/staff creation

---

### 2. Dashboard infinite spinner for new users — staff record not created
**Severity:** 🔴 Critical — **Verified via browser test**  
**Files:** `src/hooks/use-auth.tsx` (line 42-53), `src/app/(dashboard)/layout.tsx` (line 26)  
When the onboarding org creation partially fails (see issue #1), the staff record is never created. The dashboard layout checks `!staff` and redirects to `/onboarding`, but `/onboarding` doesn't check if an org already exists — creating a dead loop where:
- `/dashboard` → redirect to `/onboarding` (no staff)
- `/onboarding` → user creates org → 409 Conflict → stuck

The dashboard shows an infinite loading spinner because `isLoading` from `useAuth` resolves to `false` but `!staff` triggers a redirect to `/onboarding`, which can't complete.

**Fix:** Make onboarding resilient:
1. On mount, check if user already has an org but no staff → create just the staff record
2. Add a timeout/error boundary to the dashboard spinner
3. Add a "retry" or "contact support" button after 10s of spinner

---

### 3. `PAYMENT_STATUS` used inconsistently — receipt page may crash
**Severity:** 🟠 Medium  
**Files:** `src/lib/constants.ts` (lines 73-78), `src/app/receipt/[orderId]/page.tsx` (line 150)  
`PAYMENT_STATUS` is defined as:
```typescript
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  ...
}
```
But it's used on the receipt page as a label map: `PAYMENT_STATUS[order.payment.status]`. When `status` is `"pending"`, it returns `undefined` because the keys are `PENDING`, `COMPLETED`, etc. — not lowercase.

**Fix:** Create a `PAYMENT_STATUS_LABELS` map (like `ORDER_STATUS_LABELS` and `ITEM_STATUS_LABELS`) or use lowercase keys.

---

## 🟡 Supabase / SQL Issues

### 4. `"Public can view own feedback"` — still permissive in migration 001
**Severity:** 🟡 Low (only an issue if 003 migration hasn't been applied)  
**File:** `supabase/migrations/003_rls_fixes.sql` (line 38)  
Migration 003 correctly drops this policy. However, there's no guarantee all environments have run 003. The migration should document that it's a required fix.

---

### 5. Public SELECT on orders/order_items/payments is too broad
**Severity:** 🟠 Medium  
**File:** `supabase/migrations/003_rls_fixes.sql` (lines 128-138)  
```sql
CREATE POLICY "Public can view order by id" ON orders FOR SELECT USING (TRUE);
CREATE POLICY "Public can view order items by order" ON order_items FOR SELECT USING (TRUE);
CREATE POLICY "Public can view payment by order" ON payments FOR SELECT USING (TRUE);
```
These policies allow **anyone** to read **all** orders, items, and payments across all organizations. While needed for the public receipt page, they should be scoped to the specific order being viewed (e.g., require the user to know the order UUID).

**Fix:** These are acceptable if order UUIDs are treated as unguessable tokens. Document this security assumption.

---

## 🟠 Code Architecture Issues

### 6. `createClient()` called in component body (not memoized) on several pages
**Severity:** 🟠 Medium  
**Files:** `src/app/(dashboard)/dashboard/page.tsx` (line 33), `src/app/(dashboard)/dashboard/kitchen/page.tsx` (line 28), `src/app/(dashboard)/dashboard/waiter/page.tsx` (line 22), `src/app/(dashboard)/dashboard/staff/page.tsx` (line 33), `src/app/(dashboard)/dashboard/menu/page.tsx` (line 27), `src/app/onboarding/page.tsx` (line 19), `src/app/order/[branchId]/[tableNumber]/page.tsx` (line 32), `src/app/order/[branchId]/[tableNumber]/payment/page.tsx` (line 25), `src/app/receipt/[orderId]/page.tsx` (line 36)  

While the `useAuth` and `useRealtimeOrders` hooks were fixed to use `useState(() => createClient())`, many individual page components still call `createClient()` directly in the component body. This creates a new client instance on every render.

**Note:** `createBrowserClient` from `@supabase/ssr` may internally deduplicate, but it's still best practice to memoize.

**Fix:** Either use `useMemo(() => createClient(), [])` or create a custom hook `useSupabase()` that returns a singleton.

---

### 7. Sign-in page also calls `createClient()` in component body
**Severity:** 🟡 Low  
**File:** `src/app/(auth)/sign-in/page.tsx` (line 30)  
Same issue as #6 but in the `SignInForm` component. Since this is a form component that doesn't re-render frequently, impact is minimal.

---

### 8. Dishes not auto-added to `branch_dishes` when created via Menu page
**Severity:** 🟠 Medium  
**Files:** `src/app/(dashboard)/dashboard/menu/page.tsx` (line 109), `src/app/(dashboard)/dashboard/waiter/page.tsx` (line 41)  
When creating a dish via the Menu page, it's inserted into the `dishes` table but NOT into `branch_dishes`. The Waiter page queries `branch_dishes` for available dishes. If dishes aren't in `branch_dishes`, the waiter sees an empty menu.

**Fix:** After creating a dish, also insert into `branch_dishes` for the current branch:
```typescript
// After dish creation succeeds
await supabase.from("branch_dishes").insert({
  branch_id: branch.id,
  dish_id: newDish.id,
  is_available: true,
});
```

---

## 🔵 UI/UX Issues (Browser-Verified)

### 9. Mobile nav bar cramped at 375px width
**Severity:** 🟡 Low — **Verified via browser test**  
**File:** `src/app/page.tsx` (landing page nav section)  
At 375px viewport width, "RestaurantOS", theme toggle, "Sign In", and "Get Started" all compete for space in a single row. No hamburger menu or responsive nav. Consider collapsing into a mobile menu.

---

### 10. Sign-up page missing `autoComplete` attributes
**Severity:** 🟡 Low — **Verified via browser test (console warning)**  
**File:** `src/app/(auth)/sign-up/page.tsx` (lines 64-103)  
The sign-up form's `name`, `email`, `password`, and `confirmPassword` fields lack `autoComplete` attributes. This triggers browser warnings and degrades password manager UX.

**Fix:** Add:
```tsx
<Input autoComplete="name" {...register("name")} />
<Input autoComplete="email" {...register("email")} />
<Input autoComplete="new-password" {...register("password")} />
<Input autoComplete="new-password" {...register("confirmPassword")} />
```

---

### 11. `guide.md` says "Next.js 15" but actual version is 16.2.1
**Severity:** 🟡 Low  
**Files:** `guide.md` (line 259) vs `package.json` (line 24)  
The Tech Stack table says "Next.js 15 (App Router)" but `package.json` has `"next": "16.2.1"`. Middleware deprecation warning in dev server confirms this.

---

### 12. No confirmation dialog before sign-out
**Severity:** 🟡 Low  
**File:** `src/components/dashboard/sidebar.tsx` (line 160)  
The Sign Out button triggers immediately with no confirmation. Accidental clicks will lose any unsaved work.

---

### 13. Landing page doesn't reflect auth state
**Severity:** 🟡 Low  
**File:** `src/app/page.tsx`  
After signing in, the landing page still shows "Sign In" / "Get Started" buttons. The middleware redirects auth pages to `/dashboard`, but the landing page nav doesn't check session state.

---

## 📋 Summary Table

| # | Severity | Area | Issue | Fix Complexity |
|---|----------|------|-------|----------------|
| 1 | 🔴 Critical | Onboarding | Org creation 409 Conflict on retry — user stuck | Medium |
| 2 | 🔴 Critical | Dashboard | Infinite spinner — no staff record created | Medium |
| 3 | 🟠 Medium | Receipt | `PAYMENT_STATUS` used as labels — wrong keys | Easy |
| 4 | 🟡 Low | SQL | Feedback policy only fixed in migration 003 | N/A |
| 5 | 🟠 Medium | SQL | Public SELECT on orders/items/payments too broad | Medium |
| 6 | 🟠 Medium | Architecture | `createClient()` not memoized in 9 page components | Easy |
| 7 | 🟡 Low | Auth | Sign-in `createClient()` in component body | Easy |
| 8 | 🟠 Medium | Menu/Waiter | Dishes not auto-added to `branch_dishes` | Easy |
| 9 | 🟡 Low | UI/UX | Mobile nav cramped at 375px | Medium |
| 10 | 🟡 Low | Auth | Sign-up missing `autoComplete` attributes | Easy |
| 11 | 🟡 Low | Docs | `guide.md` says Next.js 15, actual is 16.2.1 | Easy |
| 12 | 🟡 Low | UX | No sign-out confirmation dialog | Easy |
| 13 | 🟡 Low | UX | Landing page doesn't reflect auth state | Medium |
