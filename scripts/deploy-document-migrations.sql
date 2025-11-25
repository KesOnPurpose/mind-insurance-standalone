-- ============================================================================
-- DEPLOY DOCUMENT MANAGEMENT SYSTEM MIGRATIONS
-- ============================================================================
-- Deployment Order:
-- 1. gh_documents (main registry table)
-- 2. gh_document_tactic_links (many-to-many relationships)
-- 3. gh_user_document_activity (analytics tracking)
-- 4. gh_training_chunks enhancements (RAG integration)
-- ============================================================================
-- Execute this file against Supabase database: hpyodaugrkctagkrfofj.supabase.co
-- ============================================================================

\echo '============================================================================'
\echo 'MIGRATION 1: Creating gh_documents table...'
\echo '============================================================================'

-- Create gh_documents table for unified document management system
CREATE TABLE IF NOT EXISTS gh_documents (
  id BIGSERIAL PRIMARY KEY,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  category TEXT,
  description TEXT,
  applicable_states TEXT[],
  ownership_model TEXT[],
  applicable_populations TEXT[],
  difficulty TEXT,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON gh_documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_states ON gh_documents USING GIN(applicable_states);
CREATE INDEX IF NOT EXISTS idx_documents_ownership ON gh_documents USING GIN(ownership_model);
CREATE INDEX IF NOT EXISTS idx_documents_populations ON gh_documents USING GIN(applicable_populations);
CREATE INDEX IF NOT EXISTS idx_documents_search ON gh_documents USING GIN(to_tsvector('english', document_name || ' ' || COALESCE(description, '')));

-- Add comments for documentation
COMMENT ON TABLE gh_documents IS 'Central registry for all documents in the system with metadata and analytics';
COMMENT ON COLUMN gh_documents.applicable_states IS 'Array of state codes where document is applicable (e.g., ["CA", "TX", "FL"])';
COMMENT ON COLUMN gh_documents.ownership_model IS 'Array of applicable ownership models (e.g., ["Individual", "LLC", "Corporation"])';
COMMENT ON COLUMN gh_documents.applicable_populations IS 'Array of target populations (e.g., ["Adult", "Youth", "Seniors"])';
COMMENT ON COLUMN gh_documents.difficulty IS 'Difficulty level: Beginner, Intermediate, Advanced';

-- Enable Row Level Security
ALTER TABLE gh_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_documents' AND policyname = 'Authenticated users can view documents') THEN
    CREATE POLICY "Authenticated users can view documents"
      ON gh_documents FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_documents' AND policyname = 'Admins can insert documents') THEN
    CREATE POLICY "Admins can insert documents"
      ON gh_documents FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_documents' AND policyname = 'Admins can update documents') THEN
    CREATE POLICY "Admins can update documents"
      ON gh_documents FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_documents' AND policyname = 'Admins can delete documents') THEN
    CREATE POLICY "Admins can delete documents"
      ON gh_documents FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gh_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_gh_documents_updated_at ON gh_documents;
CREATE TRIGGER set_gh_documents_updated_at
  BEFORE UPDATE ON gh_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_documents_updated_at();

\echo '✓ gh_documents table created successfully'

\echo ''
\echo '============================================================================'
\echo 'MIGRATION 2: Creating gh_document_tactic_links table...'
\echo '============================================================================'

-- Create gh_document_tactic_links table for many-to-many relationship
CREATE TABLE IF NOT EXISTS gh_document_tactic_links (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES gh_documents(id) ON DELETE CASCADE,
  tactic_id TEXT REFERENCES gh_tactic_instructions(tactic_id) ON DELETE CASCADE,
  link_type TEXT CHECK (link_type IN ('required', 'recommended', 'supplemental')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, tactic_id)
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_doc_tactic_links_tactic ON gh_document_tactic_links(tactic_id);
CREATE INDEX IF NOT EXISTS idx_doc_tactic_links_doc ON gh_document_tactic_links(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_tactic_links_type ON gh_document_tactic_links(link_type);
CREATE INDEX IF NOT EXISTS idx_doc_tactic_links_order ON gh_document_tactic_links(tactic_id, display_order);

-- Add comments for documentation
COMMENT ON TABLE gh_document_tactic_links IS 'Many-to-many relationship linking documents to tactics with metadata';
COMMENT ON COLUMN gh_document_tactic_links.link_type IS 'Relationship type: required (must have), recommended (should have), supplemental (nice to have)';
COMMENT ON COLUMN gh_document_tactic_links.display_order IS 'Order in which document should appear in tactic page (lower numbers first)';

-- Enable Row Level Security
ALTER TABLE gh_document_tactic_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_document_tactic_links' AND policyname = 'Authenticated users can view links') THEN
    CREATE POLICY "Authenticated users can view links"
      ON gh_document_tactic_links FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_document_tactic_links' AND policyname = 'Admins can manage links') THEN
    CREATE POLICY "Admins can manage links"
      ON gh_document_tactic_links FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.id = auth.uid()
        )
      );
  END IF;
END
$$;

\echo '✓ gh_document_tactic_links table created successfully'

\echo ''
\echo '============================================================================'
\echo 'MIGRATION 3: Creating gh_user_document_activity table...'
\echo '============================================================================'

-- Create gh_user_document_activity table for analytics tracking
CREATE TABLE IF NOT EXISTS gh_user_document_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id BIGINT REFERENCES gh_documents(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('view', 'download', 'bookmark')),
  tactic_id TEXT,
  referrer TEXT CHECK (referrer IN ('nette_ai', 'resource_library', 'tactic_page')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_doc_activity_user ON gh_user_document_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_doc_activity_doc ON gh_user_document_activity(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_doc_activity_type ON gh_user_document_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_doc_activity_tactic ON gh_user_document_activity(tactic_id) WHERE tactic_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_doc_activity_referrer ON gh_user_document_activity(referrer);

-- Add comments for documentation
COMMENT ON TABLE gh_user_document_activity IS 'Tracks all user interactions with documents for analytics and personalization';
COMMENT ON COLUMN gh_user_document_activity.activity_type IS 'Type of activity: view (opened), download (saved), bookmark (marked for later)';
COMMENT ON COLUMN gh_user_document_activity.tactic_id IS 'Tactic context if accessed from tactic page (optional)';
COMMENT ON COLUMN gh_user_document_activity.referrer IS 'Source of document access: nette_ai (AI assistant), resource_library (main library), tactic_page (tactic detail)';

-- Enable Row Level Security
ALTER TABLE gh_user_document_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_user_document_activity' AND policyname = 'Users can view own activity') THEN
    CREATE POLICY "Users can view own activity"
      ON gh_user_document_activity FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_user_document_activity' AND policyname = 'Users can insert own activity') THEN
    CREATE POLICY "Users can insert own activity"
      ON gh_user_document_activity FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gh_user_document_activity' AND policyname = 'Admins can view all activity') THEN
    CREATE POLICY "Admins can view all activity"
      ON gh_user_document_activity FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create function to update document view/download counts
CREATE OR REPLACE FUNCTION update_document_activity_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update view count
  IF NEW.activity_type = 'view' THEN
    UPDATE gh_documents
    SET view_count = view_count + 1
    WHERE id = NEW.document_id;
  END IF;

  -- Update download count
  IF NEW.activity_type = 'download' THEN
    UPDATE gh_documents
    SET download_count = download_count + 1
    WHERE id = NEW.document_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update document counts
DROP TRIGGER IF EXISTS update_document_counts_on_activity ON gh_user_document_activity;
CREATE TRIGGER update_document_counts_on_activity
  AFTER INSERT ON gh_user_document_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_document_activity_counts();

\echo '✓ gh_user_document_activity table created successfully'

\echo ''
\echo '============================================================================'
\echo 'MIGRATION 4: Enhancing gh_training_chunks table...'
\echo '============================================================================'

-- Add new metadata columns to existing table
ALTER TABLE gh_training_chunks
ADD COLUMN IF NOT EXISTS document_id BIGINT REFERENCES gh_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ownership_model TEXT[],
ADD COLUMN IF NOT EXISTS applicable_populations TEXT[],
ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_training_chunks_document ON gh_training_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_training_chunks_ownership ON gh_training_chunks USING GIN(ownership_model);
CREATE INDEX IF NOT EXISTS idx_training_chunks_populations ON gh_training_chunks USING GIN(applicable_populations);
CREATE INDEX IF NOT EXISTS idx_training_chunks_difficulty ON gh_training_chunks(difficulty);

-- Add comments for documentation
COMMENT ON COLUMN gh_training_chunks.document_id IS 'Links chunk to source document in gh_documents table for unified document management';
COMMENT ON COLUMN gh_training_chunks.ownership_model IS 'Array of applicable ownership models inherited from document';
COMMENT ON COLUMN gh_training_chunks.applicable_populations IS 'Array of target populations inherited from document';
COMMENT ON COLUMN gh_training_chunks.difficulty IS 'Difficulty level inherited from document: Beginner, Intermediate, Advanced';

-- Create function to sync metadata from document to chunks
CREATE OR REPLACE FUNCTION sync_chunk_metadata_from_document()
RETURNS TRIGGER AS $$
BEGIN
  -- When document_id is set or updated, sync metadata from gh_documents
  IF NEW.document_id IS NOT NULL THEN
    UPDATE gh_training_chunks
    SET
      ownership_model = (SELECT ownership_model FROM gh_documents WHERE id = NEW.document_id),
      applicable_populations = (SELECT applicable_populations FROM gh_documents WHERE id = NEW.document_id),
      difficulty = (SELECT difficulty FROM gh_documents WHERE id = NEW.document_id)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync metadata when document_id is set
DROP TRIGGER IF EXISTS sync_chunk_metadata_on_document_link ON gh_training_chunks;
CREATE TRIGGER sync_chunk_metadata_on_document_link
  AFTER INSERT OR UPDATE OF document_id ON gh_training_chunks
  FOR EACH ROW
  WHEN (NEW.document_id IS NOT NULL)
  EXECUTE FUNCTION sync_chunk_metadata_from_document();

-- Create function to propagate document metadata updates to chunks
CREATE OR REPLACE FUNCTION propagate_document_metadata_to_chunks()
RETURNS TRIGGER AS $$
BEGIN
  -- When document metadata changes, update all linked chunks
  UPDATE gh_training_chunks
  SET
    ownership_model = NEW.ownership_model,
    applicable_populations = NEW.applicable_populations,
    difficulty = NEW.difficulty
  WHERE document_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on gh_documents to propagate metadata changes
DROP TRIGGER IF EXISTS propagate_metadata_to_chunks_on_document_update ON gh_documents;
CREATE TRIGGER propagate_metadata_to_chunks_on_document_update
  AFTER UPDATE OF ownership_model, applicable_populations, difficulty ON gh_documents
  FOR EACH ROW
  EXECUTE FUNCTION propagate_document_metadata_to_chunks();

\echo '✓ gh_training_chunks table enhanced successfully'

\echo ''
\echo '============================================================================'
\echo 'DEPLOYMENT COMPLETE - VERIFICATION QUERIES'
\echo '============================================================================'

-- Verify table creation
SELECT
  'gh_documents' AS table_name,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('gh_documents')) AS table_size
FROM gh_documents
UNION ALL
SELECT
  'gh_document_tactic_links' AS table_name,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('gh_document_tactic_links')) AS table_size
FROM gh_document_tactic_links
UNION ALL
SELECT
  'gh_user_document_activity' AS table_name,
  COUNT(*) AS row_count,
  pg_size_pretty(pg_total_relation_size('gh_user_document_activity')) AS table_size
FROM gh_user_document_activity;

-- Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'gh_documents'
    OR tablename = 'gh_document_tactic_links'
    OR tablename = 'gh_user_document_activity'
  )
ORDER BY tablename, indexname;

-- Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    tablename = 'gh_documents'
    OR tablename = 'gh_document_tactic_links'
    OR tablename = 'gh_user_document_activity'
  )
ORDER BY tablename, policyname;

-- Verify triggers
SELECT
  trigger_schema,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (
    event_object_table = 'gh_documents'
    OR event_object_table = 'gh_document_tactic_links'
    OR event_object_table = 'gh_user_document_activity'
    OR event_object_table = 'gh_training_chunks'
  )
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '✓✓✓ ALL MIGRATIONS DEPLOYED SUCCESSFULLY ✓✓✓'
\echo ''
\echo 'Next Steps:'
\echo '1. Upload 38 PDF documents to Supabase Storage bucket: training-materials'
\echo '2. Seed gh_documents table with document metadata'
\echo '3. Create document-tactic links for high-priority tactics'
\echo '4. Build admin dashboard for document management'
\echo ''
