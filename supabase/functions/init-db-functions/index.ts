/**
 * Initialize Database Functions Edge Function
 * Phase 29: Create database functions that can't be deployed via regular migrations
 *
 * This is a one-time setup function that creates:
 * - advance_protocol_days() - Daily protocol day increment
 * - advance_single_protocol_day() - Single protocol advancement
 * - trigger_protocol_advancement() - Wrapper for n8n
 * - get_protocol_status_summary() - Monitoring function
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SQL to create the protocol advancement functions
const INIT_SQL = `
-- Function: advance_protocol_days
CREATE OR REPLACE FUNCTION advance_protocol_days()
RETURNS jsonb AS $$
DECLARE
  v_advanced_count INTEGER := 0;
  v_expired_count INTEGER := 0;
BEGIN
  WITH advanced AS (
    UPDATE mio_weekly_protocols
    SET
      current_day = LEAST(current_day + 1, 7),
      updated_at = NOW()
    WHERE status = 'active'
      AND current_day < 7
    RETURNING id
  )
  SELECT COUNT(*) INTO v_advanced_count FROM advanced;

  WITH expired AS (
    UPDATE mio_weekly_protocols
    SET
      status = 'expired',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE status = 'active'
      AND current_day >= 7
      AND created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired;

  RETURN jsonb_build_object(
    'success', true,
    'timestamp', NOW(),
    'protocols_advanced', v_advanced_count,
    'protocols_expired', v_expired_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: advance_single_protocol_day
CREATE OR REPLACE FUNCTION advance_single_protocol_day(p_protocol_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_protocol mio_weekly_protocols%ROWTYPE;
BEGIN
  SELECT * INTO v_protocol
  FROM mio_weekly_protocols
  WHERE id = p_protocol_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol not found');
  END IF;

  IF v_protocol.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol is not active');
  END IF;

  IF v_protocol.current_day >= 7 THEN
    UPDATE mio_weekly_protocols
    SET
      status = 'expired',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_protocol_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'expired',
      'message', 'Protocol expired after day 7'
    );
  ELSE
    UPDATE mio_weekly_protocols
    SET
      current_day = current_day + 1,
      updated_at = NOW()
    WHERE id = p_protocol_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'advanced',
      'new_day', v_protocol.current_day + 1
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: trigger_protocol_advancement (wrapper for n8n)
CREATE OR REPLACE FUNCTION trigger_protocol_advancement()
RETURNS jsonb AS $$
BEGIN
  RETURN advance_protocol_days();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_protocol_status_summary (monitoring)
CREATE OR REPLACE FUNCTION get_protocol_status_summary()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_active', COUNT(*) FILTER (WHERE status = 'active'),
    'total_completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'total_muted', COUNT(*) FILTER (WHERE muted_by_coach = true),
    'active_by_day', (
      SELECT jsonb_object_agg(
        'day_' || current_day::text,
        cnt
      )
      FROM (
        SELECT current_day, COUNT(*) as cnt
        FROM mio_weekly_protocols
        WHERE status = 'active'
        GROUP BY current_day
      ) sub
    )
  )
  INTO v_result
  FROM mio_weekly_protocols;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION advance_protocol_days() TO service_role;
GRANT EXECUTE ON FUNCTION advance_single_protocol_day(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION trigger_protocol_advancement() TO service_role;
GRANT EXECUTE ON FUNCTION get_protocol_status_summary() TO service_role;
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require service role authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes('service_role')) {
      // Check for secret token in body
      const body = await req.json().catch(() => ({}));
      if (body.init_token !== 'mio-init-29-protocol-functions') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get database URL
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    // Execute SQL using Postgres client
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const client = new Client(dbUrl);
    await client.connect();

    // Execute the initialization SQL
    await client.queryArray(INIT_SQL);
    await client.end();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database functions initialized successfully',
        functions: [
          'advance_protocol_days()',
          'advance_single_protocol_day(UUID)',
          'trigger_protocol_advancement()',
          'get_protocol_status_summary()',
        ],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Init error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
