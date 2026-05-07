-- ============================================
-- CAPP Restaurant Management System
-- SCHEMA SETUP  (matches TypeScript types exactly)
-- ============================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HELPER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ORGANIZATIONS
CREATE TABLE organizations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  slug                 TEXT UNIQUE,
  logo_url             TEXT,
  accent_color         TEXT DEFAULT '#14b8a6',
  restaurant_type      TEXT DEFAULT 'multi-cuisine',
  gst_number           TEXT,
  default_tax_percent  NUMERIC(5,2) DEFAULT 5,
  tax_inclusive        BOOLEAN DEFAULT TRUE,
  plan                 TEXT NOT NULL DEFAULT 'free'
                       CHECK (plan IN ('free','starter','professional','enterprise')),
  subscription_status  TEXT NOT NULL DEFAULT 'active'
                       CHECK (subscription_status IN ('active','trial','cancelled','expired')),
  settings             JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- BRANCHES
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  city        TEXT,
  phone       TEXT,
  upi_vpa     TEXT,
  table_count INT DEFAULT 10,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_branches_org ON branches(org_id);
CREATE TRIGGER trg_branches_updated
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- STAFF
CREATE TABLE staff (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id  UUID REFERENCES branches(id) ON DELETE SET NULL,
  full_name  TEXT,
  email      TEXT,
  phone      TEXT,
  role       TEXT NOT NULL CHECK (role IN ('owner','admin','manager','waiter','kitchen','cashier')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_staff_org    ON staff(org_id);
CREATE INDEX idx_staff_branch ON staff(branch_id);
CREATE INDEX idx_staff_user   ON staff(user_id);
CREATE TRIGGER trg_staff_updated
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- CATEGORIES
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_org ON categories(org_id);

-- DISHES
CREATE TABLE dishes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url      TEXT,
  is_veg         BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  tags           TEXT[] DEFAULT '{}',
  prep_time_mins INT DEFAULT 15,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dishes_org      ON dishes(org_id);
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE TRIGGER trg_dishes_updated
  BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- BRANCH_DISHES
CREATE TABLE branch_dishes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id    UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dish_id      UUID NOT NULL REFERENCES dishes(id)   ON DELETE CASCADE,
  custom_price NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, dish_id)
);
CREATE INDEX idx_branch_dishes_branch ON branch_dishes(branch_id);
CREATE INDEX idx_branch_dishes_dish   ON branch_dishes(dish_id);

-- TABLES
CREATE TABLE tables (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id    UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  label        TEXT,
  capacity     INT NOT NULL DEFAULT 4,
  status       TEXT NOT NULL DEFAULT 'available'
               CHECK (status IN ('available','occupied','reserved','inactive')),
  qr_code_url  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (branch_id, table_number)
);
CREATE INDEX idx_tables_branch ON tables(branch_id);

-- ORDERS
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number   TEXT NOT NULL UNIQUE,
  branch_id      UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_number   INT,
  customer_name  TEXT,
  customer_phone TEXT,
  waiter_id      UUID REFERENCES staff(id) ON DELETE SET NULL,
  order_type     TEXT NOT NULL DEFAULT 'dine_in'
                 CHECK (order_type IN ('dine_in','takeaway','delivery')),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','preparing','ready','served','cancelled')),
  subtotal       NUMERIC(10,2) DEFAULT 0,
  tax            NUMERIC(10,2) DEFAULT 0,
  discount       NUMERIC(10,2) DEFAULT 0,
  total          NUMERIC(10,2) DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_branch  ON orders(branch_id);
CREATE INDEX idx_orders_status  ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ORDER_ITEMS
CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id)  ON DELETE CASCADE,
  branch_id      UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  dish_id        UUID REFERENCES dishes(id) ON DELETE SET NULL,
  dish_name      TEXT NOT NULL,
  quantity       INT NOT NULL DEFAULT 1,
  price_at_order NUMERIC(10,2) NOT NULL,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','accepted','preparing','ready','served','cancelled')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
CREATE INDEX idx_order_items_branch ON order_items(branch_id);
CREATE TRIGGER trg_order_items_updated
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PAYMENTS
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  branch_id      UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  method         TEXT NOT NULL DEFAULT 'cash'
                 CHECK (method IN ('upi','razorpay','cash','card')),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','completed','failed','refunded')),
  transaction_id TEXT,
  provider_data  JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_order  ON payments(order_id);
