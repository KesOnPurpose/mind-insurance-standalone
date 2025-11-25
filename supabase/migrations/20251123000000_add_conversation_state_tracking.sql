-- Add conversation state tracking fields for MIO Fusion Model
-- Date: November 23, 2025
-- Purpose: Track conversation states (ANSWERED/STUCK/BREAKTHROUGH/CRISIS) and status (active/resolved/escalate)

ALTER TABLE agent_conversations
ADD COLUMN IF NOT EXISTS conversation_status TEXT CHECK (conversation_status IN ('active', 'resolved', 'escalate')),
ADD COLUMN IF NOT EXISTS conversation_state_detected TEXT CHECK (conversation_state_detected IN ('ANSWERED', 'STUCK', 'BREAKTHROUGH', 'CRISIS'));

-- Add comments for documentation
COMMENT ON COLUMN agent_conversations.conversation_status IS 'Overall conversation status: active (ongoing), resolved (complete), escalate (needs human intervention)';
COMMENT ON COLUMN agent_conversations.conversation_state_detected IS 'Detected conversation state: ANSWERED (user gave specifics), STUCK (vague/confused), BREAKTHROUGH (insight/momentum), CRISIS (dropout risk)';

-- Create index for querying by conversation state
CREATE INDEX IF NOT EXISTS idx_agent_conversations_state ON agent_conversations(conversation_state_detected) WHERE conversation_state_detected IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_conversations_status ON agent_conversations(conversation_status) WHERE conversation_status IS NOT NULL;
