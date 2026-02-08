-- ============================================================================
-- BILLION DOLLAR RAG - PHASE 1 SCHEMA
-- Creates: mio_relational_profiles, mio_conversation_memories,
--          mio_session_summaries, mio_technique_outcomes, mio_cross_pillar_triggers
-- Enhances: mio_knowledge_chunks (multi-granularity + effectiveness fields)
-- Updates: search_mio_relational() RPC with new filters
-- ============================================================================

-- ============================================================================
-- 1. mio_relational_profiles - Persistent user relationship profile
-- ============================================================================

CREATE TABLE IF NOT EXISTS mio_relational_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Attachment patterns
  attachment_style text DEFAULT 'unassessed'
    CHECK (attachment_style IN ('secure', 'anxious_preoccupied', 'dismissive_avoidant', 'fearful_avoidant', 'unassessed')),
  partner_attachment_style text DEFAULT 'unknown'
    CHECK (partner_attachment_style IN ('secure', 'anxious_preoccupied', 'dismissive_avoidant', 'fearful_avoidant', 'unknown')),
  primary_pattern text DEFAULT 'unassessed'
    CHECK (primary_pattern IN ('pursuer_withdrawer', 'withdrawer_withdrawer', 'pursuer_pursuer', 'volatile', 'validating', 'avoidant', 'unassessed')),

  -- Relationship context
  relationship_season text,
  life_stage text DEFAULT 'established'
    CHECK (life_stage IN ('dating', 'engaged', 'newlywed', 'established', 'crisis', 'separation', 'divorce', 'remarriage')),
  relationship_type text[] DEFAULT '{}',

  -- Detected patterns (accumulated over sessions)
  key_issues text[] DEFAULT '{}',
  contraindications text[] DEFAULT '{}',
  cultural_context text[] DEFAULT '{}',
  triggers text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  growth_edges text[] DEFAULT '{}',

  -- Framework preferences (learned over time)
  frameworks_that_resonate text[] DEFAULT '{}',
  frameworks_that_dont text[] DEFAULT '{}',

  -- Emotional baseline
  emotional_baseline jsonb DEFAULT '{}',
  readiness_stage text DEFAULT 'contemplation'
    CHECK (readiness_stage IN ('precontemplation', 'contemplation', 'preparation', 'action', 'maintenance')),

  -- Partner connection
  partner_joined boolean DEFAULT false,
  partner_profile_id uuid REFERENCES mio_relational_profiles(id),

  -- Progress tracking
  vertex_score_current numeric(4,2),
  vertex_score_trend text DEFAULT 'stable'
    CHECK (vertex_score_trend IN ('improving', 'stable', 'declining')),
  sessions_completed integer DEFAULT 0,
  last_session_at timestamptz,
  profile_completeness numeric(3,2) DEFAULT 0.0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Index for fast profile lookup
CREATE INDEX IF NOT EXISTS idx_relational_profiles_user_id ON mio_relational_profiles(user_id);

-- RLS
ALTER TABLE mio_relational_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own relational profile"
  ON mio_relational_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relational profile"
  ON mio_relational_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relational profile"
  ON mio_relational_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to relational profiles"
  ON mio_relational_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 2. mio_conversation_memories - Per-user conversation knowledge graph
-- ============================================================================

CREATE TABLE IF NOT EXISTS mio_conversation_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,

  -- Memory content
  memory_type text NOT NULL
    CHECK (memory_type IN ('insight', 'breakthrough', 'setback', 'technique_tried', 'pattern_detected', 'goal_set', 'trigger_identified', 'strength_observed', 'context_revealed', 'homework_assigned')),
  memory_text text NOT NULL,
  memory_embedding vector(1536),

  -- Source context
  source_message text,
  frameworks_referenced text[] DEFAULT '{}',
  issues_referenced text[] DEFAULT '{}',
  emotional_context jsonb DEFAULT '{}',

  -- Importance and lifecycle
  importance_score numeric(3,2) DEFAULT 0.5,
  is_active boolean DEFAULT true,
  superseded_by uuid REFERENCES mio_conversation_memories(id),

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON mio_conversation_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_session_id ON mio_conversation_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_created ON mio_conversation_memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON mio_conversation_memories USING ivfflat (memory_embedding vector_cosine_ops) WITH (lists = 50);

ALTER TABLE mio_conversation_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memories"
  ON mio_conversation_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON mio_conversation_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to memories"
  ON mio_conversation_memories FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 3. mio_session_summaries - Session-level threading
