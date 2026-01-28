-- ============================================================================
-- PHASE 1.1: Create conversation_metadata Table
-- ============================================================================
-- Purpose: Store conversation metadata for the UI sidebar/conversation list
-- This table enables users to see their conversation history in the frontend
-- Links to agent_conversations via conversation_id = session_id
-- ============================================================================

-- Create conversation_metadata table for UI conversation list
CREATE TABLE IF NOT EXISTS conversation_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  coach_type TEXT NOT NULL CHECK (coach_type IN ('nette', 'mio', 'me')),
  title TEXT,
  preview_text TEXT,
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint on conversation_id
  CONSTRAINT unique_conversation_id UNIQUE (conversation_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conv_meta_user ON conversation_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_meta_coach ON conversation_metadata(coach_type);
CREATE INDEX IF NOT EXISTS idx_conv_meta_last_msg ON conversation_metadata(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_meta_user_coach ON conversation_metadata(user_id, coach_type);

-- Enable RLS
ALTER TABLE conversation_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own conversation metadata
CREATE POLICY "Users can view own conversation metadata"
  ON conversation_metadata FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can insert their own conversation metadata
CREATE POLICY "Users can insert own conversation metadata"
  ON conversation_metadata FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own conversation metadata
CREATE POLICY "Users can update own conversation metadata"
  ON conversation_metadata FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Service role bypass for Edge Functions
CREATE POLICY "Service role can manage all conversation metadata"
  ON conversation_metadata FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- BACKFILL: Populate from existing agent_conversations
-- ============================================================================
-- This generates conversation_metadata entries from existing agent_conversations
-- Each unique (session_id, user_id, agent_type) combination becomes a conversation

INSERT INTO conversation_metadata (
  conversation_id,
  user_id,
  coach_type,
  title,
  preview_text,
  message_count,
  last_message_at,
  created_at
)
SELECT
  session_id as conversation_id,
  user_id,
  agent_type as coach_type,
  'Conversation with ' || initcap(agent_type) as title,
  LEFT(MAX(user_message), 100) as preview_text,
  COUNT(*) as message_count,
  MAX(created_at) as last_message_at,
  MIN(created_at) as created_at
FROM agent_conversations
WHERE user_id IS NOT NULL
  AND session_id IS NOT NULL
  AND agent_type IS NOT NULL
GROUP BY session_id, user_id, agent_type
ON CONFLICT (conversation_id) DO UPDATE SET
  message_count = EXCLUDED.message_count,
  preview_text = EXCLUDED.preview_text,
  last_message_at = EXCLUDED.last_message_at,
  updated_at = now();

-- Log the migration
DO $$
DECLARE
  rows_affected INTEGER;
BEGIN
  SELECT COUNT(*) INTO rows_affected FROM conversation_metadata;
  RAISE NOTICE 'conversation_metadata table created and populated with % rows', rows_affected;
END $$;
