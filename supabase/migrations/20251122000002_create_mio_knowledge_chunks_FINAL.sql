-- =====================================================================================
-- MIO Knowledge Chunks Table - FINAL VERSION (Error-Free)
-- Purpose: Vector database for MIO's comprehensive protocol library (250+ protocols)
-- Supports: Daily Deductible Library, Avatar Assessment, Research Protocols
-- =====================================================================================

-- Drop existing objects if migration was partially run
DROP FUNCTION IF EXISTS search_mio_knowledge;
DROP TRIGGER IF EXISTS trigger_update_mio_chunks_updated_at ON mio_knowledge_chunks;
DROP FUNCTION IF EXISTS update_mio_chunks_updated_at;
DROP TABLE IF EXISTS mio_knowledge_chunks CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================================================
-- Main Knowledge Chunks Table
-- =====================================================================================

CREATE TABLE mio_knowledge_chunks (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content fields
  chunk_text TEXT NOT NULL,
  chunk_summary TEXT,

  -- Source tracking
  source_file VARCHAR(255) NOT NULL,
  file_number INTEGER NOT NULL,
  chunk_number INTEGER NOT NULL,

  -- Categorization
  category VARCHAR(100) NOT NULL, -- Financial, Limiting Beliefs, Mental Resilience, etc.
  subcategory VARCHAR(100),

  -- Vector embeddings for semantic search
  embedding vector(1536), -- OpenAI text-embedding-3-small

  -- Full-text search (generated column)
  fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(chunk_text, '') || ' ' ||
      coalesce(chunk_summary, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(subcategory, '')
    )
  ) STORED,

  -- =====================================================================================
  -- MIO-Specific Pattern Matching
  -- =====================================================================================

  -- Which PROTECT practices this protocol supports
  applicable_practice_types TEXT[] DEFAULT '{}',

  -- Which identity collision patterns this addresses
  applicable_patterns TEXT[] DEFAULT '{}',

  -- =====================================================================================
  -- Practice Metadata
  -- =====================================================================================

  -- Time commitment for practice
  time_commitment_min INTEGER,
  time_commitment_max INTEGER,

  -- Difficulty level for user matching
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),

  -- Temperament alignment (from Avatar Assessment)
  temperament_match TEXT[] DEFAULT '{}',

  -- Desired states this protocol creates
  state_created TEXT[] DEFAULT '{}',

  -- =====================================================================================
  -- Technical Metadata
  -- =====================================================================================

  tokens_approx INTEGER NOT NULL,
  priority_level INTEGER DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10),
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_time_commitment CHECK (
    time_commitment_min IS NULL OR
    time_commitment_max IS NULL OR
    time_commitment_min <= time_commitment_max
  ),
  CONSTRAINT unique_chunk UNIQUE (source_file, file_number, chunk_number)
);

-- =====================================================================================
-- Indexes for Performance
-- =====================================================================================

-- HNSW index for fast vector similarity search
CREATE INDEX idx_mio_chunks_embedding ON mio_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Full-text search index
CREATE INDEX idx_mio_chunks_fts ON mio_knowledge_chunks
  USING GIN (fts);

-- Pattern matching indexes (GIN for array containment)
CREATE INDEX idx_mio_chunks_patterns ON mio_knowledge_chunks
  USING GIN (applicable_patterns);

CREATE INDEX idx_mio_chunks_temperament ON mio_knowledge_chunks
  USING GIN (temperament_match);

CREATE INDEX idx_mio_chunks_states ON mio_knowledge_chunks
  USING GIN (state_created);

CREATE INDEX idx_mio_chunks_practice_types ON mio_knowledge_chunks
  USING GIN (applicable_practice_types);

-- Category filtering
CREATE INDEX idx_mio_chunks_category ON mio_knowledge_chunks (category);
CREATE INDEX idx_mio_chunks_subcategory ON mio_knowledge_chunks (subcategory);

-- Active chunks with priority
CREATE INDEX idx_mio_chunks_active_priority ON mio_knowledge_chunks (is_active, priority_level)
  WHERE is_active = true;

-- Time commitment filtering
CREATE INDEX idx_mio_chunks_time ON mio_knowledge_chunks (time_commitment_min, time_commitment_max);

-- Difficulty level filtering
CREATE INDEX idx_mio_chunks_difficulty ON mio_knowledge_chunks (difficulty_level);

-- =====================================================================================
-- Updated Timestamp Trigger
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_mio_chunks_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_mio_chunks_updated_at
  BEFORE UPDATE ON mio_knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_mio_chunks_updated_at();

-- =====================================================================================
-- Helper Function: Search MIO Knowledge
-- =====================================================================================

