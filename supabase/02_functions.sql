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
security definer
stable
as $$
  select org_id from staff where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function app_user_branch_id()
returns uuid
language sql
security definer
stable
as $$
  select branch_id from staff where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function app_user_role()
returns text
language sql
security definer
stable
as $$
  select role from staff where user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function app_branch_org_id(branch uuid)
returns uuid
language sql
security definer
stable
as $$
  select org_id from branches where id = branch limit 1;
$$;

create or replace function app_user_can_manage_branch(target_branch uuid)
returns boolean
language sql
security definer
stable
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
