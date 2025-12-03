-- ============================================================================
-- GROUPHOME (GH) - MULTI-PROVIDER ACCOUNT DETECTION FUNCTION
-- ============================================================================
-- Purpose: Detect if a user has multiple auth accounts with same email
-- Security: Uses SECURITY DEFINER to bypass RLS on auth.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.gh_detect_multi_provider_accounts(p_email TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ,
  assessment_completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
  -- Return all auth.users with same email, along with assessment status
  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::TEXT AS email,
    COALESCE(
      (au.raw_app_meta_data->>'provider')::TEXT,
      (au.raw_user_meta_data->>'provider')::TEXT,
      'email'
    ) AS provider,
    au.created_at,
    uo.assessment_completed_at
  FROM auth.users au
  LEFT JOIN public.user_onboarding uo ON uo.user_id = au.id
  WHERE LOWER(au.email) = LOWER(p_email)
  ORDER BY au.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.gh_detect_multi_provider_accounts(TEXT) IS
'Grouphome: Detect multi-provider accounts for same email (used for account linking)';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.gh_detect_multi_provider_accounts(TEXT) TO authenticated;
