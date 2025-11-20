-- ============================================================================
-- STEP 2: CREATE ADMIN AUDIT LOG AND METRICS CACHE TABLES
-- ============================================================================
-- Run this AFTER Step 1 (admin_users table creation) is successful
-- ============================================================================

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
