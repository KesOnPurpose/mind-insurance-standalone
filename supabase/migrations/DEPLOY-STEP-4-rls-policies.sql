-- ============================================================================
-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- ============================================================================
-- Run this AFTER Step 3 (security functions) is successful
-- This is the FINAL step of the admin schema deployment
-- ============================================================================

-- Enable RLS on all admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_metrics_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for admin_users
-- ============================================================================

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
-- RLS Policies for admin_audit_log
-- ============================================================================

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING ((SELECT is_admin()));

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true); -- Audit logs can be inserted by system

-- Note: No UPDATE or DELETE policies - audit logs are immutable

-- ============================================================================
-- RLS Policies for admin_metrics_cache
-- ============================================================================

CREATE POLICY "Admins can view metrics cache"
  ON public.admin_metrics_cache FOR SELECT
  USING ((SELECT is_admin()));

CREATE POLICY "System can manage metrics cache"
  ON public.admin_metrics_cache FOR ALL
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));