CREATE INDEX idx_payments_branch ON payments(branch_id);
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                     TEXT NOT NULL DEFAULT 'free',
  status                   TEXT NOT NULL DEFAULT 'active',
  razorpay_subscription_id TEXT,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_org ON subscriptions(org_id);
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ACTIVITY_LOGS
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id   UUID REFERENCES branches(id)      ON DELETE CASCADE,
  staff_id    UUID REFERENCES staff(id)          ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_org    ON activity_logs(org_id);
CREATE INDEX idx_activity_logs_branch ON activity_logs(branch_id);
CREATE INDEX idx_activity_logs_time   ON activity_logs(created_at DESC);

-- FEEDBACK
CREATE TABLE feedback (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID REFERENCES orders(id)   ON DELETE SET NULL,
  branch_id  UUID REFERENCES branches(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feedback_branch ON feedback(branch_id);

-- ============================================
-- HELPER FUNCTIONS (used by RLS)
-- ============================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM staff WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM staff WHERE user_id = auth.uid() AND is_active = TRUE AND branch_id IS NOT NULL LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
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
  ON organizations FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "Owner/admin can update org"
  ON organizations FOR UPDATE
  USING (id = get_user_org_id() AND get_user_role() IN ('owner','admin'));

-- branches
CREATE POLICY "Staff can view own branches"
  ON branches FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Manager+ can manage branches"
  ON branches FOR ALL
  USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- staff
CREATE POLICY "Staff can view own org staff"
  ON staff FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Admin+ can manage staff"
  ON staff FOR ALL
  USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin'));

-- categories
CREATE POLICY "Staff can view org categories"
  ON categories FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "Manager+ can manage categories"
  ON categories FOR ALL
  USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- dishes
CREATE POLICY "Public can view active dishes"
  ON dishes FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Manager+ can manage dishes"
  ON dishes FOR ALL
  USING (org_id = get_user_org_id() AND get_user_role() IN ('owner','admin','manager'));

-- branch_dishes
CREATE POLICY "Anyone can view available branch dishes"
  ON branch_dishes FOR SELECT USING (TRUE);
CREATE POLICY "Manager+ can manage branch dishes"
  ON branch_dishes FOR ALL
  USING (
    branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id())
    AND get_user_role() IN ('owner','admin','manager')
  );

-- tables
CREATE POLICY "Anyone can view tables"
  ON tables FOR SELECT USING (TRUE);
CREATE POLICY "Manager+ can manage tables"
  ON tables FOR ALL
  USING (
    branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id())
    AND get_user_role() IN ('owner','admin','manager')
  );
CREATE POLICY "Waiter can update table status"
  ON tables FOR UPDATE
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));

-- orders
CREATE POLICY "Staff can view branch orders"
  ON orders FOR SELECT
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can update orders"
  ON orders FOR UPDATE
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));

-- order_items
CREATE POLICY "Staff can view order items"
  ON order_items FOR SELECT
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Staff can update order items"
  ON order_items FOR UPDATE
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));

-- payments
CREATE POLICY "Staff can view branch payments"
  ON payments FOR SELECT
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can insert payments"
  ON payments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Cashier+ can update payments"
  ON payments FOR UPDATE
  USING (
    branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id())
    AND get_user_role() IN ('owner','admin','manager','cashier')
  );

-- subscriptions
CREATE POLICY "Owner can view own subscription"
  ON subscriptions FOR SELECT USING (org_id = get_user_org_id());

-- activity_logs
CREATE POLICY "Staff can view org activity"
  ON activity_logs FOR SELECT USING (org_id = get_user_org_id());
CREATE POLICY "System can insert activity"
  ON activity_logs FOR INSERT WITH CHECK (org_id = get_user_org_id());

-- feedback
CREATE POLICY "Staff can view branch feedback"
  ON feedback FOR SELECT
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()));
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dish-images', 'dish-images', TRUE,
  5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view dish images"
  ON storage.objects FOR SELECT USING (bucket_id = 'dish-images');
CREATE POLICY "Authenticated staff can upload dish images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dish-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated staff can delete dish images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'dish-images' AND auth.role() = 'authenticated');

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
