/**
 * Check Subscription Edge Function
 * FEAT-GHCF-003: Validates active subscription for authenticated users.
 *
 * CRITICAL: BACKWARDS COMPATIBLE
 * - No gh_approved_users record = full access (fail-open)
 * - Query error = full access (fail-open)
 * - Only returns false when record exists AND is_active = false
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ active: false, reason: 'not_authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ active: false, reason: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check gh_approved_users for this user
    const { data: approvedUser, error: queryError } = await supabase
      .from('gh_approved_users')
      .select('is_active, enrollment_status, tier')
      .eq('user_id', user.id)
      .single();

    // FAIL-OPEN: No record = full access (backwards compatible for existing users)
    if (queryError || !approvedUser) {
      console.log(`No gh_approved_users record for user ${user.id} - granting full access (fail-open)`);
      return new Response(
        JSON.stringify({ active: true, reason: 'no_record_full_access' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Has record: check is_active
    const response = {
      active: approvedUser.is_active,
      enrollment_status: approvedUser.enrollment_status,
      tier: approvedUser.tier,
      reason: approvedUser.is_active ? 'active_subscription' : 'subscription_expired',
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // FAIL-OPEN: Any unexpected error = allow access
    console.error('check-subscription error:', error);
    return new Response(
      JSON.stringify({ active: true, reason: 'error_fail_open' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
