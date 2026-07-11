-- 11_discounts_split_payments.sql
-- 1. Totals v3: discount pass. Discount applies to the ex-tax food value;
--    service charge and GST are computed on the discounted base. Printed
--    lines always sum: subtotal - discount + service + tax = total.
-- 2. apply_discount(): manager-gated (enforced at API), only on open orders,
--    clamped to the subtotal, reason logged to activity_logs.
-- 3. Split payments: the pending payment row now tracks the REMAINING due
--    (total - completed payments), so cashiers can take part cash, part UPI.

create or replace function order_totals_v3(
  p_items_total numeric,
  p_tax_percent numeric,
  p_tax_inclusive boolean,
  p_service_charge_percent numeric,
  p_composition boolean,
  p_discount numeric default 0
)
returns table (sub numeric, disc numeric, service numeric, tax numeric, total numeric)
language plpgsql
immutable
as $$
declare
  v_rate numeric := case when p_composition then 0 else coalesce(p_tax_percent, 5) end;
  v_ex numeric;
  v_disc numeric;
  v_base numeric;
  v_sc numeric;
  v_tax numeric;
begin
  v_ex := round(case when p_tax_inclusive and v_rate > 0
    then p_items_total / (1 + v_rate / 100.0)
    else p_items_total end, 2);
  v_disc := round(least(greatest(coalesce(p_discount, 0), 0), v_ex), 2);
  v_base := v_ex - v_disc;
  v_sc := round(v_base * coalesce(p_service_charge_percent, 0) / 100.0, 2);
  v_tax := round((v_base + v_sc) * v_rate / 100.0, 2);
  return query select v_ex, v_disc, v_sc, v_tax, v_base + v_sc + v_tax;
end;
$$;

-- Recompute now: (a) preserves the order's stored discount, (b) sets the
-- pending payment to the REMAINING due after completed partials.
create or replace function recompute_order_totals(p_order_id uuid)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_tax_percent numeric;
  v_tax_inclusive boolean;
  v_sc_percent numeric;
  v_composition boolean;
  v_items_total numeric;
  v_paid numeric;
begin
  select o.default_tax_percent, o.tax_inclusive, o.service_charge_percent, (o.gst_scheme = 'composition')
    into v_tax_percent, v_tax_inclusive, v_sc_percent, v_composition
  from orders ord
  join branches b on b.id = ord.branch_id
  join organizations o on o.id = b.org_id
  where ord.id = p_order_id;

  select coalesce(sum(quantity * (price_at_order + addon_total)), 0)
    into v_items_total
  from order_items where order_id = p_order_id and status <> 'cancelled';

  update orders o
  set subtotal = t.sub, discount = t.disc, service_charge = t.service, tax = t.tax, total = t.total
  from order_totals_v3(v_items_total, v_tax_percent, v_tax_inclusive, v_sc_percent, v_composition,
                       (select discount from orders where id = p_order_id)) t
  where o.id = p_order_id
  returning o.* into v_order;

  select coalesce(sum(amount), 0) into v_paid
  from payments where order_id = p_order_id and status = 'completed';

  update payments set amount = greatest(v_order.total - v_paid, 0)
  where order_id = p_order_id and status = 'pending';

  return v_order;
end;
$$;

-- Manager applies a flat discount to an OPEN order. Percent is resolved to a
-- flat amount by the caller so the audit trail shows the exact rupee value.
create or replace function apply_discount(
  p_order_id uuid,
  p_amount numeric,
  p_reason text default null,
  p_staff_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status in ('served','cancelled') then raise exception 'ORDER_CLOSED'; end if;
  if coalesce(p_amount, -1) < 0 then raise exception 'INVALID_DISCOUNT'; end if;

  update orders set discount = round(p_amount, 2) where id = p_order_id;
  v_order := recompute_order_totals(p_order_id);

  insert into activity_logs (org_id, branch_id, staff_id, action, entity_type, entity_id, metadata)
  select b.org_id, v_order.branch_id, p_staff_id, 'discount_applied', 'order', v_order.id,
         jsonb_build_object('amount', round(p_amount, 2), 'reason', nullif(p_reason, ''), 'order_number', v_order.order_number)
  from branches b where b.id = v_order.branch_id;

  return to_jsonb(v_order);
end;
$$;

revoke execute on function apply_discount(uuid, numeric, text, uuid) from public;
revoke execute on function apply_discount(uuid, numeric, text, uuid) from anon;
revoke execute on function apply_discount(uuid, numeric, text, uuid) from authenticated;

-- Record a partial (split) payment: inserts a completed payment for the
-- given amount and shrinks the pending row to the remainder. Invoice number
-- is assigned by the existing trigger when the FIRST completed payment lands.
create or replace function record_split_payment(
  p_order_id uuid,
  p_amount numeric,
  p_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_pending payments%rowtype;
  v_paid numeric;
  v_due numeric;
begin
  if p_method not in ('cash','upi','card') then raise exception 'INVALID_METHOD'; end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'cancelled' then raise exception 'ORDER_CLOSED'; end if;

  select coalesce(sum(amount), 0) into v_paid
  from payments where order_id = p_order_id and status = 'completed';
  v_due := v_order.total - v_paid;

  if coalesce(p_amount, 0) <= 0 or p_amount > v_due + 0.01 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_pending from payments
  where order_id = p_order_id and status = 'pending'
  order by created_at limit 1 for update;

  if round(p_amount, 2) >= round(v_due, 2) then
    -- full remaining amount: complete the pending row itself
    if found then
      update payments set amount = round(v_due, 2), method = p_method, status = 'completed'
      where id = v_pending.id;
    else
      insert into payments (order_id, branch_id, amount, method, status)
      values (p_order_id, v_order.branch_id, round(v_due, 2), p_method, 'completed');
    end if;
  else
    insert into payments (order_id, branch_id, amount, method, status)
    values (p_order_id, v_order.branch_id, round(p_amount, 2), p_method, 'completed');
    if found then
      update payments set amount = round(v_due - p_amount, 2) where id = v_pending.id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paid', round(v_paid + least(p_amount, v_due), 2),
    'remaining', greatest(round(v_due - p_amount, 2), 0),
    'settled', round(p_amount, 2) >= round(v_due, 2)
  );
end;
$$;

revoke execute on function record_split_payment(uuid, numeric, text) from public;
revoke execute on function record_split_payment(uuid, numeric, text) from anon;
revoke execute on function record_split_payment(uuid, numeric, text) from authenticated;
