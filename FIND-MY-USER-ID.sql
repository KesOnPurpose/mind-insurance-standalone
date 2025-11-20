-- ============================================================================
-- FIND YOUR ACTUAL USER ID
-- ============================================================================
-- This will show all users with email containing 'kes' or 'purposewaze'
-- ============================================================================

SELECT
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  '✅ Use this user_id for admin_users INSERT' as instructions
FROM auth.users
WHERE email ILIKE '%kes%'
   OR email ILIKE '%purposewaze%'
ORDER BY created_at DESC;

-- If you don't see your email above, run this to see ALL users:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 10;
