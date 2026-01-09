-- ============================================================================
-- COVERAGE CENTER TABLES
-- ============================================================================
-- Phase 1: Database schema for Coverage Center feature
-- Supports Coverage Streaks, Skip Tokens, and Milestones
--
-- Usage:
--   - Frontend tracks user's coverage streak and skip tokens
--   - Protocol completion updates streak automatically
--   - Skip tokens protect streak when user misses a day
--   - Milestones track Day 7, 21, 66 achievements
-- ============================================================================

-- ============================================================================
-- COVERAGE STREAKS TABLE
-- ============================================================================
-- Tracks user's consecutive protocol completion streak and skip tokens

CREATE TABLE IF NOT EXISTS coverage_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Streak tracking
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),

  -- Skip tokens (earned by completing protocols, max 3)
  skip_tokens INTEGER DEFAULT 0 CHECK (skip_tokens >= 0 AND skip_tokens <= 3),

  -- Last completion tracking
  last_completion_date DATE,
  streak_started_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One streak record per user
  UNIQUE(user_id)
);

-- ============================================================================
-- COVERAGE MILESTONES TABLE
-- ============================================================================
-- Tracks achievement milestones (Day 7, 21, 66, protocol_complete)

CREATE TABLE IF NOT EXISTS coverage_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Milestone type
  milestone_type VARCHAR(30) NOT NULL CHECK (milestone_type IN ('day_7', 'day_21', 'day_66', 'protocol_complete')),

  -- Achievement timestamp
  achieved_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional: link to protocol that triggered milestone
  protocol_id UUID REFERENCES mio_weekly_protocols(id) ON DELETE SET NULL,

  -- Context data (optional)
  context JSONB DEFAULT '{}',

  -- Each milestone type can only be achieved once per protocol (or once total for streak milestones)
  UNIQUE(user_id, milestone_type, protocol_id)
);

-- ============================================================================
-- ALTER mio_weekly_protocols
-- ============================================================================
-- Add skip_token tracking columns

DO $$
BEGIN
  -- Add skip_token_earned column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'skip_token_earned'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN skip_token_earned BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add skip_token_earned_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'skip_token_earned_at'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN skip_token_earned_at TIMESTAMPTZ;
  END IF;

  -- Add source option for onboarding_completion
  -- We need to alter the CHECK constraint to add new source type
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mio_weekly_protocols_source_check_v2'
  ) THEN
    -- Drop old constraint if exists
    ALTER TABLE mio_weekly_protocols DROP CONSTRAINT IF EXISTS mio_weekly_protocols_source_check;

    -- Add new constraint with onboarding_completion option
    ALTER TABLE mio_weekly_protocols
    ADD CONSTRAINT mio_weekly_protocols_source_check_v2
    CHECK (source IN ('n8n_weekly', 'manual_assignment', 'assessment', 'chat_recommendation', 'onboarding_completion'));
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Coverage streaks lookup by user
CREATE INDEX IF NOT EXISTS idx_coverage_streaks_user ON coverage_streaks(user_id);

-- Milestones lookup by user
CREATE INDEX IF NOT EXISTS idx_coverage_milestones_user ON coverage_milestones(user_id);

-- Milestones by type (for analytics)
CREATE INDEX IF NOT EXISTS idx_coverage_milestones_type ON coverage_milestones(milestone_type, achieved_at);

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_coverage_streak_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coverage_streak_updated_at ON coverage_streaks;
CREATE TRIGGER coverage_streak_updated_at
  BEFORE UPDATE ON coverage_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_coverage_streak_updated_at();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Get or create coverage streak for user
