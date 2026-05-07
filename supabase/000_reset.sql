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
