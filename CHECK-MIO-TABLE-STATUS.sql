-- =====================================================================================
-- MIO Knowledge Chunks Table - Status Check
-- Purpose: Verify if table exists and what its current state is
-- =====================================================================================

-- Check if table exists
SELECT
  'Table Exists?' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'mio_knowledge_chunks'
    ) THEN 'YES ✓'
    ELSE 'NO ✗'
  END as status;

-- If table exists, show column count and structure
SELECT
  'Column Count' as check_type,
  COUNT(*)::text || ' columns' as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks';

-- Show all columns if table exists
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks'
ORDER BY ordinal_position;

-- Check for vector extension
SELECT
  'Vector Extension' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
    THEN 'INSTALLED ✓'
    ELSE 'NOT INSTALLED ✗'
  END as status;

-- Check for indexes
SELECT
  'Index Count' as check_type,
  COUNT(*)::text || ' indexes' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks';

-- List all indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks'
ORDER BY indexname;

-- Check for search function
SELECT
  'Search Function' as check_type,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'search_mio_knowledge'
    ) THEN 'EXISTS ✓'
    ELSE 'MISSING ✗'
  END as status;

-- Check for RLS policies
SELECT
  'RLS Policies' as check_type,
  COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks';

-- List all RLS policies
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'mio_knowledge_chunks'
ORDER BY policyname;

-- Show migration history for MIO-related migrations
-- Note: Supabase may not have executed_at column, so we just check version
SELECT version
FROM supabase_migrations.schema_migrations
WHERE version LIKE '20251122%'
ORDER BY version;
