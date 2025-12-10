-- Coach Protocols V2: Multi-Week Protocol System
-- Phase: Coach Protocols Enhancement
-- Features: Multi-week support, CSV/Google import, Primary/Secondary slots, MIO integration

-- =============================================
-- 1. MAIN PROTOCOLS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS coach_protocols_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Protocol metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coach_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Multi-week structure (1-52 weeks supported)
  total_weeks INTEGER NOT NULL DEFAULT 1 CHECK (total_weeks BETWEEN 1 AND 52),

  -- Import source tracking
  import_source VARCHAR(50) DEFAULT 'manual' CHECK (import_source IN ('manual', 'csv', 'google_doc', 'google_sheet')),
  import_metadata JSONB DEFAULT '{}',

  -- Visibility & targeting (extended with custom_group supporting multiple groups)
  visibility VARCHAR(20) NOT NULL DEFAULT 'all_users' CHECK (visibility IN ('all_users', 'tier_based', 'individual', 'custom_group')),
  visibility_config JSONB DEFAULT '{}', -- {tiers: [], user_ids: [], group_ids: []}

  -- Scheduling
  schedule_type VARCHAR(30) DEFAULT 'immediate' CHECK (schedule_type IN ('immediate', 'date_specific', 'rolling')),
  start_date DATE,

  -- Protocol status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'paused')),
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,

  -- UI customization
  theme_color VARCHAR(7) DEFAULT '#fac832',
  icon VARCHAR(50) DEFAULT 'book',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for coach_protocols_v2
CREATE INDEX IF NOT EXISTS idx_cpv2_coach ON coach_protocols_v2(coach_id);
CREATE INDEX IF NOT EXISTS idx_cpv2_status ON coach_protocols_v2(status);
CREATE INDEX IF NOT EXISTS idx_cpv2_visibility ON coach_protocols_v2(visibility, status);
CREATE INDEX IF NOT EXISTS idx_cpv2_created ON coach_protocols_v2(created_at DESC);

-- =============================================
-- 2. PROTOCOL TASKS TABLE (by week/day)
-- =============================================

CREATE TABLE IF NOT EXISTS coach_protocol_tasks_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES coach_protocols_v2(id) ON DELETE CASCADE,

  -- Position within protocol
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  task_order INTEGER NOT NULL DEFAULT 1,

  -- Task content
  title VARCHAR(255) NOT NULL,
  instructions TEXT NOT NULL,
  task_type VARCHAR(30) NOT NULL DEFAULT 'action' CHECK (task_type IN ('action', 'reflection', 'reading', 'video', 'worksheet', 'voice_recording')),
  time_of_day VARCHAR(20) DEFAULT 'throughout' CHECK (time_of_day IN ('morning', 'throughout', 'evening')),

  -- Duration & resources (only shown in UI if populated)
  estimated_minutes INTEGER,
  resource_url TEXT,
  resource_type VARCHAR(30) CHECK (resource_type IS NULL OR resource_type IN ('video', 'pdf', 'article', 'audio', 'worksheet', 'external')),

  -- Success criteria (optional)
  success_criteria TEXT[] DEFAULT '{}',

  -- Week theme (optional, for display)
  week_theme VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one task per position per protocol
  UNIQUE(protocol_id, week_number, day_number, task_order)
);

-- Indexes for coach_protocol_tasks_v2
CREATE INDEX IF NOT EXISTS idx_cptv2_protocol ON coach_protocol_tasks_v2(protocol_id);
CREATE INDEX IF NOT EXISTS idx_cptv2_protocol_week_day ON coach_protocol_tasks_v2(protocol_id, week_number, day_number);

-- =============================================
-- 3. USER ASSIGNMENTS TABLE (max 2 per user: primary + secondary)
-- =============================================

CREATE TABLE IF NOT EXISTS user_coach_protocol_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES coach_protocols_v2(id) ON DELETE CASCADE,

  -- Assignment slot: primary or secondary (max 2 per user)
  assignment_slot VARCHAR(10) NOT NULL DEFAULT 'primary' CHECK (assignment_slot IN ('primary', 'secondary')),

  -- Progress tracking
  current_week INTEGER DEFAULT 1,
  current_day INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned', 'expired')),

  -- Timing
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_advanced_at TIMESTAMPTZ,

  -- Progress stats
  days_completed INTEGER DEFAULT 0,
  days_skipped INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,

  -- MIO integration
  paused_mio_protocol_id UUID, -- References mio_weekly_protocols.id when MIO is paused

  -- Assignment source
  assigned_by UUID REFERENCES user_profiles(id),
  assignment_note TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Enforce max 2 protocols per user (one per slot)
  UNIQUE(user_id, assignment_slot)
);

