// ============================================================================
// VAPI CLEANUP RETENTION - 30-Day Data Retention
// ============================================================================
// Scheduled cleanup function to maintain 30-day retention policy
// Matches Vapi's built-in 30-day recording retention
//
// Should be scheduled via cron job to run daily:
// curl -X POST https://[project-ref].functions.supabase.co/vapi-cleanup-retention \
//   -H "Authorization: Bearer [anon-key]" \
//   -H "Content-Type: application/json"
//
// Or via Supabase scheduled functions / pg_cron
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retention period in days (matches Vapi's recording retention)
const RETENTION_DAYS = 30;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[vapi-cleanup-retention] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    console.log('[vapi-cleanup-retention] Starting cleanup...');
    console.log('[vapi-cleanup-retention] Cutoff date:', cutoffISO);

    // Count records that will be deleted (for logging)
    const { count: countToDelete, error: countError } = await supabase
      .from('vapi_call_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffISO);

    if (countError) {
      console.error('[vapi-cleanup-retention] Error counting records:', countError);
    } else {
      console.log('[vapi-cleanup-retention] Records to delete:', countToDelete);
    }

    // If nothing to delete, return early
    if (!countToDelete || countToDelete === 0) {
      console.log('[vapi-cleanup-retention] No records to delete');
      return new Response(
        JSON.stringify({
          success: true,
          deleted_count: 0,
          cutoff_date: cutoffISO,
          message: 'No records older than retention period'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete old records
    const { error: deleteError } = await supabase
      .from('vapi_call_logs')
      .delete()
      .lt('created_at', cutoffISO);

    if (deleteError) {
      console.error('[vapi-cleanup-retention] Error deleting records:', deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to delete records',
          details: deleteError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[vapi-cleanup-retention] Cleanup complete. Deleted:', countToDelete);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: countToDelete,
        cutoff_date: cutoffISO,
        retention_days: RETENTION_DAYS
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[vapi-cleanup-retention] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
