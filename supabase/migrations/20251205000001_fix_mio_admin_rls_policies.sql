-- MIO Admin RLS Policy Fix
-- Phase 29: Fix RLS policies for admin access to user groups and automation tables
--
-- Problem: Current policies only allow 'service_role' JWT, but admin panel
-- uses authenticated user sessions with role='authenticated'
--
-- Solution: Add admin access checking admin_users table, while preserving
-- service_role access for n8n/backend operations

-- =============================================
-- Section 1: Drop Existing Restrictive Policies
-- =============================================

-- Drop the overly restrictive service_role-only policies
DROP POLICY IF EXISTS "Service role has full access to user groups" ON mio_user_groups;
DROP POLICY IF EXISTS "Service role has full access to group members" ON mio_user_group_members;
DROP POLICY IF EXISTS "Service role has full access to report automation" ON mio_report_automation;

-- =============================================
-- Section 2: Create New Admin-Accessible Policies
-- =============================================

-- Policy: mio_user_groups - Allow admins and service role
CREATE POLICY "Admins and service role can manage user groups"
  ON mio_user_groups FOR ALL
  USING (
    -- Allow service role (n8n, backend operations)
    auth.jwt() ->> 'role' = 'service_role'
    OR
    -- Allow active admin users
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Policy: mio_user_group_members - Allow admins and service role
CREATE POLICY "Admins and service role can manage group members"
  ON mio_user_group_members FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Policy: mio_report_automation - Allow admins and service role
CREATE POLICY "Admins and service role can manage report automation"
  ON mio_report_automation FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- =============================================
-- Section 3: Add Read Access for Users to See Their Groups
-- =============================================

-- Users can see groups they are members of (for potential future features)
CREATE POLICY "Users can view groups they belong to"
  ON mio_user_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mio_user_group_members ugm
      WHERE ugm.group_id = mio_user_groups.id
      AND ugm.user_id = auth.uid()
    )
  );

-- Users can see their own group memberships
CREATE POLICY "Users can view their own group memberships"
  ON mio_user_group_members FOR SELECT
  USING (user_id = auth.uid());

-- =============================================
-- Section 4: Verification Query (for testing)
-- =============================================

-- Run this after migration to verify policies are correct:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual::text
-- FROM pg_policies
-- WHERE tablename IN ('mio_user_groups', 'mio_user_group_members', 'mio_report_automation')
-- ORDER BY tablename, policyname;