-- ============================================================================

CREATE TABLE IF NOT EXISTS mio_session_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL UNIQUE,
  session_number integer NOT NULL,

  -- Summary content
  summary_text text NOT NULL,
  key_topics text[] DEFAULT '{}',
  techniques_discussed text[] DEFAULT '{}',
  homework_assigned text[] DEFAULT '{}',
  homework_completed text[] DEFAULT '{}',

  -- Emotional arc
  affect_trajectory jsonb DEFAULT '{}',
  triage_colors_seen text[] DEFAULT '{}',
  breakthrough_moment text,

  -- Metadata
  message_count integer DEFAULT 0,
  duration_minutes integer,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_summaries_user ON mio_session_summaries(user_id, session_number DESC);

ALTER TABLE mio_session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own session summaries"
  ON mio_session_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session summaries"
  ON mio_session_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to session summaries"
  ON mio_session_summaries FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 4. mio_technique_outcomes - Track what works for whom
-- ============================================================================

CREATE TABLE IF NOT EXISTS mio_technique_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What was recommended
  technique_name text NOT NULL,
  framework_name text NOT NULL,
  chunk_id uuid REFERENCES mio_knowledge_chunks(id),

  -- Lifecycle
  assigned_at timestamptz DEFAULT now(),
  attempted_at timestamptz,
  reported_outcome_at timestamptz,

  -- Outcome
  did_attempt boolean,
  self_reported_helpfulness integer CHECK (self_reported_helpfulness BETWEEN 1 AND 5),
  behavioral_change_detected boolean DEFAULT false,
  follow_up_notes text,

  -- Context at time of assignment
  user_affect_at_assignment jsonb DEFAULT '{}',
  user_issues_at_assignment text[] DEFAULT '{}',

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technique_outcomes_user ON mio_technique_outcomes(user_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_technique_outcomes_technique ON mio_technique_outcomes(technique_name, framework_name);

ALTER TABLE mio_technique_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own technique outcomes"
  ON mio_technique_outcomes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to technique outcomes"
  ON mio_technique_outcomes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 5. mio_cross_pillar_triggers - Maps life events to cross-pillar cascades
-- ============================================================================

CREATE TABLE IF NOT EXISTS mio_cross_pillar_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_event text NOT NULL UNIQUE,
  trigger_keywords text[] NOT NULL DEFAULT '{}',
  affected_pillars text[] NOT NULL DEFAULT '{}',
  cascade_pattern jsonb NOT NULL DEFAULT '{}',
  common_presenting_symptom text,
  actual_root_cause text,
  recommended_domains text[] DEFAULT '{}',
  recommended_chunks_filter jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mio_cross_pillar_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cross pillar triggers"
  ON mio_cross_pillar_triggers FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to cross pillar triggers"
  ON mio_cross_pillar_triggers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. Enhance mio_knowledge_chunks with multi-granularity + effectiveness fields
-- ============================================================================

DO $enhance$ BEGIN
  -- Granularity level
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'granularity') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN granularity text DEFAULT 'concept'
      CHECK (granularity IN ('summary', 'concept', 'deep_dive', 'micro_intervention', 'case_study', 'real_talk', 'validation'));
  END IF;

  -- Parent chunk linking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'parent_chunk_id') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN parent_chunk_id uuid REFERENCES mio_knowledge_chunks(id);
  END IF;

  -- Effectiveness tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'effectiveness_score') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN effectiveness_score numeric(4,3) DEFAULT 0.500;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'times_retrieved') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN times_retrieved integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'times_helpful') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN times_helpful integer DEFAULT 0;
  END IF;

  -- Voice/style
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'voice') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN voice text DEFAULT 'clinical'
      CHECK (voice IN ('clinical', 'keston', 'conversational', 'script'));
  END IF;

  -- Readiness matching
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'target_readiness') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN target_readiness text DEFAULT 'ready'
      CHECK (target_readiness IN ('flooded', 'processing', 'ready', 'motivated'));
  END IF;

  -- Time commitment category
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'time_commitment_category') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN time_commitment_category text
      CHECK (time_commitment_category IN ('micro_2min', 'short_15min', 'medium_30min', 'deep_60min'));
  END IF;

  -- Cross-pillar tags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'cross_pillar_tags') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN cross_pillar_tags text[] DEFAULT '{}';
  END IF;

  -- Cultural contexts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'cultural_contexts') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN cultural_contexts text[] DEFAULT '{}';
  END IF;

  -- Age range
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'age_range') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN age_range text DEFAULT 'all';
  END IF;

  -- Relationship type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_knowledge_chunks' AND column_name = 'relationship_type') THEN
    ALTER TABLE mio_knowledge_chunks ADD COLUMN relationship_type text[] DEFAULT '{}';
  END IF;
