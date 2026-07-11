-- 07_staff_roles.sql
-- Multi-role staff ("collapsible roles"): a user can hold several roles at
-- once, so a solo owner can be owner + waiter + kitchen + cashier, while a
-- large restaurant assigns one role per person.
--
-- Additive migration:
--   1. staff_roles (staff_id, role) many-to-many
--   2. backfill from staff.role
--   3. trigger keeps staff.role (primary/display role) mirrored into staff_roles
--   4. new RLS helpers app_user_roles() / app_user_has_role()
-- staff.role is retained as the primary role for display and back-compat.
-- Existing RLS policies keep working; they can migrate to app_user_has_role()
-- incrementally.

create table if not exists staff_roles (
  staff_id uuid not null references staff(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','waiter','kitchen','cashier')),
  created_at timestamptz not null default now(),
  primary key (staff_id, role)
);

create index if not exists staff_roles_role_idx on staff_roles (role);

alter table staff_roles enable row level security;

-- Backfill: every existing staff member holds at least their primary role.
insert into staff_roles (staff_id, role)
select id, role from staff
on conflict do nothing;

-- Keep the primary role mirrored: inserting staff or changing staff.role
-- guarantees membership in staff_roles (extra roles are managed separately
-- and are never removed by this trigger).
create or replace function sync_staff_primary_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into staff_roles (staff_id, role)
  values (new.id, new.role)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists staff_primary_role_sync on staff;
create trigger staff_primary_role_sync
after insert or update of role on staff
for each row execute function sync_staff_primary_role();

-- All roles held by the current user (empty array when none).
create or replace function app_user_roles()
returns text[]
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(array_agg(sr.role), '{}')
  from staff s
  join staff_roles sr on sr.staff_id = s.id
  where s.user_id = auth.uid() and s.is_active = true;
$$;

-- True when the current user holds ANY of the given roles.
-- Usage in policies: app_user_has_role('owner','admin')
create or replace function app_user_has_role(variadic check_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from staff s
    join staff_roles sr on sr.staff_id = s.id
    where s.user_id = auth.uid()
      and s.is_active = true
      and sr.role = any (check_roles)
  );
$$;

-- RLS: org members can see the roles of staff in their org; only
-- owners/admins can grant or revoke roles, and only within their org.
drop policy if exists staff_roles_select on staff_roles;
create policy staff_roles_select on staff_roles
for select using (
  exists (
    select 1 from staff s
    where s.id = staff_roles.staff_id
      and s.org_id = app_user_org_id()
  )
);

drop policy if exists staff_roles_insert on staff_roles;
create policy staff_roles_insert on staff_roles
for insert with check (
  app_user_has_role('owner','admin')
  and exists (
    select 1 from staff s
    where s.id = staff_roles.staff_id
      and s.org_id = app_user_org_id()
  )
);

drop policy if exists staff_roles_delete on staff_roles;
create policy staff_roles_delete on staff_roles
for delete using (
  app_user_has_role('owner','admin')
  and exists (
    select 1 from staff s
    where s.id = staff_roles.staff_id
      and s.org_id = app_user_org_id()
  )
);
