-- ============================================================================
-- MI ACCESS CONTROL FUNCTIONS
-- Purpose: RPC functions for Mind Insurance access control
-- ============================================================================

-- ============================================================================
-- FUNCTION: mi_is_current_user_approved
-- Check if current user is approved for MI
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_is_current_user_approved()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mi_approved_users
    WHERE user_id = auth.uid()
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

COMMENT ON FUNCTION mi_is_current_user_approved() IS 'Check if current authenticated user has active MI access';

-- ============================================================================
-- FUNCTION: mi_get_current_user_access
-- Get current user's MI access details (main access check function)
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_get_current_user_access()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approved RECORD;
  v_user RECORD;
BEGIN
  -- Get approved user record
  SELECT * INTO v_approved
  FROM mi_approved_users
  WHERE user_id = auth.uid()
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  -- Get user profile
  SELECT id, email, full_name INTO v_user
  FROM user_profiles
  WHERE id = auth.uid();

  RETURN json_build_object(
    'is_approved', v_approved IS NOT NULL,
    'tier', COALESCE(v_approved.tier::text, null),
    'user', CASE
      WHEN v_user IS NOT NULL THEN json_build_object(
        'id', v_user.id,
        'email', v_user.email,
        'full_name', v_user.full_name
      )
      ELSE null
    END,
    'approved_at', v_approved.approved_at,
    'expires_at', v_approved.expires_at
  );
END;
$$;

COMMENT ON FUNCTION mi_get_current_user_access() IS 'Get complete access details for current MI user including tier and profile';

-- ============================================================================
-- FUNCTION: mi_has_tier_access
-- Check if user has required tier access (tier hierarchy)
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_has_tier_access(required_tier mi_user_tier)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_tier mi_user_tier;
BEGIN
  SELECT tier INTO v_user_tier
  FROM mi_approved_users
  WHERE user_id = auth.uid()
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW());

  IF v_user_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Tier hierarchy: super_admin > admin > user
  CASE required_tier
    WHEN 'user' THEN RETURN true;
    WHEN 'admin' THEN RETURN v_user_tier IN ('admin', 'super_admin');
    WHEN 'super_admin' THEN RETURN v_user_tier = 'super_admin';
    ELSE RETURN false;
  END CASE;
END;
$$;

COMMENT ON FUNCTION mi_has_tier_access(mi_user_tier) IS 'Check if current user meets the required tier level (super_admin > admin > user)';

-- ============================================================================
-- FUNCTION: mi_admin_get_all_users
-- Admin function: Get all MI users (admin+ only)
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_admin_get_all_users()
RETURNS SETOF mi_approved_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT mi_has_tier_access('admin'::mi_user_tier) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT * FROM mi_approved_users
  ORDER BY created_at DESC;
END;
$$;

COMMENT ON FUNCTION mi_admin_get_all_users() IS 'Get all MI approved users - requires admin tier';

-- ============================================================================
-- FUNCTION: mi_admin_add_user
-- Admin function: Add a new MI approved user
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_admin_add_user(
  p_email TEXT,
  p_tier mi_user_tier DEFAULT 'user',
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS mi_approved_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result mi_approved_users;
  v_existing_user_id UUID;
BEGIN
  -- Verify caller is super_admin
  IF NOT mi_has_tier_access('super_admin'::mi_user_tier) THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email);

  INSERT INTO mi_approved_users (
    email,
    user_id,
    tier,
    full_name,
    phone,
    notes,
    approved_by
  ) VALUES (
    LOWER(p_email),
    v_existing_user_id,
    p_tier,
    p_full_name,
    p_phone,
    p_notes,
    auth.uid()
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION mi_admin_add_user(TEXT, mi_user_tier, TEXT, TEXT, TEXT) IS 'Add a new MI approved user - requires super_admin tier';

-- ============================================================================
-- FUNCTION: mi_admin_update_user
-- Admin function: Update an MI approved user
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_admin_update_user(
  p_user_id UUID,
  p_tier mi_user_tier DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS mi_approved_users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result mi_approved_users;
BEGIN
  -- Verify caller is super_admin
  IF NOT mi_has_tier_access('super_admin'::mi_user_tier) THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  UPDATE mi_approved_users
  SET
    tier = COALESCE(p_tier, tier),
    is_active = COALESCE(p_is_active, is_active),
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    notes = COALESCE(p_notes, notes),
    expires_at = COALESCE(p_expires_at, expires_at),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION mi_admin_update_user(UUID, mi_user_tier, BOOLEAN, TEXT, TEXT, TEXT, TIMESTAMPTZ) IS 'Update an MI approved user - requires super_admin tier';

-- ============================================================================
-- FUNCTION: mi_admin_delete_user
-- Admin function: Delete an MI approved user
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_admin_delete_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is super_admin
  IF NOT mi_has_tier_access('super_admin'::mi_user_tier) THEN
    RAISE EXCEPTION 'Unauthorized: Super admin access required';
  END IF;

  DELETE FROM mi_approved_users WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION mi_admin_delete_user(UUID) IS 'Delete an MI approved user - requires super_admin tier';

-- ============================================================================
-- FUNCTION: mi_update_last_access
-- Update last_access_at when user accesses the app
-- ============================================================================

CREATE OR REPLACE FUNCTION mi_update_last_access()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mi_approved_users
  SET last_access_at = NOW()
  WHERE user_id = auth.uid()
  AND is_active = true;
END;
$$;

COMMENT ON FUNCTION mi_update_last_access() IS 'Update last access timestamp for current MI user';

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION mi_is_current_user_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION mi_get_current_user_access() TO authenticated;
GRANT EXECUTE ON FUNCTION mi_has_tier_access(mi_user_tier) TO authenticated;
GRANT EXECUTE ON FUNCTION mi_admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION mi_admin_add_user(TEXT, mi_user_tier, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mi_admin_update_user(UUID, mi_user_tier, BOOLEAN, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION mi_admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mi_update_last_access() TO authenticated;
