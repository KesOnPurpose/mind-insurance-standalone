-- ============================================================================
-- GROUPHOME (GH) - MANUAL SYNC RPC FOR ADMIN
-- ============================================================================
-- Purpose: Add admin tool to manually sync all user_ids for existing users
-- Fixes: Provide one-time sync button to fix historical stale statuses
-- Use Case: Admin clicks "Sync Statuses" button to update all existing users
-- ============================================================================

-- Manual sync function for admins to fix existing data
CREATE OR REPLACE FUNCTION public.gh_admin_sync_all_user_ids()
RETURNS TABLE (
  email TEXT,
  user_id UUID,
  synced BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update all gh_approved_users where user exists in auth.users but user_id is NULL
  RETURN QUERY
  WITH updated AS (
    UPDATE public.gh_approved_users gu
    SET
      user_id = au.id,
      last_access_at = COALESCE(gu.last_access_at, NOW()),
      updated_at = NOW()
    FROM auth.users au
    WHERE LOWER(gu.email) = LOWER(au.email)
    AND gu.user_id IS NULL
    RETURNING gu.email, au.id AS user_id, true AS synced
  )
  SELECT * FROM updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gh_admin_sync_all_user_ids() TO authenticated;

COMMENT ON FUNCTION public.gh_admin_sync_all_user_ids() IS
'Grouphome: Admin function to sync all user_ids from auth.users to gh_approved_users (fixes stale statuses in bulk).
Returns: Table of synced emails with their user_ids.
Usage: Called by "Sync Statuses" button in Admin User Management page.';
