/**
 * Manage Subscription Edge Function
 * Authenticated proxy to Whop API for subscription management.
 * Frontend never calls Whop directly — this prevents API key exposure and enables logging.
 *
 * Actions: get_status, cancel, uncancel, pause, resume
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SubscriptionAction = 'get_status' | 'cancel' | 'uncancel' | 'pause' | 'resume';

interface RequestBody {
  action: SubscriptionAction;
  data?: {
    cancel_reason?: string;
    cancel_reason_text?: string;
  };
}

const WHOP_API_BASE = 'https://api.whop.com/api/v2';

async function callWhopApi(
  method: string,
  path: string,
  apiKey: string,
  body?: Record<string, unknown>,
): Promise<{ data?: unknown; error?: string; status: number }> {
  const url = `${WHOP_API_BASE}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      error: responseData?.message || responseData?.error || `Whop API error: ${response.status}`,
      status: response.status,
    };
  }

  return { data: responseData, status: response.status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const whopApiKey = Deno.env.get('WHOP_API_KEY');

    if (!whopApiKey) {
      return new Response(
        JSON.stringify({ error: 'Whop API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Authenticate the user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Service role client for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user from gh_approved_users
    const { data: approvedUser, error: lookupError } = await adminClient
      .from('gh_approved_users')
      .select('id, email, payment_source, whop_membership_id, tier, expires_at, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single();

    if (lookupError || !approvedUser) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found for this account' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check if user is an admin — admins bypass subscription management
    const adminTiers = ['owner', 'super_admin', 'admin'];
    if (adminTiers.includes(approvedUser.tier?.toLowerCase())) {
      return new Response(
        JSON.stringify({
          success: true,
          is_admin: true,
          data: null,
          subscription: {
            tier: approvedUser.tier,
            expires_at: approvedUser.expires_at,
            is_active: approvedUser.is_active,
            manage_url: null,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const membershipId = approvedUser.whop_membership_id;
    if (!membershipId || (!membershipId.startsWith('mem_') && !membershipId.startsWith('mber_'))) {
      return new Response(
        JSON.stringify({
          error: 'No Whop membership linked to this account',
          subscription: {
            tier: approvedUser.tier,
            expires_at: approvedUser.expires_at,
            is_active: approvedUser.is_active,
            manage_url: null,
          },
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { action, data: actionData } = body;

    let result: { data?: unknown; error?: string; status: number };

    switch (action) {
      case 'get_status': {
        result = await callWhopApi('GET', `/memberships/${membershipId}`, whopApiKey);
        break;
      }

      case 'cancel': {
        // Always cancel at period end — never immediate
        result = await callWhopApi('POST', `/memberships/${membershipId}/cancel`, whopApiKey, {
          cancel_at_period_end: true,
        });
        break;
      }

      case 'uncancel': {
        result = await callWhopApi('POST', `/memberships/${membershipId}/uncancel`, whopApiKey);
        break;
      }

      case 'pause': {
        result = await callWhopApi('POST', `/memberships/${membershipId}/pause`, whopApiKey);
        break;
      }

      case 'resume': {
        result = await callWhopApi('POST', `/memberships/${membershipId}/resume`, whopApiKey);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }

    // Log the action to subscription_actions_log
    try {
      await adminClient.from('subscription_actions_log').insert({
        user_id: user.id,
        email: user.email,
        membership_id: membershipId,
        action,
        cancel_reason: actionData?.cancel_reason || null,
        cancel_reason_text: actionData?.cancel_reason_text || null,
        whop_response_status: result.status,
        whop_response_error: result.error || null,
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log subscription action:', logError);
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: result.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
