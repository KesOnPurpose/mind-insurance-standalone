-- =====================================================================================
-- Cleanup Script for Partial MIO Migration
-- Run this FIRST if you encountered errors during previous migration attempts
-- =====================================================================================

-- Drop RLS policies first (if they exist)
DROP POLICY IF EXISTS "Authenticated users can read knowledge chunks" ON mio_knowledge_chunks;
DROP POLICY IF EXISTS "Service role can manage knowledge chunks" ON mio_knowledge_chunks;

-- Drop function (if exists)
DROP FUNCTION IF EXISTS search_mio_knowledge(vector(1536), TEXT, TEXT[], TEXT[], TEXT[], INTEGER, FLOAT, INTEGER) CASCADE;

-- Drop trigger (if exists)
DROP TRIGGER IF EXISTS trigger_update_mio_chunks_updated_at ON mio_knowledge_chunks CASCADE;

-- Drop trigger function (if exists)
DROP FUNCTION IF EXISTS update_mio_chunks_updated_at() CASCADE;

-- Drop all indexes manually (in case CASCADE didn't catch them)
DROP INDEX IF EXISTS idx_mio_chunks_embedding CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_fts CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_patterns CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_temperament CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_states CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_practice_types CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_category CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_subcategory CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_active_priority CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_time CASCADE;
DROP INDEX IF EXISTS idx_mio_chunks_difficulty CASCADE;

-- Drop table last (CASCADE will drop remaining dependencies)
DROP TABLE IF EXISTS mio_knowledge_chunks CASCADE;

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mio_knowledge_chunks') THEN
    RAISE EXCEPTION 'Table mio_knowledge_chunks still exists after cleanup!';
  END IF;

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Cleanup Complete!';
  RAISE NOTICE 'All MIO knowledge chunks objects have been removed.';
  RAISE NOTICE 'You can now run the main migration safely.';
  RAISE NOTICE '==================================================';
END $$;
