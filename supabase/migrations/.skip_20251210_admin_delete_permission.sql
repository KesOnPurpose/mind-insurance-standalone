-- ============================================================================
-- Migration: Allow admin tier to delete users (previously super_admin only)
-- Date: 2025-12-10
-- ============================================================================

-- 1. Update the RPC function to allow admin tier
CREATE OR REPLACE FUNCTION public.gh_admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_tier TEXT;
  v_target_tier TEXT;
BEGIN
  -- Get caller's tier
  SELECT tier INTO v_caller_tier
  FROM public.gh_approved_users
  WHERE user_id = auth.uid();

  -- Check caller has admin+ access (CHANGED from super_admin)
  IF v_caller_tier NOT IN ('admin', 'super_admin', 'owner') THEN
    RAISE EXCEPTION 'Insufficient permissions to delete users';
  END IF;

  -- Get target's tier
  SELECT tier INTO v_target_tier
  FROM public.gh_approved_users
  WHERE id = p_user_id;

  -- Prevent deleting owner tier (unless caller is owner)
  IF v_target_tier = 'owner' AND v_caller_tier != 'owner' THEN
    RAISE EXCEPTION 'Cannot delete owner tier users';
  END IF;

  -- Prevent deleting higher tier users
  IF v_target_tier = 'super_admin' AND v_caller_tier = 'admin' THEN
    RAISE EXCEPTION 'Cannot delete users with higher tier';
  END IF;

  -- Perform deletion
  DELETE FROM public.gh_approved_users WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- 2. Update RLS policy to allow admin tier DELETE
DROP POLICY IF EXISTS "Super admins can delete approved users" ON public.gh_approved_users;

CREATE POLICY "Admins can delete approved users"
ON public.gh_approved_users
FOR DELETE
USING (
  public.gh_has_tier_access('admin')
  AND (
    -- Cannot delete owner unless you're owner
    (SELECT tier FROM public.gh_approved_users WHERE id = gh_approved_users.id) != 'owner'
    OR public.gh_get_user_tier() = 'owner'
  )
);

-- ============================================================================
-- Summary:
-- - admin tier can now delete users (user, coach, admin)
-- - admin tier CANNOT delete super_admin or owner
-- - super_admin can delete users (user, coach, admin, super_admin)
-- - super_admin CANNOT delete owner
-- - owner can delete anyone
-- ============================================================================
