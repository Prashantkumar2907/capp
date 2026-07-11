-- 10_gst_compliance.sql
-- India compliance core:
--   1. Org fields: fssai_license, service_charge_percent, gst_scheme
--   2. Orders: service_charge + invoice_number snapshots
--   3. Sequential GST invoice numbering per branch per financial year
--      (Apr-Mar), assigned automatically when payment completes
--   4. create_order v3: service charge in totals; composition-scheme orgs
--      charge no GST on the invoice (they pay composition tax themselves)
--
-- Service charge rule (uniform for inclusive & exclusive pricing):
--   ex_subtotal = tax_inclusive ? items/(1+r) : items
--   service     = ex_subtotal * sc%/100          (voluntary; 0 by default)
--   tax         = (ex_subtotal + service) * r/100   (0 for composition)
--   total       = ex_subtotal + service + tax

-- 1. Org fields ------------------------------------------------------------
alter table organizations add column if not exists fssai_license text;
alter table organizations add column if not exists service_charge_percent numeric(5,2) not null default 0;
alter table organizations add column if not exists gst_scheme text not null default 'regular';
do $$
begin
  alter table organizations add constraint organizations_gst_scheme_check check (gst_scheme in ('regular','composition'));
exception when duplicate_object then null;
end $$;

-- 2. Order snapshots ---------------------------------------------------------
alter table orders add column if not exists service_charge numeric(10,2) not null default 0;
alter table orders add column if not exists invoice_number text;

-- 3. Invoice numbering -------------------------------------------------------
create table if not exists invoice_counters (
  branch_id uuid not null references branches(id) on delete cascade,
  fy text not null,               -- '2526' for FY 2025-26 (Apr 2025 - Mar 2026)
  last_number int not null default 0,
  primary key (branch_id, fy)
);
alter table invoice_counters enable row level security;
-- counters are only touched by security-definer functions; no direct client access
drop policy if exists invoice_counters_none on invoice_counters;
create policy invoice_counters_none on invoice_counters for select using (false);

-- current Indian financial year token: Apr-Mar, e.g. 2025-06-15 -> '2526'
create or replace function current_fy(p_at timestamptz default now())
returns text
language sql
stable
as $$
  select case
    when extract(month from p_at) >= 4
      then to_char(p_at, 'YY') || to_char(p_at + interval '1 year', 'YY')
    else to_char(p_at - interval '1 year', 'YY') || to_char(p_at, 'YY')
  end;
$$;

