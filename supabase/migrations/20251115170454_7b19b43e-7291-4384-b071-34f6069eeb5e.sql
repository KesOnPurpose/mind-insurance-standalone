-- Add RAG and performance tracking columns to agent_conversations table
ALTER TABLE agent_conversations
ADD COLUMN IF NOT EXISTS rag_context_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS chunks_retrieved integer,
ADD COLUMN IF NOT EXISTS avg_similarity_score decimal(5,4),
ADD COLUMN IF NOT EXISTS max_similarity_score decimal(5,4),
ADD COLUMN IF NOT EXISTS rag_time_ms integer,
ADD COLUMN IF NOT EXISTS cache_hit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS handoff_suggested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS handoff_target text,
ADD COLUMN IF NOT EXISTS handoff_confidence decimal(5,4);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_agent_conversations_created_at 
ON agent_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_type 
ON agent_conversations(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_cache_hit 
ON agent_conversations(cache_hit);

-- Add comments for documentation
COMMENT ON COLUMN agent_conversations.rag_context_used IS 'Whether RAG context was included in the prompt';
COMMENT ON COLUMN agent_conversations.chunks_retrieved IS 'Number of knowledge chunks retrieved from RAG';
COMMENT ON COLUMN agent_conversations.avg_similarity_score IS 'Average cosine similarity of retrieved chunks';
COMMENT ON COLUMN agent_conversations.cache_hit IS 'Whether response was served from cache';
COMMENT ON COLUMN agent_conversations.handoff_suggested IS 'Whether a handoff to another agent was suggested';
COMMENT ON COLUMN agent_conversations.handoff_target IS 'Target agent for handoff (nette/mio/me)';
COMMENT ON COLUMN agent_conversations.handoff_confidence IS 'Confidence score for handoff suggestion';
COMMENT ON COLUMN agent_conversations.rag_time_ms IS 'Time taken for RAG search in milliseconds';