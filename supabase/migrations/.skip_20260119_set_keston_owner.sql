-- ============================================================================
-- SET KESTON GLASGOW AS OWNER
-- ============================================================================
-- Migration to set kes@purposewaze.com as owner tier in gh_approved_users
-- This grants full super_admin privileges to the application owner
-- ============================================================================

-- Update Keston's tier to 'owner' in gh_approved_users
UPDATE gh_approved_users
SET tier = 'owner'
WHERE email = 'kes@purposewaze.com';

-- Also update if matched by email in auth.users
UPDATE gh_approved_users
SET tier = 'owner'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'kes@purposewaze.com'
);

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM gh_approved_users
  WHERE (email = 'kes@purposewaze.com' OR user_id IN (SELECT id FROM auth.users WHERE email = 'kes@purposewaze.com'))
    AND tier = 'owner';

  IF updated_count = 0 THEN
    RAISE NOTICE 'WARNING: No records updated for kes@purposewaze.com. User may need to be added to gh_approved_users first.';
  ELSE
    RAISE NOTICE 'SUCCESS: % record(s) updated to owner tier for kes@purposewaze.com', updated_count;
  END IF;
END $$;
