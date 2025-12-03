-- ============================================================================
-- ANALYTICS TRACKING TABLES
-- ============================================================================
-- Purpose: Add missing tables for real analytics metrics (not mock data)
-- Tables: agent_errors, user_sessions, feature_usage
-- ============================================================================

-- 1. AGENT ERRORS TABLE
-- ============================================================================
-- Tracks errors for error_rate and system_uptime metrics
CREATE TABLE IF NOT EXISTS public.agent_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nette', 'mio', 'me')),

  -- Error details
  error_type TEXT NOT NULL, -- 'llm_error', 'rag_error', 'network_error', 'validation_error'
  error_message TEXT,
  error_code TEXT,
  stack_trace TEXT,

  -- Context
  conversation_id UUID, -- Optional reference to agent_conversations
  request_data JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium'
);

-- Indexes for agent_errors
CREATE INDEX idx_agent_errors_user ON public.agent_errors(user_id);
CREATE INDEX idx_agent_errors_agent_type ON public.agent_errors(agent_type, created_at DESC);
CREATE INDEX idx_agent_errors_created_at ON public.agent_errors(created_at DESC);
CREATE INDEX idx_agent_errors_severity ON public.agent_errors(severity, created_at DESC);
CREATE INDEX idx_agent_errors_type ON public.agent_errors(error_type, created_at DESC);

-- Partial index for unresolved errors
CREATE INDEX idx_agent_errors_unresolved
ON public.agent_errors(created_at DESC)
WHERE resolved_at IS NULL;

COMMENT ON TABLE agent_errors IS 'Error tracking for analytics dashboard error_rate and system_uptime metrics';
COMMENT ON COLUMN agent_errors.error_type IS 'Category of error for aggregation and filtering';
COMMENT ON COLUMN agent_errors.severity IS 'Error severity level for prioritization';

-- ============================================================================
-- 2. USER SESSIONS TABLE
-- ============================================================================
-- Tracks user sessions for session_frequency metric
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
      ELSE NULL
    END
  ) STORED,

  -- Session activity
  actions_count INTEGER DEFAULT 0,
  conversations_count INTEGER DEFAULT 0,
  tactics_completed_count INTEGER DEFAULT 0,

  -- Session metadata
  entry_point TEXT, -- 'dashboard', 'chat', 'assessment', 'tactic'
  exit_action TEXT, -- 'logout', 'timeout', 'navigation'
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'

  -- Timestamps
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_sessions
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_sessions_started_at ON public.user_sessions(started_at DESC);
CREATE INDEX idx_user_sessions_duration ON public.user_sessions(duration_minutes DESC NULLS LAST);

-- Partial index for active sessions
CREATE INDEX idx_user_sessions_active
ON public.user_sessions(user_id, started_at DESC)
WHERE ended_at IS NULL;

COMMENT ON TABLE user_sessions IS 'User session tracking for session_frequency and engagement metrics';
COMMENT ON COLUMN user_sessions.duration_minutes IS 'Auto-calculated session duration in minutes';
COMMENT ON COLUMN user_sessions.actions_count IS 'Number of meaningful actions during session';

-- ============================================================================
-- 3. FEATURE USAGE TABLE
-- ============================================================================
-- Tracks feature usage for feature_adoption metric
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feature details
  feature_name TEXT NOT NULL, -- 'chat', 'assessment', 'tactic', 'roadmap', 'profile', 'resources'
  feature_category TEXT NOT NULL CHECK (feature_category IN (
    'core_agent', 'assessment', 'practice', 'content', 'profile', 'social'
  )),

  -- Usage details
  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Context
  context_data JSONB DEFAULT '{}'::jsonb, -- Additional metadata about usage

  -- Unique constraint to track unique feature per user
  UNIQUE(user_id, feature_name)
);

-- Indexes for feature_usage
CREATE INDEX idx_feature_usage_user ON public.feature_usage(user_id, last_used_at DESC);
CREATE INDEX idx_feature_usage_feature ON public.feature_usage(feature_name, last_used_at DESC);
CREATE INDEX idx_feature_usage_category ON public.feature_usage(feature_category, last_used_at DESC);
CREATE INDEX idx_feature_usage_first_used ON public.feature_usage(first_used_at DESC);

COMMENT ON TABLE feature_usage IS 'Feature usage tracking for feature_adoption_rate metric';
COMMENT ON COLUMN feature_usage.feature_category IS 'Category for grouping features in analytics';
COMMENT ON COLUMN feature_usage.usage_count IS 'Incremented each time feature is used';

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.agent_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- agent_errors policies
CREATE POLICY "Users can insert their own errors" ON public.agent_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own errors" ON public.agent_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all errors" ON public.agent_errors
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update error resolution" ON public.agent_errors
  FOR UPDATE USING (public.is_admin());

-- user_sessions policies
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT USING (public.is_admin());

-- feature_usage policies
CREATE POLICY "Users can manage their own feature usage" ON public.feature_usage
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feature usage" ON public.feature_usage
  FOR SELECT USING (public.is_admin());

-- ============================================================================
-- HELPER FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to automatically end stale sessions (>1 hour inactive)
CREATE OR REPLACE FUNCTION public.end_stale_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ended_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET ended_at = last_activity_at,
      exit_action = 'timeout'
  WHERE ended_at IS NULL
    AND last_activity_at < NOW() - INTERVAL '1 hour'
  RETURNING COUNT(*) INTO v_ended_count;

  RETURN v_ended_count;
END;
$$;

COMMENT ON FUNCTION public.end_stale_sessions() IS 'Automatically close sessions inactive for >1 hour';

-- Function to update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity(
  p_user_id UUID,
  p_increment_actions BOOLEAN DEFAULT true,
  p_increment_conversations BOOLEAN DEFAULT false,
  p_increment_tactics BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_active_session UUID;
BEGIN
  -- Find active session (started in last hour)
  SELECT id INTO v_active_session
  FROM user_sessions
  WHERE user_id = p_user_id
    AND ended_at IS NULL
    AND started_at > NOW() - INTERVAL '1 hour'
  ORDER BY started_at DESC
  LIMIT 1;

  -- Create new session if none exists
  IF v_active_session IS NULL THEN
    INSERT INTO user_sessions (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_session_id;
  ELSE
    -- Update existing session
    UPDATE user_sessions
    SET
      last_activity_at = NOW(),
      actions_count = actions_count + CASE WHEN p_increment_actions THEN 1 ELSE 0 END,
      conversations_count = conversations_count + CASE WHEN p_increment_conversations THEN 1 ELSE 0 END,
      tactics_completed_count = tactics_completed_count + CASE WHEN p_increment_tactics THEN 1 ELSE 0 END
    WHERE id = v_active_session
    RETURNING id INTO v_session_id;
  END IF;

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION public.update_session_activity IS 'Update or create user session with activity tracking';

-- Function to track feature usage (upsert)
CREATE OR REPLACE FUNCTION public.track_feature_usage(
  p_user_id UUID,
  p_feature_name TEXT,
  p_feature_category TEXT,
  p_context_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage_id UUID;
BEGIN
  INSERT INTO feature_usage (user_id, feature_name, feature_category, context_data)
  VALUES (p_user_id, p_feature_name, p_feature_category, p_context_data)
  ON CONFLICT (user_id, feature_name) DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    last_used_at = NOW(),
    context_data = p_context_data
  RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$;

COMMENT ON FUNCTION public.track_feature_usage IS 'Track feature usage with automatic upsert logic';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.agent_errors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_usage TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.end_stale_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity(UUID, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_feature_usage(UUID, TEXT, TEXT, JSONB) TO authenticated;
