#!/usr/bin/env python3
"""Write SQL files for CAPP restaurant management system."""

import os

BASE = "/Users/prashant/projects/capp/supabase"

# ──────────────────────────────────────────────────────────────
# 000_reset.sql
# ──────────────────────────────────────────────────────────────
reset_sql = """\
-- ============================================
-- CAPP Restaurant Management System
-- RESET / CLEANUP SCRIPT  (v2 - full reset)
-- ============================================
-- WARNING: This will DELETE ALL DATA and DROP ALL TABLES.
-- After running, re-run 001_setup.sql then 002_seed_data.sql.
-- NOTE: auth.users cannot be bulk-deleted via SQL.
--   Go to: Dashboard -> Authentication -> Users -> delete manually.
-- ============================================

-- STEP 1 — Remove realtime publications (ignore if not present)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS order_items;
EXCEPTION WHEN others THEN NULL; END $$;

-- STEP 2 — Drop all triggers
DROP TRIGGER IF EXISTS trg_organizations_updated ON organizations;
DROP TRIGGER IF EXISTS trg_branches_updated      ON branches;
DROP TRIGGER IF EXISTS trg_staff_updated         ON staff;
DROP TRIGGER IF EXISTS trg_dishes_updated        ON dishes;
DROP TRIGGER IF EXISTS trg_orders_updated        ON orders;
DROP TRIGGER IF EXISTS trg_order_items_updated   ON order_items;
DROP TRIGGER IF EXISTS trg_payments_updated      ON payments;
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON subscriptions;

-- STEP 3 — Drop all custom functions
DROP FUNCTION IF EXISTS get_user_org_id()    CASCADE;
DROP FUNCTION IF EXISTS get_user_role()      CASCADE;
DROP FUNCTION IF EXISTS get_user_branch_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at()  CASCADE;

-- STEP 4 — Drop storage policies and clean bucket
DROP POLICY IF EXISTS "Public can view dish images"                ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can upload dish images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated staff can delete dish images" ON storage.objects;

DELETE FROM storage.objects WHERE bucket_id = 'dish-images';
DELETE FROM storage.buckets  WHERE id       = 'dish-images';

-- STEP 5 — Drop all tables (reverse dependency order)
DROP TABLE IF EXISTS feedback       CASCADE;
DROP TABLE IF EXISTS activity_logs  CASCADE;
DROP TABLE IF EXISTS subscriptions  CASCADE;
DROP TABLE IF EXISTS payments       CASCADE;
DROP TABLE IF EXISTS order_items    CASCADE;
DROP TABLE IF EXISTS orders         CASCADE;
DROP TABLE IF EXISTS tables         CASCADE;
DROP TABLE IF EXISTS branch_dishes  CASCADE;
DROP TABLE IF EXISTS dishes         CASCADE;
DROP TABLE IF EXISTS categories     CASCADE;
DROP TABLE IF EXISTS staff          CASCADE;
DROP TABLE IF EXISTS branches       CASCADE;
DROP TABLE IF EXISTS organizations  CASCADE;

-- DONE — now run 001_setup.sql then 002_seed_data.sql
"""

