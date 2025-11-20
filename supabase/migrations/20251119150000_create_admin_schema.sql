-- ============================================================================
-- ADMIN DASHBOARD DATABASE SCHEMA
-- ============================================================================
-- Purpose: Create admin-only tables for platform management and analytics
-- Security: All tables use RLS with admin-only access policies
-- ============================================================================

-- 1. CREATE ADMIN USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'analyst', 'content_manager', 'support')),

  -- Permission granularity
  permissions JSONB DEFAULT '{
    "users": {"read": false, "write": false, "delete": false},
    "analytics": {"read": false, "export": false},
    "content": {"read": false, "write": false, "publish": false},
    "system": {"read": false, "configure": false}
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Constraints
  UNIQUE(user_id)
);

-- Indexes for admin_users
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_role ON public.admin_users(role) WHERE is_active = true;
CREATE INDEX idx_admin_users_active ON public.admin_users(is_active, last_login_at DESC);

-- Comments
COMMENT ON TABLE admin_users IS 'Admin user accounts with role-based permissions';
COMMENT ON COLUMN admin_users.role IS 'Admin role: super_admin (full access), analyst (read-only analytics), content_manager (content editing), support (user assistance)';
COMMENT ON COLUMN admin_users.permissions IS 'Granular permissions JSON object overriding role defaults';

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
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_action_type ON public.admin_audit_log(action_type, created_at DESC);
CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- Partial index for recent audit logs (last 90 days)
CREATE INDEX idx_admin_audit_log_recent
ON public.admin_audit_log(admin_user_id, action_type, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Comments
COMMENT ON TABLE admin_audit_log IS 'Complete audit trail of all admin actions for compliance and security monitoring';
COMMENT ON COLUMN admin_audit_log.action_type IS 'Type of admin action performed';
COMMENT ON COLUMN admin_audit_log.details IS 'JSON object containing action-specific details (changed fields, values, etc.)';

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
CREATE INDEX idx_admin_metrics_cache_key ON public.admin_metrics_cache(metric_key);
CREATE INDEX idx_admin_metrics_cache_expires ON public.admin_metrics_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_admin_metrics_cache_accessed ON public.admin_metrics_cache(last_accessed_at DESC);

-- Comments
COMMENT ON TABLE admin_metrics_cache IS 'Pre-calculated metrics cache for admin dashboard performance optimization';
COMMENT ON COLUMN admin_metrics_cache.metric_key IS 'Unique cache key (e.g., "dau_7d", "cache_hit_rate_30d")';
COMMENT ON COLUMN admin_metrics_cache.metric_value IS 'Cached metric data as JSON';
COMMENT ON COLUMN admin_metrics_cache.calculation_time_ms IS 'Time taken to calculate this metric (for performance monitoring)';
COMMENT ON COLUMN admin_metrics_cache.dependency_tables IS 'Array of table names this metric depends on (for cache invalidation)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: Check if current user has specific permission
CREATE OR REPLACE FUNCTION has_admin_permission(permission_path TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  perm_value BOOLEAN;
BEGIN
  SELECT permissions INTO user_permissions
  FROM admin_users
  WHERE user_id = auth.uid() AND is_active = true;

  IF user_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Navigate JSON path to get permission value
  perm_value := (user_permissions #> permission_path)::BOOLEAN;
  RETURN COALESCE(perm_value, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users FOR SELECT
  USING (is_admin());

CREATE POLICY "Super admins can insert admin users"
  ON public.admin_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can update admin users"
  ON public.admin_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can delete admin users"
  ON public.admin_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true); -- Audit logs can be inserted by system

-- Note: No UPDATE or DELETE policies - audit logs are immutable

-- RLS Policies for admin_metrics_cache
CREATE POLICY "Admins can view metrics cache"
  ON public.admin_metrics_cache FOR SELECT
  USING (is_admin());

CREATE POLICY "System can manage metrics cache"
  ON public.admin_metrics_cache FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- TRIGGER: UPDATE LAST ACCESSED TIMESTAMP ON CACHE READ
-- ============================================================================

CREATE OR REPLACE FUNCTION update_metrics_cache_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cache_access
  BEFORE UPDATE ON admin_metrics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_cache_access();

-- ============================================================================
-- INITIAL ADMIN USER SEED
-- ============================================================================
-- Note: This should be run manually with actual user_id after first admin signs up
-- Example:
-- INSERT INTO admin_users (user_id, role, permissions, is_active)
-- VALUES (
--   'your-user-uuid-here',
--   'super_admin',
--   '{"users": {"read": true, "write": true, "delete": true}, "analytics": {"read": true, "export": true}, "content": {"read": true, "write": true, "publish": true}, "system": {"read": true, "configure": true}}'::jsonb,
--   true
-- );

COMMENT ON FUNCTION is_admin() IS 'Security function: Returns true if current user is an active admin';
COMMENT ON FUNCTION has_admin_permission(TEXT[]) IS 'Security function: Check if current admin user has specific permission (e.g., has_admin_permission(ARRAY[''users'', ''write'']))';
