-- 14_subscription_lifecycle.sql
-- 1. Trial end tracking (onboarding created status='trial' with no end date)
-- 2. Plan branch limits enforced at the database, not just the UI
--
-- Philosophy: never brick a running restaurant. Expiry gates GROWTH actions
-- (new branches here; staff-login creation is gated in the API), never live
-- service — orders, kitchen, and settling keep working regardless.

alter table subscriptions add column if not exists trial_ends_at timestamptz;

-- backfill existing trials: 14 days from row creation
update subscriptions
set trial_ends_at = created_at + interval '14 days'
where status = 'trial' and trial_ends_at is null;

-- new trials get an end date automatically
alter table subscriptions alter column trial_ends_at set default now() + interval '14 days';

-- plan -> branch limit (kept in sync with src/lib/plans.ts)
create or replace function plan_branch_limit(p_plan text)
returns int
language sql
immutable
as $$
  select case p_plan
    when 'starter' then 1
    when 'growth' then 3
    when 'pro' then 1000000
    else 1
  end;
$$;

-- Effective gate used by the trigger: trials and 5-day grace get the PRO
-- limit (full access), active gets the plan limit, expired freezes growth.
create or replace function org_can_add_branch(p_org_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_sub subscriptions%rowtype;
  v_count int;
  v_limit int;
begin
  select * into v_sub from subscriptions
  where org_id = p_org_id
  order by created_at desc limit 1;

  select count(*) into v_count from branches where org_id = p_org_id and is_active = true;

  if v_sub.id is null then
    -- no subscription row at all (legacy org): starter limit
    return v_count < plan_branch_limit('starter');
  end if;

  if v_sub.status = 'trial' then
    if v_sub.trial_ends_at is null or v_sub.trial_ends_at + interval '5 days' > now() then
      return v_count < plan_branch_limit('pro');
    end if;
    return false; -- expired trial: no growth
  end if;

  if v_sub.status = 'active' then
    if v_sub.current_period_end is null or v_sub.current_period_end + interval '5 days' > now() then
      return v_count < plan_branch_limit(v_sub.plan);
    end if;
    return false;
  end if;

  if v_sub.status = 'past_due' then
    if v_sub.current_period_end is not null and v_sub.current_period_end + interval '5 days' > now() then
      return v_count < plan_branch_limit(v_sub.plan);
    end if;
    return false;
  end if;

  return false; -- cancelled/unknown
end;
$$;

create or replace function enforce_branch_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not org_can_add_branch(new.org_id) then
    raise exception 'PLAN_LIMIT';
  end if;
  return new;
end;
$$;

drop trigger if exists branch_plan_limit on branches;
create trigger branch_plan_limit
before insert on branches
for each row execute function enforce_branch_limit();
