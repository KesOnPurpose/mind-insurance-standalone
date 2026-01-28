-- ============================================================================
-- FIX: Safe JSON parsing in get_vapi_voice_calls_for_chat RPC
-- ============================================================================
-- Problem: RPC function crashes with "Token AI is invalid" when transcript
-- is stored as plain text instead of JSON array.
--
-- Root Cause: Lines 42 and 45 use `transcript::jsonb` without checking if
-- the transcript is valid JSON first.
--
-- Solution: Add a helper function to safely check if text is valid JSON,
-- then update RPC to handle both JSON and plain text transcripts.
-- ============================================================================

-- Step 1: Create helper function to safely check if text is valid JSON
CREATE OR REPLACE FUNCTION is_valid_json(p_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_text IS NULL OR p_text = '' OR p_text = 'null' THEN
    RETURN FALSE;
  END IF;

  -- Try to parse as JSON - if it fails, return false
  BEGIN
    PERFORM p_text::jsonb;
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Create helper function to safely check if JSON is an array
CREATE OR REPLACE FUNCTION is_json_array(p_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_valid_json(p_text) THEN
    RETURN FALSE;
  END IF;

  RETURN jsonb_typeof(p_text::jsonb) = 'array';
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Drop and recreate the RPC function with safe JSON handling
DROP FUNCTION IF EXISTS get_vapi_voice_calls_for_chat(UUID, TIMESTAMPTZ);

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

    -- SAFE: Build full transcript - handle both JSON array and plain text
    CASE
      -- Case 1: Valid JSON array - parse and format
      WHEN is_json_array(vcl.transcript::text) THEN
        (SELECT string_agg(
          COALESCE(elem->>'role', 'unknown') || ': ' || COALESCE(elem->>'text', ''),
          E'\n'
        )
        FROM jsonb_array_elements(vcl.transcript::jsonb) AS elem)

      -- Case 2: Non-null plain text - return as-is
      WHEN vcl.transcript IS NOT NULL AND vcl.transcript::text != '' AND vcl.transcript::text != 'null' THEN
        vcl.transcript::text

      -- Case 3: Null or empty - return NULL
      ELSE NULL
    END AS full_transcript,

    -- SAFE: Return parsed_messages only if valid JSON array
    CASE
      WHEN is_json_array(vcl.transcript::text) THEN
        vcl.transcript::jsonb
      ELSE NULL
    END AS parsed_messages,

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

-- Step 4: Add helpful comment
COMMENT ON FUNCTION get_vapi_voice_calls_for_chat(UUID, TIMESTAMPTZ) IS
  'Fetches completed Vapi voice calls for display in chat UI. Safely handles both JSON array and plain text transcript formats.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test helper functions work correctly

  -- Test 1: Valid JSON array should return TRUE
  SELECT is_json_array('[{"role": "assistant", "text": "Hello"}]') INTO test_result;
  IF NOT test_result THEN
    RAISE EXCEPTION 'Test failed: Valid JSON array should return TRUE';
  END IF;

  -- Test 2: Plain text should return FALSE
  SELECT is_json_array('AI: Hello there') INTO test_result;
  IF test_result THEN
    RAISE EXCEPTION 'Test failed: Plain text should return FALSE';
  END IF;

  -- Test 3: NULL should return FALSE
  SELECT is_json_array(NULL) INTO test_result;
  IF test_result THEN
    RAISE EXCEPTION 'Test failed: NULL should return FALSE';
  END IF;

  -- Test 4: Empty string should return FALSE
  SELECT is_json_array('') INTO test_result;
  IF test_result THEN
    RAISE EXCEPTION 'Test failed: Empty string should return FALSE';
  END IF;

  RAISE NOTICE '✅ All helper function tests passed';
  RAISE NOTICE '✅ RPC function updated with safe JSON handling';
END $$;
