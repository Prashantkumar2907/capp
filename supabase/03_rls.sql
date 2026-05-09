alter table platform_admins enable row level security;
alter table organizations enable row level security;
alter table branches enable row level security;
alter table staff enable row level security;
alter table categories enable row level security;
alter table dishes enable row level security;
alter table branch_dishes enable row level security;
alter table tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table webhook_events enable row level security;
alter table subscriptions enable row level security;
alter table subscription_grants enable row level security;
alter table activity_logs enable row level security;
alter table feedback enable row level security;

create policy platform_admins_select_self on platform_admins for select using (is_active = true and (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email')));

create policy organizations_select on organizations for select using (id = app_user_org_id());
create policy organizations_insert on organizations for insert with check (auth.uid() is not null);
create policy organizations_update on organizations for update using (id = app_user_org_id() and app_user_role() in ('owner','admin')) with check (id = app_user_org_id());

create policy branches_select_staff on branches for select using (org_id = app_user_org_id());
create policy branches_select_public on branches for select using (is_active = true);
create policy branches_insert on branches for insert with check (org_id = app_user_org_id() and app_user_role() in ('owner','admin'));
create policy branches_update on branches for update using (org_id = app_user_org_id() and app_user_role() in ('owner','admin','manager')) with check (org_id = app_user_org_id());
create policy branches_delete on branches for delete using (org_id = app_user_org_id() and app_user_role() in ('owner','admin'));

create policy staff_select on staff for select using (org_id = app_user_org_id());
create policy staff_insert_owner on staff for insert with check (auth.uid() is not null and (app_user_org_id() is null or org_id = app_user_org_id()));
create policy staff_manage on staff for update using (org_id = app_user_org_id() and app_user_role() in ('owner','admin')) with check (org_id = app_user_org_id());
create policy staff_delete on staff for delete using (org_id = app_user_org_id() and app_user_role() in ('owner','admin') and user_id is distinct from auth.uid());

create policy categories_select_staff on categories for select using (org_id = app_user_org_id());
create policy categories_select_public on categories for select using (is_active = true);
create policy categories_manage on categories for all using (org_id = app_user_org_id() and app_user_role() in ('owner','admin','manager')) with check (org_id = app_user_org_id());

create policy dishes_select_staff on dishes for select using (org_id = app_user_org_id());
create policy dishes_select_public on dishes for select using (is_active = true);
create policy dishes_manage on dishes for all using (org_id = app_user_org_id() and app_user_role() in ('owner','admin','manager')) with check (org_id = app_user_org_id());

create policy branch_dishes_select on branch_dishes for select using (true);
create policy branch_dishes_manage on branch_dishes for all using (app_user_can_manage_branch(branch_id) and app_user_role() in ('owner','admin','manager','kitchen')) with check (app_user_can_manage_branch(branch_id));

create policy tables_select on tables for select using (true);
create policy tables_manage on tables for all using (app_user_can_manage_branch(branch_id) and app_user_role() in ('owner','admin','manager','waiter')) with check (app_user_can_manage_branch(branch_id));

create policy orders_select_staff on orders for select using (app_user_can_manage_branch(branch_id));
create policy orders_update_staff on orders for update using (app_user_can_manage_branch(branch_id)) with check (app_user_can_manage_branch(branch_id));

create policy order_items_select_staff on order_items for select using (app_user_can_manage_branch(branch_id));
create policy order_items_update_staff on order_items for update using (app_user_can_manage_branch(branch_id)) with check (app_user_can_manage_branch(branch_id));

create policy payments_select_staff on payments for select using (app_user_can_manage_branch(branch_id));
create policy payments_update_cashier on payments for update using (app_user_can_manage_branch(branch_id) and app_user_role() in ('owner','admin','manager','cashier')) with check (app_user_can_manage_branch(branch_id));

create policy subscriptions_select on subscriptions for select using (org_id = app_user_org_id() and app_user_role() in ('owner','admin'));
create policy subscriptions_manage on subscriptions for all using (org_id = app_user_org_id() and app_user_role() in ('owner','admin')) with check (org_id = app_user_org_id());

create policy activity_logs_select on activity_logs for select using (org_id = app_user_org_id());
create policy activity_logs_insert on activity_logs for insert with check (org_id = app_user_org_id());

create policy feedback_select_staff on feedback for select using (app_user_can_manage_branch(branch_id));
