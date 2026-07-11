-- 13_table_operations.sql
-- The two table moves waiters actually make:
--   1. move_order_table(): the group shifted from T4 to T7 — transfer the
--      open order, free the old table if nothing else is running on it.
--   2. merge_orders(): two groups joined tables — move every non-cancelled
--      item from the source order onto the target, recompute the target's
--      totals, cancel the source (and its pending payment).
-- Errors: ORDER_NOT_FOUND | ORDER_CLOSED | TABLE_NOT_FOUND | TABLE_OCCUPIED
--         | SAME_ORDER | BRANCH_MISMATCH

create or replace function move_order_table(p_order_id uuid, p_table_number int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_old_table int;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status in ('served','cancelled') then raise exception 'ORDER_CLOSED'; end if;

  perform 1 from tables
  where branch_id = v_order.branch_id and table_number = p_table_number and is_active = true;
  if not found then raise exception 'TABLE_NOT_FOUND'; end if;

  -- target must not carry another open order
  perform 1 from orders
  where branch_id = v_order.branch_id
    and table_number = p_table_number
    and id <> p_order_id
    and status not in ('served','cancelled');
  if found then raise exception 'TABLE_OCCUPIED'; end if;

  v_old_table := v_order.table_number;

  update orders set table_number = p_table_number, order_type = 'dine_in'
  where id = p_order_id
  returning * into v_order;

  update tables set status = 'occupied'
  where branch_id = v_order.branch_id and table_number = p_table_number;

  -- free the old table only if no other open orders remain on it
  if v_old_table is not null and not exists (
    select 1 from orders
    where branch_id = v_order.branch_id and table_number = v_old_table
      and status not in ('served','cancelled')
  ) then
    update tables set status = 'available'
    where branch_id = v_order.branch_id and table_number = v_old_table;
  end if;

  return to_jsonb(v_order);
end;
$$;

create or replace function merge_orders(p_source_order_id uuid, p_target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source orders%rowtype;
  v_target orders%rowtype;
begin
  if p_source_order_id = p_target_order_id then raise exception 'SAME_ORDER'; end if;

  -- consistent lock order avoids deadlocks on concurrent merges
  if p_source_order_id < p_target_order_id then
    select * into v_source from orders where id = p_source_order_id for update;
    select * into v_target from orders where id = p_target_order_id for update;
  else
    select * into v_target from orders where id = p_target_order_id for update;
    select * into v_source from orders where id = p_source_order_id for update;
  end if;

  if v_source.id is null or v_target.id is null then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_source.status in ('served','cancelled') or v_target.status in ('served','cancelled') then
    raise exception 'ORDER_CLOSED';
  end if;
  if v_source.branch_id <> v_target.branch_id then raise exception 'BRANCH_MISMATCH'; end if;

  update order_items set order_id = p_target_order_id
  where order_id = p_source_order_id and status <> 'cancelled';

  -- close the source: cancel it and its pending payment, keep the audit trail
  update orders
  set status = 'cancelled',
      notes = trim(both ' ' from coalesce(notes, '') || ' [merged into ' || v_target.order_number || ']')
  where id = p_source_order_id;

  update payments set status = 'failed'
  where order_id = p_source_order_id and status = 'pending';

  -- free the source table if nothing else runs on it
  if v_source.table_number is not null and not exists (
    select 1 from orders
    where branch_id = v_source.branch_id and table_number = v_source.table_number
      and status not in ('served','cancelled')
  ) then
    update tables set status = 'available'
    where branch_id = v_source.branch_id and table_number = v_source.table_number;
  end if;

  v_target := recompute_order_totals(p_target_order_id);
  return to_jsonb(v_target);
end;
$$;

revoke execute on function move_order_table(uuid, int) from public;
revoke execute on function move_order_table(uuid, int) from anon;
revoke execute on function move_order_table(uuid, int) from authenticated;
revoke execute on function merge_orders(uuid, uuid) from public;
revoke execute on function merge_orders(uuid, uuid) from anon;
revoke execute on function merge_orders(uuid, uuid) from authenticated;
