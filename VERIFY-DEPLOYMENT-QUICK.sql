-- ============================================================================
-- QUICK DEPLOYMENT VERIFICATION
-- ============================================================================
-- Run this to check if admin schema is deployed correctly
-- ============================================================================

-- Check if all 3 tables exist
SELECT
  'Tables Check' as check_type,
  COUNT(*) as found,
  '3 expected' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache');

-- Check if security functions exist
SELECT
  'Functions Check' as check_type,
  COUNT(*) as found,
  '3 expected (is_admin, is_super_admin, has_admin_permission)' as expected
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'is_super_admin', 'has_admin_permission');

-- Check if RLS policies exist
SELECT
  'RLS Policies Check' as check_type,
  COUNT(*) as found,
  '8 expected' as expected
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache');

-- Check if your admin user exists
SELECT
  'Admin User Check' as check_type,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Admin user exists'
    ELSE '❌ Need to create admin user'
  END as status,
  u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f'
GROUP BY u.email;