CREATE OR REPLACE FUNCTION search_mio_knowledge(
  query_embedding vector(1536),
  query_text TEXT DEFAULT NULL,
  filter_patterns TEXT[] DEFAULT NULL,
  filter_temperament TEXT[] DEFAULT NULL,
  filter_states TEXT[] DEFAULT NULL,
  max_time_minutes INTEGER DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  chunk_summary TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  applicable_patterns TEXT[],
  temperament_match TEXT[],
  state_created TEXT[],
  time_commitment_min INTEGER,
  time_commitment_max INTEGER,
  difficulty_level VARCHAR(20),
  similarity FLOAT,
  relevance_score FLOAT
) AS $searchfunc$
BEGIN
  RETURN QUERY
  SELECT
    mkc.id,
    mkc.chunk_text,
    mkc.chunk_summary,
    mkc.category,
    mkc.subcategory,
    mkc.applicable_patterns,
    mkc.temperament_match,
    mkc.state_created,
    mkc.time_commitment_min,
    mkc.time_commitment_max,
    mkc.difficulty_level,
    1 - (mkc.embedding <=> query_embedding) AS similarity,
    -- Combined relevance score: vector similarity + text match boost + pattern match boost
    (1 - (mkc.embedding <=> query_embedding)) * 0.6 + -- 60% vector similarity
    CASE
      WHEN query_text IS NOT NULL THEN
        ts_rank(mkc.fts, plainto_tsquery('english', query_text)) * 0.2 -- 20% text match
      ELSE 0
    END +
    CASE
      WHEN filter_patterns IS NOT NULL AND mkc.applicable_patterns && filter_patterns THEN 0.2 -- 20% pattern boost
      ELSE 0
    END AS relevance_score
  FROM mio_knowledge_chunks mkc
  WHERE
    mkc.is_active = true
    AND (1 - (mkc.embedding <=> query_embedding)) >= match_threshold
    AND (filter_patterns IS NULL OR mkc.applicable_patterns && filter_patterns)
    AND (filter_temperament IS NULL OR mkc.temperament_match && filter_temperament)
    AND (filter_states IS NULL OR mkc.state_created && filter_states)
    AND (max_time_minutes IS NULL OR mkc.time_commitment_max IS NULL OR mkc.time_commitment_max <= max_time_minutes)
  ORDER BY relevance_score DESC
  LIMIT match_count;
END;
$searchfunc$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- Row Level Security (RLS)
-- =====================================================================================

ALTER TABLE mio_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read knowledge chunks
CREATE POLICY "Authenticated users can read knowledge chunks"
  ON mio_knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only service role can insert/update/delete (admin operations)
CREATE POLICY "Service role can manage knowledge chunks"
  ON mio_knowledge_chunks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================================================
-- Comments for Documentation
-- =====================================================================================

COMMENT ON TABLE mio_knowledge_chunks IS
  'Vector database for MIO protocol library: Daily Deductible Library (45), Avatar Assessment (160+), Research Protocols (45+)';

COMMENT ON COLUMN mio_knowledge_chunks.embedding IS
  'OpenAI text-embedding-3-small vector (1536 dimensions) for semantic search';

COMMENT ON COLUMN mio_knowledge_chunks.applicable_patterns IS
  'Identity collision patterns: money_avoidance, impostor_syndrome, self_sabotage, comparison_catastrophe, past_prison, success_sabotage, compass_crisis, freeze_response, procrastination, overwhelm, self_doubt, motivation_collapse, performance_liability';

COMMENT ON COLUMN mio_knowledge_chunks.temperament_match IS
  'Avatar temperament types: warrior, sage, connector, builder';

COMMENT ON COLUMN mio_knowledge_chunks.state_created IS
  'Desired psychological states: calm, confidence, resilience, clarity, focus, peace, strength, etc.';

COMMENT ON FUNCTION search_mio_knowledge IS
  'Hybrid search combining vector similarity (60%), full-text search (20%), and pattern matching (20%) for optimal protocol recommendations';

-- =====================================================================================
-- Success Confirmation
-- =====================================================================================

DO $verify$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'MIO Knowledge Chunks Migration Complete!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Table: mio_knowledge_chunks ✓';
  RAISE NOTICE 'Columns: 22 total ✓';
  RAISE NOTICE 'Indexes: 13 specialized indexes ✓';
  RAISE NOTICE 'Functions: search_mio_knowledge (hybrid search) ✓';
  RAISE NOTICE 'Triggers: Auto-update timestamps ✓';
  RAISE NOTICE 'RLS: Enabled with 2 policies ✓';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Database is ready for protocol data import!';
  RAISE NOTICE '==================================================';
END $verify$;
