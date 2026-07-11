-- 16_cancel_cleanup_items.sql
-- Tier-1 operational safety:
--   1. cancel_order()       — proper staff cancellation: cancels order + items,
--      voids the pending payment, logs who/why, frees the table (via the
--      15_ trigger). Refuses to cancel an already-settled order.
--   2. cleanup_abandoned_orders() — auto-cancel unpaid orders older than a
--      cutoff (QR walk-aways). Meant to run on a schedule (Supabase cron).
--   3. set_item_status() + roll-up — advance a SINGLE item (naan ready while
--      curry cooks); the order's status is derived from its items so the
--      board and customer tracker stay coherent.

-- 1. Cancel -----------------------------------------------------------------
create or replace function cancel_order(
  p_order_id uuid,
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
  v_paid numeric;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'cancelled' then return to_jsonb(v_order); end if;

  select coalesce(sum(amount), 0) into v_paid
  from payments where order_id = p_order_id and status = 'completed';
  if v_paid > 0 then raise exception 'ORDER_PAID'; end if; -- settled orders: refund flow, not cancel

  update order_items set status = 'cancelled' where order_id = p_order_id and status <> 'cancelled';
  update payments set status = 'failed' where order_id = p_order_id and status = 'pending';
  update orders set status = 'cancelled' where id = p_order_id returning * into v_order;

  insert into activity_logs (org_id, branch_id, staff_id, action, entity_type, entity_id, metadata)
  select b.org_id, v_order.branch_id, p_staff_id, 'order_cancelled', 'order', v_order.id,
         jsonb_build_object('reason', nullif(p_reason, ''), 'order_number', v_order.order_number, 'total', v_order.total)
  from branches b where b.id = v_order.branch_id;

  return to_jsonb(v_order);
end;
$$;

-- 2. Abandoned cleanup ------------------------------------------------------
-- Cancels dine-in/QR orders left unpaid past the cutoff. Returns the count.
-- Skips anything with a completed payment or that's already served/cancelled.
create or replace function cleanup_abandoned_orders(p_older_than interval default interval '4 hours')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_id uuid;
begin
  for v_id in
    select o.id
    from orders o
    where o.status not in ('served','cancelled')
      and o.created_at < now() - p_older_than
      and not exists (select 1 from payments p where p.order_id = o.id and p.status = 'completed')
  loop
    update order_items set status = 'cancelled' where order_id = v_id and status <> 'cancelled';
    update payments set status = 'failed' where order_id = v_id and status = 'pending';
    update orders set status = 'cancelled',
      notes = trim(both ' ' from coalesce(notes,'') || ' [auto-cancelled: abandoned]')
    where id = v_id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- 3. Item-level status + order roll-up --------------------------------------
-- Advance one item; the order status is recomputed from all live items:
--   any preparing/accepted -> preparing ; all ready -> ready ;
--   all served -> served ; else keep the earliest meaningful stage.
create or replace function set_item_status(p_item_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order orders%rowtype;
  v_live int;
  v_ready int;
  v_served int;
  v_cooking int;
begin
  if p_status not in ('pending','accepted','preparing','ready','served','cancelled') then
    raise exception 'INVALID_STATUS';
  end if;

  update order_items set status = p_status where id = p_item_id returning order_id into v_order_id;
  if v_order_id is null then raise exception 'ITEM_NOT_FOUND'; end if;

  select * into v_order from orders where id = v_order_id for update;
  if v_order.status = 'cancelled' then return to_jsonb(v_order); end if;

  select
    count(*) filter (where status <> 'cancelled'),
    count(*) filter (where status = 'ready'),
    count(*) filter (where status = 'served'),
    count(*) filter (where status in ('preparing','accepted'))
  into v_live, v_ready, v_served, v_cooking
  from order_items where order_id = v_order_id;

  update orders set status = case
    when v_live = 0 then 'cancelled'
    when v_served = v_live then 'served'
    when v_ready + v_served = v_live then 'ready'
    when v_cooking > 0 or v_ready > 0 then 'preparing'
    else v_order.status
  end
  where id = v_order_id
  returning * into v_order;

  return to_jsonb(v_order);
end;
$$;

revoke execute on function cancel_order(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function cleanup_abandoned_orders(interval) from public, anon, authenticated;
revoke execute on function set_item_status(uuid, text) from public, anon, authenticated;
