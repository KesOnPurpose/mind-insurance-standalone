-- Create Nette knowledge chunks table
CREATE TABLE nette_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_text TEXT NOT NULL,
  chunk_summary TEXT,
  source_file VARCHAR(255) NOT NULL,
  file_number INTEGER NOT NULL,
  chunk_number INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  embedding vector(1536),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
  week_number INTEGER,
  tactic_id VARCHAR(50),
  tactic_category VARCHAR(100),
  applicable_states TEXT[],
  target_demographics TEXT[],
  tokens_approx INTEGER NOT NULL,
  priority_level INTEGER DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10),
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_file, chunk_number)
);

CREATE INDEX idx_nette_chunks_embedding ON nette_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_nette_chunks_fts ON nette_knowledge_chunks USING GIN (fts);
CREATE INDEX idx_nette_chunks_category ON nette_knowledge_chunks(category);

-- Create ME knowledge chunks table
CREATE TABLE me_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_text TEXT NOT NULL,
  chunk_summary TEXT,
  source_file VARCHAR(255) NOT NULL,
  file_number INTEGER NOT NULL,
  chunk_number INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  embedding vector(1536),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
  financing_type VARCHAR(100),
  capital_range VARCHAR(50),
  credit_score_range VARCHAR(50),
  real_estate_experience VARCHAR(50),
  applicable_states TEXT[],
  tokens_approx INTEGER NOT NULL,
  priority_level INTEGER DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10),
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_file, chunk_number)
);

CREATE INDEX idx_me_chunks_embedding ON me_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_me_chunks_fts ON me_knowledge_chunks USING GIN (fts);
CREATE INDEX idx_me_chunks_category ON me_knowledge_chunks(category);

-- Update user_profiles if columns don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'tier_level') THEN
    ALTER TABLE user_profiles ADD COLUMN tier_level TEXT DEFAULT 'free' CHECK (tier_level IN ('free', 'bootcamp', 'community', 'elite'));
    ALTER TABLE user_profiles ADD COLUMN tier_start_date TIMESTAMPTZ;
    ALTER TABLE user_profiles ADD COLUMN tier_expires_at TIMESTAMPTZ;
  END IF;
END $$;