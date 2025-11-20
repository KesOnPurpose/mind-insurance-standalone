-- ============================================================================
-- ADD ALL MISSING COLUMNS TO gh_documents
-- ============================================================================
-- The @senior-react-developer agent's code expects these columns
-- but they weren't in the original migration
-- ============================================================================

-- Add file_size_bytes (exact bytes from upload)
ALTER TABLE gh_documents
ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;

-- Add is_active (for soft deletes)
ALTER TABLE gh_documents
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add any other potentially missing columns
ALTER TABLE gh_documents
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE gh_documents
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add comments
COMMENT ON COLUMN gh_documents.file_size_bytes IS 'File size in bytes (exact from upload)';
COMMENT ON COLUMN gh_documents.is_active IS 'Soft delete flag - false means deleted';
COMMENT ON COLUMN gh_documents.tags IS 'Searchable tags for documents';
COMMENT ON COLUMN gh_documents.version IS 'Document version number';

-- Create index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_documents_active ON gh_documents(is_active) WHERE is_active = true;

-- Verify all columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gh_documents'
  AND column_name IN ('file_size_bytes', 'is_active', 'tags', 'version')
ORDER BY column_name;
