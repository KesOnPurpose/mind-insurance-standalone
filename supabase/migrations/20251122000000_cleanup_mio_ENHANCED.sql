-- =====================================================================================
-- MIO Knowledge Chunks - ENHANCED CLEANUP
-- Purpose: Remove ALL remnants including orphaned constraint names
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

-- =====================================================================================
-- CRITICAL: Remove orphaned constraint names from PostgreSQL catalog
-- =====================================================================================

-- This removes the constraint name from pg_constraint even if table doesn't exist
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  -- Check if constraint exists in catalog
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname = 'unique_chunk';

  IF constraint_count > 0 THEN
    -- Drop the constraint from any table it's attached to
    EXECUTE (
      SELECT 'ALTER TABLE ' || nsp.nspname || '.' || cls.relname || ' DROP CONSTRAINT IF EXISTS unique_chunk CASCADE;'
      FROM pg_constraint con
      JOIN pg_class cls ON con.conrelid = cls.oid
      JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
      WHERE con.conname = 'unique_chunk'
      LIMIT 1
    );
    RAISE NOTICE '✓ Removed orphaned constraint: unique_chunk';
  ELSE
    RAISE NOTICE '✓ No orphaned unique_chunk constraint found';
  END IF;

  -- Also check for valid_time_commitment constraint
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint
  WHERE conname = 'valid_time_commitment';

  IF constraint_count > 0 THEN
    EXECUTE (
      SELECT 'ALTER TABLE ' || nsp.nspname || '.' || cls.relname || ' DROP CONSTRAINT IF EXISTS valid_time_commitment CASCADE;'
      FROM pg_constraint con
      JOIN pg_class cls ON con.conrelid = cls.oid
      JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
      WHERE con.conname = 'valid_time_commitment'
      LIMIT 1
    );
    RAISE NOTICE '✓ Removed orphaned constraint: valid_time_commitment';
  ELSE
    RAISE NOTICE '✓ No orphaned valid_time_commitment constraint found';
  END IF;
END $$;

-- Final Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mio_knowledge_chunks') THEN
    RAISE EXCEPTION 'Table mio_knowledge_chunks still exists after cleanup!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_chunk') THEN
    RAISE EXCEPTION 'Constraint unique_chunk still exists in catalog!';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_time_commitment') THEN
    RAISE EXCEPTION 'Constraint valid_time_commitment still exists in catalog!';
  END IF;

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Enhanced Cleanup Complete!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE '✓ Table removed';
  RAISE NOTICE '✓ All constraints removed from catalog';
  RAISE NOTICE '✓ Ready for fresh migration';
  RAISE NOTICE '==================================================';
END $$;
