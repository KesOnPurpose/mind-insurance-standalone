-- ============================================================================
-- UNIFIED CONVERSATION CONTEXT
-- ============================================================================
-- Purpose: Enable seamless conversation continuity between Voice Nette (Vapi)
-- and Text Nette (mio-chat). Users feel they're talking to ONE unified expert
-- who remembers everything across both voice and chat channels.
--
-- Created: 2025-01-27
-- Part of: Unified Conversation Memory Architecture (Part 2)
-- ============================================================================

-- ============================================================================
-- TABLE: unified_conversation_context
-- ============================================================================
-- Stores rolling conversation summaries and pre-formatted context strings
-- for injection into both voice (Vapi variableValues) and chat (system prompt)

CREATE TABLE IF NOT EXISTS public.unified_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rolling conversation summary (updated after each interaction)
  -- AI-generated summary of recent conversations across both channels
  conversation_summary TEXT,

  -- Key topics from both channels (merged and deduplicated)
  -- Topics from GROUPHOME_TOPICS: licensing, permits, zoning, regulations, etc.
  key_topics TEXT[] DEFAULT '{}',

  -- ==========================================================================
  -- Voice-specific context
  -- ==========================================================================

  -- Reference to the most recent voice call
  last_voice_call_id UUID REFERENCES vapi_call_logs(id) ON DELETE SET NULL,

  -- Summary from the most recent voice call (for injection into chat)
  last_voice_summary TEXT,

  -- Topics discussed in recent voice calls
  last_voice_topics TEXT[] DEFAULT '{}',

  -- Total count of voice calls (for context)
  voice_call_count INTEGER DEFAULT 0,

  -- ==========================================================================
  -- Chat-specific context
  -- ==========================================================================

  -- Session ID of the most recent chat session
  last_chat_session_id UUID,

  -- Preview of the last chat exchange (for injection into voice)
  last_chat_preview TEXT,

  -- Topics discussed in recent chats
  last_chat_topics TEXT[] DEFAULT '{}',

  -- Total count of chat messages (for context)
  chat_message_count INTEGER DEFAULT 0,

  -- ==========================================================================
  -- Pre-formatted context strings for injection
  -- ==========================================================================

  -- Formatted string ready for Vapi variableValues.recentChats
  -- Contains recent chat summaries in a voice-friendly format
  context_for_voice TEXT,

  -- Formatted string ready for mio-chat system prompt
  -- Contains recent voice call summaries in a chat-friendly format
  context_for_chat TEXT,

  -- ==========================================================================
  -- Timestamps
  -- ==========================================================================

  -- When the user last made a voice call
  last_voice_at TIMESTAMPTZ,

  -- When the user last sent a chat message
  last_chat_at TIMESTAMPTZ,

  -- When this context was last updated
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- When this record was created
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Each user has exactly one unified context record
  UNIQUE(user_id)
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_unified_context_user_id
  ON unified_conversation_context(user_id);

-- Index for finding recently updated contexts (for debugging/analytics)
CREATE INDEX IF NOT EXISTS idx_unified_context_updated_at
  ON unified_conversation_context(updated_at DESC);

-- Comments for documentation
COMMENT ON TABLE unified_conversation_context IS
  'Unified conversation memory for cross-channel continuity between Voice Nette and Text Nette';

COMMENT ON COLUMN unified_conversation_context.conversation_summary IS
  'AI-generated rolling summary of recent conversations across voice and chat';

COMMENT ON COLUMN unified_conversation_context.context_for_voice IS
  'Pre-formatted string for Vapi variableValues.recentChats - contains chat history for voice';

COMMENT ON COLUMN unified_conversation_context.context_for_chat IS
  'Pre-formatted string for mio-chat system prompt - contains voice history for chat';

-- ============================================================================
-- TABLE: conversation_sync_log
-- ============================================================================
-- Audit log for context synchronization events. Helps with debugging and
-- ensures we can track when sync operations succeed or fail.

CREATE TABLE IF NOT EXISTS public.conversation_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What triggered the sync
  source_type TEXT NOT NULL CHECK (source_type IN ('voice_call', 'chat_message')),

  -- ID of the source record (vapi_call_logs.id or agent_conversations.id)
  source_id UUID NOT NULL,

  -- Summary generated during this sync (if any)
  summary_generated TEXT,

  -- Topics extracted during this sync
  topics_extracted TEXT[] DEFAULT '{}',

  -- Whether the unified context was successfully updated
  context_updated BOOLEAN DEFAULT false,

  -- Any error message if sync failed
  error_message TEXT,

  -- When this sync was processed
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- Index for finding sync logs by user
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id
  ON conversation_sync_log(user_id);

-- Index for finding sync logs by source
CREATE INDEX IF NOT EXISTS idx_sync_log_source
  ON conversation_sync_log(source_type, source_id);

-- Index for recent sync operations
CREATE INDEX IF NOT EXISTS idx_sync_log_processed_at
  ON conversation_sync_log(processed_at DESC);

-- Comment for documentation
COMMENT ON TABLE conversation_sync_log IS
  'Audit log for conversation context synchronization between voice and chat channels';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on unified_conversation_context
ALTER TABLE unified_conversation_context ENABLE ROW LEVEL SECURITY;

-- Users can only read their own context
CREATE POLICY "Users can read own unified context"
  ON unified_conversation_context
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access to unified context"
  ON unified_conversation_context
  FOR ALL
  USING (auth.role() = 'service_role');

-- Enable RLS on conversation_sync_log
ALTER TABLE conversation_sync_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own sync logs (for debugging)
CREATE POLICY "Users can read own sync logs"
  ON conversation_sync_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access to sync logs"
  ON conversation_sync_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTION: Update timestamps automatically
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_unified_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_unified_context_timestamp ON unified_conversation_context;
CREATE TRIGGER trigger_update_unified_context_timestamp
  BEFORE UPDATE ON unified_conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_context_timestamp();

-- ============================================================================
-- END MIGRATION
-- ============================================================================
