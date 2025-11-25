-- ============================================================================
-- Week 4 Protocol Update: Required Schema Migration
-- ============================================================================
--
-- PURPOSE: Add simplified language columns to mio_knowledge_chunks table
-- AGENT: Week 4 Protocol Update Agent
-- DATE: 2025-11-22
--
-- IMPORTANT: Execute this SQL in Supabase SQL Editor BEFORE running
--            execute-week-4-agent-2.py
--
-- ============================================================================

-- Add new columns for simplified language variant
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS simplified_text TEXT,
ADD COLUMN IF NOT EXISTS glossary_terms TEXT[],
ADD COLUMN IF NOT EXISTS reading_level_before NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS reading_level_after NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS language_variant VARCHAR(20) DEFAULT 'clinical';

-- Add helpful comments
COMMENT ON COLUMN mio_knowledge_chunks.simplified_text IS 'User-friendly version with glossary tooltips';
COMMENT ON COLUMN mio_knowledge_chunks.glossary_terms IS 'Technical terms used in this protocol';
COMMENT ON COLUMN mio_knowledge_chunks.language_variant IS 'clinical (original) or simplified';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_language_variant ON mio_knowledge_chunks(language_variant);
CREATE INDEX IF NOT EXISTS idx_glossary_terms ON mio_knowledge_chunks USING GIN(glossary_terms);
CREATE INDEX IF NOT EXISTS idx_reading_level ON mio_knowledge_chunks(reading_level_after);

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to confirm success)
-- ============================================================================

-- Check new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks'
  AND column_name IN ('simplified_text', 'glossary_terms', 'reading_level_before', 'reading_level_after', 'language_variant')
ORDER BY column_name;

-- Check indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks'
  AND indexname IN ('idx_language_variant', 'idx_glossary_terms', 'idx_reading_level')
ORDER BY indexname;

-- Verify table structure
SELECT
    COUNT(*) as total_rows,
    COUNT(simplified_text) as has_simplified,
    COUNT(glossary_terms) as has_glossary,
    COUNT(reading_level_before) as has_reading_before,
    COUNT(reading_level_after) as has_reading_after
FROM mio_knowledge_chunks;

-- ============================================================================
-- EXPECTED VERIFICATION RESULTS
-- ============================================================================
--
-- Query 1 (Columns):
--   Should return 5 rows showing:
--   - simplified_text (TEXT, nullable)
--   - glossary_terms (TEXT[], nullable)
--   - reading_level_before (NUMERIC(4,2), nullable)
--   - reading_level_after (NUMERIC(4,2), nullable)
--   - language_variant (VARCHAR(20), default 'clinical')
--
-- Query 2 (Indexes):
--   Should return 3 rows showing:
--   - idx_language_variant
--   - idx_glossary_terms
--   - idx_reading_level
--
-- Query 3 (Data):
--   Should return:
--   - total_rows: 205
--   - has_simplified: 0 (before update)
--   - has_glossary: 0 (before update)
--   - has_reading_before: 0 (before update)
--   - has_reading_after: 0 (before update)
--
-- ============================================================================

-- SUCCESS: If all verification queries return expected results, schema
--          migration is complete and ready for Phase 3 execution!
--
-- NEXT STEP: Run `python3 execute-week-4-agent-2.py` in glossary-extraction/
-- ============================================================================