END $enhance$;

-- ============================================================================
-- 7. Enhanced search_mio_relational() with new filters
-- ============================================================================

CREATE OR REPLACE FUNCTION search_mio_relational(
  query_embedding vector(1536),
  query_text text DEFAULT '',
  filter_domains text[] DEFAULT NULL,
  filter_frameworks text[] DEFAULT NULL,
  filter_evidence_tiers text[] DEFAULT NULL,
  filter_triage_colors text[] DEFAULT NULL,
  exclude_contraindications text[] DEFAULT NULL,
  filter_life_stages text[] DEFAULT NULL,
  filter_issue_types text[] DEFAULT NULL,
  filter_cultural_flags text[] DEFAULT NULL,
  -- New Phase 1 filters
  filter_granularity text[] DEFAULT NULL,
  filter_voice text[] DEFAULT NULL,
  filter_target_readiness text[] DEFAULT NULL,
  filter_cross_pillar text[] DEFAULT NULL,
  filter_cultural_contexts text[] DEFAULT NULL,
  filter_relationship_type text[] DEFAULT NULL,
  min_effectiveness numeric DEFAULT 0.0,
  -- Matching params
  match_threshold double precision DEFAULT 0.3,
  match_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  chunk_summary text,
  pillar text,
  category text,
  framework_domain text,
  framework_name text,
  framework_section text,
  evidence_tier text,
  triage_color text,
  contraindication_tags text[],
  integration_points text[],
  expert_name text,
  granularity text,
  voice text,
  target_readiness text,
  cross_pillar_tags text[],
  effectiveness_score numeric,
  similarity double precision,
  relevance_score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      kc.id,
      kc.chunk_text,
      kc.chunk_summary,
      kc.pillar,
      kc.category,
      kc.framework_domain,
      kc.framework_name,
      kc.framework_section,
      kc.evidence_tier,
      kc.triage_color,
      kc.contraindication_tags,
      kc.integration_points,
      kc.expert_name,
      kc.granularity,
      kc.voice,
      kc.target_readiness,
      kc.cross_pillar_tags,
      kc.effectiveness_score,
      1 - (kc.embedding <=> query_embedding) AS similarity
    FROM mio_knowledge_chunks kc
    WHERE
      kc.is_active = true
      AND kc.pillar = 'relational'
      AND kc.embedding IS NOT NULL
      AND 1 - (kc.embedding <=> query_embedding) > match_threshold
      -- Existing filters
      AND (filter_domains IS NULL OR kc.framework_domain = ANY(filter_domains))
      AND (filter_frameworks IS NULL OR kc.framework_name = ANY(filter_frameworks))
      AND (filter_evidence_tiers IS NULL OR kc.evidence_tier = ANY(filter_evidence_tiers))
      AND (filter_triage_colors IS NULL OR kc.triage_color = ANY(filter_triage_colors))
      AND (exclude_contraindications IS NULL OR NOT kc.contraindication_tags && exclude_contraindications)
      AND (filter_life_stages IS NULL OR kc.life_stages && filter_life_stages)
      AND (filter_issue_types IS NULL OR kc.issue_types && filter_issue_types)
      AND (filter_cultural_flags IS NULL OR kc.cultural_context_flags && filter_cultural_flags)
      -- New Phase 1 filters
      AND (filter_granularity IS NULL OR kc.granularity = ANY(filter_granularity))
      AND (filter_voice IS NULL OR kc.voice = ANY(filter_voice))
      AND (filter_target_readiness IS NULL OR kc.target_readiness = ANY(filter_target_readiness))
      AND (filter_cross_pillar IS NULL OR kc.cross_pillar_tags && filter_cross_pillar)
      AND (filter_cultural_contexts IS NULL OR kc.cultural_contexts && filter_cultural_contexts)
      AND (filter_relationship_type IS NULL OR kc.relationship_type && filter_relationship_type)
      AND (kc.effectiveness_score >= min_effectiveness)
    ORDER BY similarity DESC
    LIMIT match_count * 2
  ),
  fts_results AS (
    SELECT
      kc.id,
      ts_rank(kc.fts, websearch_to_tsquery('english', query_text)) AS fts_rank
    FROM mio_knowledge_chunks kc
    WHERE
      query_text != ''
      AND kc.is_active = true
      AND kc.pillar = 'relational'
      AND kc.fts @@ websearch_to_tsquery('english', query_text)
    LIMIT match_count * 2
  ),
  combined AS (
    SELECT
      vr.*,
      COALESCE(fr.fts_rank, 0) AS fts_rank,
      -- Reciprocal Rank Fusion with effectiveness boost
      (
        (1.0 / (60.0 + ROW_NUMBER() OVER (ORDER BY vr.similarity DESC))) +
        COALESCE((1.0 / (60.0 + ROW_NUMBER() OVER (ORDER BY fr.fts_rank DESC NULLS LAST))), 0) +
        (COALESCE(vr.effectiveness_score, 0.5) * 0.1)
      ) AS relevance_score
    FROM vector_results vr
    LEFT JOIN fts_results fr ON vr.id = fr.id
  )
  SELECT
    c.id,
    c.chunk_text,
    c.chunk_summary,
    c.pillar,
    c.category,
    c.framework_domain,
    c.framework_name,
    c.framework_section,
    c.evidence_tier,
    c.triage_color,
    c.contraindication_tags,
    c.integration_points,
    c.expert_name,
    c.granularity,
    c.voice,
    c.target_readiness,
    c.cross_pillar_tags,
    c.effectiveness_score,
    c.similarity,
    c.relevance_score
  FROM combined c
  ORDER BY c.relevance_score DESC
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- 8. Memory search function
-- ============================================================================

