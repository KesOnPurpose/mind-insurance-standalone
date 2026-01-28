-- ============================================================================
-- PHASE 1.2: Create unified_conversation_context Table
-- ============================================================================
-- Purpose: Enable cross-channel memory between chat and voice
-- This table stores summarized conversation context for each user
-- Used by Vapi/voice Nette to know what the user discussed in chat
-- ============================================================================

-- Create unified_conversation_context for cross-channel memory
CREATE TABLE IF NOT EXISTS unified_conversation_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  context_for_voice TEXT DEFAULT '',         -- Summary for voice Nette
  context_for_chat TEXT DEFAULT '',          -- Summary for chat Nette (future use)
  last_chat_summary JSONB,                   -- Recent chat messages summarized
  last_voice_summary JSONB,                  -- Recent voice conversations summarized
  total_chat_messages INTEGER DEFAULT 0,
  total_voice_sessions INTEGER DEFAULT 0,
  last_chat_at TIMESTAMPTZ,
  last_voice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick user lookup
CREATE INDEX IF NOT EXISTS idx_unified_context_user ON unified_conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_context_last_chat ON unified_conversation_context(last_chat_at DESC);

-- Enable RLS
ALTER TABLE unified_conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own unified context
CREATE POLICY "Users can view own unified context"
  ON unified_conversation_context FOR SELECT
  USING (user_id = auth.uid()::text);

-- Service role can manage all (Edge Functions sync context)
CREATE POLICY "Service role can manage unified context"
  ON unified_conversation_context FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- BACKFILL: Generate initial unified context from recent conversations
-- ============================================================================
-- This creates context entries for users with recent conversations

INSERT INTO unified_conversation_context (
  user_id,
  context_for_voice,
  total_chat_messages,
  last_chat_at,
  last_chat_summary
)
SELECT
  user_id,
  -- Build context summary from recent messages
  string_agg(
    '[' || agent_type || '] ' || LEFT(user_message, 80) || ' -> ' || LEFT(agent_response, 80),
    E'\n---\n'
    ORDER BY created_at DESC
  ) as context_for_voice,
  COUNT(*) as total_chat_messages,
  MAX(created_at) as last_chat_at,
  -- Store structured summary as JSONB
  jsonb_build_object(
    'last_synced', now(),
    'message_count', COUNT(*),
    'agent_types', array_agg(DISTINCT agent_type)
  ) as last_chat_summary
FROM (
  SELECT user_id, agent_type, user_message, agent_response, created_at
  FROM agent_conversations
  WHERE created_at > NOW() - INTERVAL '7 days'
    AND user_id IS NOT NULL
  ORDER BY created_at DESC
) recent
GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET
  context_for_voice = EXCLUDED.context_for_voice,
  total_chat_messages = EXCLUDED.total_chat_messages,
  last_chat_at = EXCLUDED.last_chat_at,
  last_chat_summary = EXCLUDED.last_chat_summary,
  updated_at = now();

-- ============================================================================
-- TRIGGER: Auto-update unified_conversation_context on new messages
-- ============================================================================
-- This trigger updates the context whenever a new conversation is added

CREATE OR REPLACE FUNCTION update_unified_context_on_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert unified context for the user
  INSERT INTO unified_conversation_context (
    user_id,
    total_chat_messages,
    last_chat_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    1,
    NEW.created_at,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_chat_messages = unified_conversation_context.total_chat_messages + 1,
    last_chat_at = NEW.created_at,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on agent_conversations
DROP TRIGGER IF EXISTS trg_update_unified_context ON agent_conversations;
CREATE TRIGGER trg_update_unified_context
  AFTER INSERT ON agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_unified_context_on_conversation();

-- Log the migration
DO $$
DECLARE
  rows_affected INTEGER;
BEGIN
  SELECT COUNT(*) INTO rows_affected FROM unified_conversation_context;
  RAISE NOTICE 'unified_conversation_context table created and populated with % rows', rows_affected;
END $$;
