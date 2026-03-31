-- ============================================
-- RestaurantOS Test Seed Data
-- ============================================
-- Run this AFTER creating a test user via the sign-up form.
-- Step 1: Sign up at /sign-up with email: owner@test.com, password: Test@1234
-- Step 2: Confirm the email (or disable email confirm in Supabase dashboard: Auth > Providers > Email > turn off "Confirm email")
-- Step 3: Complete onboarding (creates org, branch, owner staff record automatically)
-- Step 4: Then run this SQL to add more test data (categories, dishes, tables, extra staff, orders)
--
-- To test other roles, sign up with these emails:
--   kitchen@test.com  (password: Test@1234) — Kitchen staff
--   waiter@test.com   (password: Test@1234) — Waiter staff
--   admin@test.com    (password: Test@1234) — Branch Admin
--
-- After signing up each, run the INSERT statements below matching their user_id.

-- ============================================
-- AFTER onboarding is done, get the IDs:
-- ============================================
-- Get org_id: SELECT id FROM organizations LIMIT 1;
-- Get branch_id: SELECT id FROM branches LIMIT 1;
-- Get owner user_id: SELECT user_id FROM staff WHERE role = 'owner' LIMIT 1;

-- ============================================
-- Helper: Insert test categories (replace ORG_ID)
-- ============================================
-- INSERT INTO categories (org_id, name, sort_order) VALUES
--   ('ORG_ID', 'Starters', 1),
--   ('ORG_ID', 'Main Course', 2),
--   ('ORG_ID', 'Breads', 3),
--   ('ORG_ID', 'Desserts', 4),
--   ('ORG_ID', 'Beverages', 5);

-- ============================================
-- Helper: Insert test dishes (replace ORG_ID and CATEGORY_IDs)
-- ============================================
-- INSERT INTO dishes (org_id, category_id, name, price, is_veg, prep_time_minutes, sort_order) VALUES
--   ('ORG_ID', 'STARTERS_CAT_ID', 'Paneer Tikka', 249, true, 15, 1),
--   ('ORG_ID', 'STARTERS_CAT_ID', 'Chicken 65', 299, false, 12, 2),
--   ('ORG_ID', 'STARTERS_CAT_ID', 'Veg Manchurian', 199, true, 10, 3),
--   ('ORG_ID', 'MAIN_CAT_ID', 'Butter Chicken', 349, false, 20, 1),
--   ('ORG_ID', 'MAIN_CAT_ID', 'Dal Makhani', 249, true, 18, 2),
--   ('ORG_ID', 'MAIN_CAT_ID', 'Palak Paneer', 269, true, 15, 3),
--   ('ORG_ID', 'MAIN_CAT_ID', 'Biryani', 299, false, 25, 4),
--   ('ORG_ID', 'BREADS_CAT_ID', 'Butter Naan', 49, true, 5, 1),
--   ('ORG_ID', 'BREADS_CAT_ID', 'Garlic Naan', 59, true, 5, 2),
--   ('ORG_ID', 'BREADS_CAT_ID', 'Tandoori Roti', 39, true, 5, 3),
--   ('ORG_ID', 'DESSERTS_CAT_ID', 'Gulab Jamun', 99, true, 3, 1),
--   ('ORG_ID', 'DESSERTS_CAT_ID', 'Rasmalai', 129, true, 3, 2),
--   ('ORG_ID', 'BEVERAGES_CAT_ID', 'Masala Chai', 49, true, 5, 1),
--   ('ORG_ID', 'BEVERAGES_CAT_ID', 'Lassi', 79, true, 3, 2),
--   ('ORG_ID', 'BEVERAGES_CAT_ID', 'Cold Coffee', 99, true, 5, 3);

-- ============================================
-- Helper: Insert test tables (replace BRANCH_ID)
-- ============================================
-- INSERT INTO tables (branch_id, table_number, label, capacity) VALUES
--   ('BRANCH_ID', 1, 'Window 1', 4),
--   ('BRANCH_ID', 2, 'Window 2', 4),
--   ('BRANCH_ID', 3, 'Center 1', 6),
--   ('BRANCH_ID', 4, 'Center 2', 6),
--   ('BRANCH_ID', 5, 'Corner', 2),
--   ('BRANCH_ID', 6, 'Family', 8),
--   ('BRANCH_ID', 7, 'Patio 1', 4),
--   ('BRANCH_ID', 8, 'Patio 2', 4),
--   ('BRANCH_ID', 9, 'VIP', 4),
--   ('BRANCH_ID', 10, 'Bar', 2);

