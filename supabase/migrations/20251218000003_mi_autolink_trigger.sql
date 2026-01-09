-- ============================================================================
-- MI AUTO-LINK TRIGGER
-- Purpose: Automatically link user_id when user signs up with approved email
-- ============================================================================

-- ============================================================================
-- FUNCTION: on_auth_user_mi_link_approved
-- Auto-link user_id when user signs up with approved email
-- ============================================================================

CREATE OR REPLACE FUNCTION on_auth_user_mi_link_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only link if the user is signing up from MI domain (check metadata)
  -- Or if there's a matching email in mi_approved_users
  UPDATE mi_approved_users
  SET
    user_id = NEW.id,
    updated_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email)
    AND user_id IS NULL;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION on_auth_user_mi_link_approved() IS 'Auto-link user_id to mi_approved_users when user signs up with approved email';

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_mi_link ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_mi_link
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION on_auth_user_mi_link_approved();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION on_auth_user_mi_link_approved() TO service_role;
