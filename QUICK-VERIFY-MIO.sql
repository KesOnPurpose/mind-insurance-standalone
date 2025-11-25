-- =====================================================================================
-- MIO Knowledge Chunks - QUICK VERIFICATION
-- Single query to check if Week 1 is complete
-- =====================================================================================

-- Check everything in one query
SELECT
  'mio_knowledge_chunks' as component,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'mio_knowledge_chunks'
    ) THEN '✅ TABLE EXISTS'
    ELSE '❌ TABLE MISSING'
  END as table_status,
  (
    SELECT COUNT(*)::text || ' columns'
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mio_knowledge_chunks'
  ) as columns,
  (
    SELECT COUNT(*)::text || ' indexes'
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'mio_knowledge_chunks'
  ) as indexes,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_name = 'search_mio_knowledge'
    ) THEN '✅ FUNCTION EXISTS'
    ELSE '❌ FUNCTION MISSING'
  END as search_function,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'mio_knowledge_chunks' AND rowsecurity = true
    ) THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status,
  (
    SELECT COUNT(*)::text || ' policies'
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'mio_knowledge_chunks'
  ) as rls_policies;
