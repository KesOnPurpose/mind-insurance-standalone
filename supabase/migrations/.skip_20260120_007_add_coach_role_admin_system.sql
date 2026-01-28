-- ============================================================================
-- FEAT-GH-004-G: Add coach role to admin system
-- ============================================================================
-- Purpose: Add 'coach' role for Lynette and future coaches
-- Coaches can: view student progress, manage nudges, override completion gates
-- They cannot: access system config, delete users, or modify admin settings
-- ============================================================================

-- 1. ALTER ADMIN_USERS TABLE TO ADD COACH ROLE
-- First, drop and recreate the check constraint to include 'coach'
ALTER TABLE public.admin_users
DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
ADD CONSTRAINT admin_users_role_check CHECK (
  role IN ('super_admin', 'analyst', 'content_manager', 'support', 'coach')
);

-- 2. CREATE IS_COACH HELPER FUNCTION
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

-- 3. CREATE IS_COACH_OR_ADMIN HELPER FUNCTION
-- Useful for policies where coaches OR admins need access
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

-- 4. CREATE GET_USER_ADMIN_ROLE FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_admin_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.admin_users
  WHERE user_id = auth.uid()
  AND is_active = true;

  RETURN v_role;
END;
$$;

COMMENT ON FUNCTION get_user_admin_role() IS
  'Returns the admin role of the current user (null if not an admin)';

-- 5. ADD COACH-SPECIFIC PERMISSIONS TEMPLATE
-- Define what permissions coaches should have by default
COMMENT ON TABLE admin_users IS
  'Admin user accounts with role-based permissions. Roles: super_admin (full access), analyst (read-only analytics), content_manager (content editing), support (user assistance), coach (student management and nudges)';

-- 6. CREATE COACH PERMISSIONS VIEW
-- Shows which permissions each role has
CREATE OR REPLACE VIEW public.admin_role_permissions AS
SELECT
  'super_admin' as role,
  jsonb_build_object(
    'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
    'analytics', jsonb_build_object('read', true, 'export', true),
    'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
    'system', jsonb_build_object('read', true, 'configure', true),
    'coaching', jsonb_build_object('view_students', true, 'send_nudges', true, 'override_gates', true, 'view_analytics', true)
  ) as default_permissions
UNION ALL
SELECT
  'coach' as role,
  jsonb_build_object(
    'users', jsonb_build_object('read', true, 'write', false, 'delete', false),
    'analytics', jsonb_build_object('read', true, 'export', false),
    'content', jsonb_build_object('read', true, 'write', false, 'publish', false),
    'system', jsonb_build_object('read', false, 'configure', false),
    'coaching', jsonb_build_object('view_students', true, 'send_nudges', true, 'override_gates', true, 'view_analytics', true)
  ) as default_permissions
UNION ALL
SELECT
  'analyst' as role,
  jsonb_build_object(
    'users', jsonb_build_object('read', true, 'write', false, 'delete', false),
    'analytics', jsonb_build_object('read', true, 'export', true),
    'content', jsonb_build_object('read', true, 'write', false, 'publish', false),
    'system', jsonb_build_object('read', false, 'configure', false),
    'coaching', jsonb_build_object('view_students', false, 'send_nudges', false, 'override_gates', false, 'view_analytics', true)
  ) as default_permissions
UNION ALL
SELECT
  'content_manager' as role,
  jsonb_build_object(
    'users', jsonb_build_object('read', true, 'write', false, 'delete', false),
    'analytics', jsonb_build_object('read', true, 'export', false),
    'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
    'system', jsonb_build_object('read', false, 'configure', false),
    'coaching', jsonb_build_object('view_students', false, 'send_nudges', false, 'override_gates', false, 'view_analytics', false)
  ) as default_permissions
UNION ALL
SELECT
  'support' as role,
  jsonb_build_object(
    'users', jsonb_build_object('read', true, 'write', true, 'delete', false),
    'analytics', jsonb_build_object('read', true, 'export', false),
    'content', jsonb_build_object('read', true, 'write', false, 'publish', false),
    'system', jsonb_build_object('read', false, 'configure', false),
    'coaching', jsonb_build_object('view_students', true, 'send_nudges', true, 'override_gates', false, 'view_analytics', false)
  ) as default_permissions;

COMMENT ON VIEW admin_role_permissions IS
  'Reference view showing default permissions for each admin role';

-- 7. ADD HAS_COACHING_PERMISSION HELPER
CREATE OR REPLACE FUNCTION public.has_coaching_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_permissions JSONB;
  coaching_perms JSONB;
