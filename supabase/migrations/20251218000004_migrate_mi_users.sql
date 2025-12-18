-- ============================================================================
-- MIGRATE MI USERS FROM GH_APPROVED_USERS
-- Purpose: One-time migration of existing MI users to mi_approved_users table
-- Run ONCE during deployment
-- ============================================================================

-- ============================================================================
-- PRE-MIGRATION CHECK
-- Count how many users will be migrated
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM gh_approved_users gau
  JOIN user_profiles up ON gau.user_id = up.id
  WHERE up.user_source = 'mi_standalone';

  RAISE NOTICE 'Found % MI users to migrate from gh_approved_users', v_count;
END $$;

-- ============================================================================
-- MIGRATION
-- Copy MI users from gh_approved_users to mi_approved_users
-- ============================================================================

INSERT INTO mi_approved_users (
  email,
  user_id,
  tier,
  is_active,
  full_name,
  phone,
  notes,
  approved_at,
  approved_by,
  expires_at,
  last_access_at,
  created_at,
  updated_at
)
SELECT
  gau.email,
  gau.user_id,
  -- Map GH tiers to MI tiers
  CASE gau.tier::text
    WHEN 'super_admin' THEN 'super_admin'::mi_user_tier
    WHEN 'owner' THEN 'super_admin'::mi_user_tier  -- Owner maps to super_admin
    WHEN 'admin' THEN 'admin'::mi_user_tier
    WHEN 'coach' THEN 'admin'::mi_user_tier        -- Coach maps to admin
    ELSE 'user'::mi_user_tier                      -- Default to user
  END,
  gau.is_active,
  gau.full_name,
  gau.phone,
  gau.notes,
  gau.approved_at,
  gau.approved_by,
  gau.expires_at,
  gau.last_access_at,
  gau.created_at,
  NOW()
FROM gh_approved_users gau
JOIN user_profiles up ON gau.user_id = up.id
WHERE up.user_source = 'mi_standalone'
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- Report how many users were migrated
-- ============================================================================

DO $$
DECLARE
  v_migrated INTEGER;
  v_expected INTEGER;
BEGIN
  -- Count migrated users
  SELECT COUNT(*) INTO v_migrated FROM mi_approved_users;

  -- Count expected users
  SELECT COUNT(*) INTO v_expected
  FROM gh_approved_users gau
  JOIN user_profiles up ON gau.user_id = up.id
  WHERE up.user_source = 'mi_standalone';

  RAISE NOTICE 'Migration complete: % users in mi_approved_users (expected: %)', v_migrated, v_expected;

  IF v_migrated < v_expected THEN
    RAISE NOTICE 'Some users may have been skipped due to email conflicts';
  END IF;
END $$;

-- ============================================================================
-- TIER DISTRIBUTION REPORT
-- ============================================================================

DO $$
DECLARE
  v_users INTEGER;
  v_admins INTEGER;
  v_super_admins INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users FROM mi_approved_users WHERE tier = 'user';
  SELECT COUNT(*) INTO v_admins FROM mi_approved_users WHERE tier = 'admin';
  SELECT COUNT(*) INTO v_super_admins FROM mi_approved_users WHERE tier = 'super_admin';

  RAISE NOTICE 'Tier distribution: users=%, admins=%, super_admins=%', v_users, v_admins, v_super_admins;
END $$;
