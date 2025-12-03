-- ============================================================================
-- FIX ADMIN ROLE MAPPING IN SYNC TRIGGER
-- ============================================================================
-- Purpose: Fix role check constraint violation when syncing admin tiers
-- Issue: gh_approved_users.tier='admin' doesn't match admin_users.role enum
-- Solution: Map 'admin' → 'super_admin', 'owner' → 'super_admin'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_admin_users_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_permissions JSONB;
  v_admin_role TEXT;
BEGIN
  -- Only sync for admin, super_admin, and owner tiers
  IF NEW.tier NOT IN ('admin', 'super_admin', 'owner') THEN
    -- If user was previously an admin but downgraded, remove from admin_users
    IF TG_OP = 'UPDATE' AND OLD.tier IN ('admin', 'super_admin', 'owner') THEN
      DELETE FROM public.admin_users WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Wait for user_id to be populated (happens after user signs up)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map gh_approved_users.tier to valid admin_users.role
  -- admin_users.role CHECK constraint: ('super_admin', 'analyst', 'content_manager', 'support')
  CASE NEW.tier
    WHEN 'admin' THEN
      v_admin_role := 'super_admin';  -- Map 'admin' to 'super_admin'
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'analytics', jsonb_build_object('read', true, 'export', true),
        'content', jsonb_build_object('read', true, 'write', true, 'publish', false),
        'system', jsonb_build_object('read', true, 'configure', false)
      );
    WHEN 'super_admin' THEN
      v_admin_role := 'super_admin';  -- Already valid
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'analytics', jsonb_build_object('read', true, 'export', true),
        'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
        'system', jsonb_build_object('read', true, 'configure', true)
      );
    WHEN 'owner' THEN
      v_admin_role := 'super_admin';  -- Map 'owner' to 'super_admin' (highest level)
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'analytics', jsonb_build_object('read', true, 'export', true),
        'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
        'system', jsonb_build_object('read', true, 'configure', true)
      );
    ELSE
      v_admin_role := 'support';  -- Default fallback (should never happen)
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'analytics', jsonb_build_object('read', false, 'export', false),
        'content', jsonb_build_object('read', false, 'write', false, 'publish', false),
        'system', jsonb_build_object('read', false, 'configure', false)
      );
  END CASE;

  -- Insert or update admin_users record with MAPPED role
  INSERT INTO public.admin_users (
    user_id,
    role,
    permissions,
    is_active
  ) VALUES (
    NEW.user_id,
    v_admin_role,  -- Use mapped role instead of NEW.tier
    v_permissions,
    NEW.is_active
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_admin_users_table() IS 'Automatically sync admin_users table when gh_approved_users is modified. Maps tier values to valid admin role enum.';
