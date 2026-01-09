-- ============================================================================
-- ADMIN: GET ALL USER PROFILES FOR TARGETING
-- ============================================================================
-- Purpose: Allow admins to fetch all user profiles for MIO report targeting
-- This bypasses RLS on user_profiles for admin users
-- ============================================================================

-- Function to get all user profiles (admin only)
CREATE OR REPLACE FUNCTION public.gh_admin_get_all_user_profiles()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  caller_tier TEXT;
BEGIN
  -- Get caller's tier from gh_approved_users
  SELECT gau.tier::text INTO caller_tier
  FROM public.gh_approved_users gau
  WHERE LOWER(gau.email) = LOWER((SELECT au.email FROM auth.users au WHERE au.id = auth.uid()))
  AND gau.is_active = true;

  -- Only admins and above can access this function
  IF caller_tier IS NULL OR caller_tier NOT IN ('admin', 'super_admin', 'owner') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return all user profiles with basic info
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.email::TEXT AS user_email,
    up.full_name::TEXT AS user_full_name
  FROM public.user_profiles up
  WHERE up.deleted_at IS NULL
  ORDER BY
    CASE WHEN up.full_name IS NOT NULL AND up.full_name != '' THEN 0 ELSE 1 END,
    up.full_name ASC NULLS LAST,
    up.email ASC;
END;
$$;

COMMENT ON FUNCTION public.gh_admin_get_all_user_profiles() IS 
  'Get all user profiles for admin targeting (admin+ only). Returns id, email, full_name.';

-- Grant execute to authenticated users (function handles permission check internally)
GRANT EXECUTE ON FUNCTION public.gh_admin_get_all_user_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.gh_admin_get_all_user_profiles() TO service_role;

-- ============================================================================
-- DONE
-- ============================================================================
