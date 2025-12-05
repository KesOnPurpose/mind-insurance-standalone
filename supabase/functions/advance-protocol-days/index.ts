/**
 * Advance Protocol Days Edge Function
 * Phase 29: Daily protocol day increment triggered by n8n or pg_cron
 *
 * This function advances all active protocol current_day values and
 * expires protocols that have passed 7 days.
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
    let params: { dry_run?: boolean; protocol_id?: string } = {};
    try {
      if (req.method === 'POST') {
        params = await req.json();
      }
    } catch {
      // No body or invalid JSON is fine
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

    // Normal operation - advance all protocols
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
