-- ============================================================================
-- PREREQUISITE: Admin Functions for FEAT-GH-009
-- ============================================================================
-- Purpose: Ensure all required helper functions exist before running
--          the Phase-Based Course Platform migrations (010a-016)
-- RUN THIS FIRST: Before any FEAT-GH-009 migrations
-- ============================================================================

-- ============================================================================
-- STEP 1: Check and create admin_users table if not exists
-- ============================================================================

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'analyst', 'content_manager', 'support', 'coach')),

  -- Permission granularity
  permissions JSONB DEFAULT '{
    "users": {"read": false, "write": false, "delete": false},
    "analytics": {"read": false, "export": false},
    "content": {"read": false, "write": false, "publish": false},
    "system": {"read": false, "configure": false},
    "coaching": {"view_students": false, "send_nudges": false, "override_gates": false, "view_analytics": false}
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Constraints
  UNIQUE(user_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active, last_login_at DESC);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create or replace is_admin() function
-- ============================================================================
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

COMMENT ON FUNCTION is_admin() IS
  'Security function: Returns true if current user is an active admin (any role)';

-- ============================================================================
-- STEP 3: Create or replace is_super_admin() function
-- ============================================================================
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

COMMENT ON FUNCTION is_super_admin() IS
  'Security function: Returns true if current user is an active super_admin';

-- ============================================================================
-- STEP 4: Create or replace is_coach() function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_coach()
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
    AND role = 'coach'
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION is_coach() IS
  'Security function: Returns true if current user is an active coach';

-- ============================================================================
-- STEP 5: Create or replace is_coach_or_admin() function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_coach_or_admin()
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
    AND role IN ('super_admin', 'analyst', 'content_manager', 'support', 'coach')
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION is_coach_or_admin() IS
  'Security function: Returns true if current user is an active coach or any admin role';

-- ============================================================================
-- STEP 6: Create or replace has_admin_permission() function
-- ============================================================================
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

COMMENT ON FUNCTION has_admin_permission(TEXT[]) IS
  'Security function: Check if current admin user has specific permission';

-- ============================================================================
-- STEP 7: Create RLS policies for admin_users table (if not exist)
-- ============================================================================

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users FOR SELECT
  USING ((SELECT is_admin()));

CREATE POLICY "Super admins can insert admin users"
  ON public.admin_users FOR INSERT
  WITH CHECK ((SELECT is_super_admin()));

CREATE POLICY "Super admins can update admin users"
  ON public.admin_users FOR UPDATE
  USING ((SELECT is_super_admin()));

CREATE POLICY "Super admins can delete admin users"
  ON public.admin_users FOR DELETE
  USING ((SELECT is_super_admin()));

-- ============================================================================
-- STEP 8: Verification
-- ============================================================================
DO $$
DECLARE
  v_admin_users_exists BOOLEAN;
  v_is_admin_exists BOOLEAN;
  v_is_super_admin_exists BOOLEAN;
  v_is_coach_exists BOOLEAN;
BEGIN
  -- Check if admin_users table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) INTO v_admin_users_exists;

  -- Check if is_admin function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
  ) INTO v_is_admin_exists;

  -- Check if is_super_admin function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin'
  ) INTO v_is_super_admin_exists;

  -- Check if is_coach function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_coach'
  ) INTO v_is_coach_exists;

  IF v_admin_users_exists AND v_is_admin_exists AND v_is_super_admin_exists AND v_is_coach_exists THEN
    RAISE NOTICE '✓ PREREQUISITE: All admin functions created successfully';
    RAISE NOTICE '  → admin_users table: EXISTS';
    RAISE NOTICE '  → is_admin() function: EXISTS';
    RAISE NOTICE '  → is_super_admin() function: EXISTS';
    RAISE NOTICE '  → is_coach() function: EXISTS';
    RAISE NOTICE '  → is_coach_or_admin() function: EXISTS';
    RAISE NOTICE '  → has_admin_permission() function: EXISTS';
    RAISE NOTICE '';
    RAISE NOTICE '  You can now run the FEAT-GH-009 migrations in this order:';
    RAISE NOTICE '    1. 20260120_010a_programs_table_core.sql';
    RAISE NOTICE '    2. 20260120_011a_phases_table_core.sql';
    RAISE NOTICE '    3. 20260120_012a_lessons_table_core.sql';
    RAISE NOTICE '    4. 20260120_013a_lesson_tactics_table_core.sql';
    RAISE NOTICE '    5. 20260120_014_enrollment_tables.sql';
    RAISE NOTICE '    6. 20260120_016_add_enrollment_dependent_policies.sql';
  ELSE
    RAISE EXCEPTION '✗ PREREQUISITE: One or more components FAILED to create (table: %, is_admin: %, is_super_admin: %, is_coach: %)',
      v_admin_users_exists, v_is_admin_exists, v_is_super_admin_exists, v_is_coach_exists;
  END IF;
END $$;
