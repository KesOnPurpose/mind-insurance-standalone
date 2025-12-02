-- ============================================================================
-- FIX: GROUPHOME (GH) - GET CURRENT USER ACCESS DETAILS
-- ============================================================================
-- Issue: STABLE functions cannot perform UPDATE operations
-- Fix: Change to VOLATILE and move UPDATE inside the function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gh_get_current_user_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE  -- Changed from STABLE to VOLATILE because we UPDATE last_access_at
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_record RECORD;
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
  SELECT * INTO user_record
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER(user_email)
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  -- If no record found, return not approved
  IF user_record IS NULL THEN
    RETURN json_build_object(
      'is_approved', false,
      'tier', null,
      'user', null
    );
  END IF;

  -- Update last_access_at timestamp
  UPDATE public.gh_approved_users
  SET last_access_at = NOW()
  WHERE id = user_record.id;

  -- Build and return result
  RETURN json_build_object(
    'is_approved', true,
    'tier', user_record.tier::text,
    'user', json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'user_id', user_record.user_id,
      'tier', user_record.tier::text,
      'is_active', user_record.is_active,
      'full_name', user_record.full_name,
      'expires_at', user_record.expires_at,
      'approved_at', user_record.approved_at
    )
  );
END;
$$;

COMMENT ON FUNCTION public.gh_get_current_user_access() IS 'Grouphome: Get current authenticated user full access details (bypasses RLS)';
