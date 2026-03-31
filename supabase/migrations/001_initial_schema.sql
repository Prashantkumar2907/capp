-- CAPP Restaurant Management - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','growth','pro')),
  gst_number TEXT,
  default_tax_percent NUMERIC(5,2) DEFAULT 5.00,
  tax_inclusive BOOLEAN DEFAULT TRUE,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active','past_due','cancelled','trialing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================
-- 2. BRANCHES
-- ============================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  upi_vpa TEXT,
  table_count INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_org ON branches(org_id);
CREATE INDEX idx_branches_active ON branches(org_id, is_active);

-- ============================================
-- 3. STAFF
-- ============================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'waiter' CHECK (role IN ('owner','admin','manager','waiter','kitchen','cashier')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_staff_org ON staff(org_id);
CREATE INDEX idx_staff_branch ON staff(branch_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE UNIQUE INDEX idx_staff_user_org ON staff(user_id, org_id) WHERE user_id IS NOT NULL;

-- ============================================
-- 4. CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_org ON categories(org_id);

-- ============================================
-- 5. DISHES
-- ============================================
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dishes_org ON dishes(org_id);
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_dishes_active ON dishes(org_id, is_active);

-- ============================================
-- 6. BRANCH_DISHES (per-branch overrides)
-- ============================================
CREATE TABLE branch_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  custom_price NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, dish_id)
);

CREATE INDEX idx_branch_dishes_branch ON branch_dishes(branch_id);
CREATE INDEX idx_branch_dishes_dish ON branch_dishes(dish_id);

-- ============================================
-- 7. TABLES
-- ============================================
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','inactive')),
  qr_code_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(branch_id, table_number)
);

CREATE INDEX idx_tables_branch ON tables(branch_id);
CREATE INDEX idx_tables_status ON tables(branch_id, status);

-- ============================================
-- 8. ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_number INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  waiter_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  order_type TEXT DEFAULT 'dine_in' CHECK (order_type IN ('dine_in','takeaway','delivery')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','served','cancelled')),
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_branch ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(branch_id, status);
CREATE INDEX idx_orders_created ON orders(branch_id, created_at DESC);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_table ON orders(branch_id, table_number);

-- ============================================
-- 9. ORDER_ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_order NUMERIC(10,2) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','preparing','ready','served','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_branch ON order_items(branch_id);
CREATE INDEX idx_order_items_status ON order_items(branch_id, status);

-- ============================================
-- 10. PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT DEFAULT 'upi' CHECK (method IN ('upi','razorpay','cash','card')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  transaction_id TEXT,
  provider_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_branch ON payments(branch_id);
CREATE INDEX idx_payments_status ON payments(branch_id, status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ============================================
-- 11. SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  razorpay_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(org_id);

-- ============================================
-- 12. ACTIVITY_LOGS
-- ============================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_org ON activity_logs(org_id);
CREATE INDEX idx_activity_branch ON activity_logs(branch_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ============================================
-- 13. FEEDBACK
-- ============================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_branch ON feedback(branch_id);
CREATE INDEX idx_feedback_order ON feedback(order_id);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_dishes_updated BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_items_updated BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user's branch_id
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: staff can view their org
CREATE POLICY "Staff can view own org" ON organizations
  FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "Owner can update org" ON organizations
  FOR UPDATE USING (id = get_user_org_id() AND get_user_role() = 'owner');

-- Branches: staff can view branches in their org
CREATE POLICY "Staff can view org branches" ON branches
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Owner/admin can manage branches" ON branches
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin'));

-- Staff: can view colleagues, owner/admin can manage
CREATE POLICY "Staff can view org staff" ON staff
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Own record" ON staff
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owner/admin can manage staff" ON staff
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin'));

-- Categories: org-scoped
CREATE POLICY "Staff can view categories" ON categories
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Manager+ can manage categories" ON categories
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- Dishes: org-scoped
CREATE POLICY "Staff can view dishes" ON dishes
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Manager+ can manage dishes" ON dishes
  FOR ALL USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- Branch Dishes: branch-scoped, public read for customer ordering
CREATE POLICY "Staff can view branch dishes" ON branch_dishes
  FOR SELECT USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Public can view available dishes" ON branch_dishes
  FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Manager+ can manage branch dishes" ON branch_dishes
  FOR ALL USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()) AND get_user_role() IN ('owner','admin','manager'));

-- Tables: branch-scoped
CREATE POLICY "Staff can view tables" ON tables
  FOR SELECT USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Manager+ can manage tables" ON tables
  FOR ALL USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()) AND get_user_role() IN ('owner','admin','manager'));

-- Orders: branch-scoped, customers can insert
CREATE POLICY "Staff can view branch orders" ON orders
  FOR SELECT USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can update orders" ON orders
  FOR UPDATE USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));

-- Order Items: follows orders
CREATE POLICY "Staff can view order items" ON order_items
  FOR SELECT USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can update order items" ON order_items
  FOR UPDATE USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));

-- Payments: branch-scoped
CREATE POLICY "Staff can view payments" ON payments
  FOR SELECT USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can create payments" ON payments
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can update payments" ON payments
  FOR UPDATE USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));

-- Subscriptions
CREATE POLICY "Owner can view subscriptions" ON subscriptions
  FOR SELECT USING (org_id = get_user_org_id());

-- Activity Logs
CREATE POLICY "Staff can view logs" ON activity_logs
  FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Staff can insert logs" ON activity_logs
  FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- Feedback: public insert, staff read
CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can view feedback" ON feedback
  FOR SELECT USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Public can view own feedback" ON feedback
  FOR SELECT USING (TRUE);

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Run these in Supabase Dashboard > Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ============================================
-- DONE
-- ============================================
