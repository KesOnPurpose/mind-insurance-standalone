-- Phase 11: Claude-Style Chat Sidebar with Conversation History
-- Create conversation_metadata table to track conversation list for sidebar

-- Create the conversation_metadata table
CREATE TABLE IF NOT EXISTS conversation_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  preview_text TEXT,
  coach_type TEXT DEFAULT 'nette',
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment describing the table purpose
COMMENT ON TABLE conversation_metadata IS 'Tracks conversation metadata for chat sidebar (Claude-style conversation history)';

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_conv_meta_user_date
  ON conversation_metadata(user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_meta_archived
  ON conversation_metadata(user_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_conv_meta_conversation
  ON conversation_metadata(conversation_id);

-- Enable RLS
ALTER TABLE conversation_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own conversations
CREATE POLICY "Users can view their own conversations"
  ON conversation_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversation_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversation_metadata
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversation_metadata
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_conversation_metadata_updated_at ON conversation_metadata;
CREATE TRIGGER trigger_update_conversation_metadata_updated_at
  BEFORE UPDATE ON conversation_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_metadata_updated_at();

-- Grant permissions
GRANT ALL ON conversation_metadata TO authenticated;
GRANT ALL ON conversation_metadata TO service_role;
