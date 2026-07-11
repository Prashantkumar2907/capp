-- 08_rls_multirole.sql
-- Migrates every policy that gated on the single primary role
-- (app_user_role() in (...)) to the multi-role helper app_user_has_role(...),
-- so users holding several roles (solo owners, small teams) get the union of
-- their capabilities at the DATABASE level, matching the UI.
--
-- Idempotent: drop + recreate each affected policy. Scope conditions
-- (org/branch ownership) are unchanged from 03_rls.sql.

drop policy if exists organizations_update on organizations;
create policy organizations_update on organizations
for update using (id = app_user_org_id() and app_user_has_role('owner','admin'))
with check (id = app_user_org_id());

drop policy if exists branches_insert on branches;
create policy branches_insert on branches
for insert with check (org_id = app_user_org_id() and app_user_has_role('owner','admin'));

drop policy if exists branches_update on branches;
create policy branches_update on branches
for update using (org_id = app_user_org_id() and app_user_has_role('owner','admin','manager'))
with check (org_id = app_user_org_id());

drop policy if exists branches_delete on branches;
create policy branches_delete on branches
for delete using (org_id = app_user_org_id() and app_user_has_role('owner','admin'));

drop policy if exists staff_manage on staff;
create policy staff_manage on staff
for update using (org_id = app_user_org_id() and app_user_has_role('owner','admin'))
with check (org_id = app_user_org_id());

drop policy if exists staff_delete on staff;
create policy staff_delete on staff
for delete using (org_id = app_user_org_id() and app_user_has_role('owner','admin') and user_id is distinct from auth.uid());

drop policy if exists categories_manage on categories;
create policy categories_manage on categories
for all using (org_id = app_user_org_id() and app_user_has_role('owner','admin','manager'))
with check (org_id = app_user_org_id());

drop policy if exists dishes_manage on dishes;
create policy dishes_manage on dishes
for all using (org_id = app_user_org_id() and app_user_has_role('owner','admin','manager'))
with check (org_id = app_user_org_id());

drop policy if exists branch_dishes_manage on branch_dishes;
create policy branch_dishes_manage on branch_dishes
for all using (app_user_can_manage_branch(branch_id) and app_user_has_role('owner','admin','manager','kitchen'))
with check (app_user_can_manage_branch(branch_id));

drop policy if exists tables_manage on tables;
create policy tables_manage on tables
for all using (app_user_can_manage_branch(branch_id) and app_user_has_role('owner','admin','manager','waiter'))
with check (app_user_can_manage_branch(branch_id));

drop policy if exists payments_update_cashier on payments;
create policy payments_update_cashier on payments
for update using (app_user_can_manage_branch(branch_id) and app_user_has_role('owner','admin','manager','cashier'))
with check (app_user_can_manage_branch(branch_id));

drop policy if exists subscriptions_select on subscriptions;
create policy subscriptions_select on subscriptions
for select using (org_id = app_user_org_id() and app_user_has_role('owner','admin'));

drop policy if exists subscriptions_manage on subscriptions;
create policy subscriptions_manage on subscriptions
for all using (org_id = app_user_org_id() and app_user_has_role('owner','admin'))
with check (org_id = app_user_org_id());
