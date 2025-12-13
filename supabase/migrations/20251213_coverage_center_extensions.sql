-- ============================================================================
-- COVERAGE CENTER EXTENSIONS
-- ============================================================================
-- Adds columns and tables needed for Coverage Center features:
-- - First Protocol Generation workflow support
-- - Day Completion Response workflow support
-- - Protocol-aware MIO Insights messages
-- ============================================================================

-- ============================================================================
-- EXTEND mio_weekly_protocols TABLE
-- ============================================================================

-- Add new columns for Coverage Center
DO $$
BEGIN
  -- Pattern targeted (e.g., 'achiever_burnout')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'pattern_targeted'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN pattern_targeted VARCHAR(100);
  END IF;

  -- Description (human-readable pattern name)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'description'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN description TEXT;
  END IF;

  -- MIO intro message (shown in First Session)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'mio_intro'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN mio_intro TEXT;
  END IF;

  -- Total days (usually 7, but flexible)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'total_days'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN total_days INTEGER DEFAULT 7;
  END IF;

  -- Skip token earned flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'skip_token_earned'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN skip_token_earned BOOLEAN DEFAULT FALSE;
  END IF;

  -- Skip token earned timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'skip_token_earned_at'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN skip_token_earned_at TIMESTAMPTZ;
  END IF;

  -- Paused by coach protocol ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_weekly_protocols' AND column_name = 'paused_by_coach_protocol_id'
  ) THEN
    ALTER TABLE mio_weekly_protocols
    ADD COLUMN paused_by_coach_protocol_id UUID;
  END IF;
END $$;

-- Update source check constraint to include 'onboarding_completion'
DO $$
BEGIN
  -- Drop and recreate constraint with new value
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'mio_weekly_protocols' AND constraint_name = 'mio_weekly_protocols_source_check'
  ) THEN
    ALTER TABLE mio_weekly_protocols DROP CONSTRAINT mio_weekly_protocols_source_check;
  END IF;

  ALTER TABLE mio_weekly_protocols
  ADD CONSTRAINT mio_weekly_protocols_source_check
  CHECK (source IN ('n8n_weekly', 'manual_assignment', 'assessment', 'chat_recommendation', 'onboarding_completion'));
END $$;

-- Update status check constraint to include 'paused'
DO $$
BEGIN
  -- Drop and recreate constraint with new value
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'mio_weekly_protocols' AND constraint_name = 'mio_weekly_protocols_status_check'
  ) THEN
    ALTER TABLE mio_weekly_protocols DROP CONSTRAINT mio_weekly_protocols_status_check;
  END IF;

  ALTER TABLE mio_weekly_protocols
  ADD CONSTRAINT mio_weekly_protocols_status_check
  CHECK (status IN ('active', 'completed', 'skipped', 'muted', 'expired', 'paused'));
END $$;

-- ============================================================================
-- EXTEND mio_insights_messages TABLE
-- ============================================================================

