-- 09_variants_addons_open_orders.sql
-- Indian-menu essentials + open-order editing:
--   1. dish_variants  — Half/Full/Quarter plate with own prices
--   2. dish_addons    — extra cheese, butter, spice level etc.
--   3. order_items gains variant/addon snapshots (names+prices frozen at order time)
--   4. orders.order_type gains 'counter' (token-based QSR mode, no table)
--   5. create_order() v2 — variant/addon aware, still fully transactional
--   6. add_order_items() / remove_order_item() — edit an OPEN order
--      (waiter adds a round of naan, removes a wrong item) with totals
--      recomputed atomically. Blocked once the order is served/cancelled.

-- 1. Variants -----------------------------------------------------------
create table if not exists dish_variants (
  id uuid primary key default uuid_generate_v4(),
  dish_id uuid not null references dishes(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (dish_id, name)
);
create index if not exists dish_variants_dish_idx on dish_variants (dish_id);
alter table dish_variants enable row level security;

drop policy if exists dish_variants_select on dish_variants;
create policy dish_variants_select on dish_variants for select using (true);

drop policy if exists dish_variants_manage on dish_variants;
create policy dish_variants_manage on dish_variants
for all using (
  exists (select 1 from dishes d where d.id = dish_variants.dish_id and d.org_id = app_user_org_id())
  and app_user_has_role('owner','admin','manager','kitchen')
)
with check (
  exists (select 1 from dishes d where d.id = dish_variants.dish_id and d.org_id = app_user_org_id())
);

-- 2. Add-ons ------------------------------------------------------------
create table if not exists dish_addons (
  id uuid primary key default uuid_generate_v4(),
  dish_id uuid not null references dishes(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (dish_id, name)
);
create index if not exists dish_addons_dish_idx on dish_addons (dish_id);
alter table dish_addons enable row level security;

drop policy if exists dish_addons_select on dish_addons;
create policy dish_addons_select on dish_addons for select using (true);

drop policy if exists dish_addons_manage on dish_addons;
create policy dish_addons_manage on dish_addons
for all using (
  exists (select 1 from dishes d where d.id = dish_addons.dish_id and d.org_id = app_user_org_id())
  and app_user_has_role('owner','admin','manager')
)
with check (
  exists (select 1 from dishes d where d.id = dish_addons.dish_id and d.org_id = app_user_org_id())
);

-- 3. Order item snapshots ------------------------------------------------
alter table order_items add column if not exists variant_id uuid references dish_variants(id) on delete set null;
alter table order_items add column if not exists variant_name text;
-- addons snapshot: [{"name":"Extra cheese","price":30}] — frozen at order time
alter table order_items add column if not exists addons jsonb not null default '[]'::jsonb;
-- per-unit addon total, so line total = quantity * (price_at_order + addon_total)
alter table order_items add column if not exists addon_total numeric(10,2) not null default 0;

-- 4. Counter (token) mode -------------------------------------------------
alter table orders drop constraint if exists orders_order_type_check;
alter table orders add constraint orders_order_type_check
  check (order_type in ('dine_in','takeaway','delivery','counter'));

-- 5. create_order v2 ------------------------------------------------------
-- items: [{dish_id, quantity, notes?, variant_id?, addon_ids?: uuid[]}]
-- Pricing: variant price when variant_id given (must belong to the dish and be
-- available), else branch custom price, else dish base price. Addon prices are
-- summed per unit. All server-side; client prices ignored.
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

  select o.default_tax_percent, o.tax_inclusive
    into v_tax_percent, v_tax_inclusive
  from branches b join organizations o on o.id = b.org_id
  where b.id = p_branch_id and b.is_active = true;
  if not found then raise exception 'BRANCH_NOT_FOUND'; end if;

  if p_table_number is not null and p_order_type = 'dine_in' then
    perform 1 from tables
    where branch_id = p_branch_id and table_number = p_table_number and is_active = true;
    if not found then raise exception 'TABLE_NOT_FOUND'; end if;
  end if;

  -- price + validate every line
  create temporary table if not exists _order_lines (
    dish_id uuid, variant_id uuid, quantity int, notes text,
    dish_name text, variant_name text, unit_price numeric,
    addons jsonb, addon_total numeric, ok boolean
  ) on commit drop;
  delete from _order_lines;

  insert into _order_lines
  select
    r.dish_id,
    r.variant_id,
    r.quantity,
    r.notes,
    d.name,
    dv.name,
    coalesce(dv.price, bd.custom_price, d.price),
    coalesce(a.addons, '[]'::jsonb),
    coalesce(a.total, 0),
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
    waiter_id, order_type, order_source, status, subtotal, tax, discount, total, notes
  )
  select
    'ORD-' || to_char(now(), 'DDMM') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)),
    p_branch_id,
    case when p_order_type = 'dine_in' then p_table_number else null end,
    nullif(p_customer_name,''), nullif(p_customer_phone,''),
    p_waiter_id, p_order_type, p_order_source, 'pending',
    t.sub, t.tax, 0, t.total, nullif(p_notes,'')
  from order_totals(v_subtotal, v_tax_percent, v_tax_inclusive) t
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

