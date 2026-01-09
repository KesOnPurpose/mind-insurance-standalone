/**
 * Initialize Automation Functions Edge Function
 * Phase 29: Create automation resolution database functions
 *
 * This creates:
 * - resolve_auto_group_users() - Dynamic user resolution by criteria
 * - resolve_automation_target_users() - Main function to resolve targets
 * - get_automation_user_count() - Preview count of targeted users
 * - resolve_target_users_direct() - Direct resolution without automation lookup
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SQL to create the automation resolution functions
const INIT_SQL = `
-- Function: resolve_auto_group_users
-- Dynamically resolves users based on auto-group criteria
CREATE OR REPLACE FUNCTION resolve_auto_group_users(p_criteria JSONB)
RETURNS TABLE(user_id UUID) AS $$
DECLARE
  v_auto_type TEXT;
  v_pattern TEXT;
  v_temperament TEXT;
  v_week INTEGER;
  v_streak_days INTEGER;
BEGIN
  v_auto_type := p_criteria->>'auto_group_type';

  -- By collision pattern
  IF v_auto_type = 'by_pattern' THEN
    v_pattern := UPPER(p_criteria->>'pattern');
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.collision_patterns->>'primary_pattern' = v_pattern
      AND up.deleted_at IS NULL;

  -- By temperament
  ELSIF v_auto_type = 'by_temperament' THEN
    v_temperament := UPPER(p_criteria->>'temperament');
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.temperament = v_temperament
      AND up.deleted_at IS NULL;

  -- By week number
  ELSIF v_auto_type = 'by_week' THEN
    v_week := (p_criteria->>'week')::INTEGER;
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.current_day BETWEEN ((v_week - 1) * 7 + 1) AND (v_week * 7)
      AND up.deleted_at IS NULL;

  -- By streak status (users with broken streak)
  ELSIF v_auto_type = 'by_streak_status' THEN
    v_streak_days := COALESCE((p_criteria->>'days_since_practice')::INTEGER, 3);
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    LEFT JOIN practice_streaks ps ON ps.user_id = up.id
    WHERE (ps.current_streak = 0 OR ps.current_streak IS NULL)
      AND (ps.last_practice_date IS NULL OR ps.last_practice_date < NOW() - (v_streak_days || ' days')::INTERVAL)
      AND up.deleted_at IS NULL;

  -- All users
  ELSIF v_auto_type = 'all' THEN
    RETURN QUERY
    SELECT up.id
    FROM user_profiles up
    WHERE up.deleted_at IS NULL;

  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: resolve_automation_target_users
-- Main function to resolve all target users for an automation
CREATE OR REPLACE FUNCTION resolve_automation_target_users(p_automation_id UUID)
RETURNS TABLE(user_id UUID) AS $$
DECLARE
  v_target_type TEXT;
  v_target_config JSONB;
BEGIN
  -- Get automation config
  SELECT target_type, target_config
  INTO v_target_type, v_target_config
  FROM mio_report_automation
  WHERE id = p_automation_id;

  -- Route based on target type
  CASE v_target_type
    -- Individual users
    WHEN 'individual' THEN
      RETURN QUERY
      SELECT (jsonb_array_elements_text(v_target_config->'user_ids'))::UUID;

    -- Auto group (dynamic resolution)
    WHEN 'auto_group' THEN
      RETURN QUERY
      SELECT * FROM resolve_auto_group_users(v_target_config);

    -- Custom group (from membership table)
    WHEN 'custom_group' THEN
      RETURN QUERY
      SELECT ugm.user_id
      FROM mio_user_group_members ugm
      WHERE ugm.group_id = (v_target_config->>'group_id')::UUID;

    -- All users
    WHEN 'all' THEN
      RETURN QUERY
      SELECT up.id
      FROM user_profiles up
      WHERE up.deleted_at IS NULL;

  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: resolve_target_users_direct
-- Direct resolution without looking up automation - for n8n webhook calls
CREATE OR REPLACE FUNCTION resolve_target_users_direct(
  p_target_type TEXT,
  p_target_config JSONB
)
RETURNS TABLE(user_id UUID, email TEXT, full_name TEXT) AS $$
BEGIN
  CASE p_target_type
    -- Individual users
    WHEN 'individual' THEN
      RETURN QUERY
      SELECT up.id, up.email, up.full_name
      FROM user_profiles up
      WHERE up.id IN (SELECT (jsonb_array_elements_text(p_target_config->'user_ids'))::UUID)
        AND up.deleted_at IS NULL;

    -- Auto group (dynamic resolution)
    WHEN 'auto_group' THEN
      RETURN QUERY
      SELECT up.id, up.email, up.full_name
      FROM user_profiles up
      WHERE up.id IN (SELECT rag.user_id FROM resolve_auto_group_users(p_target_config) rag)
        AND up.deleted_at IS NULL;

    -- Custom group (from membership table)
    WHEN 'custom_group' THEN
      RETURN QUERY
      SELECT up.id, up.email, up.full_name
      FROM user_profiles up
      INNER JOIN mio_user_group_members ugm ON ugm.user_id = up.id
      WHERE ugm.group_id = (p_target_config->>'group_id')::UUID
        AND up.deleted_at IS NULL;

    -- All users
    WHEN 'all' THEN
      RETURN QUERY
      SELECT up.id, up.email, up.full_name
      FROM user_profiles up
      WHERE up.deleted_at IS NULL;

    -- Default: due users (original workflow logic)
    ELSE
      RETURN QUERY
      WITH user_journey AS (
        SELECT
          up.id,
          up.email,
          up.full_name,
          up.created_at as signup_date,
          EXTRACT(DAY FROM NOW() - up.created_at)::int as journey_day,
          (SELECT MAX(created_at) FROM mio_user_reports r WHERE r.user_id = up.id) as last_report_date
        FROM user_profiles up
        INNER JOIN gh_approved_users gau ON gau.email = up.email AND gau.is_active = true
        WHERE up.deleted_at IS NULL
      ),
      due_users AS (
        SELECT uj.*,
          CASE
            WHEN uj.journey_day IN (7, 14, 21, 28) THEN true
            WHEN uj.journey_day > 28 AND (uj.last_report_date IS NULL OR EXTRACT(DAY FROM NOW() - uj.last_report_date) >= 7) THEN true
            ELSE false
          END as is_due
        FROM user_journey uj
      )
      SELECT du.id, du.email, du.full_name
      FROM due_users du
      WHERE du.is_due = true
      LIMIT 50;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_automation_user_count
-- Preview count of users that would be targeted
CREATE OR REPLACE FUNCTION get_automation_user_count(
  p_target_type TEXT,
  p_target_config JSONB
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  CASE p_target_type
    WHEN 'individual' THEN
      SELECT jsonb_array_length(p_target_config->'user_ids') INTO v_count;

    WHEN 'auto_group' THEN
      SELECT COUNT(*) INTO v_count FROM resolve_auto_group_users(p_target_config);

    WHEN 'custom_group' THEN
      SELECT COUNT(*) INTO v_count
      FROM mio_user_group_members
      WHERE group_id = (p_target_config->>'group_id')::UUID;

    WHEN 'all' THEN
      SELECT COUNT(*) INTO v_count
      FROM user_profiles
      WHERE deleted_at IS NULL;

    ELSE
      v_count := 0;
  END CASE;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION resolve_auto_group_users(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_automation_target_users(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_target_users_direct(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_automation_user_count(TEXT, JSONB) TO service_role;
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
      if (body.init_token !== 'mio-init-29-automation-functions') {
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
        message: 'Automation functions initialized successfully',
        functions: [
          'resolve_auto_group_users(JSONB)',
          'resolve_automation_target_users(UUID)',
          'resolve_target_users_direct(TEXT, JSONB)',
          'get_automation_user_count(TEXT, JSONB)',
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