DO $$
BEGIN
  -- Protocol ID reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_insights_messages' AND column_name = 'protocol_id'
  ) THEN
    ALTER TABLE mio_insights_messages
    ADD COLUMN protocol_id UUID REFERENCES mio_weekly_protocols(id);
  END IF;

  -- Day number (for protocol day completion messages)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_insights_messages' AND column_name = 'day_number'
  ) THEN
    ALTER TABLE mio_insights_messages
    ADD COLUMN day_number INTEGER;
  END IF;

  -- Message type (day_completion_response, breakthrough, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_insights_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE mio_insights_messages
    ADD COLUMN message_type VARCHAR(50);
  END IF;

  -- Metadata (for storing key_insight, neural_connection, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_insights_messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE mio_insights_messages
    ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;

  -- Is read flag (simpler than read_at for quick queries)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mio_insights_messages' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE mio_insights_messages
    ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update section_type check constraint to include 'day_completion'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'mio_insights_messages' AND constraint_name = 'mio_insights_messages_section_type_check'
  ) THEN
    ALTER TABLE mio_insights_messages DROP CONSTRAINT mio_insights_messages_section_type_check;
  END IF;

  ALTER TABLE mio_insights_messages
  ADD CONSTRAINT mio_insights_messages_section_type_check
  CHECK (section_type IN ('PRO', 'TE', 'CT', 'reengagement', 'protocol', 'breakthrough', 'day_completion', NULL));
END $$;

-- Index for protocol-related messages
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_protocol
  ON mio_insights_messages(protocol_id) WHERE protocol_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_day_completion
  ON mio_insights_messages(user_id, protocol_id, day_number)
  WHERE message_type = 'day_completion_response';

-- ============================================================================
-- UPDATE get_active_mio_protocol FUNCTION
-- ============================================================================
-- Include new columns in the return

DROP FUNCTION IF EXISTS get_active_mio_protocol(UUID);

CREATE OR REPLACE FUNCTION get_active_mio_protocol(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  pattern_targeted VARCHAR,
  description TEXT,
  mio_intro TEXT,
  insight_summary TEXT,
  why_it_matters TEXT,
  neural_principle TEXT,
  current_day INTEGER,
  total_days INTEGER,
  days_completed INTEGER,
  day_tasks JSONB,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  skip_token_earned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.pattern_targeted,
    p.description,
    p.mio_intro,
    p.insight_summary,
    p.why_it_matters,
    p.neural_principle,
    p.current_day,
    p.total_days,
    p.days_completed,
    p.day_tasks,
    p.started_at,
    p.created_at,
    p.skip_token_earned
  FROM mio_weekly_protocols p
  WHERE p.user_id = p_user_id
    AND p.status = 'active'
    AND p.muted_by_coach = false
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_mio_protocol TO authenticated;

-- ============================================================================
-- HELPER FUNCTION: Get Protocol Day Completion Messages
-- ============================================================================

CREATE OR REPLACE FUNCTION get_protocol_day_messages(
  p_user_id UUID,
  p_protocol_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  protocol_id UUID,
  day_number INTEGER,
  content TEXT,
  metadata JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.protocol_id,
    m.day_number,
    m.content,
    m.metadata,
    m.is_read,
    m.created_at
  FROM mio_insights_messages m
  WHERE m.user_id = p_user_id
    AND m.message_type = 'day_completion_response'
    AND (p_protocol_id IS NULL OR m.protocol_id = p_protocol_id)
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_protocol_day_messages TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN mio_weekly_protocols.pattern_targeted IS 'Identity collision pattern this protocol addresses (e.g., achiever_burnout)';
COMMENT ON COLUMN mio_weekly_protocols.description IS 'Human-readable pattern name (e.g., The Achiever''s Burnout Cycle)';
COMMENT ON COLUMN mio_weekly_protocols.mio_intro IS 'MIO introductory message shown in First Session';
COMMENT ON COLUMN mio_weekly_protocols.total_days IS 'Total days in protocol (usually 7)';
COMMENT ON COLUMN mio_weekly_protocols.skip_token_earned IS 'Whether user earned a Skip Token for completing this protocol';
COMMENT ON COLUMN mio_weekly_protocols.skip_token_earned_at IS 'When the Skip Token was earned';

COMMENT ON COLUMN mio_insights_messages.protocol_id IS 'Links message to MIO protocol (for day completion responses)';
COMMENT ON COLUMN mio_insights_messages.day_number IS 'Protocol day number (1-7) for day completion messages';
COMMENT ON COLUMN mio_insights_messages.message_type IS 'Type of message (day_completion_response, breakthrough, etc.)';
COMMENT ON COLUMN mio_insights_messages.metadata IS 'Additional data (key_insight, neural_connection, streak_celebration)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Coverage Center extensions migration completed!';
  RAISE NOTICE 'Added columns to mio_weekly_protocols: pattern_targeted, description, mio_intro, total_days, skip_token_earned, skip_token_earned_at';
  RAISE NOTICE 'Added columns to mio_insights_messages: protocol_id, day_number, message_type, metadata, is_read';
  RAISE NOTICE 'Updated get_active_mio_protocol function with new columns';
  RAISE NOTICE 'Created get_protocol_day_messages helper function';
END $$;