-- shared totals math (mirrors calculateTotals in src/lib/utils.ts)
create or replace function order_totals(p_taxable numeric, p_tax_percent numeric, p_tax_inclusive boolean)
returns table (sub numeric, tax numeric, total numeric)
language sql
immutable
as $$
  select
    case when p_tax_inclusive
      then round(p_taxable - (p_taxable - p_taxable / (1 + coalesce(p_tax_percent,5)/100.0)), 2)
      else round(p_taxable, 2) end,
    case when p_tax_inclusive
      then round(p_taxable - p_taxable / (1 + coalesce(p_tax_percent,5)/100.0), 2)
      else round(p_taxable * coalesce(p_tax_percent,5)/100.0, 2) end,
    case when p_tax_inclusive
      then round(p_taxable, 2)
      else round(p_taxable + p_taxable * coalesce(p_tax_percent,5)/100.0, 2) end;
$$;

revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from public;
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from anon;
revoke execute on function create_order(uuid, jsonb, int, text, text, uuid, text, text, text) from authenticated;

-- 6. Open-order editing ---------------------------------------------------
-- Add lines to an open order. Same item format as create_order.
create or replace function add_order_items(p_order_id uuid, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_tax_percent numeric;
  v_tax_inclusive boolean;
  v_added numeric;
  v_new_taxable numeric;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status in ('served','cancelled') then raise exception 'ORDER_CLOSED'; end if;

  select o.default_tax_percent, o.tax_inclusive
    into v_tax_percent, v_tax_inclusive
  from branches b join organizations o on o.id = b.org_id
  where b.id = v_order.branch_id;

  -- reuse create_order pricing by inserting via the same validation path
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

  -- recompute order totals from ALL non-cancelled items
  select coalesce(sum(quantity * (price_at_order + addon_total)), 0)
    into v_new_taxable
  from order_items where order_id = p_order_id and status <> 'cancelled';

  update orders o set subtotal = t.sub, tax = t.tax, total = t.total
  from order_totals(v_new_taxable, v_tax_percent, v_tax_inclusive) t
  where o.id = p_order_id
  returning o.* into v_order;

  update payments set amount = v_order.total
  where order_id = p_order_id and status = 'pending';

  return to_jsonb(v_order);
end;
$$;

-- Cancel a single line on an open order (soft: status -> cancelled), totals recomputed.
create or replace function remove_order_item(p_order_id uuid, p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_tax_percent numeric;
  v_tax_inclusive boolean;
  v_new_taxable numeric;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status in ('served','cancelled') then raise exception 'ORDER_CLOSED'; end if;

  update order_items set status = 'cancelled'
  where id = p_item_id and order_id = p_order_id and status <> 'cancelled';
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;

  select o.default_tax_percent, o.tax_inclusive
    into v_tax_percent, v_tax_inclusive
  from branches b join organizations o on o.id = b.org_id
  where b.id = v_order.branch_id;

  select coalesce(sum(quantity * (price_at_order + addon_total)), 0)
    into v_new_taxable
  from order_items where order_id = p_order_id and status <> 'cancelled';

  update orders o set subtotal = t.sub, tax = t.tax, total = t.total
  from order_totals(v_new_taxable, v_tax_percent, v_tax_inclusive) t
  where o.id = p_order_id
  returning o.* into v_order;

  update payments set amount = v_order.total
  where order_id = p_order_id and status = 'pending';

  return to_jsonb(v_order);
end;
$$;

revoke execute on function add_order_items(uuid, jsonb) from public;
revoke execute on function add_order_items(uuid, jsonb) from anon;
revoke execute on function add_order_items(uuid, jsonb) from authenticated;
revoke execute on function remove_order_item(uuid, uuid) from public;
revoke execute on function remove_order_item(uuid, uuid) from anon;
revoke execute on function remove_order_item(uuid, uuid) from authenticated;
