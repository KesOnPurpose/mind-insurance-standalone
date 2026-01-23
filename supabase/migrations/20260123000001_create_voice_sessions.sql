-- ============================================================================
-- VOICE SESSIONS TABLE
-- Enables session matching for GHL Voice AI web widget calls
--
-- Problem: GHL Voice AI widget creates Guest Visitor contacts for each call
-- Solution: Create session before call, Voice AI looks up session to identify user
-- ============================================================================

-- Create voice_sessions table
CREATE TABLE IF NOT EXISTS voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  ghl_contact_id TEXT,

  -- Session context (passed to Voice AI)
  context JSONB DEFAULT '{}',
  greeting_hint TEXT,

  -- Session lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,  -- Set when Voice AI successfully looks up this session
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),

  -- Call tracking
  call_started_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'expired', 'completed'))
);

-- Index for fast lookups by creation time (Voice AI needs to find recent sessions)
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created ON voice_sessions(created_at DESC);

-- Index for finding unmatched sessions quickly
CREATE INDEX IF NOT EXISTS idx_voice_sessions_pending ON voice_sessions(status, created_at DESC)
  WHERE status = 'pending';

-- Index for user's sessions
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id, created_at DESC);

-- Index for phone lookup
CREATE INDEX IF NOT EXISTS idx_voice_sessions_phone ON voice_sessions(phone);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own voice sessions"
  ON voice_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create voice sessions"
  ON voice_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own voice sessions"
  ON voice_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for N8n webhook)
-- This is handled automatically by Supabase service role

-- ============================================================================
-- AUTO-CLEANUP FUNCTION
-- Automatically expire old sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_voice_sessions()
RETURNS void AS $$
BEGIN
  UPDATE voice_sessions
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE voice_sessions IS 'Tracks voice call sessions for GHL Voice AI web widget caller identification';
COMMENT ON COLUMN voice_sessions.phone IS 'User phone number - used by Voice AI to look up contact';
COMMENT ON COLUMN voice_sessions.ghl_contact_id IS 'GoHighLevel contact ID for the user';
COMMENT ON COLUMN voice_sessions.context IS 'Full voice context payload (journey, assessment, etc.)';
COMMENT ON COLUMN voice_sessions.greeting_hint IS 'Personalized greeting e.g., "Hi Keston!"';
COMMENT ON COLUMN voice_sessions.matched_at IS 'Timestamp when Voice AI successfully matched this session';
COMMENT ON COLUMN voice_sessions.status IS 'Session lifecycle: pending -> matched -> completed, or pending -> expired';
