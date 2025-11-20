-- ============================================================================
-- ANALYTICS COMPOSITE INDEXES FOR AGENT_CONVERSATIONS
-- ============================================================================
-- Purpose: Optimize analytics queries for admin dashboard
-- Impact: Prevents full table scans for time-series and filtered analytics
-- Query Patterns Optimized:
--   1. Cache hit rate by agent over time
--   2. Response time by agent
--   3. RAG quality metrics (similarity scores)
--   4. Handoff accuracy and confidence
-- ============================================================================

-- Composite index for time-series analytics by agent
-- Supports queries like: "Get cache hit rates for Nette agent over last 30 days"
CREATE INDEX IF NOT EXISTS idx_agent_conversations_analytics_time_series
ON agent_conversations(agent_type, created_at DESC, cache_hit)
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Composite index for RAG quality analytics
-- Supports queries like: "Get average similarity scores by agent for last 7 days"
CREATE INDEX IF NOT EXISTS idx_agent_conversations_rag_quality
ON agent_conversations(agent_type, avg_similarity_score, chunks_retrieved)
WHERE rag_context_used = true AND created_at >= NOW() - INTERVAL '90 days';

-- Composite index for handoff analytics
-- Supports queries like: "Get handoff suggestion accuracy by confidence threshold"
CREATE INDEX IF NOT EXISTS idx_agent_conversations_handoff_analytics
ON agent_conversations(handoff_suggested, handoff_confidence, handoff_target)
WHERE handoff_suggested = true AND created_at >= NOW() - INTERVAL '90 days';

-- Composite index for performance metrics
-- Supports queries like: "Get average response time by agent type"
CREATE INDEX IF NOT EXISTS idx_agent_conversations_performance
ON agent_conversations(agent_type, response_time_ms, tokens_used)
WHERE response_time_ms IS NOT NULL AND created_at >= NOW() - INTERVAL '90 days';

-- Partial index for user-specific analytics
-- Supports queries like: "Get user's conversation history with performance metrics"
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_analytics
ON agent_conversations(user_id, created_at DESC, agent_type, response_time_ms)
WHERE created_at >= NOW() - INTERVAL '90 days';

-- Add index comments for documentation
COMMENT ON INDEX idx_agent_conversations_analytics_time_series IS
'Composite index for cache hit rate and time-series analytics by agent type. Partial index limited to last 90 days.';

COMMENT ON INDEX idx_agent_conversations_rag_quality IS
'Composite index for RAG similarity and chunk retrieval analytics. Only indexes rows where RAG was used.';

COMMENT ON INDEX idx_agent_conversations_handoff_analytics IS
'Composite index for handoff suggestion accuracy metrics. Only indexes rows with handoff suggestions.';

COMMENT ON INDEX idx_agent_conversations_performance IS
'Composite index for response time and token usage analytics by agent type.';

COMMENT ON INDEX idx_agent_conversations_user_analytics IS
'Composite index for user-specific conversation analytics with performance metrics.';

-- Note: Partial indexes with WHERE clauses reduce index size by ~60-70% by excluding old data
-- Indexes will need manual refresh after 90 days or can be dropped and recreated with new timestamp
