-- Mental Pillar Baseline Assessment
-- Phase: Mental Pillar Curriculum Support
-- Features: Competency-based scoring, PRE/POST comparison, MIO personalized feedback, growth tracking

-- =============================================
-- 1. MAIN ASSESSMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS mental_pillar_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Assessment classification
  assessment_phase VARCHAR(10) NOT NULL CHECK (assessment_phase IN ('pre', 'post')),
  attempt_number INTEGER NOT NULL DEFAULT 1,

  -- Source tracking (consistent with existing patterns)
  source VARCHAR(50) NOT NULL DEFAULT 'user_initiated'
    CHECK (source IN ('user_initiated', 'coach_assigned', 'system_day28', 'mio_suggested')),
  source_context JSONB DEFAULT '{}', -- {coach_id, trigger_reason, etc.}

  -- Link to invitation if triggered externally
  invitation_id UUID REFERENCES assessment_invitations(id) ON DELETE SET NULL,

  -- Competency scores stored in JSONB (consistent with existing assessment patterns)
  pillar_scores JSONB NOT NULL,
  -- Structure: {
  --   pattern_awareness: 45,
  --   identity_alignment: 62,
  --   belief_mastery: 38,
  --   mental_resilience: 55,
  --   overall: 50
  -- }

  -- Growth tracking (only populated for 'post' assessments)
  baseline_assessment_id UUID REFERENCES mental_pillar_assessments(id),
  growth_deltas JSONB,
  -- Structure: {
  --   pattern_awareness: 15,
  --   identity_alignment: 8,
  --   belief_mastery: 22,
  --   mental_resilience: 12,
  --   overall: 14
  -- }

  -- Raw responses (consistent with existing patterns)
  responses JSONB NOT NULL,
  -- Structure: [
  --   {question_id: "q1", answer_id: "a2", score: 50, competency: "pattern_awareness"},
  --   ...
  -- ]

  -- MIO feedback (populated async via N8n webhook callback)
  mio_feedback JSONB,
  -- Structure: {
  --   content: "Your Pattern Awareness at 45 tells me something important...",
  --   generated_at: "2025-12-10T...",
  --   focus_areas: ["belief_mastery", "pattern_awareness"],
  --   predicted_challenge_week: 3
  -- }

  -- Quality metrics
  confidence_score DECIMAL(3,2), -- Assessment confidence 0.00-1.00
  answer_quality_score DECIMAL(3,2), -- Response quality indicator

  -- Timestamps (consistent with existing patterns)
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_to_complete_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_mpa_user ON mental_pillar_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_mpa_user_phase ON mental_pillar_assessments(user_id, assessment_phase);
CREATE INDEX IF NOT EXISTS idx_mpa_user_completed ON mental_pillar_assessments(user_id)
  WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mpa_invitation ON mental_pillar_assessments(invitation_id);
CREATE INDEX IF NOT EXISTS idx_mpa_created ON mental_pillar_assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mpa_scores ON mental_pillar_assessments USING gin (pillar_scores);

-- =============================================
-- 3. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE mental_pillar_assessments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assessments
CREATE POLICY "Users view own mental pillar assessments"
  ON mental_pillar_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own assessments
CREATE POLICY "Users insert own mental pillar assessments"
  ON mental_pillar_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assessments
CREATE POLICY "Users update own mental pillar assessments"
  ON mental_pillar_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access (for N8n workflows)
CREATE POLICY "Service role full access to mental pillar assessments"
  ON mental_pillar_assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view all assessments
CREATE POLICY "Admins view all mental pillar assessments"
  ON mental_pillar_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- =============================================
-- 4. UPDATE TRIGGER
-- =============================================

CREATE TRIGGER mental_pillar_assessments_updated_at
  BEFORE UPDATE ON mental_pillar_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. ADD COLUMN TO USER_PROFILES
-- =============================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS mental_pillar_progress JSONB DEFAULT NULL;

-- Index for JSONB queries on mental_pillar_progress
CREATE INDEX IF NOT EXISTS idx_user_profiles_mental_pillar
  ON user_profiles USING gin (mental_pillar_progress)
  WHERE mental_pillar_progress IS NOT NULL;

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to get Mental Pillar assessment status for a user
CREATE OR REPLACE FUNCTION get_mental_pillar_assessment_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_baseline RECORD;
  v_latest RECORD;
  v_attempts_used INTEGER;
  v_last_attempt_at TIMESTAMPTZ;
