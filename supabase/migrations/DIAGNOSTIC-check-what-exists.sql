-- ============================================================================
-- DIAGNOSTIC: Check what admin schema objects already exist
-- ============================================================================
-- Run this to see what was successfully created before the error
-- ============================================================================

-- Check tables
SELECT
  'TABLES' as object_type,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY table_name;

-- Check functions
SELECT
  'FUNCTIONS' as object_type,
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'is_super_admin', 'has_admin_permission', 'update_metrics_cache_access')
ORDER BY routine_name;

-- Check indexes on admin_users (if table exists)
SELECT
  'INDEXES' as object_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'admin_users'
ORDER BY indexname;

-- Check RLS policies
SELECT
  'RLS POLICIES' as object_type,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY tablename, policyname;
