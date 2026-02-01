-- =====================================================================================
-- Relational RAG Enhancement Migration
-- Purpose: Extend mio_knowledge_chunks for 10-domain relational framework system
-- Adds: framework_domain, evidence_tier, triage_color, contraindication_tags,
--        cultural_context_flags, integration_points
-- Creates: mio_framework_contradictions, mio_triage_keywords tables
-- =====================================================================================

-- =====================================================================================
-- STEP 1: Add new columns to mio_knowledge_chunks
-- =====================================================================================

-- Framework domain (1 of 10 relational domains)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS framework_domain VARCHAR(50);

COMMENT ON COLUMN mio_knowledge_chunks.framework_domain IS
  'Relational framework domain: foundation_attachment, communication_conflict, trauma_nervous_system, abuse_narcissism, addiction_codependency, neurodivergence, modern_threats, financial_mens, cultural_context, premarital_formation';

-- Framework name within domain
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS framework_name VARCHAR(100);

COMMENT ON COLUMN mio_knowledge_chunks.framework_name IS
  'Specific framework identifier, e.g., polyvagal_theory, gottman_four_horsemen';

-- 4-tier evidence hierarchy
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS evidence_tier VARCHAR(10)
CHECK (evidence_tier IS NULL OR evidence_tier IN ('gold', 'silver', 'bronze', 'copper'));

COMMENT ON COLUMN mio_knowledge_chunks.evidence_tier IS
  'Evidence quality: gold (RCTs/meta-analyses), silver (peer-reviewed), bronze (clinical consensus), copper (emerging/expert opinion)';

-- 4-color clinical triage
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS triage_color VARCHAR(10)
CHECK (triage_color IS NULL OR triage_color IN ('red', 'orange', 'yellow', 'green'));

COMMENT ON COLUMN mio_knowledge_chunks.triage_color IS
  'Clinical triage: red (safety/crisis), orange (professional referral needed), yellow (monitor + coach), green (full coaching)';

-- Contraindication tags - "DO NOT USE WHEN" identifiers
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS contraindication_tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN mio_knowledge_chunks.contraindication_tags IS
  'Array of contraindication identifiers from the 52-rule matrix, e.g., active_abuse, active_addiction, acute_psychosis';

-- Cultural context sensitivity markers
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS cultural_context_flags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN mio_knowledge_chunks.cultural_context_flags IS
  'Cultural sensitivity markers: western_bias, faith_sensitive, collectivist_adaptation, immigration_aware, lgbtq_affirming';

-- Integration points - connected framework references
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS integration_points TEXT[] DEFAULT '{}';

COMMENT ON COLUMN mio_knowledge_chunks.integration_points IS
  'Connected framework names for cross-referencing, e.g., [polyvagal_theory, attachment_theory]';

-- Framework section type within the universal template
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS framework_section VARCHAR(50);

COMMENT ON COLUMN mio_knowledge_chunks.framework_section IS
  'Section within universal template: core_theory, relationship_application, key_interventions, contraindications, integration_points, evidence_base';

-- Life stage applicability
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS life_stages TEXT[] DEFAULT '{}';

COMMENT ON COLUMN mio_knowledge_chunks.life_stages IS
  'Applicable life stages: dating, engaged, newlywed, established, crisis, separation, divorce, remarriage';

-- Issue type tags
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS issue_types TEXT[] DEFAULT '{}';

COMMENT ON COLUMN mio_knowledge_chunks.issue_types IS
  'Issue categories: communication, conflict, intimacy, trust, abuse, addiction, trauma, finance, parenting';

-- =====================================================================================
-- STEP 2: Add indexes for new columns
-- =====================================================================================

-- Framework domain filtering
CREATE INDEX IF NOT EXISTS idx_mio_chunks_framework_domain
  ON mio_knowledge_chunks (framework_domain)
  WHERE framework_domain IS NOT NULL;