# ──────────────────────────────────────────────────────────────
# 001_setup.sql
# ──────────────────────────────────────────────────────────────
setup_sql = """\
-- ============================================
-- CAPP Restaurant Management System
-- SCHEMA SETUP  (v2 - with label column fix + storage)
-- ============================================

-- ───────────────────────── EXTENSIONS ─────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────── HELPER FUNCTION ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────── ORGANIZATIONS ───────────────────────
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  logo_url    TEXT,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────── BRANCHES ──────────────────────────
CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  settings        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_branches_org ON branches(organization_id);
CREATE TRIGGER trg_branches_updated
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────── STAFF ───────────────────────────
CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,
  user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('owner','admin','manager','waiter','kitchen','cashier')),
  is_active       BOOLEAN DEFAULT TRUE,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staff_org    ON staff(organization_id);
CREATE INDEX idx_staff_branch ON staff(branch_id);
CREATE INDEX idx_staff_user   ON staff(user_id);
CREATE TRIGGER trg_staff_updated
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────── CATEGORIES ───────────────────────
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  sort_order      INT  DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_org ON categories(organization_id);

-- ────────────────────────────── DISHES ────────────────────────
CREATE TABLE dishes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url       TEXT,
  is_veg          BOOLEAN DEFAULT TRUE,
  is_active       BOOLEAN DEFAULT TRUE,
  prep_time_mins  INT DEFAULT 15,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dishes_org      ON dishes(organization_id);
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE TRIGGER trg_dishes_updated
  BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────── BRANCH_DISHES ───────────────────
CREATE TABLE branch_dishes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dish_id     UUID NOT NULL REFERENCES dishes(id)   ON DELETE CASCADE,
  price       NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE (branch_id, dish_id)
);
CREATE INDEX idx_branch_dishes_branch ON branch_dishes(branch_id);
CREATE INDEX idx_branch_dishes_dish   ON branch_dishes(dish_id);

-- ──────────────────────────── TABLES ──────────────────────────
CREATE TABLE tables (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  number      INT NOT NULL,
  label       TEXT,
  capacity    INT NOT NULL DEFAULT 4,
  status      TEXT NOT NULL DEFAULT 'available'
              CHECK (status IN ('available','occupied','reserved','cleaning')),
  qr_code     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, number)
);
CREATE INDEX idx_tables_branch ON tables(branch_id);

-- ───────────────────────────── ORDERS ─────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES tables(id) ON DELETE SET NULL,
  staff_id        UUID REFERENCES staff(id)  ON DELETE SET NULL,
  order_number    TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','preparing','ready','served','cancelled')),
  type            TEXT NOT NULL DEFAULT 'dine_in'
                  CHECK (type IN ('dine_in','takeaway','delivery')),
  notes           TEXT,
  total_amount    NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount      NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_branch  ON orders(branch_id);
CREATE INDEX idx_orders_table   ON orders(table_id);
CREATE INDEX idx_orders_staff   ON orders(staff_id);
CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────── ORDER_ITEMS ──────────────────────
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id     UUID REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name   TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes       TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','preparing','ready','served')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_dish  ON order_items(dish_id);
CREATE TRIGGER trg_order_items_updated
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────── PAYMENTS ─────────────────────────
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  branch_id      UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  method         TEXT NOT NULL DEFAULT 'cash'
                 CHECK (method IN ('cash','card','upi','wallet')),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','completed','failed','refunded')),
  transaction_id TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_order  ON payments(order_id);
CREATE INDEX idx_payments_branch ON payments(branch_id);
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────── SUBSCRIPTIONS ─────────────────────
CREATE TABLE subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','starter','professional','enterprise')),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','cancelled','expired','trial')),
  starts_at       TIMESTAMPTZ DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  max_branches    INT DEFAULT 1,
  max_staff       INT DEFAULT 5,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────── ACTIVITY_LOGS ────────────────────
CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id)      ON DELETE CASCADE,
  staff_id        UUID REFERENCES staff(id)          ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT,
  resource_id     UUID,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_org    ON activity_logs(organization_id);
CREATE INDEX idx_activity_logs_branch ON activity_logs(branch_id);
CREATE INDEX idx_activity_logs_staff  ON activity_logs(staff_id);
CREATE INDEX idx_activity_logs_time   ON activity_logs(created_at DESC);

-- ──────────────────────────── FEEDBACK ────────────────────────
CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  customer    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feedback_branch ON feedback(branch_id);

-- ══════════════════════════════════════════════
-- HELPER FUNCTIONS (used by RLS)
-- ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM staff WHERE user_id = auth.uid() AND is_active = TRUE AND branch_id IS NOT NULL LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ══════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff          ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_dishes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback       ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY "Staff can view own org"
  ON organizations FOR SELECT
  USING (id = get_user_org_id());

CREATE POLICY "Owner can update org"
  ON organizations FOR UPDATE
  USING (id = get_user_org_id() AND get_user_role() IN ('owner','admin'));

-- branches
CREATE POLICY "Staff can view own branches"
  ON branches FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Manager+ can manage branches"
  ON branches FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- staff
CREATE POLICY "Staff can view own org staff"
  ON staff FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admin+ can manage staff"
  ON staff FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner','admin'));

-- categories
CREATE POLICY "Staff can view org categories"
  ON categories FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Manager+ can manage categories"
  ON categories FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- dishes
CREATE POLICY "Staff can view org dishes"
  ON dishes FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Manager+ can manage dishes"
  ON dishes FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- branch_dishes
CREATE POLICY "Staff can view branch dishes"
  ON branch_dishes FOR SELECT
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Manager+ can manage branch dishes"
  ON branch_dishes FOR ALL
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
    AND get_user_role() IN ('owner','admin','manager')
  );

-- tables
CREATE POLICY "Staff can view branch tables"
  ON tables FOR SELECT
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Manager+ can manage tables"
  ON tables FOR ALL
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
    AND get_user_role() IN ('owner','admin','manager')
  );

CREATE POLICY "Waiter can update table status"
  ON tables FOR UPDATE
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
    AND get_user_role() IN ('waiter')
  );

-- orders
CREATE POLICY "Staff can view branch orders"
  ON orders FOR SELECT
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Waiter+ can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

-- order_items
CREATE POLICY "Staff can view order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
    )
  );

CREATE POLICY "Staff can manage order items"
  ON order_items FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
    )
  );

-- payments
CREATE POLICY "Staff can view branch payments"
  ON payments FOR SELECT
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Cashier+ can manage payments"
  ON payments FOR ALL
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
    AND get_user_role() IN ('owner','admin','manager','cashier')
  );

-- subscriptions
CREATE POLICY "Owner can view own subscription"
  ON subscriptions FOR SELECT
  USING (organization_id = get_user_org_id());

-- activity_logs
CREATE POLICY "Staff can view org activity"
  ON activity_logs FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "System can insert activity"
  ON activity_logs FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

-- feedback
CREATE POLICY "Staff can view branch feedback"
  ON feedback FOR SELECT
  USING (
    branch_id IN (SELECT id FROM branches WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (TRUE);

-- ══════════════════════════════════════════════
-- STORAGE BUCKET
-- ══════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dish-images',
  'dish-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view dish images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dish-images');

CREATE POLICY "Authenticated staff can upload dish images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dish-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated staff can delete dish images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dish-images' AND auth.role() = 'authenticated');

-- ══════════════════════════════════════════════
-- REALTIME
-- ══════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
"""