CREATE OR REPLACE FUNCTION search_user_memories(
  p_user_id uuid,
  p_query_embedding vector(1536),
  p_limit integer DEFAULT 10,
  p_recency_days integer DEFAULT 90,
  p_min_importance numeric DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  memory_type text,
  memory_text text,
  importance_score numeric,
  frameworks_referenced text[],
  issues_referenced text[],
  emotional_context jsonb,
  created_at timestamptz,
  similarity double precision,
  recency_weight double precision,
  combined_score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.memory_type,
    cm.memory_text,
    cm.importance_score,
    cm.frameworks_referenced,
    cm.issues_referenced,
    cm.emotional_context,
    cm.created_at,
    1 - (cm.memory_embedding <=> p_query_embedding) AS similarity,
    -- Recency decay: 1.0 for today, ~0.5 for 30 days ago, ~0.1 for 90 days
    EXP(-0.02 * EXTRACT(EPOCH FROM (now() - cm.created_at)) / 86400.0) AS recency_weight,
    -- Combined: 40% similarity + 30% recency + 30% importance
    (
      0.4 * (1 - (cm.memory_embedding <=> p_query_embedding)) +
      0.3 * EXP(-0.02 * EXTRACT(EPOCH FROM (now() - cm.created_at)) / 86400.0) +
      0.3 * cm.importance_score
    ) AS combined_score
  FROM mio_conversation_memories cm
  WHERE
    cm.user_id = p_user_id
    AND cm.is_active = true
    AND cm.importance_score >= p_min_importance
    AND cm.created_at >= now() - (p_recency_days || ' days')::interval
    AND cm.memory_embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 9. Seed cross-pillar triggers (50 common cascades)
-- ============================================================================

INSERT INTO mio_cross_pillar_triggers (trigger_event, trigger_keywords, affected_pillars, cascade_pattern, common_presenting_symptom, actual_root_cause, recommended_domains) VALUES
('job_loss', ARRAY['lost my job', 'laid off', 'fired', 'unemployed', 'no work', 'between jobs'], ARRAY['financial', 'mental', 'relational'], '{"financial_stress": "immediate", "shame_withdrawal": "1-2 weeks", "relationship_conflict": "2-4 weeks"}', 'We keep fighting about everything', 'Financial shame causing emotional withdrawal and irritability', ARRAY['financial_mens', 'communication_conflict']),
('new_baby', ARRAY['baby', 'newborn', 'pregnant', 'just had a baby', 'postpartum', 'infant'], ARRAY['physical', 'relational', 'mental'], '{"sleep_deprivation": "immediate", "identity_shift": "1-3 months", "intimacy_decline": "3-6 months"}', 'We never have time for each other anymore', 'Sleep deprivation destroying emotional regulation capacity', ARRAY['foundation_attachment', 'communication_conflict']),
('health_diagnosis', ARRAY['diagnosed', 'cancer', 'chronic', 'disease', 'disability', 'surgery', 'illness'], ARRAY['physical', 'mental', 'relational', 'spiritual'], '{"fear_grief": "immediate", "role_shift": "weeks", "intimacy_change": "months"}', 'My partner doesn''t understand what I''m going through', 'Grief and fear manifesting as emotional distance', ARRAY['trauma_nervous_system', 'foundation_attachment']),
('infidelity_discovery', ARRAY['found out', 'cheating', 'affair', 'other woman', 'other man', 'messages', 'caught'], ARRAY['relational', 'mental', 'physical'], '{"trust_shattered": "immediate", "hypervigilance": "weeks", "identity_crisis": "months"}', 'I can''t trust anything anymore', 'Betrayal trauma activating nervous system hypervigilance', ARRAY['addiction_codependency', 'trauma_nervous_system', 'foundation_attachment']),
('death_of_parent', ARRAY['parent died', 'mom passed', 'dad passed', 'lost my father', 'lost my mother', 'funeral', 'grief'], ARRAY['mental', 'spiritual', 'relational'], '{"acute_grief": "immediate", "family_role_shift": "weeks", "unresolved_patterns_surface": "months"}', 'I don''t know why I''m so angry at my partner', 'Unresolved childhood attachment wounds surfacing through grief', ARRAY['trauma_nervous_system', 'foundation_attachment']),
('financial_crisis', ARRAY['debt', 'bankruptcy', 'foreclosure', 'can''t pay', 'collections', 'broke', 'overdue'], ARRAY['financial', 'mental', 'relational'], '{"survival_mode": "immediate", "shame_secrecy": "days", "power_imbalance": "weeks"}', 'He/she is so controlling about money', 'Financial anxiety creating controlling behavior as coping mechanism', ARRAY['financial_mens', 'communication_conflict']),
('retirement', ARRAY['retired', 'retirement', 'stopped working', 'no longer working', 'empty schedule'], ARRAY['financial', 'relational', 'spiritual'], '{"identity_loss": "immediate", "too_much_togetherness": "weeks", "purpose_crisis": "months"}', 'We''re driving each other crazy being home together', 'Identity vacuum from work loss creating existential anxiety', ARRAY['cultural_context', 'foundation_attachment']),
('relocation', ARRAY['moved', 'new city', 'relocation', 'transferred', 'far from family', 'no friends here'], ARRAY['relational', 'mental'], '{"isolation": "immediate", "support_loss": "weeks", "dependency_increase": "months"}', 'I feel so alone and my partner doesn''t get it', 'Loss of social support network increasing partner dependency', ARRAY['foundation_attachment', 'cultural_context']),
('empty_nest', ARRAY['kids left', 'empty nest', 'last child', 'kids moved out', 'alone together'], ARRAY['relational', 'spiritual', 'mental'], '{"identity_shift": "immediate", "rediscovery_or_crisis": "months"}', 'I don''t even know this person anymore', 'Parenting identity dissolving reveals neglected partnership', ARRAY['foundation_attachment', 'communication_conflict']),
('addiction_relapse', ARRAY['relapsed', 'started drinking again', 'using again', 'fell off the wagon', 'slipped'], ARRAY['mental', 'relational', 'physical'], '{"trust_collapse": "immediate", "safety_concern": "immediate", "codependency_activation": "days"}', 'I don''t know if I can go through this again', 'Addiction cycle re-traumatizing partner''s betrayal wounds', ARRAY['addiction_codependency', 'trauma_nervous_system']),
('mental_health_crisis', ARRAY['suicidal', 'panic attacks', 'can''t get out of bed', 'hospitalized', 'breakdown', 'crisis'], ARRAY['mental', 'relational', 'physical'], '{"acute_danger": "immediate", "caregiver_burnout": "weeks", "role_reversal": "months"}', 'I''m exhausted from being their caretaker', 'Compassion fatigue from partner''s mental health crisis', ARRAY['trauma_nervous_system', 'addiction_codependency']),
('promotion_success', ARRAY['promotion', 'big raise', 'new position', 'career success', 'got the job'], ARRAY['relational', 'financial'], '{"schedule_change": "immediate", "power_dynamic_shift": "weeks", "jealousy_risk": "months"}', 'My partner seems resentful of my success', 'Power dynamic shift triggering partner''s insecurity', ARRAY['financial_mens', 'communication_conflict']),
('chronic_pain', ARRAY['chronic pain', 'fibromyalgia', 'back pain', 'always in pain', 'disability', 'can''t do anything'], ARRAY['physical', 'mental', 'relational'], '{"activity_reduction": "immediate", "depression_risk": "weeks", "intimacy_decline": "months"}', 'Our sex life is nonexistent', 'Chronic pain causing avoidance of all physical intimacy', ARRAY['foundation_attachment', 'trauma_nervous_system']),
('sleep_deprivation', ARRAY['can''t sleep', 'insomnia', 'exhausted', 'no sleep', 'up all night', 'sleep deprived'], ARRAY['physical', 'mental', 'relational'], '{"irritability": "immediate", "cognitive_impairment": "days", "conflict_escalation": "weeks"}', 'Everything turns into a fight', 'Sleep deprivation reducing prefrontal cortex function needed for emotional regulation', ARRAY['communication_conflict', 'trauma_nervous_system']),
('social_media_conflict', ARRAY['instagram', 'social media', 'following', 'likes', 'DMs', 'online', 'her phone', 'his phone'], ARRAY['relational', 'mental'], '{"jealousy_trigger": "immediate", "trust_erosion": "weeks", "comparison_depression": "months"}', 'I saw something on their phone that bothers me', 'Digital boundary violations activating attachment insecurity', ARRAY['modern_threats', 'foundation_attachment']),
('pornography_discovery', ARRAY['found porn', 'pornography', 'watching porn', 'cam sites', 'OnlyFans', 'explicit content'], ARRAY['relational', 'mental', 'spiritual'], '{"betrayal_feeling": "immediate", "self_worth_collapse": "days", "intimacy_avoidance": "weeks"}', 'I feel like I''m not enough', 'Betrayal trauma from pornography discovery attacking partner''s self-worth', ARRAY['modern_threats', 'addiction_codependency']),
('pregnancy_loss', ARRAY['miscarriage', 'stillborn', 'lost the baby', 'pregnancy loss', 'couldn''t carry'], ARRAY['physical', 'mental', 'relational', 'spiritual'], '{"acute_grief": "immediate", "blame_cycle": "weeks", "intimacy_fear": "months"}', 'We grieve so differently it''s tearing us apart', 'Different grief styles creating false impression of not caring', ARRAY['trauma_nervous_system', 'communication_conflict']),
('in_law_conflict', ARRAY['mother-in-law', 'in-laws', 'his mother', 'her mother', 'family interference', 'boundaries with family'], ARRAY['relational', 'cultural'], '{"loyalty_conflict": "immediate", "boundary_testing": "ongoing", "identity_threat": "months"}', 'His/her family is destroying our marriage', 'Enmeshment with family of origin preventing healthy couple boundary', ARRAY['foundation_attachment', 'cultural_context']),
('work_stress_chronic', ARRAY['work stress', 'burnout', 'overworked', 'hate my job', 'work all the time', 'never home'], ARRAY['physical', 'mental', 'relational'], '{"emotional_depletion": "ongoing", "presence_deficit": "ongoing", "resentment_buildup": "months"}', 'I feel like a single parent', 'Work addiction or burnout leaving no emotional energy for partnership', ARRAY['modern_threats', 'communication_conflict']),
('sexual_dysfunction', ARRAY['erectile', 'can''t perform', 'no desire', 'pain during sex', 'vaginismus', 'low libido'], ARRAY['physical', 'relational', 'mental'], '{"avoidance_pattern": "immediate", "shame_silence": "weeks", "emotional_distance": "months"}', 'We just stopped being intimate', 'Sexual dysfunction creating shame spiral that prevents vulnerable conversation', ARRAY['foundation_attachment', 'trauma_nervous_system'])
ON CONFLICT (trigger_event) DO NOTHING;

-- ============================================================================
-- COMPLETE
-- Billion Dollar RAG Phase 1 schema applied.
-- Tables: mio_relational_profiles, mio_conversation_memories,
--         mio_session_summaries, mio_technique_outcomes, mio_cross_pillar_triggers
-- Columns added to mio_knowledge_chunks: granularity, parent_chunk_id,
--         effectiveness_score, times_retrieved, times_helpful, voice,
--         target_readiness, time_commitment_category, cross_pillar_tags,
--         cultural_contexts, age_range, relationship_type
-- Functions updated: search_mio_relational(), search_user_memories()
-- ============================================================================
