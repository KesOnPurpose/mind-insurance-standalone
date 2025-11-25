-- ============================================================================
-- Week 4 Agent 1: Database Schema Migration
-- ============================================================================
-- Mission: Add simplified language support columns to mio_knowledge_chunks
-- Execute this SQL in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add new columns for simplified language variant
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS simplified_text TEXT,
ADD COLUMN IF NOT EXISTS glossary_terms TEXT[],
ADD COLUMN IF NOT EXISTS reading_level_before NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS reading_level_after NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS language_variant VARCHAR(20) DEFAULT 'clinical';

-- Step 2: Add column comments for documentation
COMMENT ON COLUMN mio_knowledge_chunks.simplified_text IS 'User-friendly version with glossary tooltips (format: {{term||definition}})';
COMMENT ON COLUMN mio_knowledge_chunks.glossary_terms IS 'Array of technical terms used in this protocol';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_before IS 'Original Flesch-Kincaid grade level (before simplification)';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_after IS 'Post-simplification Flesch-Kincaid grade level';
COMMENT ON COLUMN mio_knowledge_chunks.language_variant IS 'Language variant: clinical (original) or simplified';

-- Step 3: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_language_variant ON mio_knowledge_chunks(language_variant);
CREATE INDEX IF NOT EXISTS idx_glossary_terms ON mio_knowledge_chunks USING GIN(glossary_terms);
CREATE INDEX IF NOT EXISTS idx_reading_level_after ON mio_knowledge_chunks(reading_level_after);
CREATE INDEX IF NOT EXISTS idx_reading_level_before ON mio_knowledge_chunks(reading_level_before);

-- Step 4: Verify schema changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
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

-- Step 5: Verify indexes created
SELECT
    indexname,
    indexdef
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
-- Expected Results
-- ============================================================================
-- Columns Added: 5
-- Indexes Created: 4
-- Ready for: Glossary tooltip injection and reading level tracking
-- ============================================================================