-- Indexes for user_coach_protocol_assignments
CREATE INDEX IF NOT EXISTS idx_ucpa_user ON user_coach_protocol_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ucpa_user_active ON user_coach_protocol_assignments(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ucpa_protocol ON user_coach_protocol_assignments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_ucpa_status ON user_coach_protocol_assignments(status);
CREATE INDEX IF NOT EXISTS idx_ucpa_assigned_at ON user_coach_protocol_assignments(assigned_at DESC);

-- =============================================
-- 4. TASK COMPLETIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS coach_protocol_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES user_coach_protocol_assignments(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES coach_protocol_tasks_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Completion data
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB DEFAULT '{}',
  notes TEXT,
  time_spent_minutes INTEGER,

  -- Skip tracking
  was_skipped BOOLEAN DEFAULT false,
  auto_skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,

  -- Self-assessment (optional)
  self_rating INTEGER CHECK (self_rating IS NULL OR self_rating BETWEEN 1 AND 5),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each task can only be completed once per assignment
  UNIQUE(assignment_id, task_id)
);

-- Indexes for coach_protocol_completions
CREATE INDEX IF NOT EXISTS idx_cpc_assignment ON coach_protocol_completions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_cpc_user ON coach_protocol_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_cpc_completed_at ON coach_protocol_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cpc_task ON coach_protocol_completions(task_id);

-- =============================================
-- 5. PROTOCOL COMPLETION EVENTS (for analytics/coach notifications)
-- =============================================

CREATE TABLE IF NOT EXISTS coach_protocol_completion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES user_coach_protocol_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES coach_protocols_v2(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES user_profiles(id),

  -- Event type
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('protocol_started', 'week_completed', 'protocol_completed', 'protocol_abandoned', 'protocol_expired')),

  -- Stats at time of event
  days_completed INTEGER DEFAULT 0,
  days_skipped INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0,

  -- Notification tracking
  coach_notified BOOLEAN DEFAULT false,
  coach_notified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for completion events
CREATE INDEX IF NOT EXISTS idx_cpce_user ON coach_protocol_completion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cpce_protocol ON coach_protocol_completion_events(protocol_id);
CREATE INDEX IF NOT EXISTS idx_cpce_coach ON coach_protocol_completion_events(coach_id);
CREATE INDEX IF NOT EXISTS idx_cpce_event_type ON coach_protocol_completion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cpce_created ON coach_protocol_completion_events(created_at DESC);

-- =============================================
-- 6. EXTEND MIO WEEKLY PROTOCOLS TABLE
-- =============================================

-- Add column to track when MIO is paused by coach protocol
ALTER TABLE mio_weekly_protocols
  ADD COLUMN IF NOT EXISTS paused_by_coach_protocol_id UUID REFERENCES user_coach_protocol_assignments(id);

-- =============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE coach_protocols_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_tasks_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coach_protocol_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_completion_events ENABLE ROW LEVEL SECURITY;

-- Policies for coach_protocols_v2
CREATE POLICY "Service role full access to coach_protocols_v2"
  ON coach_protocols_v2 FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage coach_protocols_v2"
  ON coach_protocols_v2 FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Users can view published protocols they have access to"
  ON coach_protocols_v2 FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND (
      visibility = 'all_users'
      OR (visibility = 'individual' AND auth.uid()::text = ANY(ARRAY(SELECT jsonb_array_elements_text(visibility_config->'user_ids'))))
      OR (visibility = 'tier_based')
      OR (visibility = 'custom_group')
    )
  );

-- Policies for coach_protocol_tasks_v2
CREATE POLICY "Service role full access to coach_protocol_tasks_v2"
  ON coach_protocol_tasks_v2 FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage coach_protocol_tasks_v2"
  ON coach_protocol_tasks_v2 FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Users can view tasks for protocols they're assigned to"
  ON coach_protocol_tasks_v2 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_coach_protocol_assignments
      WHERE user_coach_protocol_assignments.protocol_id = coach_protocol_tasks_v2.protocol_id
      AND user_coach_protocol_assignments.user_id = auth.uid()
    )
  );

-- Policies for user_coach_protocol_assignments
CREATE POLICY "Service role full access to assignments"
  ON user_coach_protocol_assignments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage all assignments"
  ON user_coach_protocol_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Users can view their own assignments"
  ON user_coach_protocol_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own assignments"
  ON user_coach_protocol_assignments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for coach_protocol_completions
CREATE POLICY "Service role full access to completions"
  ON coach_protocol_completions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all completions"
  ON coach_protocol_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Users can manage their own completions"
  ON coach_protocol_completions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for coach_protocol_completion_events
CREATE POLICY "Service role full access to completion_events"
  ON coach_protocol_completion_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all completion events"
  ON coach_protocol_completion_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Users can view their own completion events"
  ON coach_protocol_completion_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================
-- 8. HELPER FUNCTIONS
-- =============================================

