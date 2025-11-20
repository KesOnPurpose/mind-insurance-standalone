-- ============================================================================
-- VERIFY ADMIN SCHEMA DEPLOYMENT
-- ============================================================================
-- Run this to confirm everything was created successfully
-- ============================================================================

-- 1. Check all tables exist
SELECT
  'TABLES' as check_type,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY table_name;

-- Expected Result: 3 tables
-- admin_audit_log      | 9 columns
-- admin_metrics_cache  | 8 columns
-- admin_users          | 8 columns

-- 2. Check all security functions exist
SELECT
  'FUNCTIONS' as check_type,
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'is_super_admin', 'has_admin_permission', 'update_metrics_cache_access')
ORDER BY routine_name;

-- Expected Result: 4 functions, all with DEFINER security

-- 3. Check RLS is enabled
SELECT
  'RLS STATUS' as check_type,
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY tablename;

-- Expected Result: All 3 tables should show ENABLED

-- 4. Check RLS policies
SELECT
  'RLS POLICIES' as check_type,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY tablename, policyname;

-- Expected Result:
-- admin_audit_log: 2 policies (SELECT, INSERT)
-- admin_metrics_cache: 2 policies (SELECT, ALL)
-- admin_users: 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- 5. Check indexes
SELECT
  'INDEXES' as check_type,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY tablename, indexname;

-- Expected Result: Multiple indexes per table

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all queries return expected results, deployment is successful!
-- Next step: Create your first admin user using scripts/seed-admin-user.sql
-- ============================================================================
