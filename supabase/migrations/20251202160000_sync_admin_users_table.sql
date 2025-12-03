-- ============================================================================
-- SYNC ADMIN_USERS TABLE WITH GH_APPROVED_USERS
-- ============================================================================
-- Purpose: Automatically sync admin_users table when admin+ users are added
-- to gh_approved_users table to prevent the dual-table access issue
-- ============================================================================

-- Function to sync admin_users when a user is added/updated in gh_approved_users
CREATE OR REPLACE FUNCTION public.sync_admin_users_table()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_permissions JSONB;
BEGIN
  -- Only sync for admin, super_admin, and owner tiers
  IF NEW.tier NOT IN ('admin', 'super_admin', 'owner') THEN
    -- If user was previously an admin but downgraded, remove from admin_users
    IF TG_OP = 'UPDATE' AND OLD.tier IN ('admin', 'super_admin', 'owner') THEN
      DELETE FROM public.admin_users WHERE user_id = NEW.user_id;
    END IF
;
    RETURN NEW;
  END IF;

  -- Wait for user_id to be populated (happens after user signs up)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Set permissions based on tier
  CASE NEW.tier
    WHEN 'admin' THEN
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'analytics', jsonb_build_object('read', true, 'export', true),
        'content', jsonb_build_object('read', true, 'write', true, 'publish', false),
        'system', jsonb_build_object('read', true, 'configure', false)
      );
    WHEN 'super_admin' THEN
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'analytics', jsonb_build_object('read', true, 'export', true),
        'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
        'system', jsonb_build_object('read', true, 'configure', true)
      );
    WHEN 'owner' THEN
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'analytics', jsonb_build_object('read', true, 'export', true),
        'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
        'system', jsonb_build_object('read', true, 'configure', true)
      );
    ELSE
      v_permissions := jsonb_build_object(
        'users', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'analytics', jsonb_build_object('read', false, 'export', false),
        'content', jsonb_build_object('read', false, 'write', false, 'publish', false),
        'system', jsonb_build_object('read', false, 'configure', false)
      );
  END CASE;

  -- Insert or update admin_users record
  INSERT INTO public.admin_users (
    user_id,
    role,
    permissions,
    is_active
  ) VALUES (
    NEW.user_id,
    NEW.tier::text,
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

COMMENT ON FUNCTION public.sync_admin_users_table() IS 'Automatically sync admin_users table when gh_approved_users is modified';

-- Create trigger to sync on INSERT and UPDATE
DROP TRIGGER IF EXISTS sync_admin_users_on_change ON public.gh_approved_users;
CREATE TRIGGER sync_admin_users_on_change
  AFTER INSERT OR UPDATE OF tier, user_id, is_active
  ON public.gh_approved_users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_users_table();

COMMENT ON TRIGGER sync_admin_users_on_change ON public.gh_approved_users IS 'Sync admin_users table when admin+ users are added or updated';

-- Backfill existing admin+ users that don't have admin_users records
INSERT INTO public.admin_users (user_id, role, permissions, is_active)
SELECT
  ga.user_id,
  ga.tier::text,
  CASE ga.tier
    WHEN 'admin' THEN jsonb_build_object(
      'users', jsonb_build_object('read', true, 'write', true, 'delete', false),
      'analytics', jsonb_build_object('read', true, 'export', true),
      'content', jsonb_build_object('read', true, 'write', true, 'publish', false),
      'system', jsonb_build_object('read', true, 'configure', false)
    )
    WHEN 'super_admin' THEN jsonb_build_object(
      'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
      'analytics', jsonb_build_object('read', true, 'export', true),
      'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
      'system', jsonb_build_object('read', true, 'configure', true)
    )
    WHEN 'owner' THEN jsonb_build_object(
      'users', jsonb_build_object('read', true, 'write', true, 'delete', true),
      'analytics', jsonb_build_object('read', true, 'export', true),
      'content', jsonb_build_object('read', true, 'write', true, 'publish', true),
      'system', jsonb_build_object('read', true, 'configure', true)
    )
    ELSE jsonb_build_object(
      'users', jsonb_build_object('read', false, 'write', false, 'delete', false),
      'analytics', jsonb_build_object('read', false, 'export', false),
      'content', jsonb_build_object('read', false, 'write', false, 'publish', false),
      'system', jsonb_build_object('read', false, 'configure', false)
    )
  END,
  ga.is_active
FROM public.gh_approved_users ga
WHERE ga.tier IN ('admin', 'super_admin', 'owner')
  AND ga.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users au WHERE au.user_id = ga.user_id
  );
