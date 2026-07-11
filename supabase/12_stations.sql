-- 12_stations.sql
-- Station routing for large kitchens: tandoor, chinese, bar, dessert etc.
-- Categories map to a station; every order item snapshots its station at
-- order time, so each kitchen screen filters to its own tickets even if the
-- category mapping changes later.

create table if not exists stations (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (branch_id, name)
);
create index if not exists stations_branch_idx on stations (branch_id);
alter table stations enable row level security;

drop policy if exists stations_select on stations;
create policy stations_select on stations
for select using (
  exists (select 1 from branches b where b.id = stations.branch_id and b.org_id = app_user_org_id())
);

drop policy if exists stations_manage on stations;
create policy stations_manage on stations
for all using (
  app_user_can_manage_branch(branch_id) and app_user_has_role('owner','admin','manager')
)
with check (app_user_can_manage_branch(branch_id));

-- category -> station mapping (org-level categories; station is per-branch,
-- so the mapping applies wherever that branch serves the category)
alter table categories add column if not exists station_id uuid references stations(id) on delete set null;

-- snapshot on items so tickets stay stable
alter table order_items add column if not exists station_id uuid references stations(id) on delete set null;
alter table order_items add column if not exists station_name text;

-- create_order + add_order_items: fill station snapshot from the dish's category
create or replace function station_for_dish(p_dish_id uuid)
returns table (station_id uuid, station_name text)
language sql
stable
as $$
  select st.id, st.name
  from dishes d
  join categories c on c.id = d.category_id
  join stations st on st.id = c.station_id
  where d.id = p_dish_id;
$$;

-- Patch the item-insert paths: recreate both functions with station columns.
-- (Full bodies kept identical to 10/11 apart from the station snapshot.)
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
    subtotal, discount, service_charge, tax, total, notes
  )
  select
    'ORD-' || to_char(now(), 'DDMM') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)),
    p_branch_id,
    case when p_order_type = 'dine_in' then p_table_number else null end,
    nullif(p_customer_name,''), nullif(p_customer_phone,''),
    p_waiter_id, p_order_type, p_order_source, 'pending',
    t.sub, t.disc, t.service, t.tax, t.total, nullif(p_notes,'')
  from order_totals_v3(v_subtotal, v_tax_percent, v_tax_inclusive, v_sc_percent, v_composition, 0) t
  returning * into v_order;

  insert into order_items (order_id, branch_id, dish_id, variant_id, dish_name, variant_name, quantity, price_at_order, addons, addon_total, notes, status, station_id, station_name)
  select v_order.id, p_branch_id, l.dish_id, l.variant_id, l.dish_name, l.variant_name, l.quantity, l.unit_price, l.addons, l.addon_total, l.notes, 'pending', s.station_id, s.station_name
  from _order_lines l
  left join lateral station_for_dish(l.dish_id) s on true;

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

  insert into order_items (order_id, branch_id, dish_id, variant_id, dish_name, variant_name, quantity, price_at_order, addons, addon_total, notes, status, station_id, station_name)
  select p_order_id, v_order.branch_id, l.dish_id, l.variant_id, l.dish_name, l.variant_name, l.quantity, l.unit_price, l.addons, l.addon_total, l.notes, 'pending', s.station_id, s.station_name
  from _add_lines l
  left join lateral station_for_dish(l.dish_id) s on true;

  v_order := recompute_order_totals(p_order_id);
  return to_jsonb(v_order);
end;
$$;

revoke execute on function add_order_items(uuid, jsonb) from public;
revoke execute on function add_order_items(uuid, jsonb) from anon;
revoke execute on function add_order_items(uuid, jsonb) from authenticated;
