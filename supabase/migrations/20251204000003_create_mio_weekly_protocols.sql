-- ============================================================================
-- MIO WEEKLY PROTOCOLS TABLE
-- ============================================================================
-- Stores AI-generated 7-day protocols linked to MIO insights.
-- Each user gets 1 active protocol at a time, generated on Day 7, 14, 21, 28+
--
-- Usage:
--   - N8N workflow creates protocol after insight generation
--   - Frontend displays current day's task
--   - Coach can mute protocols via admin panel
-- ============================================================================

-- Drop existing table if exists (for development)
DROP TABLE IF EXISTS mio_protocol_completions CASCADE;
DROP TABLE IF EXISTS mio_weekly_protocols CASCADE;

-- Main protocols table
CREATE TABLE mio_weekly_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES mio_user_reports(id) ON DELETE SET NULL,

  -- Protocol metadata
  protocol_type VARCHAR(50) NOT NULL DEFAULT 'insight_based',
  title VARCHAR(255) NOT NULL,
  insight_summary TEXT NOT NULL,
  why_it_matters TEXT,
  neural_principle TEXT,

  -- 7-day structure (JSONB array)
  day_tasks JSONB NOT NULL DEFAULT '[]',
  /* Expected structure:
  [
    {
      "day": 1,
      "theme": "Awareness Day",
      "task_title": "Notice Without Judgment",
      "task_instructions": "Today, simply notice when...",
      "duration_minutes": 10,
      "success_criteria": ["Caught pattern 3+ times", "Wrote what triggered it"],
      "morning_task": {
        "title": "Morning check-in",
        "instructions": "Start your day by..."
      },
      "throughout_day": {
        "title": "Pattern watch",
        "instructions": "Throughout the day..."
      },
      "evening_task": {
        "title": "Evening reflection",
        "instructions": "Before bed..."
      }
    },
    ...days 2-7
  ]
  */

  -- Protocol timing
  week_number INTEGER,
  year INTEGER,
  assigned_week_start DATE,

  -- Progress tracking
  current_day INTEGER DEFAULT 1 CHECK (current_day BETWEEN 1 AND 7),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'skipped', 'muted', 'expired')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  days_completed INTEGER DEFAULT 0,
  days_skipped INTEGER DEFAULT 0,

  -- Coach control
  muted_by_coach BOOLEAN DEFAULT false,
  muted_at TIMESTAMPTZ,
  muted_by UUID REFERENCES user_profiles(id),
  muted_reason TEXT,

  -- Source tracking (for analytics)
  source VARCHAR(50) DEFAULT 'n8n_weekly' CHECK (source IN ('n8n_weekly', 'manual_assignment', 'assessment', 'chat_recommendation')),
  source_context JSONB DEFAULT '{}',
  rag_chunks_used UUID[] DEFAULT '{}',
  capability_triggers INTEGER[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- User engagement tracking
  insight_viewed_at TIMESTAMPTZ,
  first_task_started_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROTOCOL COMPLETIONS TABLE
-- ============================================================================
-- Tracks individual day completions within a protocol

CREATE TABLE mio_protocol_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES mio_weekly_protocols(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),

  -- Completion data
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB DEFAULT '{}',
  notes TEXT,
  time_spent_minutes INTEGER,

  -- Skip tracking
  was_skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  auto_skipped BOOLEAN DEFAULT false, -- True if system auto-skipped due to date

  -- Quality metrics (optional)
  self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each day can only be completed once per protocol
  UNIQUE(protocol_id, day_number)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup: user's protocols
CREATE INDEX idx_mio_protocols_user ON mio_weekly_protocols(user_id);

-- Find active protocol for user (most common query)
CREATE INDEX idx_mio_protocols_user_active ON mio_weekly_protocols(user_id, status)
  WHERE status = 'active';

-- Link to reports
CREATE INDEX idx_mio_protocols_report ON mio_weekly_protocols(report_id);

-- Analytics: find protocols by type/source
CREATE INDEX idx_mio_protocols_source ON mio_weekly_protocols(source, created_at);

-- Completions lookup
CREATE INDEX idx_mio_completions_protocol ON mio_protocol_completions(protocol_id);
CREATE INDEX idx_mio_completions_user ON mio_protocol_completions(user_id, created_at);

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_mio_protocol_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mio_protocol_updated_at
  BEFORE UPDATE ON mio_weekly_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_mio_protocol_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user's active protocol
CREATE OR REPLACE FUNCTION get_active_mio_protocol(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  insight_summary TEXT,
  current_day INTEGER,
  days_completed INTEGER,
  day_tasks JSONB,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.insight_summary,
    p.current_day,
    p.days_completed,
    p.day_tasks,
    p.started_at,
    p.created_at
  FROM mio_weekly_protocols p
  WHERE p.user_id = p_user_id
    AND p.status = 'active'
    AND p.muted_by_coach = false
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete a protocol day
CREATE OR REPLACE FUNCTION complete_protocol_day(
  p_protocol_id UUID,
  p_day_number INTEGER,
  p_response_data JSONB DEFAULT '{}',
  p_notes TEXT DEFAULT NULL,
  p_time_spent INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_protocol mio_weekly_protocols%ROWTYPE;
  v_completion_id UUID;
  v_all_days_completed BOOLEAN;
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
    SET status = 'completed', completed_at = NOW()
    WHERE id = p_protocol_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'days_completed', (SELECT days_completed FROM mio_weekly_protocols WHERE id = p_protocol_id),
    'protocol_completed', v_all_days_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skip to current day (for users who missed days)
CREATE OR REPLACE FUNCTION skip_to_current_protocol_day(
  p_protocol_id UUID,
  p_target_day INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_protocol mio_weekly_protocols%ROWTYPE;
  v_day INTEGER;
  v_skipped_count INTEGER := 0;
BEGIN
  SELECT * INTO v_protocol
  FROM mio_weekly_protocols
  WHERE id = p_protocol_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol not found');
  END IF;

  -- Skip all days between current_day and target_day
  FOR v_day IN v_protocol.current_day .. (p_target_day - 1) LOOP
    INSERT INTO mio_protocol_completions (
      protocol_id,
      user_id,
      day_number,
      was_skipped,
      auto_skipped,
      skip_reason
    ) VALUES (
      p_protocol_id,
      v_protocol.user_id,
      v_day,
      true,
      true,
      'Auto-skipped: user advanced to day ' || p_target_day
    )
    ON CONFLICT (protocol_id, day_number) DO NOTHING;

    v_skipped_count := v_skipped_count + 1;
  END LOOP;

  -- Update protocol
  UPDATE mio_weekly_protocols
  SET
    current_day = p_target_day,
    days_skipped = days_skipped + v_skipped_count
  WHERE id = p_protocol_id;

  RETURN jsonb_build_object(
    'success', true,
    'days_skipped', v_skipped_count,
    'current_day', p_target_day
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mute protocol (coach action)
CREATE OR REPLACE FUNCTION mute_mio_protocol(
  p_protocol_id UUID,
  p_muted_by UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE mio_weekly_protocols
  SET
    muted_by_coach = true,
    muted_at = NOW(),
    muted_by = p_muted_by,
    muted_reason = p_reason,
    status = 'muted'
  WHERE id = p_protocol_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'muted_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get protocol with completions
CREATE OR REPLACE FUNCTION get_protocol_with_progress(p_protocol_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'protocol', to_jsonb(p),
    'completions', COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(c) ORDER BY c.day_number)
        FROM mio_protocol_completions c
        WHERE c.protocol_id = p.id
      ),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM mio_weekly_protocols p
  WHERE p.id = p_protocol_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE mio_weekly_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE mio_protocol_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own protocols
CREATE POLICY "Users can view own protocols"
  ON mio_weekly_protocols FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own protocols (limited fields)
CREATE POLICY "Users can update own protocols"
  ON mio_weekly_protocols FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for n8n)
CREATE POLICY "Service role full access protocols"
  ON mio_weekly_protocols FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Completions policies
CREATE POLICY "Users can view own completions"
  ON mio_protocol_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON mio_protocol_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON mio_protocol_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access completions"
  ON mio_protocol_completions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin policies (users with admin role in gh_approved_users)
CREATE POLICY "Admins can view all protocols"
  ON mio_weekly_protocols FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update all protocols"
  ON mio_weekly_protocols FOR UPDATE
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

GRANT SELECT, INSERT, UPDATE ON mio_weekly_protocols TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mio_protocol_completions TO authenticated;
GRANT ALL ON mio_weekly_protocols TO service_role;
GRANT ALL ON mio_protocol_completions TO service_role;

GRANT EXECUTE ON FUNCTION get_active_mio_protocol TO authenticated;
GRANT EXECUTE ON FUNCTION complete_protocol_day TO authenticated;
GRANT EXECUTE ON FUNCTION skip_to_current_protocol_day TO authenticated;
GRANT EXECUTE ON FUNCTION get_protocol_with_progress TO authenticated;
GRANT EXECUTE ON FUNCTION mute_mio_protocol TO authenticated;

-- ============================================================================
-- ADD COLUMNS TO mio_user_reports (if table exists)
-- ============================================================================

DO $$
BEGIN
  -- Add protocol_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_user_reports' AND column_name = 'protocol_id'
  ) THEN
    ALTER TABLE mio_user_reports
    ADD COLUMN protocol_id UUID REFERENCES mio_weekly_protocols(id);
  END IF;

  -- Add insight_viewed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_user_reports' AND column_name = 'insight_viewed_at'
  ) THEN
    ALTER TABLE mio_user_reports
    ADD COLUMN insight_viewed_at TIMESTAMPTZ;
  END IF;

  -- Add protocol_started_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_user_reports' AND column_name = 'protocol_started_at'
  ) THEN
    ALTER TABLE mio_user_reports
    ADD COLUMN protocol_started_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mio_weekly_protocols IS 'AI-generated 7-day protocols for MIO weekly insights';
COMMENT ON TABLE mio_protocol_completions IS 'Tracks daily completion of protocol tasks';
COMMENT ON FUNCTION get_active_mio_protocol IS 'Returns the current active protocol for a user';
COMMENT ON FUNCTION complete_protocol_day IS 'Marks a protocol day as complete and updates progress';
COMMENT ON FUNCTION skip_to_current_protocol_day IS 'Auto-skips missed days when user advances';
COMMENT ON FUNCTION mute_mio_protocol IS 'Allows coaches to mute a user protocol';
