-- ============================================================================
-- ANALYTICS SEED DATA - REALISTIC TEST DATA
-- ============================================================================
-- Purpose: Seed realistic analytics data for testing Phase 1 dashboard
-- Usage: Run in Supabase SQL Editor to populate agent_conversations table
-- Impact: Creates 1000+ conversation records across 90 days with realistic patterns
-- ============================================================================

-- Clean up existing test data (optional - comment out if you want to preserve existing data)
-- DELETE FROM agent_conversations WHERE user_id IN (
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000002',
--   '00000000-0000-0000-0000-000000000003'
-- );

-- ============================================================================
-- HELPER FUNCTION: Generate random boolean with probability
-- ============================================================================
CREATE OR REPLACE FUNCTION random_boolean(probability FLOAT DEFAULT 0.5)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN random() < probability;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- HELPER FUNCTION: Generate random integer in range
-- ============================================================================
CREATE OR REPLACE FUNCTION random_int(min_val INT, max_val INT)
RETURNS INT AS $$
BEGIN
  RETURN floor(random() * (max_val - min_val + 1) + min_val)::INT;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- HELPER FUNCTION: Generate random float in range
-- ============================================================================
CREATE OR REPLACE FUNCTION random_float(min_val FLOAT, max_val FLOAT)
RETURNS FLOAT AS $$
BEGIN
  RETURN random() * (max_val - min_val) + min_val;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- SEED AGENT CONVERSATIONS - 90 DAYS OF DATA
-- ============================================================================
-- Pattern: More recent data, realistic agent distribution, varied metrics
-- - Nette: 50% of conversations (primary chatbot)
-- - MIO: 30% of conversations (behavioral analysis)
-- - ME: 20% of conversations (multi-agent orchestrator)
-- ============================================================================

DO $$
DECLARE
  base_date TIMESTAMP WITH TIME ZONE;
  conversation_timestamp TIMESTAMP WITH TIME ZONE;
  agent_name TEXT;
  cache_hit BOOLEAN;
  response_time INT;
  rag_used BOOLEAN;
  avg_similarity FLOAT;
  chunks_retrieved INT;
  rag_time INT;
  handoff_suggested BOOLEAN;
  handoff_target TEXT;
  handoff_confidence FLOAT;
  day_offset INT;
  hour_offset INT;
  conversations_per_day INT;
  i INT;
BEGIN
  -- Start 90 days ago
  base_date := NOW() - INTERVAL '90 days';

  -- Generate conversations for each day
  FOR day_offset IN 0..89 LOOP
    -- More conversations in recent days (simulate growth)
    conversations_per_day := random_int(8, 15) + (day_offset / 10);

    FOR i IN 1..conversations_per_day LOOP
      -- Random hour between 6 AM and 11 PM (business hours + evening)
      hour_offset := random_int(6, 23);
      conversation_timestamp := base_date + (day_offset || ' days')::INTERVAL + (hour_offset || ' hours')::INTERVAL + (random_int(0, 59) || ' minutes')::INTERVAL;

      -- Select agent based on realistic distribution
      CASE
        WHEN random() < 0.5 THEN agent_name := 'nette';
        WHEN random() < 0.8 THEN agent_name := 'mio';
        ELSE agent_name := 'me';
      END CASE;

      -- Cache hit patterns: Nette has highest cache hit rate (80%), MIO 60%, ME 40%
      cache_hit := CASE agent_name
        WHEN 'nette' THEN random_boolean(0.80)
        WHEN 'mio' THEN random_boolean(0.60)
        WHEN 'me' THEN random_boolean(0.40)
      END;

      -- Response time: Cache hits are faster
      response_time := CASE
        WHEN cache_hit THEN random_int(50, 200)
        ELSE random_int(300, 1200)
      END;

      -- RAG usage: 70% of non-cached responses use RAG
      rag_used := NOT cache_hit AND random_boolean(0.70);

      -- RAG quality metrics (only if RAG was used)
      IF rag_used THEN
        avg_similarity := random_float(0.65, 0.95);
        chunks_retrieved := random_int(3, 8);
        rag_time := random_int(100, 400);
      ELSE
        avg_similarity := NULL;
        chunks_retrieved := NULL;
        rag_time := NULL;
      END IF;

      -- Handoff suggestions: ME suggests handoffs more often (30%), others rarely (5%)
      handoff_suggested := CASE agent_name
        WHEN 'me' THEN random_boolean(0.30)
        ELSE random_boolean(0.05)
      END;

      -- Handoff details (only if handoff suggested)
      IF handoff_suggested THEN
        -- ME hands off to Nette or MIO based on context
        IF agent_name = 'me' THEN
          handoff_target := CASE WHEN random() < 0.6 THEN 'nette' ELSE 'mio' END;
        -- Nette occasionally hands off to MIO for deeper analysis
        ELSIF agent_name = 'nette' THEN
          handoff_target := 'mio';
        -- MIO rarely hands off (already specialized)
        ELSE
          handoff_target := 'nette';
        END IF;

        handoff_confidence := random_float(0.70, 0.98);
      ELSE
        handoff_target := NULL;
        handoff_confidence := NULL;
      END IF;

      -- Insert conversation record
      INSERT INTO agent_conversations (
        user_id,
        session_id,
        agent_type,
        user_message,
        agent_response,
        cache_hit,
        response_time_ms,
        tokens_used,
        rag_context_used,
        avg_similarity_score,
        max_similarity_score,
        chunks_retrieved,
        rag_time_ms,
        handoff_suggested,
        handoff_target,
        handoff_confidence,
        created_at
      ) VALUES (
        -- Rotate between 3 test users
        ('00000000-0000-0000-0000-00000000000' || (i % 3 + 1))::UUID,
        gen_random_uuid(),
        agent_name,
        'Test user message for analytics seed data',
        'Test agent response for analytics seed data',
        cache_hit,
        response_time,
        random_int(100, 500),
        rag_used,
        avg_similarity,
        CASE WHEN rag_used THEN avg_similarity + random_float(0.01, 0.05) ELSE NULL END,
        chunks_retrieved,
        rag_time,
        handoff_suggested,
        handoff_target,
        handoff_confidence,
        conversation_timestamp
      );
    END LOOP;
  END LOOP;

  -- Print summary
  RAISE NOTICE 'Seed data generation complete!';
  RAISE NOTICE 'Total conversations inserted: %', (SELECT COUNT(*) FROM agent_conversations WHERE user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
  ));