BEGIN
  -- Get user's role and permissions
  SELECT role, permissions INTO user_role, user_permissions
  FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Super admin has all permissions
  IF user_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Check explicit permission override
  IF user_permissions IS NOT NULL THEN
    coaching_perms := user_permissions->'coaching';
    IF coaching_perms IS NOT NULL AND (coaching_perms->>permission_name)::BOOLEAN = true THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Check role-based defaults
  IF user_role = 'coach' THEN
    RETURN permission_name IN ('view_students', 'send_nudges', 'override_gates', 'view_analytics');
  END IF;

  IF user_role = 'support' THEN
    RETURN permission_name IN ('view_students', 'send_nudges');
  END IF;

  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION has_coaching_permission(TEXT) IS
  'Check if current user has a specific coaching permission (view_students, send_nudges, override_gates, view_analytics)';

-- 8. ADD AUDIT LOG ACTION TYPES FOR COACHING
-- Update the audit log check constraint to include coaching actions
ALTER TABLE public.admin_audit_log
DROP CONSTRAINT IF EXISTS admin_audit_log_action_type_check;

ALTER TABLE public.admin_audit_log
ADD CONSTRAINT admin_audit_log_action_type_check CHECK (action_type IN (
  -- Existing actions
  'user_view', 'user_edit', 'user_delete', 'user_export',
  'content_view', 'content_edit', 'content_publish', 'content_delete',
  'analytics_view', 'analytics_export',
  'system_config', 'system_health_check',
  -- New coaching actions
  'coach_view_student', 'coach_send_nudge', 'coach_override_gate',
  'coach_add_note', 'coach_intervention', 'coach_escalation'
));

-- 9. ADD TARGET TYPES FOR COACHING
ALTER TABLE public.admin_audit_log
DROP CONSTRAINT IF EXISTS admin_audit_log_target_type_check;

ALTER TABLE public.admin_audit_log
ADD CONSTRAINT admin_audit_log_target_type_check CHECK (target_type IN (
  'user', 'tactic', 'assessment', 'conversation', 'system',
  -- New coaching targets
  'student', 'progress', 'nudge', 'completion_gate'
));

-- 10. CREATE COACH STUDENTS VIEW
-- A view that coaches can use to see their assigned students
CREATE OR REPLACE VIEW public.coach_student_overview AS
SELECT
  up.id as user_id,
  up.full_name,
  up.email,
  up.created_at as joined_at,
  up.user_source,
  -- Progress metrics
  (SELECT COUNT(*) FROM gh_user_tactic_progress WHERE user_id = up.id AND status = 'completed') as tactics_completed,
  (SELECT COUNT(*) FROM gh_user_tactic_progress WHERE user_id = up.id AND status = 'in_progress') as tactics_in_progress,
  (SELECT MAX(last_accessed_at) FROM gh_user_tactic_progress WHERE user_id = up.id) as last_activity_at,
  -- Risk indicators
  CASE
    WHEN (SELECT MAX(last_accessed_at) FROM gh_user_tactic_progress WHERE user_id = up.id) < NOW() - INTERVAL '7 days'
    THEN 'high_risk'
    WHEN (SELECT MAX(last_accessed_at) FROM gh_user_tactic_progress WHERE user_id = up.id) < NOW() - INTERVAL '3 days'
    THEN 'medium_risk'
    ELSE 'active'
  END as engagement_status
FROM user_profiles up
WHERE up.user_source = 'mi_standalone';  -- Mind Insurance users only

COMMENT ON VIEW coach_student_overview IS
  'Dashboard view for coaches showing student progress and engagement status';

-- 11. ADD RLS POLICY FOR COACHES ON STUDENT PROGRESS
-- Coaches can view all student tactic progress
CREATE POLICY "Coaches can view all tactic progress"
  ON public.gh_user_tactic_progress FOR SELECT
  USING ((SELECT public.has_coaching_permission('view_students')));

-- Coaches can update progress (for overrides)
CREATE POLICY "Coaches can override tactic progress"
  ON public.gh_user_tactic_progress FOR UPDATE
  USING ((SELECT public.has_coaching_permission('override_gates')));

-- Coaches can view automation events
CREATE POLICY "Coaches can view automation events"
  ON public.gh_automation_events FOR SELECT
  USING ((SELECT public.has_coaching_permission('view_students')));

-- Coaches can create automation events (nudges)
CREATE POLICY "Coaches can create automation events"
  ON public.gh_automation_events FOR INSERT
  WITH CHECK ((SELECT public.has_coaching_permission('send_nudges')));

-- 12. VERIFICATION QUERY
DO $$
DECLARE
  v_coach_in_roles BOOLEAN;
  v_is_coach_exists BOOLEAN;
BEGIN
  -- Check if coach is in the role constraint
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints
    WHERE constraint_name = 'admin_users_role_check'
    AND check_clause LIKE '%coach%'
  ) INTO v_coach_in_roles;

  -- Check if is_coach function exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'is_coach'
  ) INTO v_is_coach_exists;

  IF v_coach_in_roles AND v_is_coach_exists THEN
    RAISE NOTICE '✓ FEAT-GH-004-G: Coach role added to admin system successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-G: Coach role addition FAILED (roles: %, function: %)', v_coach_in_roles, v_is_coach_exists;
  END IF;
END $$;