-- ============================================
-- Quick automated seed (run THIS after onboarding)
-- This auto-fetches IDs from existing data
-- ============================================
DO $$
DECLARE
  v_org_id UUID;
  v_branch_id UUID;
  v_cat_starters UUID;
  v_cat_main UUID;
  v_cat_breads UUID;
  v_cat_desserts UUID;
  v_cat_beverages UUID;
BEGIN
  -- Get first org and branch
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  SELECT id INTO v_branch_id FROM branches WHERE org_id = v_org_id LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Please complete onboarding first.';
  END IF;

  -- Insert categories
  INSERT INTO categories (org_id, name, sort_order) VALUES (v_org_id, 'Starters', 1) RETURNING id INTO v_cat_starters;
  INSERT INTO categories (org_id, name, sort_order) VALUES (v_org_id, 'Main Course', 2) RETURNING id INTO v_cat_main;
  INSERT INTO categories (org_id, name, sort_order) VALUES (v_org_id, 'Breads', 3) RETURNING id INTO v_cat_breads;
  INSERT INTO categories (org_id, name, sort_order) VALUES (v_org_id, 'Desserts', 4) RETURNING id INTO v_cat_desserts;
  INSERT INTO categories (org_id, name, sort_order) VALUES (v_org_id, 'Beverages', 5) RETURNING id INTO v_cat_beverages;

  -- Insert dishes
  INSERT INTO dishes (org_id, category_id, name, price, is_veg, prep_time_minutes, sort_order) VALUES
    (v_org_id, v_cat_starters, 'Paneer Tikka', 249, true, 15, 1),
    (v_org_id, v_cat_starters, 'Chicken 65', 299, false, 12, 2),
    (v_org_id, v_cat_starters, 'Veg Manchurian', 199, true, 10, 3),
    (v_org_id, v_cat_starters, 'Crispy Corn', 179, true, 8, 4),
    (v_org_id, v_cat_main, 'Butter Chicken', 349, false, 20, 1),
    (v_org_id, v_cat_main, 'Dal Makhani', 249, true, 18, 2),
    (v_org_id, v_cat_main, 'Palak Paneer', 269, true, 15, 3),
    (v_org_id, v_cat_main, 'Chicken Biryani', 299, false, 25, 4),
    (v_org_id, v_cat_main, 'Veg Biryani', 249, true, 22, 5),
    (v_org_id, v_cat_main, 'Chole Bhature', 199, true, 15, 6),
    (v_org_id, v_cat_breads, 'Butter Naan', 49, true, 5, 1),
    (v_org_id, v_cat_breads, 'Garlic Naan', 59, true, 5, 2),
    (v_org_id, v_cat_breads, 'Tandoori Roti', 39, true, 5, 3),
    (v_org_id, v_cat_breads, 'Laccha Paratha', 59, true, 7, 4),
    (v_org_id, v_cat_desserts, 'Gulab Jamun', 99, true, 3, 1),
    (v_org_id, v_cat_desserts, 'Rasmalai', 129, true, 3, 2),
    (v_org_id, v_cat_desserts, 'Kulfi', 89, true, 2, 3),
    (v_org_id, v_cat_beverages, 'Masala Chai', 49, true, 5, 1),
    (v_org_id, v_cat_beverages, 'Sweet Lassi', 79, true, 3, 2),
    (v_org_id, v_cat_beverages, 'Cold Coffee', 99, true, 5, 3),
    (v_org_id, v_cat_beverages, 'Fresh Lime Soda', 59, true, 3, 4);

  -- Insert tables
  INSERT INTO tables (branch_id, table_number, label, capacity) VALUES
    (v_branch_id, 1, 'Window 1', 4),
    (v_branch_id, 2, 'Window 2', 4),
    (v_branch_id, 3, 'Center 1', 6),
    (v_branch_id, 4, 'Center 2', 6),
    (v_branch_id, 5, 'Corner', 2),
    (v_branch_id, 6, 'Family', 8),
    (v_branch_id, 7, 'Patio 1', 4),
    (v_branch_id, 8, 'Patio 2', 4),
    (v_branch_id, 9, 'VIP', 4),
    (v_branch_id, 10, 'Bar', 2);

  RAISE NOTICE 'Seed data inserted: 5 categories, 21 dishes, 10 tables for org % branch %', v_org_id, v_branch_id;
END $$;