-- Atomically issue the next invoice number for a branch: INV/2526/000042
create or replace function next_invoice_number(p_branch_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fy text := current_fy();
  v_n int;
begin
  insert into invoice_counters (branch_id, fy, last_number)
  values (p_branch_id, v_fy, 1)
  on conflict (branch_id, fy)
  do update set last_number = invoice_counters.last_number + 1
  returning last_number into v_n;
  return 'INV/' || v_fy || '/' || lpad(v_n::text, 6, '0');
end;
$$;

-- Assign the invoice number the moment the first payment completes.
create or replace function assign_invoice_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    update orders
    set invoice_number = next_invoice_number(new.branch_id)
    where id = new.order_id and invoice_number is null;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_invoice_assign on payments;
create trigger payment_invoice_assign
after update on payments
for each row execute function assign_invoice_on_payment();

-- also cover payments inserted directly as completed (cash settle)
create or replace function assign_invoice_on_payment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' then
    update orders
    set invoice_number = next_invoice_number(new.branch_id)
    where id = new.order_id and invoice_number is null;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_invoice_assign_insert on payments;
create trigger payment_invoice_assign_insert
after insert on payments
for each row execute function assign_invoice_on_payment_insert();

-- 4. Totals + create_order v3 -----------------------------------------------
-- Extended totals: returns service charge too. Composition orgs charge no GST.
create or replace function order_totals_v2(
  p_items_total numeric,
  p_tax_percent numeric,
  p_tax_inclusive boolean,
  p_service_charge_percent numeric,
  p_composition boolean
)
returns table (sub numeric, service numeric, tax numeric, total numeric)
language plpgsql
immutable
as $$
declare
  v_rate numeric := case when p_composition then 0 else coalesce(p_tax_percent, 5) end;
  v_ex numeric;
  v_sc numeric;
  v_tax numeric;
begin
  v_ex := round(case when p_tax_inclusive and v_rate > 0
    then p_items_total / (1 + v_rate / 100.0)
    else p_items_total end, 2);
  v_sc := round(v_ex * coalesce(p_service_charge_percent, 0) / 100.0, 2);
  v_tax := round((v_ex + v_sc) * v_rate / 100.0, 2);
  -- total must equal the sum of the printed components (GST invoice rule)
  return query select v_ex, v_sc, v_tax, v_ex + v_sc + v_tax;
end;
$$;

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
  v_sc_percent numeric;
  v_composition boolean;
  v_subtotal numeric;
  v_bad int;
  v_order orders%rowtype;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  if p_order_type not in ('dine_in','takeaway','delivery','counter') then
    p_order_type := 'dine_in';
  end if;
  if p_order_source not in ('waiter','qr_customer','cashier') then
    p_order_source := 'qr_customer';
  end if;

  select o.default_tax_percent, o.tax_inclusive, o.service_charge_percent, (o.gst_scheme = 'composition')
    into v_tax_percent, v_tax_inclusive, v_sc_percent, v_composition
  from branches b join organizations o on o.id = b.org_id
  where b.id = p_branch_id and b.is_active = true;
  if not found then raise exception 'BRANCH_NOT_FOUND'; end if;

  if p_table_number is not null and p_order_type = 'dine_in' then
    perform 1 from tables
    where branch_id = p_branch_id and table_number = p_table_number and is_active = true;
    if not found then raise exception 'TABLE_NOT_FOUND'; end if;
  end if;

  create temporary table if not exists _order_lines (
    dish_id uuid, variant_id uuid, quantity int, notes text,
    dish_name text, variant_name text, unit_price numeric,
    addons jsonb, addon_total numeric, ok boolean
  ) on commit drop;
  delete from _order_lines;

  insert into _order_lines
  select
    r.dish_id, r.variant_id, r.quantity, r.notes, d.name, dv.name,
    coalesce(dv.price, bd.custom_price, d.price),
    coalesce(a.addons, '[]'::jsonb), coalesce(a.total, 0),
    (
      bd.dish_id is not null and bd.is_available and d.is_active
      and (r.variant_id is null or (dv.id is not null and dv.is_available))
      and (a.requested_count is null or a.requested_count = a.matched_count)
    )
  from (
    select
      (i->>'dish_id')::uuid as dish_id,
      nullif(i->>'variant_id','')::uuid as variant_id,
      greatest(1, least(50, coalesce(nullif(i->>'quantity','')::int, 1))) as quantity,
      nullif(i->>'notes','') as notes,
      case when i ? 'addon_ids' and jsonb_typeof(i->'addon_ids') = 'array'
           then i->'addon_ids' else '[]'::jsonb end as addon_ids
    from jsonb_array_elements(p_items) i
  ) r
  left join branch_dishes bd on bd.branch_id = p_branch_id and bd.dish_id = r.dish_id
  left join dishes d on d.id = r.dish_id
  left join dish_variants dv on dv.id = r.variant_id and dv.dish_id = r.dish_id
  left join lateral (
    select
      jsonb_agg(jsonb_build_object('name', da.name, 'price', da.price) order by da.sort_order) as addons,
      sum(da.price) as total,
      jsonb_array_length(r.addon_ids) as requested_count,
      count(da.id) as matched_count
    from jsonb_array_elements_text(r.addon_ids) aid
    join dish_addons da on da.id = aid::uuid and da.dish_id = r.dish_id and da.is_available
  ) a on jsonb_array_length(r.addon_ids) > 0;

  select count(*) filter (where not ok or unit_price is null),
         coalesce(sum(quantity * (unit_price + addon_total)) filter (where ok), 0)
    into v_bad, v_subtotal
  from _order_lines;

  if v_bad > 0 then raise exception 'DISH_UNAVAILABLE'; end if;

  insert into orders (
    order_number, branch_id, table_number, customer_name, customer_phone,
    waiter_id, order_type, order_source, status,
    subtotal, service_charge, tax, discount, total, notes
  )
  select
    'ORD-' || to_char(now(), 'DDMM') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)),
    p_branch_id,
    case when p_order_type = 'dine_in' then p_table_number else null end,
    nullif(p_customer_name,''), nullif(p_customer_phone,''),
    p_waiter_id, p_order_type, p_order_source, 'pending',
    t.sub, t.service, t.tax, 0, t.total, nullif(p_notes,'')
  from order_totals_v2(v_subtotal, v_tax_percent, v_tax_inclusive, v_sc_percent, v_composition) t
  returning * into v_order;

  insert into order_items (order_id, branch_id, dish_id, variant_id, dish_name, variant_name, quantity, price_at_order, addons, addon_total, notes, status)
  select v_order.id, p_branch_id, dish_id, variant_id, dish_name, variant_name, quantity, unit_price, addons, addon_total, notes, 'pending'
  from _order_lines;

  insert into payments (order_id, branch_id, amount, method, status)
  values (v_order.id, p_branch_id, v_order.total, 'upi', 'pending');

  if v_order.table_number is not null then
    update tables set status = 'occupied'
    where branch_id = p_branch_id and table_number = v_order.table_number;
  end if;

  return to_jsonb(v_order);
