-- MIO Protocols Admin RLS Policy Fix
-- Date: 2025-12-06
-- Issue: Protocols tab showing "Failed to load protocols" error
--
-- Root Cause: The admin RLS policies were checking gh_approved_users (data table)
-- instead of admin_users (permission table)
--
-- Fix: Update policies to use admin_users table (matching pattern from
-- 20251205000001_fix_mio_admin_rls_policies.sql)

-- =============================================
-- Section 1: Drop Old Broken Policies
-- =============================================

DROP POLICY IF EXISTS "Admins can view all protocols" ON mio_weekly_protocols;
DROP POLICY IF EXISTS "Admins can update all protocols" ON mio_weekly_protocols;

-- =============================================
-- Section 2: Create New Admin-Accessible Policies
-- =============================================

-- Policy: Admins can view all protocols
CREATE POLICY "Admins can view all protocols"
  ON mio_weekly_protocols FOR SELECT
  USING (
    -- Allow service role (n8n, backend operations)
    auth.jwt() ->> 'role' = 'service_role'
    OR
    -- Allow active admin users (correct pattern using admin_users table)
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );

-- Policy: Admins can update all protocols
CREATE POLICY "Admins can update all protocols"
  ON mio_weekly_protocols FOR UPDATE
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
-- Section 3: Verification Query
-- =============================================

-- Run this after migration to verify policies are correct:
-- SELECT policyname, cmd, qual::text AS using_clause
-- FROM pg_policies
-- WHERE tablename = 'mio_weekly_protocols'
-- ORDER BY policyname;