CREATE OR REPLACE FUNCTION get_or_create_coverage_streak(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  current_streak INTEGER,
  longest_streak INTEGER,
  skip_tokens INTEGER,
  last_completion_date DATE,
  streak_started_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Insert if not exists
  INSERT INTO coverage_streaks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Return the record
  RETURN QUERY
  SELECT
    cs.id,
    cs.user_id,
    cs.current_streak,
    cs.longest_streak,
    cs.skip_tokens,
    cs.last_completion_date,
    cs.streak_started_at
  FROM coverage_streaks cs
  WHERE cs.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete protocol day WITH streak update (replaces simple complete_protocol_day)
CREATE OR REPLACE FUNCTION complete_protocol_day_with_streak(
  p_protocol_id UUID,
  p_day_number INTEGER,
  p_response_data JSONB DEFAULT '{}',
  p_notes TEXT DEFAULT NULL,
  p_time_spent INTEGER DEFAULT NULL,
  p_practice_response VARCHAR DEFAULT NULL,
  p_moment_captured TEXT DEFAULT NULL,
  p_insight_captured TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_protocol mio_weekly_protocols%ROWTYPE;
  v_completion_id UUID;
  v_all_days_completed BOOLEAN;
  v_streak RECORD;
  v_today DATE := CURRENT_DATE;
  v_streak_broken BOOLEAN := FALSE;
  v_milestone_achieved VARCHAR(30) := NULL;
  v_skip_token_awarded BOOLEAN := FALSE;
BEGIN
  -- Get the protocol
  SELECT * INTO v_protocol
  FROM mio_weekly_protocols
  WHERE id = p_protocol_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol not found');
  END IF;

  IF v_protocol.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol is not active');
  END IF;

  -- Build response_data with practice context
  IF p_response_data IS NULL THEN
    p_response_data := '{}'::jsonb;
  END IF;

  IF p_practice_response IS NOT NULL THEN
    p_response_data := p_response_data || jsonb_build_object('practice_response', p_practice_response);
  END IF;

  IF p_moment_captured IS NOT NULL THEN
    p_response_data := p_response_data || jsonb_build_object('moment_captured', p_moment_captured);
  END IF;

  IF p_insight_captured IS NOT NULL THEN
    p_response_data := p_response_data || jsonb_build_object('insight_captured', p_insight_captured);
  END IF;

  -- Insert or update completion
  INSERT INTO mio_protocol_completions (
    protocol_id,
    user_id,
    day_number,
    response_data,
    notes,
    time_spent_minutes
  ) VALUES (
    p_protocol_id,
    v_protocol.user_id,
    p_day_number,
    p_response_data,
    p_notes,
    p_time_spent
  )
  ON CONFLICT (protocol_id, day_number)
  DO UPDATE SET
    completed_at = NOW(),
    response_data = EXCLUDED.response_data,
    notes = EXCLUDED.notes,
    time_spent_minutes = EXCLUDED.time_spent_minutes,
    was_skipped = false
  RETURNING id INTO v_completion_id;

  -- Update protocol progress
  UPDATE mio_weekly_protocols
  SET
    days_completed = (
      SELECT COUNT(*)
      FROM mio_protocol_completions
      WHERE protocol_id = p_protocol_id AND NOT was_skipped
    ),
    current_day = LEAST(p_day_number + 1, 7),
    started_at = COALESCE(started_at, NOW()),
    first_task_started_at = COALESCE(first_task_started_at, NOW())
  WHERE id = p_protocol_id;

  -- Check if all 7 days completed
  SELECT COUNT(*) = 7 INTO v_all_days_completed
  FROM mio_protocol_completions
  WHERE protocol_id = p_protocol_id AND NOT was_skipped;

  IF v_all_days_completed THEN
    UPDATE mio_weekly_protocols
    SET
      status = 'completed',
      completed_at = NOW(),
      skip_token_earned = true,
      skip_token_earned_at = NOW()
    WHERE id = p_protocol_id;

    v_skip_token_awarded := true;
    v_milestone_achieved := 'protocol_complete';
  END IF;

  -- Get or create coverage streak
  INSERT INTO coverage_streaks (user_id)
  VALUES (v_protocol.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak
  FROM coverage_streaks
  WHERE user_id = v_protocol.user_id;

  -- Update streak based on last completion date
  IF v_streak.last_completion_date IS NULL THEN
    -- First ever completion
    UPDATE coverage_streaks
    SET
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_completion_date = v_today,
      streak_started_at = NOW()
    WHERE user_id = v_protocol.user_id;
  ELSIF v_streak.last_completion_date = v_today THEN
    -- Already completed today, no change
    NULL;
  ELSIF v_streak.last_completion_date = v_today - 1 THEN
    -- Consecutive day! Increment streak
    UPDATE coverage_streaks
    SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_completion_date = v_today
    WHERE user_id = v_protocol.user_id;

    -- Check for streak milestones
    IF v_streak.current_streak + 1 = 7 THEN
      v_milestone_achieved := 'day_7';
    ELSIF v_streak.current_streak + 1 = 21 THEN
      v_milestone_achieved := 'day_21';
    ELSIF v_streak.current_streak + 1 = 66 THEN
      v_milestone_achieved := 'day_66';
    END IF;
  ELSE
    -- Streak broken (more than 1 day gap)
    v_streak_broken := true;
    UPDATE coverage_streaks
    SET
      current_streak = 1,
      last_completion_date = v_today,
      streak_started_at = NOW()
    WHERE user_id = v_protocol.user_id;
  END IF;

  -- Award skip token if protocol completed
  IF v_skip_token_awarded THEN
    UPDATE coverage_streaks
    SET skip_tokens = LEAST(skip_tokens + 1, 3)
    WHERE user_id = v_protocol.user_id;
  END IF;

  -- Record milestone if achieved
  IF v_milestone_achieved IS NOT NULL THEN
    INSERT INTO coverage_milestones (user_id, milestone_type, protocol_id)
    VALUES (v_protocol.user_id, v_milestone_achieved, p_protocol_id)
    ON CONFLICT (user_id, milestone_type, protocol_id) DO NOTHING;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'days_completed', (SELECT days_completed FROM mio_weekly_protocols WHERE id = p_protocol_id),
    'protocol_completed', v_all_days_completed,
    'streak', (SELECT jsonb_build_object(
      'current_streak', current_streak,
      'longest_streak', longest_streak,
      'skip_tokens', skip_tokens,
      'streak_broken', v_streak_broken
    ) FROM coverage_streaks WHERE user_id = v_protocol.user_id),
    'milestone_achieved', v_milestone_achieved,
    'skip_token_awarded', v_skip_token_awarded
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Use skip token to protect streak
CREATE OR REPLACE FUNCTION use_skip_token(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_streak RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT * INTO v_streak
  FROM coverage_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Streak record not found');
  END IF;

  IF v_streak.skip_tokens <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No skip tokens available');
  END IF;

  -- Use token and maintain streak
  UPDATE coverage_streaks
  SET
    skip_tokens = skip_tokens - 1,
    last_completion_date = v_today
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'skip_tokens_remaining', v_streak.skip_tokens - 1,
    'streak_protected', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get coverage history for user
CREATE OR REPLACE FUNCTION get_coverage_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  protocol_id UUID,
  protocol_title VARCHAR,
  pattern_targeted VARCHAR,
  completion_percentage NUMERIC,
  days_completed INTEGER,
  total_days INTEGER,
  status VARCHAR,
  skip_token_earned BOOLEAN,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as protocol_id,
    p.title as protocol_title,
    COALESCE((p.source_context->>'collision_pattern')::VARCHAR, p.protocol_type) as pattern_targeted,
    ROUND((p.days_completed::NUMERIC / 7) * 100, 0) as completion_percentage,
    p.days_completed,
    7 as total_days,
    p.status,
    COALESCE(p.skip_token_earned, false) as skip_token_earned,
    p.started_at,
    p.completed_at,
    p.created_at
  FROM mio_weekly_protocols p
  WHERE p.user_id = p_user_id
    AND p.status IN ('completed', 'active', 'expired')
    AND p.muted_by_coach = false
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get milestones for user
CREATE OR REPLACE FUNCTION get_user_milestones(p_user_id UUID)
RETURNS TABLE (
  milestone_type VARCHAR,
  achieved_at TIMESTAMPTZ,
  protocol_id UUID,
  protocol_title VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.milestone_type,
    m.achieved_at,
    m.protocol_id,
    p.title as protocol_title
  FROM coverage_milestones m
  LEFT JOIN mio_weekly_protocols p ON m.protocol_id = p.id
  WHERE m.user_id = p_user_id
  ORDER BY m.achieved_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE coverage_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_milestones ENABLE ROW LEVEL SECURITY;

-- Users can view their own streaks
CREATE POLICY "Users can view own streaks"
  ON coverage_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own streaks (via RPC functions)
CREATE POLICY "Users can update own streaks"
  ON coverage_streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own streaks
CREATE POLICY "Users can insert own streaks"
  ON coverage_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access streaks"
  ON coverage_streaks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Milestones policies
CREATE POLICY "Users can view own milestones"
  ON coverage_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestones"
  ON coverage_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access milestones"
  ON coverage_milestones FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin policies
CREATE POLICY "Admins can view all streaks"
  ON coverage_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can view all milestones"
  ON coverage_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON coverage_streaks TO authenticated;
GRANT SELECT, INSERT ON coverage_milestones TO authenticated;
GRANT ALL ON coverage_streaks TO service_role;
GRANT ALL ON coverage_milestones TO service_role;

GRANT EXECUTE ON FUNCTION get_or_create_coverage_streak TO authenticated;
GRANT EXECUTE ON FUNCTION complete_protocol_day_with_streak TO authenticated;
GRANT EXECUTE ON FUNCTION use_skip_token TO authenticated;
GRANT EXECUTE ON FUNCTION get_coverage_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_milestones TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE coverage_streaks IS 'Tracks user coverage streaks and skip tokens for protocol gamification';
COMMENT ON TABLE coverage_milestones IS 'Records achievement milestones (Day 7, 21, 66, protocol completion)';
COMMENT ON FUNCTION get_or_create_coverage_streak IS 'Returns or creates coverage streak record for a user';
COMMENT ON FUNCTION complete_protocol_day_with_streak IS 'Completes a protocol day and updates streak/milestones';
COMMENT ON FUNCTION use_skip_token IS 'Consumes a skip token to protect streak when missing a day';
COMMENT ON FUNCTION get_coverage_history IS 'Returns protocol history for Coverage Center display';
COMMENT ON FUNCTION get_user_milestones IS 'Returns all milestones achieved by a user';
