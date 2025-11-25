-- =====================================================================================
-- MIO Knowledge Chunks - STEP BY STEP MIGRATION
-- This version will tell us EXACTLY where it fails
-- =====================================================================================

-- STEP 1: Test vector extension works
DO $$
BEGIN
  -- Test creating a simple vector column
  CREATE TEMP TABLE test_vector (id uuid, vec vector(1536));
  DROP TABLE test_vector;
  RAISE NOTICE '✓ STEP 1: Vector extension works!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'STEP 1 FAILED: Vector extension test failed. Error: %', SQLERRM;
END $$;

-- STEP 2: Create the table (minimal version first)
CREATE TABLE mio_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_text TEXT NOT NULL,
  chunk_summary TEXT,
  source_file VARCHAR(255) NOT NULL,
  file_number INTEGER NOT NULL,
  chunk_number INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  tokens_approx INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 2: Basic table created!';
END $$;

-- STEP 3: Add the vector column
ALTER TABLE mio_knowledge_chunks
  ADD COLUMN embedding vector(1536);

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 3: Vector column added!';
END $$;

-- STEP 4: Add array columns
ALTER TABLE mio_knowledge_chunks
  ADD COLUMN applicable_practice_types TEXT[] DEFAULT '{}',
  ADD COLUMN applicable_patterns TEXT[] DEFAULT '{}',
  ADD COLUMN temperament_match TEXT[] DEFAULT '{}',
  ADD COLUMN state_created TEXT[] DEFAULT '{}';

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 4: Array columns added!';
END $$;

-- STEP 5: Add remaining columns
ALTER TABLE mio_knowledge_chunks
  ADD COLUMN time_commitment_min INTEGER,
  ADD COLUMN time_commitment_max INTEGER,
  ADD COLUMN difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN priority_level INTEGER DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10),
  ADD COLUMN version VARCHAR(20) DEFAULT '1.0',
  ADD COLUMN is_active BOOLEAN DEFAULT true;

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 5: Metadata columns added!';
END $$;

-- STEP 6: Add generated FTS column
ALTER TABLE mio_knowledge_chunks
  ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(chunk_text, '') || ' ' ||
      coalesce(chunk_summary, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(subcategory, '')
    )
  ) STORED;

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 6: Full-text search column added!';
END $$;

-- STEP 7: Add constraints
ALTER TABLE mio_knowledge_chunks
  ADD CONSTRAINT valid_time_commitment CHECK (
    time_commitment_min IS NULL OR
    time_commitment_max IS NULL OR
    time_commitment_min <= time_commitment_max
  ),
  ADD CONSTRAINT unique_chunk UNIQUE (source_file, file_number, chunk_number);

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 7: Constraints added!';
END $$;

-- STEP 8: Create HNSW vector index (this is the most likely to fail)
CREATE INDEX idx_mio_chunks_embedding ON mio_knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 8: Vector HNSW index created!';
END $$;

-- STEP 9: Create remaining indexes
CREATE INDEX idx_mio_chunks_fts ON mio_knowledge_chunks USING GIN (fts);
CREATE INDEX idx_mio_chunks_patterns ON mio_knowledge_chunks USING GIN (applicable_patterns);
CREATE INDEX idx_mio_chunks_temperament ON mio_knowledge_chunks USING GIN (temperament_match);
CREATE INDEX idx_mio_chunks_states ON mio_knowledge_chunks USING GIN (state_created);
CREATE INDEX idx_mio_chunks_practice_types ON mio_knowledge_chunks USING GIN (applicable_practice_types);
CREATE INDEX idx_mio_chunks_category ON mio_knowledge_chunks (category);
CREATE INDEX idx_mio_chunks_subcategory ON mio_knowledge_chunks (subcategory);
CREATE INDEX idx_mio_chunks_active_priority ON mio_knowledge_chunks (is_active, priority_level) WHERE is_active = true;
CREATE INDEX idx_mio_chunks_time ON mio_knowledge_chunks (time_commitment_min, time_commitment_max);
CREATE INDEX idx_mio_chunks_difficulty ON mio_knowledge_chunks (difficulty_level);

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 9: All 12 remaining indexes created!';
END $$;

-- STEP 10: Create functions and triggers
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

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 10: Trigger function created!';
END $$;

-- STEP 11: Create search function
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
    (1 - (mkc.embedding <=> query_embedding)) * 0.6 +
    CASE
      WHEN query_text IS NOT NULL THEN
        ts_rank(mkc.fts, plainto_tsquery('english', query_text)) * 0.2
      ELSE 0
    END +
    CASE
      WHEN filter_patterns IS NOT NULL AND mkc.applicable_patterns && filter_patterns THEN 0.2
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

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 11: Search function created!';
END $$;

-- STEP 12: Enable RLS
ALTER TABLE mio_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read knowledge chunks"
  ON mio_knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role can manage knowledge chunks"
  ON mio_knowledge_chunks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✓ STEP 12: RLS enabled with 2 policies!';
END $$;

-- FINAL VERIFICATION
DO $$
DECLARE
  col_count INTEGER;
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'mio_knowledge_chunks';

  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE tablename = 'mio_knowledge_chunks';

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'MIO KNOWLEDGE CHUNKS MIGRATION COMPLETE!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Table: mio_knowledge_chunks ✓';
  RAISE NOTICE 'Columns: % total ✓', col_count;
  RAISE NOTICE 'Indexes: % total ✓', idx_count;
  RAISE NOTICE 'Functions: search_mio_knowledge ✓';
  RAISE NOTICE 'Triggers: Auto-update timestamps ✓';
  RAISE NOTICE 'RLS: Enabled with 2 policies ✓';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Database is ready for protocol data import!';
  RAISE NOTICE '==================================================';
END $$;
