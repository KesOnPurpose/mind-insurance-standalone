-- ============================================================================
-- ANALYTICS SYNC FUNCTION
-- ============================================================================
-- Syncs chat data from nette_chat_histories, me_chat_histories, and
-- mio_conversations into the agent_conversations table for unified analytics.
--
-- Usage:
--   SELECT sync_chat_to_analytics();  -- Sync last 24 hours
--   SELECT sync_chat_to_analytics(true);  -- Full sync (all records)
--   SELECT sync_chat_to_analytics(false, 168);  -- Sync last 7 days
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_chat_to_analytics(
  p_full_sync BOOLEAN DEFAULT false,
  p_since_hours INTEGER DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nette_count INTEGER := 0;
  v_mio_count INTEGER := 0;
  v_me_count INTEGER := 0;
  v_time_filter TIMESTAMP WITH TIME ZONE;
  v_session_uuid UUID;
  v_user_uuid UUID;
  v_record RECORD;
BEGIN
  -- Calculate time filter
  IF p_full_sync THEN
    v_time_filter := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  ELSE
    v_time_filter := NOW() - (p_since_hours || ' hours')::INTERVAL;
  END IF;

  -- ============================================================================
  -- SYNC NETTE CHAT HISTORIES
  -- ============================================================================
  -- nette_chat_histories has: id, session_id, message (JSONB), created_at
  -- session_id format: "nette:user-uuid" or "nette:uuid"
  -- message.type can be "human" or "ai"
  -- We create one agent_conversations record per message pair (human + ai)

  FOR v_record IN
    SELECT
      n.id,
      n.session_id,
      n.message,
      n.created_at,
      LEAD(n.message) OVER (PARTITION BY n.session_id ORDER BY n.created_at) as next_message,
      LEAD(n.created_at) OVER (PARTITION BY n.session_id ORDER BY n.created_at) as next_created_at,
      ROW_NUMBER() OVER (PARTITION BY n.session_id ORDER BY n.created_at) as turn_number
    FROM nette_chat_histories n
    WHERE n.created_at >= v_time_filter
  LOOP
    -- Only process human messages that have an AI response following
    IF v_record.message->>'type' = 'human' AND v_record.next_message->>'type' = 'ai' THEN
      -- Extract user UUID from session_id (format: "nette:uuid")
      BEGIN
        v_user_uuid := (SPLIT_PART(v_record.session_id, ':', 2))::UUID;
      EXCEPTION WHEN OTHERS THEN
        -- If not a valid UUID, generate a deterministic one from session_id
        v_user_uuid := uuid_generate_v5(uuid_nil(), v_record.session_id);
      END;

      -- Generate a unique ID for this conversation turn
      v_session_uuid := uuid_generate_v5(uuid_nil(), v_record.session_id || v_record.created_at::TEXT);

      -- Calculate response time (time between human message and AI response)
      DECLARE
        v_response_time_ms INTEGER;
      BEGIN
        v_response_time_ms := EXTRACT(MILLISECONDS FROM (v_record.next_created_at - v_record.created_at))::INTEGER;
        -- Cap at reasonable max (30 seconds)
        IF v_response_time_ms > 30000 THEN
          v_response_time_ms := 30000;
        END IF;
        IF v_response_time_ms < 0 THEN
          v_response_time_ms := 500; -- Default if timing is off
        END IF;
      END;

      -- Upsert into agent_conversations
      INSERT INTO agent_conversations (
        id,
        user_id,
        agent_type,
        user_message,
        agent_response,
        session_id,
        conversation_turn,
        created_at,
        response_time_ms,
        cache_hit,
        is_handoff,
        handoff_suggested,
        rag_context_used
      ) VALUES (
        v_session_uuid,
        v_user_uuid,
        'nette',
        COALESCE(v_record.message->>'content', ''),
        COALESCE(v_record.next_message->>'content', ''),
        v_record.session_id,
        (v_record.turn_number + 1) / 2,  -- Convert to conversation turn number
        v_record.created_at,
        v_response_time_ms,
        false,  -- Default cache_hit to false (we don't have this data)
        false,
        false,
        false
      )
      ON CONFLICT (id) DO UPDATE SET
        user_message = EXCLUDED.user_message,
        agent_response = EXCLUDED.agent_response,
        response_time_ms = EXCLUDED.response_time_ms;

      v_nette_count := v_nette_count + 1;
    END IF;
  END LOOP;

  -- ============================================================================
  -- SYNC ME CHAT HISTORIES
  -- ============================================================================
  -- me_chat_histories has: id, session_id, message (JSONB), created_at
  -- session_id format: "me:uuid"

  FOR v_record IN
    SELECT
      m.id,
      m.session_id,
      m.message,
      m.created_at,
      LEAD(m.message) OVER (PARTITION BY m.session_id ORDER BY m.created_at) as next_message,
      LEAD(m.created_at) OVER (PARTITION BY m.session_id ORDER BY m.created_at) as next_created_at,
      ROW_NUMBER() OVER (PARTITION BY m.session_id ORDER BY m.created_at) as turn_number
    FROM me_chat_histories m
    WHERE m.created_at >= v_time_filter
  LOOP
    -- Only process human messages that have an AI response following
    IF v_record.message->>'type' = 'human' AND v_record.next_message->>'type' = 'ai' THEN
      -- Extract user UUID from session_id (format: "me:uuid")
      BEGIN
        v_user_uuid := (SPLIT_PART(v_record.session_id, ':', 2))::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_user_uuid := uuid_generate_v5(uuid_nil(), v_record.session_id);
      END;

      v_session_uuid := uuid_generate_v5(uuid_nil(), v_record.session_id || v_record.created_at::TEXT);

      DECLARE
        v_response_time_ms INTEGER;
      BEGIN
        v_response_time_ms := EXTRACT(MILLISECONDS FROM (v_record.next_created_at - v_record.created_at))::INTEGER;
        IF v_response_time_ms > 30000 THEN v_response_time_ms := 30000; END IF;
        IF v_response_time_ms < 0 THEN v_response_time_ms := 500; END IF;
      END;

      INSERT INTO agent_conversations (
        id, user_id, agent_type, user_message, agent_response,
        session_id, conversation_turn, created_at, response_time_ms,
        cache_hit, is_handoff, handoff_suggested, rag_context_used
      ) VALUES (
        v_session_uuid, v_user_uuid, 'me',
        COALESCE(v_record.message->>'content', ''),
        COALESCE(v_record.next_message->>'content', ''),
        v_record.session_id, (v_record.turn_number + 1) / 2,
        v_record.created_at, v_response_time_ms,
        false, false, false, false
      )
      ON CONFLICT (id) DO UPDATE SET
        user_message = EXCLUDED.user_message,
        agent_response = EXCLUDED.agent_response,
        response_time_ms = EXCLUDED.response_time_ms;

      v_me_count := v_me_count + 1;
    END IF;
  END LOOP;

  -- ============================================================================
  -- SYNC MIO CONVERSATIONS
  -- ============================================================================
  -- mio_conversations has: id, user_id, conversation_type, messages (JSONB array),
  -- conversation_turns, started_at, total_messages, etc.
  -- This table already has user_id and structured data

  FOR v_record IN
    SELECT
      mc.id,
      mc.user_id,
      mc.conversation_type,
      mc.messages,
      mc.conversation_turns,
      mc.started_at,
      mc.total_messages,
      mc.created_at
    FROM mio_conversations mc
    WHERE mc.created_at >= v_time_filter
      AND mc.total_messages > 0
  LOOP
    -- Create one agent_conversations record per MIO conversation session
    v_session_uuid := uuid_generate_v5(uuid_nil(), 'mio:' || v_record.id::TEXT);

    INSERT INTO agent_conversations (
      id, user_id, agent_type, user_message, agent_response,
      session_id, conversation_turn, created_at, response_time_ms,
      cache_hit, is_handoff, handoff_suggested, rag_context_used
    ) VALUES (
      v_session_uuid,
      v_record.user_id,
      'mio',
      'MIO conversation: ' || COALESCE(v_record.conversation_type, 'general'),
      'MIO session with ' || COALESCE(v_record.total_messages, 0) || ' messages',
      'mio:' || v_record.id::TEXT,
      COALESCE(v_record.conversation_turns, 1),
      COALESCE(v_record.started_at, v_record.created_at),
      1000,  -- Default response time for MIO
      false, false, false, false
    )
    ON CONFLICT (id) DO UPDATE SET
      conversation_turn = EXCLUDED.conversation_turn,
      agent_response = EXCLUDED.agent_response;

    v_mio_count := v_mio_count + 1;
  END LOOP;

  -- Return sync statistics
  RETURN jsonb_build_object(
    'success', true,
    'nette_synced', v_nette_count,
    'mio_synced', v_mio_count,
    'me_synced', v_me_count,
    'total', v_nette_count + v_mio_count + v_me_count,
    'time_filter', v_time_filter,
    'full_sync', p_full_sync,
    'synced_at', NOW()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'nette_synced', v_nette_count,
    'mio_synced', v_mio_count,
    'me_synced', v_me_count
  );
END;
$$;

-- Grant execute permission to authenticated users (admin check happens in edge function)
GRANT EXECUTE ON FUNCTION sync_chat_to_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION sync_chat_to_analytics TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION sync_chat_to_analytics IS
'Syncs chat data from nette_chat_histories, me_chat_histories, and mio_conversations
into agent_conversations for unified analytics dashboard.
Params: p_full_sync (bool) - sync all records, p_since_hours (int) - hours to look back';
