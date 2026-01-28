-- =====================================================
-- Nette AI Voice ↔ Text Context Synchronization
-- Date: January 19, 2026
-- Purpose: Create voice call logs table with AI summary, topics,
--          and sync tracking for bidirectional voice/text context
-- =====================================================

-- =====================================================
-- PART 1: Create nette_voice_call_logs Table
-- Stores GHL Voice AI call transcripts and context
-- =====================================================

CREATE TABLE IF NOT EXISTS nette_voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- GHL identifiers
  ghl_call_id TEXT NOT NULL UNIQUE,
  ghl_contact_id TEXT,
  phone TEXT,

  -- Call metadata
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound_proactive', 'outbound_widget')),
  call_duration_seconds INTEGER,
  call_status TEXT CHECK (call_status IN ('completed', 'missed', 'voicemail', 'failed', 'in_progress')),

  -- Transcript data (from GHL webhook post-call)
  full_transcript TEXT,
  parsed_messages JSONB, -- [{role: 'user'|'nette', content: '...', timestamp: '...'}]

  -- AI Summary and Topics (Option D Hybrid Sync)
  ai_summary TEXT,
  topics_discussed TEXT[],

  -- Context snapshot (what Nette knew during the call)
  context_snapshot JSONB,

  -- Recording
  recording_url TEXT,

  -- Trigger info (why the call was made)
  trigger_type TEXT CHECK (trigger_type IN (
    'reactive_widget',      -- User initiated via in-app widget
    'proactive_missed',     -- Nette calling because user missed days
    'proactive_milestone',  -- Nette calling for milestone celebration
    'proactive_checkin',    -- General check-in call
    'proactive_onboarding'  -- Onboarding follow-up call
  )),

  -- Behavioral analysis from the call
  detected_sentiment TEXT,
  escalation_triggered BOOLEAN DEFAULT false,
  escalation_reason TEXT,

  -- Sync tracking for text chat integration
  synced_to_chat BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  chat_message_id TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 2: Indexes for Efficient Querying
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_nvcl_user_id ON nette_voice_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nvcl_phone ON nette_voice_call_logs(phone);
CREATE INDEX IF NOT EXISTS idx_nvcl_started ON nette_voice_call_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_nvcl_ghl_call ON nette_voice_call_logs(ghl_call_id);
CREATE INDEX IF NOT EXISTS idx_nvcl_trigger ON nette_voice_call_logs(trigger_type);
CREATE INDEX IF NOT EXISTS idx_nvcl_sync_status ON nette_voice_call_logs(synced_to_chat) WHERE synced_to_chat = FALSE;
CREATE INDEX IF NOT EXISTS idx_nvcl_topics ON nette_voice_call_logs USING gin(topics_discussed);
CREATE INDEX IF NOT EXISTS idx_nvcl_created ON nette_voice_call_logs(created_at DESC);

-- =====================================================
-- PART 3: Updated_at Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_nette_voice_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_nette_voice_call_logs_updated_at ON nette_voice_call_logs;
CREATE TRIGGER trigger_nette_voice_call_logs_updated_at
  BEFORE UPDATE ON nette_voice_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_nette_voice_call_logs_updated_at();

-- =====================================================
-- PART 4: RLS Policies
-- =====================================================

ALTER TABLE nette_voice_call_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own voice call logs
CREATE POLICY "Users can view own voice call logs"
  ON nette_voice_call_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions and N8n)
CREATE POLICY "Service role full access to voice call logs"
  ON nette_voice_call_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- PART 5: Helper Functions
-- =====================================================

-- Function: Get recent voice calls for text chat context
CREATE OR REPLACE FUNCTION get_recent_nette_voice_calls(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  call_id UUID,
  ghl_call_id TEXT,
  ai_summary TEXT,
  topics_discussed TEXT[],
  call_duration_seconds INTEGER,
  direction TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nvcl.id AS call_id,
    nvcl.ghl_call_id,
    nvcl.ai_summary,
    nvcl.topics_discussed,
    nvcl.call_duration_seconds,
    nvcl.direction,
    nvcl.created_at
  FROM nette_voice_call_logs nvcl
  WHERE nvcl.user_id = p_user_id
    AND nvcl.call_status = 'completed'
    AND nvcl.full_transcript IS NOT NULL
  ORDER BY nvcl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get voice calls for chat display
CREATE OR REPLACE FUNCTION get_nette_voice_calls_for_chat(
  p_user_id UUID,
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  ai_summary TEXT,
  topics_discussed TEXT[],
  call_duration_seconds INTEGER,
  direction TEXT,
  full_transcript TEXT,
  parsed_messages JSONB,
  recording_url TEXT,
  synced_to_chat BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nvcl.id,
    nvcl.ai_summary,
    nvcl.topics_discussed,
    nvcl.call_duration_seconds,
    nvcl.direction,
    nvcl.full_transcript,
    nvcl.parsed_messages,
    nvcl.recording_url,
    nvcl.synced_to_chat,
    nvcl.created_at
  FROM nette_voice_call_logs nvcl
  WHERE nvcl.user_id = p_user_id
    AND nvcl.call_status = 'completed'
    AND (p_since IS NULL OR nvcl.created_at > p_since)
  ORDER BY nvcl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark voice call as synced to chat
CREATE OR REPLACE FUNCTION mark_nette_voice_call_synced(
  p_call_id UUID,
  p_chat_message_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE nette_voice_call_logs
  SET
    synced_to_chat = TRUE,
    synced_at = NOW(),
    chat_message_id = COALESCE(p_chat_message_id, chat_message_id),
    updated_at = NOW()
  WHERE id = p_call_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user by phone (for GHL Voice webhook)
CREATE OR REPLACE FUNCTION get_user_by_phone_for_voice(p_phone TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  ghl_contact_id TEXT,
  timezone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id AS user_id,
    up.email,
    up.full_name,
    up.ghl_contact_id,
    up.timezone
  FROM user_profiles up
  WHERE up.phone = p_phone
  LIMIT 1;

  -- If not found in user_profiles.phone, try gh_approved_users
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      up.id AS user_id,
      up.email,
      up.full_name,
      up.ghl_contact_id,
      up.timezone
    FROM gh_approved_users gau
    JOIN user_profiles up ON up.id = gau.user_id
    WHERE gau.phone = p_phone
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 6: Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_recent_nette_voice_calls(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_nette_voice_calls(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_nette_voice_calls_for_chat(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nette_voice_calls_for_chat(UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION mark_nette_voice_call_synced(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_nette_voice_call_synced(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_by_phone_for_voice(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_phone_for_voice(TEXT) TO service_role;

-- =====================================================
-- PART 7: Verification
-- =====================================================

DO $$
BEGIN
  -- Verify table was created
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'nette_voice_call_logs'
  ) THEN
    RAISE EXCEPTION 'nette_voice_call_logs table not created';
  END IF;

  -- Verify key columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nette_voice_call_logs' AND column_name = 'ai_summary'
  ) THEN
    RAISE EXCEPTION 'ai_summary column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'nette_voice_call_logs' AND column_name = 'synced_to_chat'
  ) THEN
    RAISE EXCEPTION 'synced_to_chat column not created';
  END IF;

  RAISE NOTICE 'Nette Voice Call Sync migration completed successfully';
END $$;