# ──────────────────────────────────────────────────────────────
# 002_seed_data.sql
# ──────────────────────────────────────────────────────────────
seed_sql = """\
-- ============================================
-- CAPP Restaurant Management System
-- SEED DATA — v2
-- Includes 4 restaurants + 6 demo auth users
-- ============================================
-- Demo credentials (all passwords: DemoPass123!)
--   owner@demo.com    — owner   (Demo Restaurant)
--   admin@demo.com    — admin   (Demo Restaurant)
--   manager@demo.com  — manager (Demo Restaurant)
--   waiter@demo.com   — waiter  (Demo Restaurant)
--   kitchen@demo.com  — kitchen (Demo Restaurant)
--   cashier@demo.com  — cashier (Demo Restaurant)
-- ============================================

-- ══════════════════════════════════════════════
-- ORGANIZATIONS
-- ══════════════════════════════════════════════
INSERT INTO organizations (id, name, slug, email, phone, address) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Spice Garden',     'spice-garden',     'owner@spicegarden.com',  '+91-9800000001', 'MG Road, Bengaluru'),
  ('a0000000-0000-0000-0000-000000000002', 'Sakura Japanese',  'sakura-japanese',  'owner@sakura.com',       '+91-9800000002', 'Bandra, Mumbai'),
  ('a0000000-0000-0000-0000-000000000003', 'Cafe Italiano',    'cafe-italiano',    'owner@italiano.com',     '+91-9800000003', 'Connaught Place, Delhi'),
  ('a0000000-0000-0000-0000-000000000099', 'Demo Restaurant',  'demo-restaurant',  'owner@demo.com',         '+91-9800000099', 'Demo Street, Chennai')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- BRANCHES
-- ══════════════════════════════════════════════
INSERT INTO branches (id, organization_id, name, address, phone, is_active) VALUES
  -- Spice Garden
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'MG Road Branch',   'MG Road, Bengaluru',       '+91-8000000001', TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Indiranagar Branch','Indiranagar, Bengaluru',   '+91-8000000002', TRUE),
  -- Sakura
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Bandra Branch',    'Bandra West, Mumbai',      '+91-8000000003', TRUE),
  -- Cafe Italiano
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'CP Branch',        'Connaught Place, Delhi',   '+91-8000000004', TRUE),
  -- Demo Restaurant
  ('b0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000099', 'Demo Main Branch', 'Demo Street, Chennai',     '+91-8000000099', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- SUBSCRIPTIONS
-- ══════════════════════════════════════════════
INSERT INTO subscriptions (organization_id, plan, status, max_branches, max_staff) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'professional', 'active', 5,  50),
  ('a0000000-0000-0000-0000-000000000002', 'starter',      'active', 2,  20),
  ('a0000000-0000-0000-0000-000000000003', 'starter',      'active', 2,  20),
  ('a0000000-0000-0000-0000-000000000099', 'professional', 'trial',  5,  50)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════
-- AUTH USERS — Demo Restaurant (6 roles)
-- All passwords: DemoPass123!
-- ══════════════════════════════════════════════
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  is_super_admin, last_sign_in_at
) VALUES
  (
    'u0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'owner@demo.com',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo Owner"}',
    '', '', FALSE, NOW()
  ),
  (
    'u0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@demo.com',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo Admin"}',
    '', '', FALSE, NOW()
  ),
  (
    'u0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'manager@demo.com',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo Manager"}',
    '', '', FALSE, NOW()
  ),
  (
    'u0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'waiter@demo.com',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo Waiter"}',
    '', '', FALSE, NOW()
  ),
  (
    'u0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'kitchen@demo.com',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo Kitchen"}',
    '', '', FALSE, NOW()
  ),
  (
    'u0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'cashier@demo.com',
    crypt('DemoPass123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Demo Cashier"}',
    '', '', FALSE, NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Auth identities (required for email login)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, last_sign_in_at, created_at, updated_at
) VALUES
  ('u0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'owner@demo.com',   'email', '{"sub":"u0000000-0000-0000-0000-000000000001","email":"owner@demo.com"}',   NOW(), NOW(), NOW()),
  ('u0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'admin@demo.com',   'email', '{"sub":"u0000000-0000-0000-0000-000000000002","email":"admin@demo.com"}',   NOW(), NOW(), NOW()),
  ('u0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000003', 'manager@demo.com', 'email', '{"sub":"u0000000-0000-0000-0000-000000000003","email":"manager@demo.com"}', NOW(), NOW(), NOW()),
  ('u0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000004', 'waiter@demo.com',  'email', '{"sub":"u0000000-0000-0000-0000-000000000004","email":"waiter@demo.com"}',  NOW(), NOW(), NOW()),
  ('u0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000005', 'kitchen@demo.com', 'email', '{"sub":"u0000000-0000-0000-0000-000000000005","email":"kitchen@demo.com"}', NOW(), NOW(), NOW()),
  ('u0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000006', 'cashier@demo.com', 'email', '{"sub":"u0000000-0000-0000-0000-000000000006","email":"cashier@demo.com"}', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- STAFF
-- ══════════════════════════════════════════════
INSERT INTO staff (id, organization_id, branch_id, user_id, name, email, role, is_active) VALUES
  -- Demo Restaurant (linked to auth users)
  ('s0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'u0000000-0000-0000-0000-000000000001', 'Demo Owner',   'owner@demo.com',   'owner',   TRUE),
  ('s0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'u0000000-0000-0000-0000-000000000002', 'Demo Admin',   'admin@demo.com',   'admin',   TRUE),
  ('s0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'u0000000-0000-0000-0000-000000000003', 'Demo Manager', 'manager@demo.com', 'manager', TRUE),
  ('s0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'u0000000-0000-0000-0000-000000000004', 'Demo Waiter',  'waiter@demo.com',  'waiter',  TRUE),
  ('s0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'u0000000-0000-0000-0000-000000000005', 'Demo Kitchen', 'kitchen@demo.com', 'kitchen', TRUE),
  ('s0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000099', 'u0000000-0000-0000-0000-000000000006', 'Demo Cashier', 'cashier@demo.com', 'cashier', TRUE),
  -- Spice Garden staff (no auth link - existing data)
  ('s0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL, 'Rajesh Kumar',   'rajesh@spicegarden.com',   'manager', TRUE),
  ('s0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL, 'Priya Sharma',   'priya@spicegarden.com',    'waiter',  TRUE),
  ('s0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL, 'Arjun Patel',    'arjun@spicegarden.com',    'kitchen', TRUE),
  ('s0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', NULL, 'Meera Singh',    'meera@spicegarden.com',    'cashier', TRUE),
  -- Sakura staff
  ('s0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', NULL, 'Yuki Tanaka',    'yuki@sakura.com',          'manager', TRUE),
  ('s0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', NULL, 'Ravi Nair',      'ravi@sakura.com',          'waiter',  TRUE)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- CATEGORIES
-- ══════════════════════════════════════════════
INSERT INTO categories (id, organization_id, name, description, sort_order, is_active) VALUES
  -- Spice Garden
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Starters',    'Appetizers and starters',        1, TRUE),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Main Course', 'Rice, curries and breads',        2, TRUE),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Beverages',   'Drinks and juices',               3, TRUE),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Desserts',    'Sweet treats',                    4, TRUE),
  -- Sakura
  ('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'Sushi',       'Fresh sushi and rolls',           1, TRUE),
  ('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Ramen',       'Japanese noodle soups',           2, TRUE),
  ('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'Drinks',      'Japanese teas and beverages',     3, TRUE),
  -- Cafe Italiano
  ('c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000003', 'Pasta',       'Authentic Italian pasta',         1, TRUE),
  ('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000003', 'Pizza',       'Wood-fired Italian pizzas',       2, TRUE),
  ('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000003', 'Coffee',      'Espresso and specialty coffees',  3, TRUE),
  -- Demo Restaurant
  ('c0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000099', 'Starters',    'Demo starters',    1, TRUE),
  ('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000099', 'Main Course', 'Demo mains',       2, TRUE),
  ('c0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000099', 'Beverages',   'Demo beverages',   3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- DISHES
-- ══════════════════════════════════════════════
INSERT INTO dishes (id, organization_id, category_id, name, description, base_price, is_veg, is_active, prep_time_mins, tags) VALUES
  -- Spice Garden — Starters
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Paneer Tikka',    'Grilled cottage cheese', 280, TRUE,  TRUE, 20, ARRAY['veg','popular']),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Chicken 65',      'Spicy fried chicken',    320, FALSE, TRUE, 25, ARRAY['non-veg','spicy']),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Samosa (2 pcs)',  'Crispy potato samosa',   80,  TRUE,  TRUE, 10, ARRAY['veg','snack']),
  -- Spice Garden — Main Course
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Butter Chicken',  'Creamy tomato gravy',    380, FALSE, TRUE, 30, ARRAY['non-veg','popular']),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Dal Makhani',     'Slow-cooked black dal',  280, TRUE,  TRUE, 40, ARRAY['veg','popular']),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Biryani',         'Fragrant basmati rice',  420, FALSE, TRUE, 45, ARRAY['non-veg','popular']),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Garlic Naan',     'Butter garlic flatbread', 60,  TRUE,  TRUE,  8, ARRAY['veg','bread']),
  -- Spice Garden — Beverages
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Mango Lassi',     'Sweet yoghurt drink',    120, TRUE,  TRUE,  5, ARRAY['veg','cold']),
  ('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Masala Chai',     'Spiced milk tea',         60, TRUE,  TRUE,  5, ARRAY['veg','hot']),
  -- Spice Garden — Desserts
  ('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Gulab Jamun',     'Sweet milk dumplings',   120, TRUE,  TRUE, 10, ARRAY['veg','sweet']),
  -- Sakura
  ('d0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 'Salmon Nigiri',   '2 pcs fresh salmon',     320, FALSE, TRUE, 10, ARRAY['seafood']),
  ('d0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 'Dragon Roll',     'Avocado shrimp roll',    480, FALSE, TRUE, 15, ARRAY['seafood','popular']),
  ('d0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000011', 'Tonkotsu Ramen',  'Pork bone broth',        520, FALSE, TRUE, 20, ARRAY['pork','popular']),
  -- Cafe Italiano
  ('d0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000020', 'Spaghetti Carbonara', 'Classic Roman pasta', 420, FALSE, TRUE, 20, ARRAY['popular']),
  ('d0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000021', 'Margherita Pizza',    'Tomato mozzarella',   380, TRUE,  TRUE, 25, ARRAY['veg','popular']),
  ('d0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000022', 'Espresso',            'Double shot',          80, TRUE,  TRUE,  3, ARRAY['hot','coffee']),
  -- Demo Restaurant
  ('d0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000030', 'Spring Rolls',    'Crispy veg rolls',       160, TRUE,  TRUE, 15, ARRAY['veg']),
  ('d0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000031', 'Grilled Chicken', 'Herb grilled chicken',   350, FALSE, TRUE, 25, ARRAY['non-veg']),
  ('d0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000031', 'Veg Fried Rice',  'Wok-tossed rice',        220, TRUE,  TRUE, 20, ARRAY['veg']),
  ('d0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000032', 'Fresh Lime Soda', 'Cool refresher',          80, TRUE,  TRUE,  3, ARRAY['cold']),
  ('d0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000099', 'c0000000-0000-0000-0000-000000000032', 'Cold Coffee',     'Blended cold coffee',    120, TRUE,  TRUE,  5, ARRAY['cold'])
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- BRANCH DISHES (availability per branch)
-- ══════════════════════════════════════════════
INSERT INTO branch_dishes (branch_id, dish_id, price, is_available) VALUES
  -- Spice Garden — MG Road (all dishes)
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000003', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000004', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000005', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000006', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000007', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000008', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000009', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000010', NULL, TRUE),
  -- Spice Garden — Indiranagar (subset, different price for biryani)
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000001', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000004', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000005', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000006', 440,  TRUE),
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000007', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000008', NULL, TRUE),
  -- Sakura — Bandra
  ('b0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000020', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000021', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000022', NULL, TRUE),
  -- Cafe Italiano — CP
  ('b0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000030', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000031', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000032', NULL, TRUE),
  -- Demo Restaurant (all demo dishes)
  ('b0000000-0000-0000-0000-000000000099','d0000000-0000-0000-0000-000000000040', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000099','d0000000-0000-0000-0000-000000000041', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000099','d0000000-0000-0000-0000-000000000042', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000099','d0000000-0000-0000-0000-000000000043', NULL, TRUE),
  ('b0000000-0000-0000-0000-000000000099','d0000000-0000-0000-0000-000000000044', NULL, TRUE)
ON CONFLICT (branch_id, dish_id) DO NOTHING;

-- ══════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════
INSERT INTO tables (id, branch_id, number, label, capacity, status) VALUES
  -- Spice Garden MG Road
  ('t0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001', 1, 'Window A',   4, 'available'),
  ('t0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001', 2, 'Window B',   4, 'occupied'),
  ('t0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000001', 3, 'VIP',        6, 'available'),
  ('t0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000001', 4, 'Terrace A',  4, 'reserved'),
  ('t0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000001', 5, 'Terrace B',  4, 'available'),
  -- Spice Garden Indiranagar
  ('t0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000002', 1, 'Garden',     4, 'available'),
  ('t0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000002', 2, 'Indoor A',   2, 'occupied'),
  ('t0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000002', 3, 'Indoor B',   4, 'available'),
  -- Sakura
  ('t0000000-0000-0000-0000-000000000020','b0000000-0000-0000-0000-000000000003', 1, 'Sakura 1',   2, 'available'),
  ('t0000000-0000-0000-0000-000000000021','b0000000-0000-0000-0000-000000000003', 2, 'Sakura 2',   4, 'occupied'),
  ('t0000000-0000-0000-0000-000000000022','b0000000-0000-0000-0000-000000000003', 3, 'Private',    6, 'available'),
  -- Cafe Italiano
  ('t0000000-0000-0000-0000-000000000030','b0000000-0000-0000-0000-000000000004', 1, 'Balcony',    4, 'available'),
  ('t0000000-0000-0000-0000-000000000031','b0000000-0000-0000-0000-000000000004', 2, 'Corner',     2, 'cleaning'),
  -- Demo Restaurant (8 tables covering all statuses)
  ('t0000000-0000-0000-0000-000000000040','b0000000-0000-0000-0000-000000000099', 1, 'Table 1',    4, 'available'),
  ('t0000000-0000-0000-0000-000000000041','b0000000-0000-0000-0000-000000000099', 2, 'Table 2',    4, 'occupied'),
  ('t0000000-0000-0000-0000-000000000042','b0000000-0000-0000-0000-000000000099', 3, 'VIP Suite',  6, 'reserved'),
  ('t0000000-0000-0000-0000-000000000043','b0000000-0000-0000-0000-000000000099', 4, 'Outdoor A',  4, 'cleaning'),
  ('t0000000-0000-0000-0000-000000000044','b0000000-0000-0000-0000-000000000099', 5, 'Outdoor B',  4, 'available'),
  ('t0000000-0000-0000-0000-000000000045','b0000000-0000-0000-0000-000000000099', 6, 'Bar Seat 1', 2, 'available'),
  ('t0000000-0000-0000-0000-000000000046','b0000000-0000-0000-0000-000000000099', 7, 'Bar Seat 2', 2, 'occupied'),
  ('t0000000-0000-0000-0000-000000000047','b0000000-0000-0000-0000-000000000099', 8, 'Private',    8, 'available')
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- ORDERS — Demo Restaurant (all 6 statuses)
-- ══════════════════════════════════════════════
INSERT INTO orders (id, branch_id, table_id, staff_id, order_number, status, type, total_amount, discount_amount, tax_amount) VALUES
  ('o0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000099','t0000000-0000-0000-0000-000000000041','s0000000-0000-0000-0000-000000000004','ORD-DEMO-001','pending',   'dine_in',  530.00, 0,    47.70),
  ('o0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000099','t0000000-0000-0000-0000-000000000042','s0000000-0000-0000-0000-000000000004','ORD-DEMO-002','confirmed', 'dine_in',  700.00, 0,    63.00),
  ('o0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000099','t0000000-0000-0000-0000-000000000046','s0000000-0000-0000-0000-000000000004','ORD-DEMO-003','preparing', 'dine_in',  450.00, 0,    40.50),
  ('o0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000099', NULL,                                 's0000000-0000-0000-0000-000000000004','ORD-DEMO-004','ready',     'takeaway', 350.00, 20,   29.70),
  ('o0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000099', NULL,                                 's0000000-0000-0000-0000-000000000004','ORD-DEMO-005','served',    'delivery', 570.00, 0,    51.30),
  ('o0000000-0000-0000-0000-000000000006','b0000000-0000-0000-0000-000000000099','t0000000-0000-0000-0000-000000000040','s0000000-0000-0000-0000-000000000004','ORD-DEMO-006','cancelled', 'dine_in',  220.00, 0,    19.80)
ON CONFLICT (id) DO NOTHING;

-- Spice Garden MG Road orders
INSERT INTO orders (id, branch_id, table_id, staff_id, order_number, status, type, total_amount, tax_amount) VALUES
  ('o0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000001','t0000000-0000-0000-0000-000000000002','s0000000-0000-0000-0000-000000000011','ORD-SG-001','served',   'dine_in', 980.00, 88.20),
  ('o0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000001','t0000000-0000-0000-0000-000000000001','s0000000-0000-0000-0000-000000000011','ORD-SG-002','preparing','dine_in', 460.00, 41.40),
  ('o0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000001', NULL,                                 's0000000-0000-0000-0000-000000000011','ORD-SG-003','served',   'takeaway',320.00, 28.80)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════
-- ORDER ITEMS
-- ══════════════════════════════════════════════
INSERT INTO order_items (order_id, dish_id, dish_name, quantity, unit_price, status) VALUES
  -- ORD-DEMO-001 (pending)
  ('o0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000040','Spring Rolls',  2, 160, 'pending'),
  ('o0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000041','Grilled Chicken',1,350, 'pending'),
  -- ORD-DEMO-002 (confirmed)
  ('o0000000-0000-0000-0000-000000000002','d0000000-0000-0000-0000-000000000041','Grilled Chicken',2, 350,'pending'),
  -- ORD-DEMO-003 (preparing)
  ('o0000000-0000-0000-0000-000000000003','d0000000-0000-0000-0000-000000000042','Veg Fried Rice', 2, 220,'preparing'),
  -- ORD-DEMO-004 (ready)
  ('o0000000-0000-0000-0000-000000000004','d0000000-0000-0000-0000-000000000041','Grilled Chicken',1, 350,'ready'),
  -- ORD-DEMO-005 (served)
  ('o0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000041','Grilled Chicken',1, 350,'served'),
  ('o0000000-0000-0000-0000-000000000005','d0000000-0000-0000-0000-000000000042','Veg Fried Rice', 1, 220,'served'),
  -- ORD-DEMO-006 (cancelled)
  ('o0000000-0000-0000-0000-000000000006','d0000000-0000-0000-0000-000000000042','Veg Fried Rice', 1, 220,'pending'),
  -- ORD-SG-001
  ('o0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000001','Paneer Tikka',   2, 280,'served'),
  ('o0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000004','Butter Chicken', 1, 380,'served'),
  ('o0000000-0000-0000-0000-000000000010','d0000000-0000-0000-0000-000000000007','Garlic Naan',    2,  60,'served'),
  -- ORD-SG-002
  ('o0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000004','Butter Chicken', 1, 380,'preparing'),
  ('o0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000008','Mango Lassi',    1, 120,'preparing'),
  -- ORD-SG-003
  ('o0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000005','Dal Makhani',    1, 280,'served'),
  ('o0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000007','Garlic Naan',    1,  60,'served')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════
-- PAYMENTS
-- ══════════════════════════════════════════════
INSERT INTO payments (order_id, branch_id, amount, method, status, transaction_id) VALUES
  -- Demo Restaurant (all 4 payment methods)
  ('o0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000099', 621.30, 'upi',    'completed', 'UPI-DEMO-001'),
  ('o0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000099', 359.70, 'card',   'completed', 'CARD-DEMO-001'),
  -- Spice Garden
  ('o0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000001',1068.20, 'cash',   'completed', NULL),
  ('o0000000-0000-0000-0000-000000000012','b0000000-0000-0000-0000-000000000001', 348.80, 'wallet', 'completed', 'WAL-SG-001')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════
-- ACTIVITY LOGS
-- ══════════════════════════════════════════════
INSERT INTO activity_logs (organization_id, branch_id, staff_id, action, resource_type, resource_id, metadata) VALUES
  ('a0000000-0000-0000-0000-000000000099','b0000000-0000-0000-0000-000000000099','s0000000-0000-0000-0000-000000000001','created','organization','a0000000-0000-0000-0000-000000000099','{"note":"Demo org created"}'),
  ('a0000000-0000-0000-0000-000000000099','b0000000-0000-0000-0000-000000000099','s0000000-0000-0000-0000-000000000002','added_staff','staff','s0000000-0000-0000-0000-000000000004','{"name":"Demo Waiter","role":"waiter"}'),
  ('a0000000-0000-0000-0000-000000000099','b0000000-0000-0000-0000-000000000099','s0000000-0000-0000-0000-000000000004','created_order','order','o0000000-0000-0000-0000-000000000001','{"order_number":"ORD-DEMO-001"}'),
  ('a0000000-0000-0000-0000-000000000099','b0000000-0000-0000-0000-000000000099','s0000000-0000-0000-0000-000000000006','processed_payment','payment',NULL,'{"amount":621.30,"method":"upi"}')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════
-- FEEDBACK
-- ══════════════════════════════════════════════
INSERT INTO feedback (branch_id, order_id, rating, comment, customer) VALUES
  ('b0000000-0000-0000-0000-000000000001','o0000000-0000-0000-0000-000000000010', 5, 'Absolutely delicious! Best butter chicken in the city.', 'Ananya M.'),
  ('b0000000-0000-0000-0000-000000000001','o0000000-0000-0000-0000-000000000012', 4, 'Good food, quick service. Will come again.', 'Rahul D.'),
  ('b0000000-0000-0000-0000-000000000099','o0000000-0000-0000-0000-000000000005', 5, 'Demo feedback - excellent service!', 'Test User'),
  ('b0000000-0000-0000-0000-000000000099', NULL,                                  3, 'Average experience, room for improvement.', 'Anonymous')
ON CONFLICT DO NOTHING;
"""

os.makedirs(BASE, exist_ok=True)

with open(os.path.join(BASE, "000_reset.sql"), "w") as f:
    f.write(reset_sql)
print("✓ 000_reset.sql")

with open(os.path.join(BASE, "001_setup.sql"), "w") as f:
    f.write(setup_sql)
print("✓ 001_setup.sql")

with open(os.path.join(BASE, "002_seed_data.sql"), "w") as f:
    f.write(seed_sql)
print("✓ 002_seed_data.sql")

print("All SQL files written successfully.")