-- Framework name lookup
CREATE INDEX IF NOT EXISTS idx_mio_chunks_framework_name
  ON mio_knowledge_chunks (framework_name)
  WHERE framework_name IS NOT NULL;

-- Evidence tier for quality-weighted search
CREATE INDEX IF NOT EXISTS idx_mio_chunks_evidence_tier
  ON mio_knowledge_chunks (evidence_tier)
  WHERE evidence_tier IS NOT NULL;

-- Triage color for safety-first routing
CREATE INDEX IF NOT EXISTS idx_mio_chunks_triage_color
  ON mio_knowledge_chunks (triage_color)
  WHERE triage_color IS NOT NULL;

-- Contraindication filtering (GIN for array containment)
CREATE INDEX IF NOT EXISTS idx_mio_chunks_contraindications
  ON mio_knowledge_chunks USING GIN (contraindication_tags)
  WHERE contraindication_tags != '{}';

-- Cultural context filtering
CREATE INDEX IF NOT EXISTS idx_mio_chunks_cultural_flags
  ON mio_knowledge_chunks USING GIN (cultural_context_flags)
  WHERE cultural_context_flags != '{}';

-- Life stage filtering
CREATE INDEX IF NOT EXISTS idx_mio_chunks_life_stages
  ON mio_knowledge_chunks USING GIN (life_stages)
  WHERE life_stages != '{}';

-- Issue type filtering
CREATE INDEX IF NOT EXISTS idx_mio_chunks_issue_types
  ON mio_knowledge_chunks USING GIN (issue_types)
  WHERE issue_types != '{}';

-- Composite index: pillar + domain for relational queries
CREATE INDEX IF NOT EXISTS idx_mio_chunks_pillar_domain
  ON mio_knowledge_chunks (pillar, framework_domain)
  WHERE pillar = 'relational' AND framework_domain IS NOT NULL;

-- =====================================================================================
-- STEP 3: Create mio_framework_contradictions table
-- Stores the 5 decision trees for when frameworks give conflicting advice
-- =====================================================================================

CREATE TABLE IF NOT EXISTS mio_framework_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Conflicting framework pair
  framework_a VARCHAR(100) NOT NULL,
  framework_b VARCHAR(100) NOT NULL,

  -- Decision tree for routing
  contradiction_description TEXT NOT NULL,
  decision_tree JSONB NOT NULL,
  -- Example decision_tree:
  -- {
  --   "condition": "abuse_indicators_present",
  --   "if_true": { "use": "boundaries_framework", "reason": "Safety takes priority" },
  --   "if_false": { "use": "gottman_turn_toward", "reason": "Neglect pattern, not abuse" }
  -- }

  -- Priority (higher = check first)
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

  -- Which domains are involved
  domain_a VARCHAR(50) NOT NULL,
  domain_b VARCHAR(50) NOT NULL,

  -- Detection keywords that trigger this contradiction check
  trigger_keywords TEXT[] DEFAULT '{}',

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_contradiction_pair UNIQUE (framework_a, framework_b)
);

-- Enable RLS
ALTER TABLE mio_framework_contradictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contradictions"
  ON mio_framework_contradictions FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role manages contradictions"
  ON mio_framework_contradictions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE mio_framework_contradictions IS
  'Decision trees for resolving conflicts between relational frameworks (e.g., Gottman vs Boundaries)';

-- =====================================================================================
-- STEP 4: Create mio_triage_keywords table
-- Safety keyword database for 4-color clinical triage routing
-- =====================================================================================

