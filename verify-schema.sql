-- ============================================================================
-- Schema Verification Queries
-- ============================================================================
-- Run these queries after executing schema-migration.sql
-- to confirm all changes were applied successfully
-- ============================================================================

-- ============================================================================
-- QUERY 1: Verify All New Columns Exist
-- ============================================================================
-- Expected: 5 rows (one for each new column)

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name = 'simplified_text' THEN 'User-friendly version with glossary tooltips'
        WHEN column_name = 'glossary_terms' THEN 'Array of technical terms used in this protocol'
        WHEN column_name = 'reading_level_before' THEN 'Original Flesch-Kincaid grade level'
        WHEN column_name = 'reading_level_after' THEN 'Post-simplification Flesch-Kincaid grade level'
        WHEN column_name = 'language_variant' THEN 'Language variant: clinical or simplified'
    END as expected_purpose
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks'
  AND column_name IN (
    'simplified_text',
    'glossary_terms',
    'reading_level_before',
    'reading_level_after',
    'language_variant'
  )
ORDER BY column_name;

-- ============================================================================
-- QUERY 2: Verify All New Indexes Exist
-- ============================================================================
-- Expected: 4 rows (one for each new index)

SELECT
    indexname,
    indexdef,
    CASE
        WHEN indexname = 'idx_language_variant' THEN 'Filter by language variant (clinical/simplified)'
        WHEN indexname = 'idx_glossary_terms' THEN 'Array search for technical terms'
        WHEN indexname = 'idx_reading_level_after' THEN 'Sort/filter by post-simplification reading level'
        WHEN indexname = 'idx_reading_level_before' THEN 'Track original reading level for comparison'
    END as index_purpose
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks'
  AND indexname IN (
    'idx_language_variant',
    'idx_glossary_terms',
    'idx_reading_level_after',
    'idx_reading_level_before'
  )
ORDER BY indexname;

-- ============================================================================
-- QUERY 3: Verify Column Comments
-- ============================================================================
-- Expected: 5 rows with descriptive comments

SELECT
    cols.column_name,
    pg_catalog.col_description(c.oid, cols.ordinal_position::int) as column_comment
FROM information_schema.columns cols
JOIN pg_catalog.pg_class c ON c.relname = cols.table_name
WHERE cols.table_name = 'mio_knowledge_chunks'
  AND cols.column_name IN (
    'simplified_text',
    'glossary_terms',
    'reading_level_before',
    'reading_level_after',
    'language_variant'
  )
ORDER BY cols.column_name;

-- ============================================================================
-- QUERY 4: Sample Data Check
-- ============================================================================
-- Expected: Shows current state of data (likely all NULL for new columns)

SELECT
    id,
    protocol_title,
    language_variant,
    simplified_text,
    glossary_terms,
    reading_level_before,
    reading_level_after,
    CASE
        WHEN simplified_text IS NOT NULL THEN 'Has simplified text'
        ELSE 'Awaiting processing'
    END as processing_status
FROM mio_knowledge_chunks
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- QUERY 5: Migration Completeness Check
-- ============================================================================
-- Expected: Should return 'COMPLETE' if all columns and indexes exist

WITH column_check AS (
    SELECT COUNT(*) as column_count
    FROM information_schema.columns
    WHERE table_name = 'mio_knowledge_chunks'
      AND column_name IN (
        'simplified_text',
        'glossary_terms',
        'reading_level_before',
        'reading_level_after',
        'language_variant'
      )
),
index_check AS (
    SELECT COUNT(*) as index_count
    FROM pg_indexes
    WHERE tablename = 'mio_knowledge_chunks'
      AND indexname IN (
        'idx_language_variant',
        'idx_glossary_terms',
        'idx_reading_level_after',
        'idx_reading_level_before'
      )
)
SELECT
    c.column_count,
    i.index_count,
    CASE
        WHEN c.column_count = 5 AND i.index_count = 4 THEN 'COMPLETE ✅'
        WHEN c.column_count > 0 OR i.index_count > 0 THEN 'PARTIAL ⚠️'
        ELSE 'NOT STARTED ❌'
    END as migration_status,
    CASE
        WHEN c.column_count = 5 AND i.index_count = 4 THEN 'Ready for Week 4 Agents 2-4'
        WHEN c.column_count > 0 OR i.index_count > 0 THEN 'Re-run migration to complete'
        ELSE 'Execute schema-migration.sql first'
    END as next_step
FROM column_check c, index_check i;

-- ============================================================================
-- QUERY 6: Table Statistics
-- ============================================================================
-- Expected: Shows total rows and table size

SELECT
    schemaname,
    tablename,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_stat_user_tables
WHERE tablename = 'mio_knowledge_chunks';

-- ============================================================================
-- EXPECTED RESULTS SUMMARY
-- ============================================================================
-- Query 1: 5 rows (all columns exist with correct data types)
-- Query 2: 4 rows (all indexes created)
-- Query 3: 5 rows (all column comments present)
-- Query 4: Up to 5 rows (sample data, new columns likely NULL)
-- Query 5: 1 row with status 'COMPLETE ✅'
-- Query 6: 1 row showing table statistics
-- ============================================================================
