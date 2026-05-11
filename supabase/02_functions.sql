create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at before update on organizations for each row execute function set_updated_at();
create trigger platform_admins_updated_at before update on platform_admins for each row execute function set_updated_at();
create trigger branches_updated_at before update on branches for each row execute function set_updated_at();
create trigger staff_updated_at before update on staff for each row execute function set_updated_at();
create trigger dishes_updated_at before update on dishes for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders for each row execute function set_updated_at();
create trigger order_items_updated_at before update on order_items for each row execute function set_updated_at();
create trigger payments_updated_at before update on payments for each row execute function set_updated_at();
create trigger subscriptions_updated_at before update on subscriptions for each row execute function set_updated_at();

create or replace function app_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select org_id from staff where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function app_user_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select branch_id from staff where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function app_user_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from staff where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function app_branch_org_id(branch uuid)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select org_id from branches where id = branch limit 1;
$$;

create or replace function app_user_can_manage_branch(target_branch uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from staff s
    where s.user_id = auth.uid()
      and s.is_active = true
      and s.org_id = app_branch_org_id(target_branch)
      and (
        s.role in ('owner','admin')
        or s.branch_id = target_branch
      )
  );
$$;

create or replace function create_order_with_items(
  p_order_number text,
  p_branch_id uuid,
  p_table_number int,
  p_customer_name text,
  p_customer_phone text,
  p_client_request_id text,
  p_receipt_token text,
  p_waiter_id uuid,
  p_order_type text,
  p_order_source text,
  p_subtotal numeric,
  p_tax numeric,
  p_discount numeric,
  p_total numeric,
  p_notes text,
  p_items jsonb
)
returns orders
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  created_order orders%rowtype;
begin
  insert into orders (
    order_number,
    branch_id,
    table_number,
    customer_name,
    customer_phone,
    client_request_id,
    receipt_token,
    waiter_id,
    order_type,
    order_source,
    status,
    subtotal,
    tax,
    discount,
    total,
    notes
  )
  values (
    p_order_number,
    p_branch_id,
    p_table_number,
    p_customer_name,
    p_customer_phone,
    p_client_request_id,
    p_receipt_token,
    p_waiter_id,
    p_order_type,
    p_order_source,
    'pending',
    p_subtotal,
    p_tax,
    p_discount,
    p_total,
    p_notes
  )
  returning * into created_order;

  insert into order_items (order_id, branch_id, dish_id, dish_name, quantity, price_at_order, notes, status)
  select
    created_order.id,
    p_branch_id,
    (item ->> 'dish_id')::uuid,
    item ->> 'dish_name',
    (item ->> 'quantity')::int,
    (item ->> 'price_at_order')::numeric,
    nullif(item ->> 'notes', ''),
    'pending'
  from jsonb_array_elements(p_items) as item;

  insert into payments (order_id, branch_id, amount, method, status)
  values (created_order.id, p_branch_id, p_total, 'upi', 'pending');

  if p_table_number is not null then
    update tables
    set status = 'occupied'
    where branch_id = p_branch_id
      and table_number = p_table_number;
  end if;

  return created_order;
end;
$$;

revoke all on function create_order_with_items(
  text,
  uuid,
  int,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) from public;

grant execute on function create_order_with_items(
  text,
  uuid,
  int,
  text,
  text,
  text,
  text,
  uuid,
  text,
  text,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  jsonb
) to service_role;
