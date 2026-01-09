-- ============================================================================
-- PHASE 27: UNIFIED KNOWLEDGE MANAGEMENT SYSTEM
-- ============================================================================
-- Creates the database infrastructure for the Admin Knowledge Base Manager
-- supporting all three AI agents: Nette (GroupHome), MIO, and ME
-- ============================================================================

-- ============================================================================
-- STEP 1: Extend existing gh_training_chunks table for Admin UI
-- ============================================================================
-- The gh_training_chunks table already exists for Nette
-- We're adding columns to track upload source for the Admin UI

ALTER TABLE gh_training_chunks
ADD COLUMN IF NOT EXISTS source_type TEXT, -- google_drive, google_docs, notion, file_upload
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS upload_metadata JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN gh_training_chunks.source_type IS 'Source of the knowledge chunk: google_drive, google_docs, notion, or file_upload';
COMMENT ON COLUMN gh_training_chunks.source_url IS 'Original URL or file path of the source document';
COMMENT ON COLUMN gh_training_chunks.uploaded_by IS 'Admin user who added this content';
COMMENT ON COLUMN gh_training_chunks.upload_metadata IS 'Additional metadata including tags, title, etc.';

-- ============================================================================
-- STEP 2: Create me_knowledge_chunks table for Money Evolution (ME)
-- ============================================================================
-- New table for ME agent - wealth psychology and financial mindset

CREATE TABLE IF NOT EXISTS me_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL DEFAULT 'me',
  category TEXT NOT NULL, -- wealth_mindset, investment_strategies, financial_planning, abundance_psychology
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source_url TEXT,
  source_type TEXT, -- google_drive, google_docs, notion, file_upload
  source_title TEXT,
  metadata JSONB DEFAULT '{}',
  chunk_index INTEGER,
  total_chunks INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add comments for documentation
COMMENT ON TABLE me_knowledge_chunks IS 'Knowledge base for ME (Money Evolution) agent - wealth psychology and financial mindset';
COMMENT ON COLUMN me_knowledge_chunks.category IS 'Content category: wealth_mindset, investment_strategies, financial_planning, abundance_psychology';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_me_chunks_category ON me_knowledge_chunks(category);
CREATE INDEX IF NOT EXISTS idx_me_chunks_source ON me_knowledge_chunks(source_url);
CREATE INDEX IF NOT EXISTS idx_me_chunks_created ON me_knowledge_chunks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_me_chunks_agent ON me_knowledge_chunks(agent_type);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_me_chunks_embedding ON me_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- STEP 3: Create unified knowledge_processing_queue table
-- ============================================================================
-- Tracks processing status for all agents

CREATE TABLE IF NOT EXISTS knowledge_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nette', 'mio', 'me')),
  source_type TEXT NOT NULL CHECK (source_type IN ('google_drive', 'google_docs', 'notion', 'file_upload')),
  source_url TEXT,
  source_title TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  chunks_created INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Add comments for documentation
COMMENT ON TABLE knowledge_processing_queue IS 'Processing queue for knowledge ingestion across all agents (Nette, MIO, ME)';
COMMENT ON COLUMN knowledge_processing_queue.agent_type IS 'Target agent: nette (GroupHome), mio (Mind Insurance), me (Money Evolution)';
COMMENT ON COLUMN knowledge_processing_queue.status IS 'Processing status: pending, processing, completed, failed';

-- Create indexes for efficient queue operations
CREATE INDEX IF NOT EXISTS idx_queue_agent_status ON knowledge_processing_queue(agent_type, status);
CREATE INDEX IF NOT EXISTS idx_queue_submitted_at ON knowledge_processing_queue(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_submitted_by ON knowledge_processing_queue(submitted_by);

-- ============================================================================
-- STEP 4: Create similarity search functions for each agent
-- ============================================================================

-- Nette (gh_training_chunks) - similarity search
CREATE OR REPLACE FUNCTION search_nette_knowledge(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id,
    tc.chunk_text AS content,
    tc.category,
    1 - (tc.embedding <=> query_embedding) AS similarity,
    COALESCE(tc.upload_metadata, '{}')::JSONB AS metadata
  FROM gh_training_chunks tc
  WHERE
    tc.embedding IS NOT NULL
    AND (category_filter IS NULL OR tc.category = category_filter)
  ORDER BY tc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ME (me_knowledge_chunks) - similarity search
CREATE OR REPLACE FUNCTION search_me_knowledge(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  category TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mk.id,
    mk.content,
    mk.category,
    1 - (mk.embedding <=> query_embedding) AS similarity,
    COALESCE(mk.metadata, '{}')::JSONB AS metadata
  FROM me_knowledge_chunks mk
  WHERE
    mk.embedding IS NOT NULL
    AND (category_filter IS NULL OR mk.category = category_filter)
  ORDER BY mk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- STEP 5: RLS Policies for Admin Access
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE me_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_processing_queue ENABLE ROW LEVEL SECURITY;

-- ME Knowledge Chunks - Admin read/write access
CREATE POLICY "Admins can manage ME knowledge"
ON me_knowledge_chunks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Allow service role full access (for N8N webhooks)
CREATE POLICY "Service role full access to ME knowledge"
ON me_knowledge_chunks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Processing Queue - Admin read/write access
CREATE POLICY "Admins can manage processing queue"
ON knowledge_processing_queue
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
  )
);

-- Allow service role full access (for N8N webhooks)
CREATE POLICY "Service role full access to queue"
ON knowledge_processing_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 6: Create view for knowledge stats per agent
-- ============================================================================

CREATE OR REPLACE VIEW knowledge_stats AS
SELECT
  'nette' AS agent_type,
  tc.category,
  COUNT(*) AS chunk_count,
  MAX(tc.created_at) AS last_updated
FROM gh_training_chunks tc
GROUP BY tc.category

UNION ALL

SELECT
  'mio' AS agent_type,
  mk.category,
  COUNT(*) AS chunk_count,
  MAX(mk.created_at) AS last_updated
FROM mio_knowledge_chunks mk
GROUP BY mk.category

UNION ALL

SELECT
  'me' AS agent_type,
  me.category,
  COUNT(*) AS chunk_count,
  MAX(me.created_at) AS last_updated
FROM me_knowledge_chunks me
GROUP BY me.category;

COMMENT ON VIEW knowledge_stats IS 'Aggregated knowledge chunk statistics per agent and category';

-- Grant access to authenticated users
GRANT SELECT ON knowledge_stats TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the migration

DO $$
BEGIN
  -- Check gh_training_chunks has new columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_training_chunks' AND column_name = 'source_type'
  ) THEN
    RAISE NOTICE 'gh_training_chunks extended with source_type column';
  END IF;

  -- Check me_knowledge_chunks exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'me_knowledge_chunks'
  ) THEN
    RAISE NOTICE 'me_knowledge_chunks table created';
  END IF;

  -- Check knowledge_processing_queue exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'knowledge_processing_queue'
  ) THEN
    RAISE NOTICE 'knowledge_processing_queue table created';
  END IF;

  RAISE NOTICE 'Knowledge Management System migration complete!';
END $$;