CREATE TABLE IF NOT EXISTS mio_triage_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The keyword or phrase to detect
  keyword VARCHAR(200) NOT NULL,

  -- Triage classification
  triage_color VARCHAR(10) NOT NULL CHECK (triage_color IN ('red', 'orange', 'yellow', 'green')),

  -- Category for grouping
  category VARCHAR(50) NOT NULL,
  -- e.g., 'violence', 'self_harm', 'substance', 'mental_health', 'relationship_distress', 'growth'

  -- Additional context
  context_notes TEXT,

  -- Whether this is an exact match or substring match
  match_type VARCHAR(20) DEFAULT 'substring' CHECK (match_type IN ('exact', 'substring', 'regex')),

  -- Priority within same color (higher = more specific/urgent)
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

  -- Response guidance
  response_guidance TEXT,
  -- e.g., "Provide crisis hotline numbers immediately. Do not attempt coaching."

  -- Professional referral type (for orange/red)
  referral_type VARCHAR(50),
  -- e.g., 'crisis_hotline', 'domestic_violence', 'therapist', 'psychiatrist', 'addiction_counselor'

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_keyword_color UNIQUE (keyword, triage_color)
);

-- Enable RLS
ALTER TABLE mio_triage_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read triage keywords"
  ON mio_triage_keywords FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Service role manages triage keywords"
  ON mio_triage_keywords FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Indexes for fast keyword lookup
CREATE INDEX IF NOT EXISTS idx_triage_keywords_color
  ON mio_triage_keywords (triage_color) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_triage_keywords_category
  ON mio_triage_keywords (category) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_triage_keywords_keyword_trgm
  ON mio_triage_keywords USING GIN (keyword gin_trgm_ops);

COMMENT ON TABLE mio_triage_keywords IS
  '4-color clinical triage keyword database: RED (crisis/safety), ORANGE (professional referral), YELLOW (monitor+coach), GREEN (full coaching)';

-- =====================================================================================
-- STEP 5: Enhanced search function with triage/evidence/cultural filtering
-- =====================================================================================

