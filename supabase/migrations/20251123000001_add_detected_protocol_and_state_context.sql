-- Add detected_protocol and state_context fields for code-level state detection
-- Date: November 23, 2025
-- Purpose: Store protocol name and detection context from code-level state detection

ALTER TABLE agent_conversations
ADD COLUMN IF NOT EXISTS detected_protocol TEXT,
ADD COLUMN IF NOT EXISTS state_context TEXT;

-- Add comments for documentation
COMMENT ON COLUMN agent_conversations.detected_protocol IS 'Protocol name extracted when PROTOCOL_AGREED state detected (e.g., "Virtue Contemplation")';
COMMENT ON COLUMN agent_conversations.state_context IS 'Additional context about state detection (e.g., "User agreed to try protocol", "User needs guidance within protocol")';

-- Create index for querying by detected protocol
CREATE INDEX IF NOT EXISTS idx_agent_conversations_detected_protocol
ON agent_conversations(detected_protocol)
WHERE detected_protocol IS NOT NULL;

-- Example queries enabled by these fields:
-- 1. Find all conversations where users agreed to specific protocol:
--    SELECT * FROM agent_conversations WHERE detected_protocol = 'Virtue Contemplation';
--
-- 2. Track protocol agreement rate:
--    SELECT conversation_state_detected, COUNT(*)
--    FROM agent_conversations
--    WHERE agent_type = 'mio'
--    GROUP BY conversation_state_detected;
--
-- 3. Analyze protocol continuity (how often PROTOCOL_AGREED leads to completion):
--    SELECT detected_protocol, state_context, COUNT(*)
--    FROM agent_conversations
--    WHERE conversation_state_detected = 'PROTOCOL_AGREED'
--    GROUP BY detected_protocol, state_context;
