-- ============================================
-- 002: RLS INSERT Policies for Onboarding
-- ============================================
-- During onboarding, a new user needs to:
--   1. Create an organization (no staff record exists yet)
--   2. Create a default branch
--   3. Create their own staff record (role=owner)
--
-- The existing RLS policies use get_user_org_id() which reads from staff,
-- causing a chicken-and-egg problem. These policies solve that.
-- ============================================

-- Allow any authenticated user to create an organization
CREATE POLICY "Authenticated users can create orgs"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to create a branch
-- (during onboarding, the owner creates the first branch)
CREATE POLICY "Authenticated users can create branches"
  ON branches FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to create their own staff record
CREATE POLICY "Users can create own staff record"
  ON staff FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow owner/admin to insert staff (for inviting new staff members)
CREATE POLICY "Owner/admin can insert staff"
  ON staff FOR INSERT
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin'));

-- Allow owner/admin to delete staff records
CREATE POLICY "Owner/admin can delete staff"
  ON staff FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin'));

-- Allow manager+ to insert categories
CREATE POLICY "Manager+ can insert categories"
  ON categories FOR INSERT
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Allow manager+ to insert dishes
CREATE POLICY "Manager+ can insert dishes"
  ON dishes FOR INSERT
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Allow manager+ to delete dishes
CREATE POLICY "Manager+ can delete dishes"
  ON dishes FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Allow manager+ to insert tables
CREATE POLICY "Manager+ can insert tables"
  ON tables FOR INSERT
  WITH CHECK (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()) AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Allow manager+ to delete tables
CREATE POLICY "Manager+ can delete tables"
  ON tables FOR DELETE
  USING (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()) AND get_user_role() IN ('owner', 'admin', 'manager'));

-- Allow manager+ to insert branch_dishes
CREATE POLICY "Manager+ can insert branch_dishes"
  ON branch_dishes FOR INSERT
  WITH CHECK (branch_id IN (SELECT id FROM branches WHERE org_id = get_user_org_id()) AND get_user_role() IN ('owner', 'admin', 'manager'));

-- ============================================
-- Enable Realtime for orders and order_items
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ============================================
-- DONE - Run this in Supabase SQL Editor
-- ============================================