end;
$$;

revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from public;
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from anon;
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from authenticated;
revoke execute on function next_invoice_number(uuid) from public;
revoke execute on function next_invoice_number(uuid) from anon;
revoke execute on function next_invoice_number(uuid) from authenticated;

-- open-order edits must respect service charge + composition too
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
  set subtotal = t.sub, service_charge = t.service, tax = t.tax, total = t.total
  from order_totals_v2(v_items_total, v_tax_percent, v_tax_inclusive, v_sc_percent, v_composition) t
  where o.id = p_order_id
  returning o.* into v_order;

  update payments set amount = v_order.total
  where order_id = p_order_id and status = 'pending';

  return v_order;
end;
$$;

create or replace function add_order_items(p_order_id uuid, p_items jsonb)
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

  create temporary table if not exists _add_lines (
    dish_id uuid, variant_id uuid, quantity int, notes text,
    dish_name text, variant_name text, unit_price numeric,
    addons jsonb, addon_total numeric, ok boolean
  ) on commit drop;
  delete from _add_lines;

  insert into _add_lines
  select
    r.dish_id, r.variant_id, r.quantity, r.notes, d.name, dv.name,
    coalesce(dv.price, bd.custom_price, d.price),
    coalesce(a.addons, '[]'::jsonb), coalesce(a.total, 0),
    (
      bd.dish_id is not null and bd.is_available and d.is_active
      and (r.variant_id is null or (dv.id is not null and dv.is_available))
      and (a.requested_count is null or a.requested_count = a.matched_count)
    )
  from (
    select
      (i->>'dish_id')::uuid as dish_id,
      nullif(i->>'variant_id','')::uuid as variant_id,
      greatest(1, least(50, coalesce(nullif(i->>'quantity','')::int, 1))) as quantity,
      nullif(i->>'notes','') as notes,
      case when i ? 'addon_ids' and jsonb_typeof(i->'addon_ids') = 'array'
           then i->'addon_ids' else '[]'::jsonb end as addon_ids
    from jsonb_array_elements(p_items) i
  ) r
  left join branch_dishes bd on bd.branch_id = v_order.branch_id and bd.dish_id = r.dish_id
  left join dishes d on d.id = r.dish_id
  left join dish_variants dv on dv.id = r.variant_id and dv.dish_id = r.dish_id
  left join lateral (
    select
      jsonb_agg(jsonb_build_object('name', da.name, 'price', da.price) order by da.sort_order) as addons,
      sum(da.price) as total,
      jsonb_array_length(r.addon_ids) as requested_count,
      count(da.id) as matched_count
    from jsonb_array_elements_text(r.addon_ids) aid
    join dish_addons da on da.id = aid::uuid and da.dish_id = r.dish_id and da.is_available
  ) a on jsonb_array_length(r.addon_ids) > 0;

  if exists (select 1 from _add_lines where not ok or unit_price is null) then
    raise exception 'DISH_UNAVAILABLE';
  end if;

  insert into order_items (order_id, branch_id, dish_id, variant_id, dish_name, variant_name, quantity, price_at_order, addons, addon_total, notes, status)
  select p_order_id, v_order.branch_id, dish_id, variant_id, dish_name, variant_name, quantity, unit_price, addons, addon_total, notes, 'pending'
  from _add_lines;

  v_order := recompute_order_totals(p_order_id);
  return to_jsonb(v_order);
end;
$$;

create or replace function remove_order_item(p_order_id uuid, p_item_id uuid)
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

  update order_items set status = 'cancelled'
  where id = p_item_id and order_id = p_order_id and status <> 'cancelled';
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;

  v_order := recompute_order_totals(p_order_id);
  return to_jsonb(v_order);
end;
$$;

revoke execute on function add_order_items(uuid, jsonb) from public;
revoke execute on function add_order_items(uuid, jsonb) from anon;
revoke execute on function add_order_items(uuid, jsonb) from authenticated;
revoke execute on function remove_order_item(uuid, uuid) from public;
revoke execute on function remove_order_item(uuid, uuid) from anon;
revoke execute on function remove_order_item(uuid, uuid) from authenticated;
revoke execute on function recompute_order_totals(uuid) from public;
revoke execute on function recompute_order_totals(uuid) from anon;
revoke execute on function recompute_order_totals(uuid) from authenticated;