-- Function to calculate absolute day from week and day number
CREATE OR REPLACE FUNCTION calculate_absolute_day(p_week INTEGER, p_day INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (p_week - 1) * 7 + p_day;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get current day based on assignment start date
CREATE OR REPLACE FUNCTION get_coach_protocol_current_day(p_assignment_id UUID)
RETURNS TABLE(current_week INTEGER, current_day INTEGER, absolute_day INTEGER, is_completed BOOLEAN) AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_total_weeks INTEGER;
  v_days_elapsed INTEGER;
  v_calc_week INTEGER;
  v_calc_day INTEGER;
  v_abs_day INTEGER;
BEGIN
  -- Get assignment and protocol details
  SELECT
    a.started_at,
    p.total_weeks
  INTO v_started_at, v_total_weeks
  FROM user_coach_protocol_assignments a
  JOIN coach_protocols_v2 p ON p.id = a.protocol_id
  WHERE a.id = p_assignment_id;

  IF v_started_at IS NULL THEN
    -- Not started yet
    RETURN QUERY SELECT 1, 1, 1, false;
    RETURN;
  END IF;

  -- Calculate days elapsed since start (add 1 because day 1 is the start day)
  v_days_elapsed := GREATEST(1, EXTRACT(DAY FROM (NOW() - v_started_at))::INTEGER + 1);

  -- Calculate week and day
  v_calc_week := LEAST(((v_days_elapsed - 1) / 7) + 1, v_total_weeks);
  v_calc_day := ((v_days_elapsed - 1) % 7) + 1;
  v_abs_day := LEAST(v_days_elapsed, v_total_weeks * 7);

  RETURN QUERY SELECT
    v_calc_week,
    v_calc_day,
    v_abs_day,
    v_days_elapsed > (v_total_weeks * 7);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to advance a user's protocol to the current day (auto-skip)
CREATE OR REPLACE FUNCTION advance_coach_protocol_assignment(p_assignment_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_current_state RECORD;
  v_assignment RECORD;
  v_total_days INTEGER;
BEGIN
  -- Get current calculated state
  SELECT * INTO v_current_state FROM get_coach_protocol_current_day(p_assignment_id);

  -- Get assignment details
  SELECT
    a.*,
    p.total_weeks
  INTO v_assignment
  FROM user_coach_protocol_assignments a
  JOIN coach_protocols_v2 p ON p.id = a.protocol_id
  WHERE a.id = p_assignment_id;

  v_total_days := v_assignment.total_weeks * 7;

  -- Check if completed
  IF v_current_state.is_completed THEN
    UPDATE user_coach_protocol_assignments
    SET
      status = 'completed',
      completed_at = NOW(),
      current_week = v_assignment.total_weeks,
      current_day = 7,
      updated_at = NOW()
    WHERE id = p_assignment_id;

    v_result := jsonb_build_object(
      'status', 'completed',
      'final_week', v_assignment.total_weeks,
      'final_day', 7
    );
  ELSE
    -- Calculate days skipped
    DECLARE
      v_old_abs_day INTEGER;
      v_new_abs_day INTEGER;
      v_days_to_skip INTEGER;
    BEGIN
      v_old_abs_day := (v_assignment.current_week - 1) * 7 + v_assignment.current_day;
      v_new_abs_day := v_current_state.absolute_day;
      v_days_to_skip := GREATEST(0, v_new_abs_day - v_old_abs_day - 1);

      UPDATE user_coach_protocol_assignments
      SET
        current_week = v_current_state.current_week,
        current_day = v_current_state.current_day,
        days_skipped = days_skipped + v_days_to_skip,
        last_advanced_at = NOW(),
        updated_at = NOW()
      WHERE id = p_assignment_id;

      v_result := jsonb_build_object(
        'status', 'advanced',
        'current_week', v_current_state.current_week,
        'current_day', v_current_state.current_day,
        'days_skipped', v_days_to_skip
      );
    END;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's tasks for a user's coach protocol
CREATE OR REPLACE FUNCTION get_coach_protocol_today_tasks(p_user_id UUID)
RETURNS TABLE(
  assignment_id UUID,
  protocol_id UUID,
  protocol_title VARCHAR(255),
  assignment_slot VARCHAR(10),
  current_week INTEGER,
  current_day INTEGER,
  task_id UUID,
  task_title VARCHAR(255),
  task_instructions TEXT,
  task_type VARCHAR(30),
  time_of_day VARCHAR(20),
  estimated_minutes INTEGER,
  resource_url TEXT,
  is_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS assignment_id,
    p.id AS protocol_id,
    p.title AS protocol_title,
    a.assignment_slot,
    a.current_week,
    a.current_day,
    t.id AS task_id,
    t.title AS task_title,
    t.instructions AS task_instructions,
    t.task_type,
    t.time_of_day,
    t.estimated_minutes,
    t.resource_url,
    EXISTS (
      SELECT 1 FROM coach_protocol_completions c
      WHERE c.assignment_id = a.id AND c.task_id = t.id
    ) AS is_completed
  FROM user_coach_protocol_assignments a
  JOIN coach_protocols_v2 p ON p.id = a.protocol_id
  JOIN coach_protocol_tasks_v2 t ON t.protocol_id = p.id
    AND t.week_number = a.current_week
    AND t.day_number = a.current_day
  WHERE a.user_id = p_user_id
    AND a.status = 'active'
  ORDER BY a.assignment_slot, t.time_of_day, t.task_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to complete a coach protocol task
CREATE OR REPLACE FUNCTION complete_coach_protocol_task(
  p_assignment_id UUID,
  p_task_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_response_data JSONB DEFAULT '{}'::JSONB,
  p_time_spent_minutes INTEGER DEFAULT NULL,
  p_self_rating INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_all_tasks_completed BOOLEAN;
  v_protocol_completed BOOLEAN;
  v_assignment RECORD;
BEGIN
  -- Get user_id from assignment
  SELECT user_id INTO v_user_id
  FROM user_coach_protocol_assignments
  WHERE id = p_assignment_id;

  -- Insert completion record
  INSERT INTO coach_protocol_completions (
    assignment_id, task_id, user_id,
    notes, response_data, time_spent_minutes, self_rating
  ) VALUES (
    p_assignment_id, p_task_id, v_user_id,
    p_notes, p_response_data, p_time_spent_minutes, p_self_rating
  )
  ON CONFLICT (assignment_id, task_id) DO UPDATE SET
    notes = COALESCE(EXCLUDED.notes, coach_protocol_completions.notes),
    response_data = COALESCE(EXCLUDED.response_data, coach_protocol_completions.response_data),
    time_spent_minutes = COALESCE(EXCLUDED.time_spent_minutes, coach_protocol_completions.time_spent_minutes),
    self_rating = COALESCE(EXCLUDED.self_rating, coach_protocol_completions.self_rating);

  -- Update assignment stats
  UPDATE user_coach_protocol_assignments
  SET
    total_tasks_completed = (
      SELECT COUNT(*) FROM coach_protocol_completions
      WHERE assignment_id = p_assignment_id AND NOT was_skipped
    ),
    updated_at = NOW()
  WHERE id = p_assignment_id;

  -- Check if all today's tasks are completed
  SELECT
    a.*,
    p.total_weeks
  INTO v_assignment
  FROM user_coach_protocol_assignments a
  JOIN coach_protocols_v2 p ON p.id = a.protocol_id
  WHERE a.id = p_assignment_id;

  SELECT NOT EXISTS (
    SELECT 1 FROM coach_protocol_tasks_v2 t
    WHERE t.protocol_id = v_assignment.protocol_id
      AND t.week_number = v_assignment.current_week
      AND t.day_number = v_assignment.current_day
      AND NOT EXISTS (
        SELECT 1 FROM coach_protocol_completions c
        WHERE c.assignment_id = p_assignment_id AND c.task_id = t.id
      )
  ) INTO v_all_tasks_completed;

  -- Check if protocol is completed (last day, all tasks done)
  v_protocol_completed := v_all_tasks_completed
    AND v_assignment.current_week = v_assignment.total_weeks
    AND v_assignment.current_day = 7;

  IF v_all_tasks_completed THEN
    UPDATE user_coach_protocol_assignments
    SET days_completed = days_completed + 1
    WHERE id = p_assignment_id;
  END IF;

  IF v_protocol_completed THEN
    UPDATE user_coach_protocol_assignments
    SET
      status = 'completed',
      completed_at = NOW()
    WHERE id = p_assignment_id;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'all_today_tasks_completed', v_all_tasks_completed,
    'protocol_completed', v_protocol_completed
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_protocols_v2_updated_at
  BEFORE UPDATE ON coach_protocols_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_protocol_tasks_v2_updated_at
  BEFORE UPDATE ON coach_protocol_tasks_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_coach_protocol_assignments_updated_at
  BEFORE UPDATE ON user_coach_protocol_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

COMMENT ON TABLE coach_protocols_v2 IS 'Multi-week coach protocols with support for CSV/Google import and custom visibility';
COMMENT ON TABLE coach_protocol_tasks_v2 IS 'Tasks organized by week and day within a coach protocol';
COMMENT ON TABLE user_coach_protocol_assignments IS 'User assignments to coach protocols (max 2 per user: primary + secondary)';
COMMENT ON TABLE coach_protocol_completions IS 'Individual task completions for coach protocols';
COMMENT ON TABLE coach_protocol_completion_events IS 'Analytics events for protocol milestones and coach notifications';