END $$;

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================

-- Check total count by agent
SELECT
  agent_type,
  COUNT(*) as total_conversations,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
GROUP BY agent_type
ORDER BY total_conversations DESC;

-- Check cache hit rates by agent
SELECT
  agent_type,
  COUNT(*) as total,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  ROUND(SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as cache_hit_rate_pct
FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
GROUP BY agent_type
ORDER BY agent_type;

-- Check average response times
SELECT
  agent_type,
  cache_hit,
  COUNT(*) as count,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  MIN(response_time_ms) as min_ms,
  MAX(response_time_ms) as max_ms
FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
GROUP BY agent_type, cache_hit
ORDER BY agent_type, cache_hit;

-- Check RAG quality metrics
SELECT
  agent_type,
  COUNT(*) as rag_queries,
  ROUND(AVG(avg_similarity_score)::NUMERIC, 3) as avg_similarity,
  ROUND(AVG(chunks_retrieved)::NUMERIC, 1) as avg_chunks,
  ROUND(AVG(rag_time_ms)::NUMERIC) as avg_rag_time_ms
FROM agent_conversations
WHERE rag_context_used = true
  AND user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
  )
GROUP BY agent_type
ORDER BY agent_type;

-- Check handoff patterns
SELECT
  agent_type as source_agent,
  handoff_target as target_agent,
  COUNT(*) as handoff_count,
  ROUND(AVG(handoff_confidence)::NUMERIC, 3) as avg_confidence
FROM agent_conversations
WHERE handoff_suggested = true
  AND user_id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
  )
GROUP BY agent_type, handoff_target
ORDER BY agent_type, handoff_count DESC;

-- Check daily conversation volume trend
SELECT
  created_date as day,
  COUNT(*) as conversations
FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
GROUP BY created_date
ORDER BY created_date DESC
LIMIT 30;

-- Verify generated columns are populated
SELECT
  COUNT(*) as total,
  COUNT(created_date) as has_created_date,
  COUNT(created_hour) as has_created_hour,
  COUNT(created_week) as has_created_week
FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- ============================================================================
-- TEST INDEX USAGE WITH SEEDED DATA
-- ============================================================================

-- Test daily volume index
EXPLAIN ANALYZE
SELECT
  created_date as day,
  agent_type,
  COUNT(*) as conversations
FROM agent_conversations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY created_date, agent_type
ORDER BY created_date DESC;

-- Test hourly analytics index
EXPLAIN ANALYZE
SELECT
  created_hour as hour,
  agent_type,
  COUNT(*) as conversations
FROM agent_conversations
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY created_hour, agent_type
ORDER BY created_hour DESC
LIMIT 50;

-- Test cache performance index
EXPLAIN ANALYZE
SELECT
  agent_type,
  cache_hit,
  COUNT(*) as count,
  AVG(response_time_ms) as avg_response_time
FROM agent_conversations
WHERE response_time_ms IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY agent_type, cache_hit
ORDER BY agent_type, cache_hit;

-- ============================================================================
-- CLEANUP HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS random_boolean(FLOAT);
DROP FUNCTION IF EXISTS random_int(INT, INT);
DROP FUNCTION IF EXISTS random_float(FLOAT, FLOAT);

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
-- Expected Results:
-- - ~1000-1200 conversation records across 90 days
-- - Nette: ~50% of conversations (500-600 records)
-- - MIO: ~30% of conversations (300-360 records)
-- - ME: ~20% of conversations (200-240 records)
-- - Cache hit rates: Nette 80%, MIO 60%, ME 40%
-- - RAG usage: ~50% of all conversations
-- - Handoff suggestions: ME 30%, others 5%
-- - Generated columns: All populated automatically
-- - Indexes: Ready for testing with realistic data patterns
-- ============================================================================
