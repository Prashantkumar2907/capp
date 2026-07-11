-- 15_table_status_trigger.sql
-- Table occupancy was maintained only in the API status route, so any other
-- write path (SQL, merges, future features) leaked 'occupied' tables forever
-- (caught by the full-day E2E simulation). Move it into the database:
-- whenever an order's status or table changes, recompute both affected
-- tables from the ground truth (are there open orders on them?).

create or replace function sync_table_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table int;
begin
  -- tables that may need recomputing: new table and (on change) old table
  foreach v_table in array array_remove(array[new.table_number, case when tg_op = 'UPDATE' then old.table_number end], null)
  loop
    update tables t
    set status = case
      when exists (
        select 1 from orders o
        where o.branch_id = new.branch_id
          and o.table_number = v_table
          and o.status not in ('served','cancelled')
      ) then 'occupied'
      else 'available'
    end
    where t.branch_id = new.branch_id
      and t.table_number = v_table
      and t.status in ('available','occupied'); -- never touch reserved/inactive
  end loop;
  return new;
end;
$$;

drop trigger if exists orders_sync_table_status on orders;
create trigger orders_sync_table_status
after insert or update of status, table_number on orders
for each row execute function sync_table_status();
