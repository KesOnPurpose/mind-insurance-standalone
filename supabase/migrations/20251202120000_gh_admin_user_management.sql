-- ============================================================================
-- GROUPHOME (GH) - ADMIN USER MANAGEMENT FUNCTIONS
-- ============================================================================
-- Purpose: Allow admins to manage approved users (bypasses RLS)
-- ============================================================================

-- Function to get all approved users (admin only)
CREATE OR REPLACE FUNCTION public.gh_admin_get_all_users()
RETURNS SETOF public.gh_approved_users
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  caller_tier TEXT;
BEGIN
  -- Get caller's tier
  SELECT tier::text INTO caller_tier
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND is_active = true;

  -- Only admins and above can access this function
  IF caller_tier IS NULL OR caller_tier NOT IN ('admin', 'super_admin', 'owner') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return all users
  RETURN QUERY
  SELECT *
  FROM public.gh_approved_users
  ORDER BY approved_at DESC;
END;
$$;

COMMENT ON FUNCTION public.gh_admin_get_all_users() IS 'Grouphome Admin: Get all approved users (admin+ only)';

-- Function to add a new approved user (admin only)
CREATE OR REPLACE FUNCTION public.gh_admin_add_user(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT 'user',
  p_notes TEXT DEFAULT NULL,
  p_payment_source TEXT DEFAULT 'manual',
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS public.gh_approved_users
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  caller_tier TEXT;
  caller_tier_level INT;
  target_tier_level INT;
  new_user public.gh_approved_users;
  tier_levels CONSTANT INT[] := ARRAY[1, 2, 3, 4, 5]; -- user, coach, admin, super_admin, owner
  tier_names CONSTANT TEXT[] := ARRAY['user', 'coach', 'admin', 'super_admin', 'owner'];
BEGIN
  -- Get caller's tier
  SELECT tier::text INTO caller_tier
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND is_active = true;

  -- Only admins and above can access this function
  IF caller_tier IS NULL OR caller_tier NOT IN ('admin', 'super_admin', 'owner') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get tier levels
  caller_tier_level := array_position(tier_names, caller_tier);
  target_tier_level := array_position(tier_names, p_tier);

  IF target_tier_level IS NULL THEN
    RAISE EXCEPTION 'Invalid tier: %', p_tier;
  END IF;

  -- Can only create users with lower tier than yourself (except owner can do anything)
  IF caller_tier != 'owner' AND target_tier_level >= caller_tier_level THEN
    RAISE EXCEPTION 'Cannot create user with tier % or higher', caller_tier;
  END IF;

  -- Insert the new user
  INSERT INTO public.gh_approved_users (
    email,
    full_name,
    phone,
    tier,
    notes,
    payment_source,
    payment_reference,
    is_active
  ) VALUES (
    LOWER(TRIM(p_email)),
    NULLIF(TRIM(p_full_name), ''),
    NULLIF(TRIM(p_phone), ''),
    p_tier::gh_access_tier,
    NULLIF(TRIM(p_notes), ''),
    COALESCE(p_payment_source, 'manual'),
    NULLIF(TRIM(p_payment_reference), ''),
    true
  )
  RETURNING * INTO new_user;

  RETURN new_user;
END;
$$;

COMMENT ON FUNCTION public.gh_admin_add_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Grouphome Admin: Add new approved user (admin+ only)';

-- Function to update an approved user (admin only)
CREATE OR REPLACE FUNCTION public.gh_admin_update_user(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_payment_source TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS public.gh_approved_users
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  caller_tier TEXT;
  caller_tier_level INT;
  target_current_tier TEXT;
  target_current_tier_level INT;
  new_tier_level INT;
  updated_user public.gh_approved_users;
  tier_names CONSTANT TEXT[] := ARRAY['user', 'coach', 'admin', 'super_admin', 'owner'];
BEGIN
  -- Get caller's tier
  SELECT tier::text INTO caller_tier
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND is_active = true;

  -- Only admins and above can access this function
  IF caller_tier IS NULL OR caller_tier NOT IN ('admin', 'super_admin', 'owner') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get target user's current tier
  SELECT tier::text INTO target_current_tier
  FROM public.gh_approved_users
  WHERE id = p_user_id;

  IF target_current_tier IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get tier levels
  caller_tier_level := array_position(tier_names, caller_tier);
  target_current_tier_level := array_position(tier_names, target_current_tier);

  -- Can only modify users with lower tier than yourself (except owner can do anything)
  IF caller_tier != 'owner' AND target_current_tier_level >= caller_tier_level THEN
    RAISE EXCEPTION 'Cannot modify user with tier % or higher', caller_tier;
  END IF;

  -- If changing tier, validate the new tier
  IF p_tier IS NOT NULL THEN
    new_tier_level := array_position(tier_names, p_tier);
    IF new_tier_level IS NULL THEN
      RAISE EXCEPTION 'Invalid tier: %', p_tier;
    END IF;
    -- Can only set tier lower than your own
    IF caller_tier != 'owner' AND new_tier_level >= caller_tier_level THEN
      RAISE EXCEPTION 'Cannot set tier to % or higher', caller_tier;
    END IF;
  END IF;

  -- Update the user
  UPDATE public.gh_approved_users SET
    full_name = COALESCE(NULLIF(TRIM(p_full_name), ''), full_name),
    phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
    tier = COALESCE(p_tier::gh_access_tier, tier),
    notes = COALESCE(NULLIF(TRIM(p_notes), ''), notes),
    payment_source = COALESCE(p_payment_source, payment_source),
    payment_reference = COALESCE(NULLIF(TRIM(p_payment_reference), ''), payment_reference),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_user_id
  RETURNING * INTO updated_user;

  RETURN updated_user;
END;
$$;

COMMENT ON FUNCTION public.gh_admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) IS 'Grouphome Admin: Update approved user (admin+ only)';

-- Function to delete an approved user (super_admin+ only)
CREATE OR REPLACE FUNCTION public.gh_admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  caller_tier TEXT;
  caller_tier_level INT;
  target_tier TEXT;
  target_tier_level INT;
  tier_names CONSTANT TEXT[] := ARRAY['user', 'coach', 'admin', 'super_admin', 'owner'];
BEGIN
  -- Get caller's tier
  SELECT tier::text INTO caller_tier
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND is_active = true;

  -- Only super_admins and owners can delete users
  IF caller_tier IS NULL OR caller_tier NOT IN ('super_admin', 'owner') THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  -- Get target user's tier
  SELECT tier::text INTO target_tier
  FROM public.gh_approved_users
  WHERE id = p_user_id;

  IF target_tier IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get tier levels
  caller_tier_level := array_position(tier_names, caller_tier);
  target_tier_level := array_position(tier_names, target_tier);

  -- Can only delete users with lower tier than yourself
  IF caller_tier != 'owner' AND target_tier_level >= caller_tier_level THEN
    RAISE EXCEPTION 'Cannot delete user with tier % or higher', caller_tier;
  END IF;

  -- Delete the user
  DELETE FROM public.gh_approved_users WHERE id = p_user_id;

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.gh_admin_delete_user(UUID) IS 'Grouphome Admin: Delete approved user (super_admin+ only)';

-- Function to bulk add users (admin only)
CREATE OR REPLACE FUNCTION public.gh_admin_bulk_add_users(
  p_emails TEXT[],
  p_tier TEXT DEFAULT 'user',
  p_payment_source TEXT DEFAULT 'bulk_import'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  caller_tier TEXT;
  inserted_count INT;
BEGIN
  -- Get caller's tier
  SELECT tier::text INTO caller_tier
  FROM public.gh_approved_users
  WHERE LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  AND is_active = true;

  -- Only admins and above can access this function
  IF caller_tier IS NULL OR caller_tier NOT IN ('admin', 'super_admin', 'owner') THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Insert users, ignoring duplicates
  INSERT INTO public.gh_approved_users (email, tier, is_active, payment_source)
  SELECT
    LOWER(TRIM(email)),
    p_tier::gh_access_tier,
    true,
    p_payment_source
  FROM UNNEST(p_emails) AS email
  WHERE TRIM(email) != '' AND POSITION('@' IN email) > 0
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION public.gh_admin_bulk_add_users(TEXT[], TEXT, TEXT) IS 'Grouphome Admin: Bulk add approved users (admin+ only)';
