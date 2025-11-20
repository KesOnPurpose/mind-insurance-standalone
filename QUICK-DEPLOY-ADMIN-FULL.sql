-- ============================================================================
-- COMPLETE ADMIN SCHEMA - FULL DEPLOYMENT
-- ============================================================================
-- This creates EVERYTHING from scratch including admin_users table
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it
-- ============================================================================

-- 1. CREATE ADMIN_USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role and permissions
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'analyst', 'content_manager', 'support')),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for admin_users
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);

-- Comments
COMMENT ON TABLE admin_users IS 'Admin user management with role-based access control';
COMMENT ON COLUMN admin_users.role IS 'Admin role: super_admin, analyst, content_manager, or support';
COMMENT ON COLUMN admin_users.permissions IS 'Granular permissions as JSON object';

-- 2. CREATE ADMIN AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'user_view', 'user_edit', 'user_delete', 'user_export',
    'content_view', 'content_edit', 'content_publish', 'content_delete',
    'analytics_view', 'analytics_export',
    'system_config', 'system_health_check'
  )),
  target_type TEXT CHECK (target_type IN ('user', 'tactic', 'assessment', 'conversation', 'system')),
  target_id TEXT,

  -- Audit metadata
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_audit_log
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON public.admin_audit_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- 3. CREATE ADMIN METRICS CACHE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,

  -- Cache metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  calculation_time_ms INTEGER,

  -- Source tracking
  source_query TEXT,
  dependency_tables TEXT[],

  -- Timestamps
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin_metrics_cache
CREATE INDEX IF NOT EXISTS idx_admin_metrics_cache_key ON public.admin_metrics_cache(metric_key);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_cache_expires ON public.admin_metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_cache_accessed ON public.admin_metrics_cache(last_accessed_at DESC);

-- ============================================================================
-- ENABLE RLS ON ALL ADMIN TABLES
-- ============================================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_metrics_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SECURITY FUNCTIONS
-- ============================================================================

-- Helper function: Check if current user is an admin
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

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

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

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING ((SELECT is_admin()));

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for admin_metrics_cache
CREATE POLICY "Admins can view metrics cache"
  ON public.admin_metrics_cache FOR SELECT
  USING ((SELECT is_admin()));

CREATE POLICY "System can manage metrics cache"
  ON public.admin_metrics_cache FOR ALL
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger function: Update last accessed timestamp on cache read
CREATE OR REPLACE FUNCTION update_metrics_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update cache access timestamp
CREATE TRIGGER trigger_update_cache_access
  BEFORE UPDATE ON admin_metrics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_cache_access();

-- ============================================================================
-- FUNCTION COMMENTS
-- ============================================================================
COMMENT ON FUNCTION is_admin() IS 'Security function: Returns true if current user is an active admin';
COMMENT ON FUNCTION is_super_admin() IS 'Security function: Returns true if current user is an active super_admin';
COMMENT ON FUNCTION has_admin_permission(TEXT[]) IS 'Security function: Check if current admin user has specific permission';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Admin schema deployed successfully!';
  RAISE NOTICE 'Next step: Insert your admin user record';
END $$;
