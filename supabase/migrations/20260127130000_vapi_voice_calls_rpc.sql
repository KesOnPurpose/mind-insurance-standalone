-- ============================================================================
-- VAPI-ONLY: Voice calls for chat display
-- Replaces deprecated get_nette_voice_calls_for_chat
-- Part of GHL voice system decommission - going 100% Vapi
-- ============================================================================

-- Drop old function if it exists (safe cleanup)
DROP FUNCTION IF EXISTS get_vapi_voice_calls_for_chat(UUID, TIMESTAMPTZ);

-- Create new Vapi-only RPC function
CREATE OR REPLACE FUNCTION get_vapi_voice_calls_for_chat(
  p_user_id UUID,
  p_since TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  ai_summary TEXT,
  topics_discussed TEXT[],
  call_duration_seconds INTEGER,
  direction TEXT,
  full_transcript TEXT,
  parsed_messages JSONB,
  recording_url TEXT,
  synced_to_chat BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vcl.id,
    vcl.summary AS ai_summary,
    vcl.topics AS topics_discussed,
    vcl.duration_seconds AS call_duration_seconds,
    COALESCE(vcl.direction, 'web') AS direction,
    -- Build full transcript from JSON array if available
    CASE
      WHEN vcl.transcript IS NOT NULL AND vcl.transcript::text != '' AND vcl.transcript::text != 'null' THEN
        (SELECT string_agg(
          COALESCE(elem->>'role', 'unknown') || ': ' || COALESCE(elem->>'text', ''),
          E'\n'
        )
        FROM jsonb_array_elements(vcl.transcript::jsonb) AS elem)
      ELSE NULL
    END AS full_transcript,
    vcl.transcript::jsonb AS parsed_messages,
    vcl.recording_url,
    false AS synced_to_chat,  -- Vapi calls don't use the sync mechanism
    COALESCE(vcl.started_at, vcl.created_at) AS created_at
  FROM public.vapi_call_logs vcl
  WHERE vcl.user_id = p_user_id
    AND vcl.status = 'completed'
    AND (p_since IS NULL OR vcl.created_at > p_since)
  ORDER BY vcl.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_vapi_voice_calls_for_chat(UUID, TIMESTAMPTZ) TO authenticated;

-- Also create a simpler function for recent calls (context building)
DROP FUNCTION IF EXISTS get_recent_vapi_voice_calls(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_recent_vapi_voice_calls(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  call_id UUID,
  vapi_call_id TEXT,
  ai_summary TEXT,
  topics_discussed TEXT[],
  call_duration_seconds INTEGER,
  direction TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vcl.id AS call_id,
    vcl.vapi_call_id,
    vcl.summary AS ai_summary,
    vcl.topics AS topics_discussed,
    vcl.duration_seconds AS call_duration_seconds,
    COALESCE(vcl.direction, 'web') AS direction,
    COALESCE(vcl.started_at, vcl.created_at) AS created_at
  FROM public.vapi_call_logs vcl
  WHERE vcl.user_id = p_user_id
    AND vcl.status = 'completed'
    AND vcl.summary IS NOT NULL
  ORDER BY vcl.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recent_vapi_voice_calls(UUID, INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_vapi_voice_calls_for_chat(UUID, TIMESTAMPTZ) IS
  'Fetches completed Vapi voice calls for display in chat UI. Replaces deprecated get_nette_voice_calls_for_chat.';

COMMENT ON FUNCTION get_recent_vapi_voice_calls(UUID, INTEGER) IS
  'Fetches recent completed Vapi calls with summaries for context building. Replaces deprecated get_recent_nette_voice_calls.';