BEGIN
  -- Get baseline (first 'pre' assessment)
  SELECT * INTO v_baseline
  FROM mental_pillar_assessments
  WHERE user_id = p_user_id
    AND assessment_phase = 'pre'
    AND completed_at IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- Get latest completed assessment
  SELECT * INTO v_latest
  FROM mental_pillar_assessments
  WHERE user_id = p_user_id
    AND completed_at IS NOT NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Count user-initiated attempts
  SELECT COUNT(*), MAX(completed_at) INTO v_attempts_used, v_last_attempt_at
  FROM mental_pillar_assessments
  WHERE user_id = p_user_id
    AND source = 'user_initiated'
    AND completed_at IS NOT NULL;

  v_result := jsonb_build_object(
    'has_baseline', v_baseline.id IS NOT NULL,
    'baseline_id', v_baseline.id,
    'baseline_scores', v_baseline.pillar_scores,
    'baseline_completed_at', v_baseline.completed_at,
    'latest_id', v_latest.id,
    'latest_phase', v_latest.assessment_phase,
    'latest_scores', v_latest.pillar_scores,
    'latest_growth', v_latest.growth_deltas,
    'latest_mio_feedback', v_latest.mio_feedback,
    'latest_completed_at', v_latest.completed_at,
    'user_attempts_used', COALESCE(v_attempts_used, 0),
    'user_attempts_remaining', GREATEST(0, 3 - COALESCE(v_attempts_used, 0)),
    'last_attempt_at', v_last_attempt_at,
    'cooldown_ends_at', CASE
      WHEN v_last_attempt_at IS NOT NULL
      THEN v_last_attempt_at + INTERVAL '7 days'
      ELSE NULL
    END,
    'can_retake_now', (
      COALESCE(v_attempts_used, 0) < 3
      AND (
        v_last_attempt_at IS NULL
        OR v_last_attempt_at + INTERVAL '7 days' <= NOW()
      )
    ) OR EXISTS (
      SELECT 1 FROM assessment_invitations
      WHERE user_id = p_user_id
        AND assessment_type = 'mental_pillar'
        AND status = 'pending'
    ),
    'has_pending_invitation', EXISTS (
      SELECT 1 FROM assessment_invitations
      WHERE user_id = p_user_id
        AND assessment_type = 'mental_pillar'
        AND status = 'pending'
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to save Mental Pillar assessment and update user_profiles
CREATE OR REPLACE FUNCTION save_mental_pillar_assessment(
  p_user_id UUID,
  p_assessment_phase VARCHAR(10),
  p_source VARCHAR(50),
  p_source_context JSONB,
  p_pillar_scores JSONB,
  p_responses JSONB,
  p_started_at TIMESTAMPTZ,
  p_invitation_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_assessment_id UUID;
  v_baseline_id UUID := NULL;
  v_baseline_scores JSONB := NULL;
  v_growth_deltas JSONB;
  v_attempt_number INTEGER;
  v_time_to_complete INTEGER;
  v_focus_areas TEXT[];
BEGIN
  -- Calculate attempt number
  SELECT COALESCE(COUNT(*), 0) + 1 INTO v_attempt_number
  FROM mental_pillar_assessments
  WHERE user_id = p_user_id
    AND source = p_source;

  -- Calculate time to complete
  v_time_to_complete := EXTRACT(EPOCH FROM (NOW() - p_started_at))::INTEGER;

  -- If this is a POST assessment, get baseline and calculate deltas
  IF p_assessment_phase = 'post' THEN
    SELECT id, pillar_scores INTO v_baseline_id, v_baseline_scores
    FROM mental_pillar_assessments
    WHERE user_id = p_user_id
      AND assessment_phase = 'pre'
      AND completed_at IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_baseline_id IS NOT NULL THEN
      v_growth_deltas := jsonb_build_object(
        'pattern_awareness', (p_pillar_scores->>'pattern_awareness')::INTEGER - (v_baseline_scores->>'pattern_awareness')::INTEGER,
        'identity_alignment', (p_pillar_scores->>'identity_alignment')::INTEGER - (v_baseline_scores->>'identity_alignment')::INTEGER,
        'belief_mastery', (p_pillar_scores->>'belief_mastery')::INTEGER - (v_baseline_scores->>'belief_mastery')::INTEGER,
        'mental_resilience', (p_pillar_scores->>'mental_resilience')::INTEGER - (v_baseline_scores->>'mental_resilience')::INTEGER,
        'overall', (p_pillar_scores->>'overall')::INTEGER - (v_baseline_scores->>'overall')::INTEGER
      );
    END IF;
  END IF;

  -- Determine focus areas (lowest 2 competencies)
  SELECT ARRAY_AGG(competency ORDER BY score ASC) INTO v_focus_areas
  FROM (
    SELECT 'pattern_awareness' AS competency, (p_pillar_scores->>'pattern_awareness')::INTEGER AS score
    UNION ALL
    SELECT 'identity_alignment', (p_pillar_scores->>'identity_alignment')::INTEGER
    UNION ALL
    SELECT 'belief_mastery', (p_pillar_scores->>'belief_mastery')::INTEGER
    UNION ALL
    SELECT 'mental_resilience', (p_pillar_scores->>'mental_resilience')::INTEGER
  ) AS scores
  LIMIT 2;

  -- Insert the assessment
  INSERT INTO mental_pillar_assessments (
    user_id,
    assessment_phase,
    attempt_number,
    source,
    source_context,
    invitation_id,
    pillar_scores,
    baseline_assessment_id,
    growth_deltas,
    responses,
    started_at,
    completed_at,
    time_to_complete_seconds
  ) VALUES (
    p_user_id,
    p_assessment_phase,
    v_attempt_number,
    p_source,
    p_source_context,
    p_invitation_id,
    p_pillar_scores,
    v_baseline_id,
    v_growth_deltas,
    p_responses,
    p_started_at,
    NOW(),
    v_time_to_complete
  )
  RETURNING id INTO v_assessment_id;

  -- Update user_profiles with denormalized data
  UPDATE user_profiles
  SET mental_pillar_progress = jsonb_build_object(
    'baseline', CASE
      WHEN p_assessment_phase = 'pre' THEN jsonb_build_object(
        'assessment_id', v_assessment_id,
        'scores', p_pillar_scores,
        'completed_at', NOW(),
        'attempt', v_attempt_number
      )
      ELSE (
        SELECT jsonb_build_object(
          'assessment_id', mpa.id,
          'scores', mpa.pillar_scores,
          'completed_at', mpa.completed_at,
          'attempt', mpa.attempt_number
        )
        FROM mental_pillar_assessments mpa
        WHERE mpa.user_id = p_user_id
          AND mpa.assessment_phase = 'pre'
          AND mpa.completed_at IS NOT NULL
        ORDER BY mpa.created_at ASC
        LIMIT 1
      )
    END,
    'latest', jsonb_build_object(
      'assessment_id', v_assessment_id,
      'phase', p_assessment_phase,
      'scores', p_pillar_scores,
      'growth', v_growth_deltas,
      'completed_at', NOW(),
      'attempt', v_attempt_number,
      'focus_areas', to_jsonb(v_focus_areas)
    ),
    'user_attempts_used', (
      SELECT COUNT(*)
      FROM mental_pillar_assessments
      WHERE user_id = p_user_id
        AND source = 'user_initiated'
        AND completed_at IS NOT NULL
    ),
    'user_attempts_max', 3,
    'next_retake_available_at', NOW() + INTERVAL '7 days'
  )
  WHERE id = p_user_id;

  -- Update invitation status if applicable
  IF p_invitation_id IS NOT NULL THEN
    UPDATE assessment_invitations
    SET status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invitation_id;
  END IF;

  RETURN jsonb_build_object(
    'assessment_id', v_assessment_id,
    'phase', p_assessment_phase,
    'scores', p_pillar_scores,
    'growth_deltas', v_growth_deltas,
    'focus_areas', v_focus_areas,
    'attempt_number', v_attempt_number,
    'time_to_complete_seconds', v_time_to_complete
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update MIO feedback after N8n webhook processes
CREATE OR REPLACE FUNCTION update_mental_pillar_mio_feedback(
  p_assessment_id UUID,
  p_mio_feedback JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE mental_pillar_assessments
  SET mio_feedback = p_mio_feedback,
      updated_at = NOW()
  WHERE id = p_assessment_id;

  -- Also update user_profiles latest feedback
  UPDATE user_profiles
  SET mental_pillar_progress = mental_pillar_progress ||
    jsonb_build_object('latest',
      (mental_pillar_progress->'latest') || jsonb_build_object('mio_feedback', p_mio_feedback)
    )
  WHERE id = (SELECT user_id FROM mental_pillar_assessments WHERE id = p_assessment_id);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. GRANTS
-- =============================================

GRANT SELECT, INSERT, UPDATE ON mental_pillar_assessments TO authenticated;
GRANT ALL ON mental_pillar_assessments TO service_role;
GRANT EXECUTE ON FUNCTION get_mental_pillar_assessment_status TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION save_mental_pillar_assessment TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_mental_pillar_mio_feedback TO service_role;

-- =============================================
-- 8. COMMENTS
-- =============================================

COMMENT ON TABLE mental_pillar_assessments IS 'Mental Pillar Baseline Assessment - measures 4 competencies (Pattern Awareness, Identity Alignment, Belief Mastery, Mental Resilience) with PRE/POST comparison for growth tracking';
COMMENT ON FUNCTION get_mental_pillar_assessment_status IS 'Returns complete assessment status for a user including baseline, latest scores, growth, attempt tracking, and retake eligibility';
COMMENT ON FUNCTION save_mental_pillar_assessment IS 'Saves assessment results, calculates growth deltas for POST assessments, and updates user_profiles with denormalized data';
COMMENT ON FUNCTION update_mental_pillar_mio_feedback IS 'Updates MIO personalized feedback after N8n webhook processes - service_role only';
