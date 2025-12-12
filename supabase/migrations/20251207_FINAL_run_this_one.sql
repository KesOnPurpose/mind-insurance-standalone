-- ============================================================================
-- FINAL CONSOLIDATED MIO GROUP-AWARE FUNCTIONS MIGRATION
-- ============================================================================
-- Run ONLY this file - it is fully idempotent and includes all necessary changes
-- This combines all 4 migration files (20251207000001-000004) into one safe script
-- ============================================================================

-- ============================================================================
-- SECTION 1: Schema Columns (safely add if not exist)
-- ============================================================================

DO $$
BEGIN
  -- Add journey_mode column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_report_automation' AND column_name = 'journey_mode'
  ) THEN
    ALTER TABLE mio_report_automation ADD COLUMN journey_mode VARCHAR(20) DEFAULT 'milestone';
  END IF;

  -- Add milestone_days column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_report_automation' AND column_name = 'milestone_days'
  ) THEN
    ALTER TABLE mio_report_automation ADD COLUMN milestone_days INTEGER[] DEFAULT ARRAY[7, 14, 21, 28];
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: Run Log Table (CREATE IF NOT EXISTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mio_automation_run_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES mio_report_automation(id) ON DELETE SET NULL,
  automation_name VARCHAR(255),
  run_type VARCHAR(20) NOT NULL CHECK (run_type IN ('scheduled', 'manual', 'event')),
  triggered_by UUID REFERENCES user_profiles(id),
  journey_mode VARCHAR(20),
  milestone_days INTEGER[],
  target_type VARCHAR(30),
  target_config JSONB,
  users_targeted INTEGER DEFAULT 0,
  users_processed INTEGER DEFAULT 0,
  users_failed INTEGER DEFAULT 0,
  users_skipped INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed', 'cancelled')),
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_mio_run_log_automation ON mio_automation_run_log(automation_id);
CREATE INDEX IF NOT EXISTS idx_mio_run_log_status ON mio_automation_run_log(status);
CREATE INDEX IF NOT EXISTS idx_mio_run_log_started ON mio_automation_run_log(started_at DESC);

-- Enable RLS
ALTER TABLE mio_automation_run_log ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "Service role full access to run log" ON mio_automation_run_log;
DROP POLICY IF EXISTS "Admins can view run logs" ON mio_automation_run_log;

CREATE POLICY "Service role full access to run log"
  ON mio_automation_run_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view run logs"
  ON mio_automation_run_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

GRANT ALL ON mio_automation_run_log TO service_role;
GRANT SELECT ON mio_automation_run_log TO authenticated;

-- ============================================================================
-- SECTION 3: Drop ALL existing function versions (safe cleanup)
-- ============================================================================

DROP FUNCTION IF EXISTS get_group_users_at_milestone(TEXT, JSONB, INTEGER[]);
DROP FUNCTION IF EXISTS get_group_users_immediate(TEXT, JSONB);
DROP FUNCTION IF EXISTS get_user_mio_context(UUID);
DROP FUNCTION IF EXISTS resolve_target_users_direct(TEXT, JSONB, TEXT, INTEGER[]);

-- ============================================================================
-- SECTION 4: Create group milestone function (with TEXT return types)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_users_at_milestone(
  p_target_type TEXT,
  p_target_config JSONB,
  p_milestone_days INTEGER[] DEFAULT ARRAY[7, 14, 21, 28]
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_day INTEGER,
  journey_start DATE,
  collision_pattern TEXT,
  temperament TEXT,
  current_week INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH base_users AS (
    SELECT (jsonb_array_elements_text(p_target_config->'user_ids'))::UUID AS uid
    WHERE p_target_type = 'individual'

    UNION ALL

    SELECT ugm.user_id AS uid
    FROM mio_user_group_members ugm
    WHERE p_target_type = 'custom_group'
      AND ugm.group_id = (p_target_config->>'group_id')::UUID

    UNION ALL

    SELECT ragu.user_id AS uid
    FROM resolve_auto_group_users(p_target_config) ragu
    WHERE p_target_type = 'auto_group'

    UNION ALL

    SELECT up.id AS uid
    FROM user_profiles up
    WHERE p_target_type = 'all'
      AND up.deleted_at IS NULL
  ),
  users_with_journey AS (
    SELECT
      bu.uid,
      up.email::TEXT AS email,
      up.full_name::TEXT AS full_name,
      COALESCE(
        (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
        1
      ) AS calc_journey_day,
      COALESCE(up.challenge_start_date, up.created_at::DATE) AS calc_journey_start,
      (up.collision_patterns->>'primary_pattern')::TEXT AS coll_pattern,
      up.temperament::TEXT AS temperament,
      COALESCE(up.current_journey_week,
        CEIL(COALESCE(
          (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
          1
        )::DECIMAL / 7)::INTEGER
      ) AS calc_week
    FROM base_users bu
    JOIN user_profiles up ON up.id = bu.uid
    WHERE up.deleted_at IS NULL
  ),
  at_milestone AS (
    SELECT *
    FROM users_with_journey uwj
    WHERE uwj.calc_journey_day = ANY(p_milestone_days)
  ),
  without_active_protocol AS (
    SELECT am.*
    FROM at_milestone am
    WHERE NOT EXISTS (
      SELECT 1 FROM mio_weekly_protocols mwp
      WHERE mwp.user_id = am.uid
      AND mwp.status = 'active'
      AND mwp.week_number = am.calc_week
      AND mwp.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    )
  )
  SELECT
    wap.uid,
    wap.email,
    wap.full_name,
    wap.calc_journey_day,
    wap.calc_journey_start,
    wap.coll_pattern,
    wap.temperament,
    wap.calc_week
  FROM without_active_protocol wap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_group_users_at_milestone IS
  'Returns users from a target group who are AT a milestone day and do not have an active protocol';

-- ============================================================================
-- SECTION 5: Create immediate mode function (with TEXT return types)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_users_immediate(
  p_target_type TEXT,
  p_target_config JSONB
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_day INTEGER,
  journey_start DATE,
  collision_pattern TEXT,
  temperament TEXT,
  current_week INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH base_users AS (
    SELECT (jsonb_array_elements_text(p_target_config->'user_ids'))::UUID AS uid
    WHERE p_target_type = 'individual'

    UNION ALL

    SELECT ugm.user_id AS uid
    FROM mio_user_group_members ugm
    WHERE p_target_type = 'custom_group'
      AND ugm.group_id = (p_target_config->>'group_id')::UUID

    UNION ALL

    SELECT ragu.user_id AS uid
    FROM resolve_auto_group_users(p_target_config) ragu
    WHERE p_target_type = 'auto_group'

    UNION ALL

    SELECT up.id AS uid
    FROM user_profiles up
    WHERE p_target_type = 'all'
      AND up.deleted_at IS NULL
  )
  SELECT
    up.id,
    up.email::TEXT,
    up.full_name::TEXT,
    COALESCE(
      (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
      1
    ) AS journey_day,
    COALESCE(up.challenge_start_date, up.created_at::DATE) AS journey_start,
    (up.collision_patterns->>'primary_pattern')::TEXT AS collision_pattern,
    up.temperament::TEXT,
    COALESCE(up.current_journey_week,
      CEIL(COALESCE(
        (CURRENT_DATE - COALESCE(up.challenge_start_date, up.created_at::DATE))::INTEGER + 1,
        1
      )::DECIMAL / 7)::INTEGER
    ) AS current_week
  FROM base_users bu
  JOIN user_profiles up ON up.id = bu.uid
  WHERE up.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_group_users_immediate IS
  'Returns ALL users from a target group regardless of journey day (for manual/immediate runs)';

-- ============================================================================
-- SECTION 6: Create comprehensive user context function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_mio_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_profile JSONB;
  v_journey JSONB;
  v_practices JSONB;
  v_streaks JSONB;
  v_assessments JSONB;
  v_conversations JSONB;
  v_protocols JSONB;
  v_journey_start DATE;
  v_journey_day INTEGER;
  v_journey_week INTEGER;
BEGIN
  -- 1. Get user profile
  SELECT jsonb_build_object(
    'id', up.id,
    'email', up.email,
    'full_name', up.full_name,
    'challenge_start_date', up.challenge_start_date,
    'current_day', up.current_day,
    'current_journey_day', up.current_journey_day,
    'current_journey_week', up.current_journey_week,
    'collision_patterns', up.collision_patterns,
    'temperament', up.temperament,
    'championship_level', up.championship_level,
    'tier_level', up.tier_level,
    'created_at', up.created_at
  ) INTO v_profile
  FROM user_profiles up
  WHERE up.id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found', 'user_id', p_user_id);
  END IF;

  -- Calculate journey info
  v_journey_start := COALESCE(
    (v_profile->>'challenge_start_date')::DATE,
    (v_profile->>'created_at')::DATE
  );
  v_journey_day := (CURRENT_DATE - v_journey_start)::INTEGER + 1;
  v_journey_week := CEIL(v_journey_day::DECIMAL / 7)::INTEGER;

  v_journey := jsonb_build_object(
    'start_date', v_journey_start,
    'current_day', v_journey_day,
    'current_week', v_journey_week,
    'is_at_milestone', v_journey_day IN (7, 14, 21, 28, 30, 35, 42, 49, 56),
    'next_milestone', CASE
      WHEN v_journey_day < 7 THEN 7
      WHEN v_journey_day < 14 THEN 14
      WHEN v_journey_day < 21 THEN 21
      WHEN v_journey_day < 28 THEN 28
      ELSE ((v_journey_week + 1) * 7)
    END
  );

  -- 2. Get practices (last 30 days)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', dp.id,
      'practice_type', dp.practice_type,
      'practice_date', dp.practice_date,
      'data', dp.data,
      'completed_at', dp.completed_at
    ) ORDER BY dp.practice_date DESC
  ), '[]'::jsonb) INTO v_practices
  FROM daily_practices dp
  WHERE dp.user_id = p_user_id
  AND dp.practice_date >= CURRENT_DATE - INTERVAL '30 days';

  -- 3. Get streaks
  SELECT jsonb_build_object(
    'current_streak', COALESCE(ps.current_streak, 0),
    'longest_streak', COALESCE(ps.longest_streak, 0),
    'last_practice_date', ps.last_practice_date
  ) INTO v_streaks
  FROM practice_streaks ps
  WHERE ps.user_id = p_user_id;

  IF v_streaks IS NULL THEN
    v_streaks := jsonb_build_object(
      'current_streak', 0,
      'longest_streak', 0,
      'last_practice_date', NULL
    );
  END IF;

  -- 4. Get assessments (handle tables that may not exist)
  BEGIN
    v_assessments := jsonb_build_object(
      'partner_matching', (
        SELECT jsonb_build_object(
          'collision_pattern', pmq.collision_pattern,
          'temperament', pmq.temperament,
          'accountability_style', pmq.accountability_style,
          'communication_style', pmq.communication_style,
          'created_at', pmq.created_at
        )
        FROM partner_matching_questionnaire pmq
        WHERE pmq.user_id = p_user_id
        ORDER BY pmq.created_at DESC
        LIMIT 1
      ),
      'weekly_scores', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'week_number', was.week_number,
            'score_data', was.score_data,
            'created_at', was.created_at
          ) ORDER BY was.week_number DESC
        )
        FROM weekly_assessment_scores was
        WHERE was.user_id = p_user_id
      ), '[]'::jsonb)
    );
  EXCEPTION WHEN OTHERS THEN
    v_assessments := jsonb_build_object(
      'partner_matching', NULL,
      'weekly_scores', '[]'::jsonb
    );
  END;

  -- 5. Get conversations (handle tables that may not exist)
  BEGIN
    v_conversations := jsonb_build_object(
      'mio', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', mc.id,
            'messages', mc.messages,
            'conversation_turns', mc.conversation_turns,
            'key_insights', mc.key_insights,
            'user_commitments', mc.user_commitments,
            'mio_tone_strategy', mc.mio_tone_strategy,
            'status', mc.status,
            'created_at', mc.created_at
          ) ORDER BY mc.created_at DESC
        )
        FROM (
          SELECT * FROM mio_conversations
          WHERE user_id = p_user_id
          ORDER BY created_at DESC
          LIMIT 10
        ) mc
      ), '[]'::jsonb),
      'agents', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ac.id,
            'agent_type', ac.agent_type,
            'user_message', ac.user_message,
            'ai_response', ac.ai_response,
            'created_at', ac.created_at
          ) ORDER BY ac.created_at DESC
        )
        FROM (
          SELECT * FROM agent_conversations
          WHERE user_id = p_user_id
          ORDER BY created_at DESC
          LIMIT 10
        ) ac
      ), '[]'::jsonb)
    );
  EXCEPTION WHEN OTHERS THEN
    v_conversations := jsonb_build_object(
      'mio', '[]'::jsonb,
      'agents', '[]'::jsonb
    );
  END;

  -- 6. Get previous protocols
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', mwp.id,
      'title', mwp.title,
      'protocol_type', mwp.protocol_type,
      'insight_summary', mwp.insight_summary,
      'status', mwp.status,
      'current_day', mwp.current_day,
      'days_completed', mwp.days_completed,
      'days_skipped', mwp.days_skipped,
      'started_at', mwp.started_at,
      'completed_at', mwp.completed_at,
      'created_at', mwp.created_at,
      'completions', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'day_number', mpc.day_number,
            'completed_at', mpc.completed_at,
            'response_data', mpc.response_data,
            'was_skipped', mpc.was_skipped,
            'self_rating', mpc.self_rating
          ) ORDER BY mpc.day_number
        )
        FROM mio_protocol_completions mpc
        WHERE mpc.protocol_id = mwp.id
      ), '[]'::jsonb)
    ) ORDER BY mwp.created_at DESC
  ), '[]'::jsonb) INTO v_protocols
  FROM mio_weekly_protocols mwp
  WHERE mwp.user_id = p_user_id;

  -- Build final result
  v_result := jsonb_build_object(
    'profile', v_profile,
    'journey', v_journey,
    'practices', v_practices,
    'streaks', v_streaks,
    'assessments', v_assessments,
    'conversations', v_conversations,
    'previous_protocols', v_protocols,
    'fetched_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_mio_context IS
  'Returns comprehensive user context for MIO Claude AI analysis including profile, practices, streaks, assessments, conversations, and previous protocols';

-- ============================================================================
-- SECTION 7: Create unified resolution function
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_target_users_direct(
  p_target_type TEXT,
  p_target_config JSONB,
  p_journey_mode TEXT DEFAULT 'immediate',
  p_milestone_days INTEGER[] DEFAULT ARRAY[7, 14, 21, 28]
)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  journey_day INTEGER,
  journey_start DATE,
  collision_pattern TEXT,
  temperament TEXT,
  current_week INTEGER
) AS $$
BEGIN
  IF p_journey_mode = 'milestone' THEN
    RETURN QUERY
    SELECT * FROM get_group_users_at_milestone(p_target_type, p_target_config, p_milestone_days);
  ELSE
    RETURN QUERY
    SELECT * FROM get_group_users_immediate(p_target_type, p_target_config);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION resolve_target_users_direct(TEXT, JSONB, TEXT, INTEGER[]) IS
  'Unified function to resolve target users based on journey mode (milestone or immediate)';

-- ============================================================================
-- SECTION 8: Grants
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_group_users_at_milestone(TEXT, JSONB, INTEGER[]) TO service_role;
GRANT EXECUTE ON FUNCTION get_group_users_immediate(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_mio_context(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_target_users_direct(TEXT, JSONB, TEXT, INTEGER[]) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_mio_context(UUID) TO authenticated;

-- ============================================================================
-- DONE - Migration complete!
-- ============================================================================
