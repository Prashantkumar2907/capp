drop table if exists feedback cascade;
drop table if exists activity_logs cascade;
drop table if exists subscription_grants cascade;
drop table if exists subscriptions cascade;
drop table if exists webhook_events cascade;
drop table if exists payments cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists tables cascade;
drop table if exists branch_dishes cascade;
drop table if exists dishes cascade;
drop table if exists categories cascade;
drop table if exists staff cascade;
drop table if exists branches cascade;
drop table if exists platform_admins cascade;
drop table if exists organizations cascade;

create table platform_admins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique,
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  accent_color text not null default '#128c7e',
  restaurant_type text not null default 'casual',
  gst_number text,
  default_tax_percent numeric(5,2) not null default 5,
  tax_inclusive boolean not null default true,
  plan text not null default 'starter' check (plan in ('starter','growth','pro','enterprise')),
  subscription_status text not null default 'trial' check (subscription_status in ('trial','active','past_due','cancelled','expired')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  phone text,
  upi_vpa text,
  table_count int not null default 10,
  is_active boolean not null default true,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete set null,
  org_id uuid not null references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text,
  email text,
  phone text,
  role text not null check (role in ('owner','admin','manager','waiter','kitchen','cashier')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table dishes (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  is_veg boolean not null default true,
  is_active boolean not null default true,
  tags text[] not null default '{}',
  prep_time_mins int not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table branch_dishes (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  dish_id uuid not null references dishes(id) on delete cascade,
  custom_price numeric(10,2),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id, dish_id)
);

create table tables (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid not null references branches(id) on delete cascade,
  table_number int not null,
  label text,
  capacity int not null default 4,
  status text not null default 'available' check (status in ('available','occupied','reserved','inactive')),
  qr_code_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (branch_id, table_number)
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  branch_id uuid not null references branches(id) on delete cascade,
  table_number int,
  customer_name text,
  customer_phone text,
  client_request_id text,
  receipt_token text not null default encode(gen_random_bytes(16), 'hex'),
  waiter_id uuid references staff(id) on delete set null,
  order_type text not null default 'dine_in' check (order_type in ('dine_in','takeaway','delivery')),
  order_source text not null default 'waiter' check (order_source in ('waiter','qr_customer','cashier')),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','served','paid','cancelled','refunded','failed')),
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  dish_id uuid references dishes(id) on delete set null,
  dish_name text not null,
  quantity int not null default 1,
  price_at_order numeric(10,2) not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','accepted','preparing','ready','served','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null default 'cash' check (method in ('upi','razorpay','cash','card')),
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  transaction_id text,
  provider_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table webhook_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'processing' check (status in ('processing','processed','ignored','failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload jsonb not null default '{}',
  unique (provider, event_id)
);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan text not null default 'starter',
  status text not null default 'trial',
  razorpay_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscription_grants (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  platform_admin_id uuid references platform_admins(id) on delete set null,
  plan text not null check (plan in ('starter','growth','pro','enterprise')),
  status text not null check (status in ('trial','active','past_due','cancelled','expired')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  days_granted int not null check (days_granted between 1 and 1095),
  payment_reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references organizations(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  staff_id uuid references staff(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table feedback (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete set null,
  branch_id uuid not null references branches(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_branches_org on branches(org_id);
create index idx_platform_admins_email on platform_admins(lower(email));
create index idx_platform_admins_user on platform_admins(user_id) where user_id is not null;
create index idx_organizations_plan_status on organizations(plan, subscription_status);
create index idx_staff_org on staff(org_id);
create index idx_staff_branch on staff(branch_id);
create index idx_staff_user on staff(user_id);
create index idx_categories_org on categories(org_id);
create index idx_categories_org_sort on categories(org_id, sort_order);
create index idx_dishes_org on dishes(org_id);
create index idx_dishes_org_name on dishes(org_id, name);
create index idx_dishes_category on dishes(category_id);
create index idx_branch_dishes_branch on branch_dishes(branch_id);
create index idx_branch_dishes_dish on branch_dishes(dish_id);
create index idx_tables_branch on tables(branch_id);
create index idx_tables_branch_status on tables(branch_id, status);
create index idx_orders_branch_status on orders(branch_id, status);
create index idx_orders_created on orders(created_at desc);
create index idx_orders_branch_created on orders(branch_id, created_at desc);
create index idx_orders_branch_table_active on orders(branch_id, table_number) where table_number is not null and status in ('pending','confirmed','preparing','ready','served');
create unique index idx_orders_branch_client_request on orders(branch_id, client_request_id) where client_request_id is not null;
create unique index idx_orders_receipt_token on orders(receipt_token);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_branch on order_items(branch_id);
create index idx_order_items_branch_created on order_items(branch_id, created_at desc);
create index idx_payments_branch on payments(branch_id);
create index idx_payments_order on payments(order_id);
create unique index idx_payments_transaction on payments(transaction_id) where transaction_id is not null;
create index idx_payments_branch_created on payments(branch_id, created_at desc);
create index idx_webhook_events_provider_event on webhook_events(provider, event_id);
create index idx_subscriptions_org_period on subscriptions(org_id, current_period_end desc);
create index idx_subscription_grants_org_created on subscription_grants(org_id, created_at desc);
create index idx_subscription_grants_period_end on subscription_grants(period_end desc);
create index idx_feedback_branch on feedback(branch_id);
create index idx_feedback_branch_created on feedback(branch_id, created_at desc);
