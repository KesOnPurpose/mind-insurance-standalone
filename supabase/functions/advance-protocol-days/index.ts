/**
 * Advance Protocol Days Edge Function
 * Phase 29/30: Daily protocol day increment triggered by n8n or pg_cron
 *
 * This function advances all active protocol current_day values and
 * expires protocols that have passed 7 days.
 *
 * Phase 30 UPDATE: Now uses advance_protocol_days_with_skip() which:
 * - Calculates actual day from assigned_week_start
 * - Auto-skips missed days for better tracking
 * - Auto-skips remaining days before expiring protocols
 *
 * Should be called daily at midnight EST (5:00 AM UTC) by:
 * - n8n scheduled workflow (recommended) - cron: 0 5 * * *
 * - pg_cron if enabled in Supabase
 * - Manual trigger for testing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SQL to create/update the advance_protocol_days_with_skip function
const UPGRADE_SQL = `
CREATE OR REPLACE FUNCTION advance_protocol_days_with_skip()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_protocol RECORD;
  v_actual_day INT;
  v_day INT;
  v_protocols_advanced INT := 0;
  v_protocols_expired INT := 0;
  v_days_skipped INT := 0;
BEGIN
  FOR v_protocol IN
    SELECT id, user_id, current_day, assigned_week_start, created_at
    FROM mio_weekly_protocols
    WHERE status = 'active'
  LOOP
    v_actual_day := LEAST(
      GREATEST(
        (NOW()::date - v_protocol.assigned_week_start::date) + 1,
        1
      ),
      8
    );

    IF v_actual_day > v_protocol.current_day AND v_actual_day <= 7 THEN
      FOR v_day IN v_protocol.current_day..(v_actual_day - 1) LOOP
        INSERT INTO mio_protocol_completions (
          protocol_id, user_id, day_number, was_skipped, auto_skipped, skip_reason, completed_at
        )
        SELECT v_protocol.id, v_protocol.user_id, v_day, TRUE, TRUE,
               'Auto-skipped by daily advancement job', NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND day_number = v_day
        );
        IF FOUND THEN v_days_skipped := v_days_skipped + 1; END IF;
      END LOOP;

      UPDATE mio_weekly_protocols
      SET current_day = v_actual_day,
          days_skipped = (SELECT COUNT(*) FROM mio_protocol_completions
                          WHERE protocol_id = v_protocol.id AND was_skipped = TRUE),
          updated_at = NOW()
      WHERE id = v_protocol.id;
      v_protocols_advanced := v_protocols_advanced + 1;
    END IF;

    IF v_actual_day > 7 THEN
      FOR v_day IN v_protocol.current_day..7 LOOP
        INSERT INTO mio_protocol_completions (
          protocol_id, user_id, day_number, was_skipped, auto_skipped, skip_reason, completed_at
        )
        SELECT v_protocol.id, v_protocol.user_id, v_day, TRUE, TRUE,
               'Auto-skipped: protocol expired after 7 days', NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND day_number = v_day
        );
        IF FOUND THEN v_days_skipped := v_days_skipped + 1; END IF;
      END LOOP;

      UPDATE mio_weekly_protocols
      SET current_day = 7,
          days_skipped = (SELECT COUNT(*) FROM mio_protocol_completions
                          WHERE protocol_id = v_protocol.id AND was_skipped = TRUE),
          days_completed = (SELECT COUNT(*) FROM mio_protocol_completions
                            WHERE protocol_id = v_protocol.id AND was_skipped = FALSE),
          status = 'expired', completed_at = NOW(), updated_at = NOW()
      WHERE id = v_protocol.id;
      v_protocols_expired := v_protocols_expired + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE, 'timestamp', NOW(),
    'protocols_advanced', v_protocols_advanced,
    'protocols_expired', v_protocols_expired,
    'days_skipped', v_days_skipped
  );
END;
$func$;

CREATE OR REPLACE FUNCTION trigger_protocol_advancement()
RETURNS JSONB AS $func$
BEGIN
  RETURN advance_protocol_days_with_skip();
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION advance_protocol_days_with_skip() TO service_role;

-- Protocol renewal settings table (Phase 14)
CREATE TABLE IF NOT EXISTS mio_protocol_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_renewal_enabled BOOLEAN DEFAULT true,
  renewal_source TEXT DEFAULT 'ai_generated',
  max_protocols_per_user INT DEFAULT 0,
  pause_for_inactive BOOLEAN DEFAULT true,
  inactive_days_threshold INT DEFAULT 7,
  pause_for_muted BOOLEAN DEFAULT true,
  avoid_repeat_themes BOOLEAN DEFAULT true,
  theme_cooldown_weeks INT DEFAULT 4,
  -- Phased rollout controls
  target_tiers TEXT[] DEFAULT ARRAY['admin', 'owner', 'super_admin']::TEXT[], -- Only these tiers get auto-renewal
  target_user_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Specific users (overrides tier filter if not empty)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Add columns if they don't exist (for existing table)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_protocol_settings' AND column_name = 'target_tiers') THEN
    ALTER TABLE mio_protocol_settings ADD COLUMN target_tiers TEXT[] DEFAULT ARRAY['admin', 'owner', 'super_admin']::TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mio_protocol_settings' AND column_name = 'target_user_ids') THEN
    ALTER TABLE mio_protocol_settings ADD COLUMN target_user_ids UUID[] DEFAULT ARRAY[]::UUID[];
  END IF;
END $$;

-- Insert default settings if not exists
INSERT INTO mio_protocol_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS for settings
ALTER TABLE mio_protocol_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access settings" ON mio_protocol_settings;
CREATE POLICY "Service role full access settings"
  ON mio_protocol_settings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Admins can manage settings" ON mio_protocol_settings;
CREATE POLICY "Admins can manage settings"
  ON mio_protocol_settings FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM gh_approved_users
    WHERE user_id = auth.uid()
    AND tier IN ('admin', 'owner', 'super_admin')
    AND is_active = true
  ));

GRANT ALL ON mio_protocol_settings TO service_role;
GRANT SELECT, UPDATE ON mio_protocol_settings TO authenticated;
`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse optional parameters
    let params: { dry_run?: boolean; protocol_id?: string; upgrade?: boolean } = {};
    try {
      if (req.method === 'POST') {
        params = await req.json();
      }
    } catch {
      // No body or invalid JSON is fine
    }

    // Upgrade mode - deploy the new function
    if (params.upgrade) {
      const dbUrl = Deno.env.get('SUPABASE_DB_URL');
      if (!dbUrl) {
        throw new Error('Database URL not configured - cannot upgrade');
      }

      const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
      const client = new Client(dbUrl);
      await client.connect();
      await client.queryArray(UPGRADE_SQL);
      await client.end();

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'upgrade',
          message: 'Successfully deployed advance_protocol_days_with_skip() and updated trigger_protocol_advancement()',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If specific protocol_id provided, advance just that one
    if (params.protocol_id) {
      const { data, error } = await supabase.rpc('advance_single_protocol_day', {
        p_protocol_id: params.protocol_id,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'single',
          result: data,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Dry run mode - just get status without making changes
    if (params.dry_run) {
      const { data: summary, error: summaryError } = await supabase.rpc(
        'get_protocol_status_summary'
      );

      if (summaryError) throw summaryError;

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'dry_run',
          would_process: summary,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normal operation - advance all protocols (now uses advance_protocol_days_with_skip via trigger_protocol_advancement)
    const { data, error } = await supabase.rpc('trigger_protocol_advancement');

    if (error) throw error;

    console.log('Protocol advancement completed:', data);

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'full_run',
        result: data,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error advancing protocols:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
