-- ============================================================================
-- STEP 3: CREATE SECURITY FUNCTIONS
-- ============================================================================
-- Run this AFTER Step 2 (audit_log and metrics_cache tables) is successful
-- CRITICAL: These functions must exist BEFORE creating RLS policies
-- ============================================================================

-- Helper function: Check if current user is an admin
-- SECURITY DEFINER bypasses RLS to avoid infinite recursion
-- STABLE because result is consistent within a transaction
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Helper function: Check if current user is a super admin
-- SECURITY DEFINER bypasses RLS to avoid infinite recursion
-- STABLE because result is consistent within a transaction
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$;

-- Helper function: Check if current user has specific permission
-- SECURITY DEFINER bypasses RLS to avoid infinite recursion
-- STABLE because result is consistent within a transaction
CREATE OR REPLACE FUNCTION public.has_admin_permission(permission_path TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_permissions JSONB;
  perm_value BOOLEAN;
BEGIN
  SELECT permissions INTO user_permissions
  FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true;

  IF user_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Navigate JSON path to get permission value
  perm_value := (user_permissions #> permission_path)::BOOLEAN;
  RETURN COALESCE(perm_value, FALSE);
END;
$$;

-- Add comments documenting the functions
COMMENT ON FUNCTION is_admin() IS 'Security function: Returns true if current user is an active admin';
COMMENT ON FUNCTION is_super_admin() IS 'Security function: Returns true if current user is an active super_admin (used in RLS policies to avoid circular dependencies)';
COMMENT ON FUNCTION has_admin_permission(TEXT[]) IS 'Security function: Check if current admin user has specific permission (e.g., has_admin_permission(ARRAY[''users'', ''write'']))';
