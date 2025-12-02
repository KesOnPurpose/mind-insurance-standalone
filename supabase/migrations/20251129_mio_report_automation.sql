-- MIO Report Automation Schema
-- Phase 28: Automated Report Generation with User Groups
-- Enables scheduling and targeting for MIO reports via n8n workflows

-- =============================================
-- Section 1: User Groups Table
-- =============================================

-- Table: mio_user_groups
-- Stores both custom and auto-generated user groups for targeting
CREATE TABLE IF NOT EXISTS mio_user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Group type: 'auto' (system-generated) or 'custom' (admin-created)
  group_type VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (group_type IN ('auto', 'custom')),

  -- Auto-group criteria (only for group_type = 'auto')
  -- Example: {"pattern": "past_prison", "temperament": "warrior", "week": 3}
  auto_criteria JSONB,

  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Section 2: User Group Members Table
-- =============================================

-- Table: mio_user_group_members
-- Maps users to custom groups (auto groups are resolved dynamically)
CREATE TABLE IF NOT EXISTS mio_user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES mio_user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tracking
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),

  -- Prevent duplicates
  UNIQUE(group_id, user_id)
);

-- =============================================
-- Section 3: Report Automation Table
-- =============================================

-- Table: mio_report_automation
-- Stores scheduled/automated report generation configs
CREATE TABLE IF NOT EXISTS mio_report_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Target configuration
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN (
    'individual',    -- Specific users by ID
    'auto_group',    -- Dynamic group based on criteria
    'custom_group',  -- Manually created group
    'all'            -- All active users
  )),

  -- Target config details (JSONB for flexibility)
  -- For individual: {"user_ids": ["uuid1", "uuid2"]}
  -- For auto_group: {"auto_group_type": "by_pattern", "pattern": "past_prison"}
  -- For custom_group: {"group_id": "uuid"}
  -- For all: {} or null
  target_config JSONB NOT NULL DEFAULT '{}',

  -- Schedule configuration
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN (
    'manual',        -- On-demand only
    'daily',         -- Run daily
    'weekly',        -- Run weekly
    'event_based'    -- Triggered by events
  )),

  -- Schedule details (JSONB for flexibility)
  -- For daily: {"time": "09:00"}
  -- For weekly: {"day_of_week": 0, "time": "09:00"} (0=Sunday)
  -- For event_based: {"event_trigger": "practice_complete", "delay_minutes": 30}
  schedule_config JSONB,

  -- n8n workflow info
  n8n_webhook_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Run tracking
  last_run_at TIMESTAMPTZ,
  last_run_status VARCHAR(20),
  last_run_count INTEGER,
  next_run_at TIMESTAMPTZ,

  -- Admin tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Section 4: Indexes for Performance
-- =============================================

-- User groups indexes
CREATE INDEX IF NOT EXISTS idx_mio_user_groups_type ON mio_user_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_mio_user_groups_created_by ON mio_user_groups(created_by);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_mio_user_group_members_group ON mio_user_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_mio_user_group_members_user ON mio_user_group_members(user_id);

-- Automation indexes
CREATE INDEX IF NOT EXISTS idx_mio_report_automation_active ON mio_report_automation(is_active);
CREATE INDEX IF NOT EXISTS idx_mio_report_automation_schedule ON mio_report_automation(schedule_type);
CREATE INDEX IF NOT EXISTS idx_mio_report_automation_next_run ON mio_report_automation(next_run_at) WHERE is_active = true;

-- =============================================
-- Section 5: Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE mio_user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mio_user_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mio_report_automation ENABLE ROW LEVEL SECURITY;

-- User Groups: Service role has full access (admin panel uses service key)
CREATE POLICY "Service role has full access to user groups"
  ON mio_user_groups FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Group Members: Service role has full access
CREATE POLICY "Service role has full access to group members"
  ON mio_user_group_members FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Report Automation: Service role has full access
CREATE POLICY "Service role has full access to report automation"
  ON mio_report_automation FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- Section 6: Auto-Group Resolution Functions
-- =============================================

-- Function: resolve_auto_group_users
-- Dynamically resolves users based on auto-group criteria
CREATE OR REPLACE FUNCTION resolve_auto_group_users(p_criteria JSONB)
RETURNS TABLE(user_id UUID) AS $$
DECLARE
  v_auto_type TEXT;
  v_pattern TEXT;
  v_temperament TEXT;
  v_week INTEGER;
  v_streak_days INTEGER;
BEGIN
  v_auto_type := p_criteria->>'auto_group_type';

  -- By collision pattern
  IF v_auto_type = 'by_pattern' THEN
    v_pattern := UPPER(p_criteria->>'pattern');
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.collision_patterns->>'primary_pattern' = v_pattern
      AND up.deleted_at IS NULL;

  -- By temperament
  ELSIF v_auto_type = 'by_temperament' THEN
    v_temperament := UPPER(p_criteria->>'temperament');
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.temperament = v_temperament
      AND up.deleted_at IS NULL;

  -- By week number
  ELSIF v_auto_type = 'by_week' THEN
    v_week := (p_criteria->>'week')::INTEGER;
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.current_day BETWEEN ((v_week - 1) * 7 + 1) AND (v_week * 7)
      AND up.deleted_at IS NULL;

  -- By streak status (users with broken streak)
  ELSIF v_auto_type = 'by_streak_status' THEN
    v_streak_days := COALESCE((p_criteria->>'days_since_practice')::INTEGER, 3);
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    LEFT JOIN practice_streaks ps ON ps.user_id = up.id
    WHERE (ps.current_streak = 0 OR ps.current_streak IS NULL)
      AND (ps.last_practice_date IS NULL OR ps.last_practice_date < NOW() - (v_streak_days || ' days')::INTERVAL)
      AND up.deleted_at IS NULL;

  -- All users
  ELSIF v_auto_type = 'all' THEN
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.deleted_at IS NULL;

  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: resolve_automation_target_users
