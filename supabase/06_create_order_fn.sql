-- 06_create_order_fn.sql
-- Transactional order creation. Replaces the multi-insert pattern in the API
-- route (orders -> order_items -> payments with manual rollback), which could
-- leave partial state on failure.
--
-- Everything happens in one transaction:
--   validate branch/table -> price items server-side -> insert order,
--   items, pending UPI payment -> mark table occupied.
--
-- Pricing is authoritative here (branch_dishes.custom_price falling back to
-- dishes.price); client-supplied prices are ignored, preventing price spoofing.
--
-- Errors are raised with stable codes the API maps to HTTP responses:
--   BRANCH_NOT_FOUND | TABLE_NOT_FOUND | DISH_UNAVAILABLE | EMPTY_ORDER

create or replace function create_order(
  p_branch_id uuid,
  p_items jsonb,
  p_table_number int default null,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_waiter_id uuid default null,
  p_order_type text default 'dine_in',
  p_order_source text default 'qr_customer',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tax_percent numeric;
  v_tax_inclusive boolean;
  v_subtotal numeric;
  v_taxable numeric;
  v_tax numeric;
  v_total numeric;
  v_out_subtotal numeric;
  v_bad_items int;
  v_order orders%rowtype;
  v_order_number text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  if p_order_type not in ('dine_in', 'takeaway', 'delivery') then
    p_order_type := 'dine_in';
  end if;
  if p_order_source not in ('waiter', 'qr_customer', 'cashier') then
    p_order_source := 'qr_customer';
  end if;

  select o.default_tax_percent, o.tax_inclusive
    into v_tax_percent, v_tax_inclusive
  from branches b
  join organizations o on o.id = b.org_id
  where b.id = p_branch_id and b.is_active = true;

  if not found then
    raise exception 'BRANCH_NOT_FOUND';
  end if;

  if p_table_number is not null then
    perform 1 from tables
    where branch_id = p_branch_id and table_number = p_table_number and is_active = true;
    if not found then
      raise exception 'TABLE_NOT_FOUND';
    end if;
  end if;

  -- Server-side pricing: any requested dish that is missing, inactive, or
  -- unavailable at this branch aborts the whole order.
  with requested as (
    select
      (i->>'dish_id')::uuid as dish_id,
      greatest(1, least(50, coalesce(nullif(i->>'quantity','')::int, 1))) as quantity
    from jsonb_array_elements(p_items) i
  ),
  priced as (
    select
      r.dish_id,
      r.quantity,
      coalesce(bd.custom_price, d.price) as price,
      (bd.dish_id is not null and bd.is_available and d.is_active) as ok
    from requested r
    left join branch_dishes bd on bd.branch_id = p_branch_id and bd.dish_id = r.dish_id
    left join dishes d on d.id = r.dish_id
  )
  select
    count(*) filter (where not ok or price is null),
    coalesce(sum(quantity * price) filter (where ok), 0)
  into v_bad_items, v_subtotal
  from priced;

  if v_bad_items > 0 then
    raise exception 'DISH_UNAVAILABLE';
  end if;

  -- Totals: mirrors calculateTotals() in src/lib/utils.ts (discount = 0 at creation).
  v_taxable := v_subtotal;
  if v_tax_inclusive then
    v_tax := round(v_taxable - v_taxable / (1 + coalesce(v_tax_percent, 5) / 100.0), 2);
    v_out_subtotal := round(v_taxable - v_tax, 2);
    v_total := round(v_taxable, 2);
  else
    v_tax := round(v_taxable * coalesce(v_tax_percent, 5) / 100.0, 2);
    v_out_subtotal := round(v_taxable, 2);
    v_total := round(v_taxable + v_tax, 2);
  end if;

  -- ORD-DDMM-XXXX, matching orderNumber() in src/lib/utils.ts
  v_order_number := 'ORD-'
    || to_char(now(), 'DDMM') || '-'
    || upper(substr(md5(gen_random_uuid()::text), 1, 4));

  insert into orders (
    order_number, branch_id, table_number, customer_name, customer_phone,
    waiter_id, order_type, order_source, status,
    subtotal, tax, discount, total, notes
  ) values (
    v_order_number, p_branch_id, p_table_number, nullif(p_customer_name, ''), nullif(p_customer_phone, ''),
    p_waiter_id, p_order_type, p_order_source, 'pending',
    v_out_subtotal, v_tax, 0, v_total, nullif(p_notes, '')
  )
  returning * into v_order;

  insert into order_items (order_id, branch_id, dish_id, dish_name, quantity, price_at_order, notes, status)
  select
    v_order.id,
    p_branch_id,
    r.dish_id,
    d.name,
    r.quantity,
    coalesce(bd.custom_price, d.price),
    r.notes,
    'pending'
  from (
    select
      (i->>'dish_id')::uuid as dish_id,
      greatest(1, least(50, coalesce(nullif(i->>'quantity','')::int, 1))) as quantity,
      nullif(i->>'notes', '') as notes
    from jsonb_array_elements(p_items) i
  ) r
  join branch_dishes bd on bd.branch_id = p_branch_id and bd.dish_id = r.dish_id
  join dishes d on d.id = r.dish_id;

  insert into payments (order_id, branch_id, amount, method, status)
  values (v_order.id, p_branch_id, v_total, 'upi', 'pending');

  if p_table_number is not null then
    update tables set status = 'occupied'
    where branch_id = p_branch_id and table_number = p_table_number;
  end if;

  return to_jsonb(v_order);
end;
$$;

-- Only the service role (our API routes) may call this directly. The public
-- QR flow goes through POST /api/orders, never straight to PostgREST RPC.
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from public;
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from anon;
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from authenticated;
