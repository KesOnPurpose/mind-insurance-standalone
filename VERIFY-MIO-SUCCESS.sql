-- =====================================================================================
-- MIO Knowledge Chunks - SUCCESS VERIFICATION
-- Run this to confirm table exists and is ready for protocol data
-- =====================================================================================

-- 1. Table exists?
SELECT
  'TABLE EXISTS' as status,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks';

-- 2. Column count (should be 22)
SELECT
  'COLUMN COUNT' as status,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks';

-- 3. Show all columns with types
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks'
ORDER BY ordinal_position;

-- 4. Index count (should be 14 total: 1 primary key + 13 created)
SELECT
  'INDEX COUNT' as status,
  COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks';

-- 5. List all indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks'
ORDER BY indexname;

-- 6. Check search function exists
SELECT
  'SEARCH FUNCTION' as status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'search_mio_knowledge';

-- 7. Check RLS is enabled
SELECT
  'RLS STATUS' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks';

-- 8. Count RLS policies (should be 2)
SELECT
  'RLS POLICIES' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks';

-- 9. List all RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks'
ORDER BY policyname;

-- 10. Check vector extension is installed
SELECT
  'VECTOR EXTENSION' as status,
  extname,
  extversion
FROM pg_extension
WHERE extname = 'vector';

-- =====================================================================================
-- FINAL SUMMARY
-- =====================================================================================

DO $$
DECLARE
  col_count INTEGER;
  idx_count INTEGER;
  func_exists BOOLEAN;
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- Count columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'mio_knowledge_chunks';

  -- Count indexes
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'mio_knowledge_chunks';

  -- Check function
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'search_mio_knowledge'
  ) INTO func_exists;

  -- Check RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'mio_knowledge_chunks';

  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'mio_knowledge_chunks';

  RAISE NOTICE '==================================================';
  RAISE NOTICE '          MIO KNOWLEDGE CHUNKS - STATUS          ';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Table exists: %', CASE WHEN col_count > 0 THEN 'YES ✓' ELSE 'NO ✗' END;
  RAISE NOTICE 'Columns: % (expected 22)', col_count;
  RAISE NOTICE 'Indexes: % (expected 14)', idx_count;
  RAISE NOTICE 'Search function: %', CASE WHEN func_exists THEN 'EXISTS ✓' ELSE 'MISSING ✗' END;
  RAISE NOTICE 'RLS enabled: %', CASE WHEN rls_enabled THEN 'YES ✓' ELSE 'NO ✗' END;
  RAISE NOTICE 'RLS policies: % (expected 2)', policy_count;
  RAISE NOTICE '==================================================';

  IF col_count = 22 AND idx_count = 14 AND func_exists AND rls_enabled AND policy_count = 2 THEN
    RAISE NOTICE '🎉 WEEK 1 COMPLETE - DATABASE READY FOR PROTOCOL DATA!';
  ELSE
    RAISE WARNING '⚠️  Some components missing - review results above';
  END IF;

  RAISE NOTICE '==================================================';
END $$;