-- Main function to resolve all target users for an automation
CREATE OR REPLACE FUNCTION resolve_automation_target_users(p_automation_id UUID)
RETURNS TABLE(user_id UUID) AS $$
DECLARE
  v_target_type TEXT;
  v_target_config JSONB;
BEGIN
  -- Get automation config
  SELECT target_type, target_config
  INTO v_target_type, v_target_config
  FROM mio_report_automation
  WHERE id = p_automation_id;

  -- Route based on target type
  CASE v_target_type
    -- Individual users
    WHEN 'individual' THEN
      RETURN QUERY
      SELECT (jsonb_array_elements_text(v_target_config->'user_ids'))::UUID;

    -- Auto group (dynamic resolution)
    WHEN 'auto_group' THEN
      RETURN QUERY
      SELECT * FROM resolve_auto_group_users(v_target_config);

    -- Custom group (from membership table)
    WHEN 'custom_group' THEN
      RETURN QUERY
      SELECT ugm.user_id
      FROM mio_user_group_members ugm
      WHERE ugm.group_id = (v_target_config->>'group_id')::UUID;

    -- All users
    WHEN 'all' THEN
      RETURN QUERY
      SELECT up.id
      FROM user_profiles up
      WHERE up.deleted_at IS NULL;

  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_automation_user_count
-- Preview count of users that would be targeted
CREATE OR REPLACE FUNCTION get_automation_user_count(
  p_target_type TEXT,
  p_target_config JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  CASE p_target_type
    WHEN 'individual' THEN
      SELECT jsonb_array_length(p_target_config->'user_ids') INTO v_count;

    WHEN 'auto_group' THEN
      SELECT COUNT(*) INTO v_count FROM resolve_auto_group_users(p_target_config);

    WHEN 'custom_group' THEN
      SELECT COUNT(*) INTO v_count
      FROM mio_user_group_members
      WHERE group_id = (p_target_config->>'group_id')::UUID;

    WHEN 'all' THEN
      SELECT COUNT(*) INTO v_count
      FROM user_profiles
      WHERE deleted_at IS NULL;

    ELSE
      v_count := 0;
  END CASE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 7: Updated_at Trigger
-- =============================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_mio_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_mio_user_groups_updated_at
  BEFORE UPDATE ON mio_user_groups
  FOR EACH ROW EXECUTE FUNCTION update_mio_automation_updated_at();

CREATE TRIGGER update_mio_report_automation_updated_at
  BEFORE UPDATE ON mio_report_automation
  FOR EACH ROW EXECUTE FUNCTION update_mio_automation_updated_at();

-- =============================================
-- Section 8: Seed Default Auto-Groups
-- =============================================

-- Insert pre-configured auto-groups
INSERT INTO mio_user_groups (name, description, group_type, auto_criteria) VALUES
  ('Past Prison Users', 'All users with Past Prison collision pattern', 'auto', '{"auto_group_type": "by_pattern", "pattern": "past_prison"}'),
  ('Success Sabotage Users', 'All users with Success Sabotage collision pattern', 'auto', '{"auto_group_type": "by_pattern", "pattern": "success_sabotage"}'),
  ('Compass Crisis Users', 'All users with Compass Crisis collision pattern', 'auto', '{"auto_group_type": "by_pattern", "pattern": "compass_crisis"}'),
  ('Warriors', 'All users with Warrior temperament', 'auto', '{"auto_group_type": "by_temperament", "temperament": "warrior"}'),
  ('Sages', 'All users with Sage temperament', 'auto', '{"auto_group_type": "by_temperament", "temperament": "sage"}'),
  ('Connectors', 'All users with Connector temperament', 'auto', '{"auto_group_type": "by_temperament", "temperament": "connector"}'),
  ('Builders', 'All users with Builder temperament', 'auto', '{"auto_group_type": "by_temperament", "temperament": "builder"}'),
  ('Week 1 Users', 'Users in their first week (days 1-7)', 'auto', '{"auto_group_type": "by_week", "week": 1}'),
  ('Week 2 Users', 'Users in their second week (days 8-14)', 'auto', '{"auto_group_type": "by_week", "week": 2}'),
  ('Week 3 Users', 'Users in danger zone week (days 15-21)', 'auto', '{"auto_group_type": "by_week", "week": 3}'),
  ('Week 4 Users', 'Users in their fourth week (days 22-28)', 'auto', '{"auto_group_type": "by_week", "week": 4}'),
  ('Broken Streak Users', 'Users who have not practiced in 3+ days', 'auto', '{"auto_group_type": "by_streak_status", "days_since_practice": 3}')
ON CONFLICT DO NOTHING;

-- =============================================
-- Section 9: Grants
-- =============================================

GRANT ALL ON mio_user_groups TO service_role;
GRANT ALL ON mio_user_group_members TO service_role;
GRANT ALL ON mio_report_automation TO service_role;
GRANT EXECUTE ON FUNCTION resolve_auto_group_users TO service_role;
GRANT EXECUTE ON FUNCTION resolve_automation_target_users TO service_role;
GRANT EXECUTE ON FUNCTION get_automation_user_count TO service_role;
