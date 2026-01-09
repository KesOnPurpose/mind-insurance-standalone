// ============================================================================
// SYNC ANALYTICS EDGE FUNCTION
// ============================================================================
// Triggers the sync_chat_to_analytics database function to populate
// the agent_conversations table from chat history tables.
//
// Endpoints:
//   POST /sync-analytics
//     Body: { full_sync?: boolean, since_hours?: number }
//     Returns: { success, nette_synced, mio_synced, me_synced, total }
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for database function access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the user is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Create a client with the user's token to check their role
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user is an admin (check gh_approved_users table)
    const { data: adminData, error: adminError } = await supabaseClient
      .from('gh_approved_users')
      .select('tier, is_active')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData) {
      // Also check by email
      const { data: adminByEmail } = await supabaseClient
        .from('gh_approved_users')
        .select('tier, is_active')
        .eq('email', user.email)
        .single();

      if (!adminByEmail || !['admin', 'super_admin', 'owner'].includes(adminByEmail.tier)) {
        throw new Error('Admin access required to sync analytics');
      }
    } else if (!['admin', 'super_admin', 'owner'].includes(adminData.tier)) {
      throw new Error('Admin access required to sync analytics');
    }

    // Parse request body
    let fullSync = false;
    let sinceHours = 24;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        fullSync = body.full_sync === true;
        sinceHours = typeof body.since_hours === 'number' ? body.since_hours : 24;
      } catch {
        // Use defaults if body parsing fails
      }
    }

    console.log(`[Sync Analytics] Starting sync - full_sync: ${fullSync}, since_hours: ${sinceHours}`);

    // Call the database function
    const { data, error } = await supabaseClient.rpc('sync_chat_to_analytics', {
      p_full_sync: fullSync,
      p_since_hours: sinceHours,
    });

    if (error) {
      console.error('[Sync Analytics] Database function error:', error);
      throw new Error(`Sync failed: ${error.message}`);
    }

    console.log('[Sync Analytics] Sync completed:', data);

    // Invalidate the metrics cache after successful sync
    if (data?.success) {
      try {
        await supabaseClient
          .from('admin_metrics_cache')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        console.log('[Sync Analytics] Metrics cache invalidated');
      } catch (cacheError) {
        console.warn('[Sync Analytics] Failed to invalidate cache:', cacheError);
        // Don't fail the whole operation if cache clear fails
      }
    }

    return new Response(
      JSON.stringify({
        ...data,
        cache_invalidated: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[Sync Analytics] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: error instanceof Error && error.message.includes('required') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
