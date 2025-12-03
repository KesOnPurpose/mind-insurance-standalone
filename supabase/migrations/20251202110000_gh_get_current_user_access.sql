-- ============================================================================
-- GROUPHOME (GH) - GET CURRENT USER ACCESS DETAILS
-- ============================================================================
-- Purpose: Return current user's full access record, bypassing RLS
-- This function is called by the frontend to check access
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gh_get_current_user_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  result JSON;
BEGIN
  -- Get current user's email from auth
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  IF user_email IS NULL THEN
    RETURN json_build_object(
      'is_approved', false,
      'tier', null,
      'user', null
    );
  END IF;

  -- Get full user record
  SELECT json_build_object(
    'is_approved', true,
    'tier', tier::text,
    'user', json_build_object(
      'id', id,
      'email', email,
      'user_id', user_id,
      'tier', tier::text,
      'is_active', is_active,
      'full_name', full_name,
      'expires_at', expires_at,
      'approved_at', approved_at
    )
  ) INTO result
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER(user_email)
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  -- If no record found, return not approved
  IF result IS NULL THEN
    RETURN json_build_object(
      'is_approved', false,
      'tier', null,
      'user', null
    );
  END IF;

  -- Update last_access_at timestamp
  UPDATE public.gh_approved_users
  SET last_access_at = NOW()
  WHERE LOWER(email) = LOWER(user_email)
  AND is_active = true;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.gh_get_current_user_access() IS 'Grouphome: Get current authenticated user full access details (bypasses RLS)';
