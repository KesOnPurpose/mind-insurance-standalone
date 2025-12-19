-- ============================================================================
-- FIX: RLS Infinite Recursion on mi_approved_users
-- Problem: Admin/super_admin policies query the same table, causing recursion
-- Solution: Use SECURITY DEFINER function to bypass RLS when checking roles
-- ============================================================================

-- Step 1: Create a SECURITY DEFINER function to check MI admin status
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION mi_check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mi_approved_users
    WHERE user_id = auth.uid()
    AND tier IN ('admin', 'super_admin')
    AND is_active = true
  );
$$;

-- Step 2: Create function to check if user is super_admin
CREATE OR REPLACE FUNCTION mi_check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mi_approved_users
    WHERE user_id = auth.uid()
    AND tier = 'super_admin'
    AND is_active = true
  );
$$;

-- Step 3: Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own MI access" ON mi_approved_users;
DROP POLICY IF EXISTS "MI admins can view all" ON mi_approved_users;
DROP POLICY IF EXISTS "MI super admins can manage" ON mi_approved_users;
DROP POLICY IF EXISTS "Service role full access mi_approved" ON mi_approved_users;

-- Step 4: Recreate policies using the helper functions

-- Users can view their own record (no recursion here)
CREATE POLICY "Users can view own MI access"
  ON mi_approved_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all (uses SECURITY DEFINER function to avoid recursion)
CREATE POLICY "MI admins can view all"
  ON mi_approved_users FOR SELECT
  USING (mi_check_is_admin());

-- Super admins can manage all (uses SECURITY DEFINER function)
CREATE POLICY "MI super admins can manage"
  ON mi_approved_users FOR ALL
  USING (mi_check_is_super_admin());

-- Service role bypass (for N8n and Edge Functions)
CREATE POLICY "Service role full access mi_approved"
  ON mi_approved_users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION mi_check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION mi_check_is_super_admin() TO authenticated;