CREATE OR REPLACE FUNCTION search_mio_relational(
  query_embedding vector(1536),
  query_text TEXT DEFAULT NULL,
  filter_domains TEXT[] DEFAULT NULL,       -- ['trauma_nervous_system', 'abuse_narcissism']
  filter_frameworks TEXT[] DEFAULT NULL,    -- ['polyvagal_theory', 'gottman_four_horsemen']
  filter_evidence_tiers TEXT[] DEFAULT NULL,-- ['gold', 'silver']
  filter_triage_colors TEXT[] DEFAULT NULL, -- ['green', 'yellow']
  exclude_contraindications TEXT[] DEFAULT NULL, -- Contraindication tags to EXCLUDE
  filter_life_stages TEXT[] DEFAULT NULL,   -- ['crisis', 'established']
  filter_issue_types TEXT[] DEFAULT NULL,   -- ['trauma', 'abuse']
  filter_cultural_flags TEXT[] DEFAULT NULL,-- ['faith_sensitive']
  match_threshold FLOAT DEFAULT 0.65,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  chunk_summary TEXT,
  pillar VARCHAR(50),
  category VARCHAR(100),
  framework_domain VARCHAR(50),
  framework_name VARCHAR(100),
  framework_section VARCHAR(50),
  evidence_tier VARCHAR(10),
  triage_color VARCHAR(10),
  contraindication_tags TEXT[],
  integration_points TEXT[],
  expert_name VARCHAR(100),
  similarity FLOAT,
  relevance_score FLOAT
) AS $searchrel$
BEGIN
  RETURN QUERY
  SELECT
    mkc.id,
    mkc.chunk_text,
    mkc.chunk_summary,
    mkc.pillar,
    mkc.category,
    mkc.framework_domain,
    mkc.framework_name,
    mkc.framework_section,
    mkc.evidence_tier,
    mkc.triage_color,
    mkc.contraindication_tags,
    mkc.integration_points,
    mkc.expert_name,
    1 - (mkc.embedding <=> query_embedding) AS similarity,
    -- Enhanced relevance scoring
    (1 - (mkc.embedding <=> query_embedding)) * 0.40 +  -- 40% vector similarity
    CASE
      WHEN query_text IS NOT NULL THEN
        LEAST(ts_rank(mkc.fts, plainto_tsquery('english', query_text)) * 0.15, 0.15)
      ELSE 0
    END +
    -- Evidence tier boost (gold gets highest boost)
    CASE mkc.evidence_tier
      WHEN 'gold' THEN 0.15
      WHEN 'silver' THEN 0.10
      WHEN 'bronze' THEN 0.05
      WHEN 'copper' THEN 0.02
      ELSE 0
    END +
    -- Pattern/context matching boost
    CASE
      WHEN filter_issue_types IS NOT NULL AND mkc.issue_types && filter_issue_types THEN 0.15
      ELSE 0
    END +
    CASE
      WHEN filter_life_stages IS NOT NULL AND mkc.life_stages && filter_life_stages THEN 0.10
      ELSE 0
    END +
    CASE
      WHEN mkc.applicable_patterns != '{}' THEN 0.05  -- Small boost for having patterns
      ELSE 0
    END AS relevance_score
  FROM mio_knowledge_chunks mkc
  WHERE
    mkc.is_active = true
    AND mkc.pillar = 'relational'
    AND (1 - (mkc.embedding <=> query_embedding)) >= match_threshold
    -- Domain filtering
    AND (filter_domains IS NULL OR mkc.framework_domain = ANY(filter_domains))
    -- Framework filtering
    AND (filter_frameworks IS NULL OR mkc.framework_name = ANY(filter_frameworks))
    -- Evidence tier filtering
    AND (filter_evidence_tiers IS NULL OR mkc.evidence_tier = ANY(filter_evidence_tiers))
    -- Triage color filtering (safety-first: exclude higher severity)
    AND (filter_triage_colors IS NULL OR mkc.triage_color = ANY(filter_triage_colors))
    -- Contraindication exclusion (DO NOT return chunks with these contraindications)
    AND (exclude_contraindications IS NULL OR NOT (mkc.contraindication_tags && exclude_contraindications))
    -- Life stage filtering
    AND (filter_life_stages IS NULL OR mkc.life_stages && filter_life_stages)
    -- Issue type filtering
    AND (filter_issue_types IS NULL OR mkc.issue_types && filter_issue_types)
    -- Cultural context filtering
    AND (filter_cultural_flags IS NULL OR mkc.cultural_context_flags && filter_cultural_flags)
  ORDER BY relevance_score DESC
  LIMIT match_count;
END;
$searchrel$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_mio_relational IS
  'Enhanced relational search with evidence-tier weighting, triage filtering, contraindication exclusion, and cultural context awareness';

-- =====================================================================================
-- Verification
-- =====================================================================================

DO $verify$
BEGIN
  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'Relational RAG Enhancement Migration Complete';
  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'New columns on mio_knowledge_chunks:';
  RAISE NOTICE '  - framework_domain (10 relational domains)';
  RAISE NOTICE '  - framework_name (specific framework ID)';
  RAISE NOTICE '  - framework_section (universal template section)';
  RAISE NOTICE '  - evidence_tier (gold/silver/bronze/copper)';
  RAISE NOTICE '  - triage_color (red/orange/yellow/green)';
  RAISE NOTICE '  - contraindication_tags (52-rule matrix)';
  RAISE NOTICE '  - cultural_context_flags (sensitivity markers)';
  RAISE NOTICE '  - integration_points (cross-framework refs)';
  RAISE NOTICE '  - life_stages (relationship lifecycle)';
  RAISE NOTICE '  - issue_types (problem categories)';
  RAISE NOTICE 'New tables:';
  RAISE NOTICE '  - mio_framework_contradictions (5 decision trees)';
  RAISE NOTICE '  - mio_triage_keywords (4-color safety keywords)';
  RAISE NOTICE 'New function:';
  RAISE NOTICE '  - search_mio_relational (enhanced relational search)';
  RAISE NOTICE '=========================================================';
END $verify$;
