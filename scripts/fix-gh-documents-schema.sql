-- ============================================================================
-- FIX gh_documents SCHEMA MISMATCH
-- ============================================================================
-- The code expects 'file_size_bytes' but migration has 'file_size_kb'
-- This adds the missing column
-- ============================================================================

-- Add file_size_bytes column (used by upload code)
ALTER TABLE gh_documents
ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;

-- Add comment
COMMENT ON COLUMN gh_documents.file_size_bytes IS 'File size in bytes (exact size from upload)';

-- Optionally: Update file_size_kb from file_size_bytes
-- CREATE OR REPLACE FUNCTION sync_file_size()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.file_size_bytes IS NOT NULL THEN
--     NEW.file_size_kb = ROUND(NEW.file_size_bytes / 1024.0);
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER sync_file_size_trigger
--   BEFORE INSERT OR UPDATE OF file_size_bytes ON gh_documents
--   FOR EACH ROW
--   EXECUTE FUNCTION sync_file_size();

-- Verify column was added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'gh_documents'
  AND column_name IN ('file_size_kb', 'file_size_bytes')
ORDER BY column_name;
