// ============================================================================
// VOICE SESSION LOOKUP - Find Active Session for Voice AI Caller Identification
// ============================================================================
// Called by N8n webhook when GHL Voice AI starts a call.
// Finds the most recent pending session to identify the caller.
//
// Flow:
// 1. Voice AI widget call starts in browser
// 2. Voice AI calls this webhook via N8n (Custom Action)
// 3. This function finds the most recent pending session
// 4. Returns caller context (phone, greeting_hint, user data)
// 5. Voice AI uses "Get Contact" with phone to get full context
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface LookupRequest {
  // Optional: How many seconds back to search for sessions (default: 60)
  lookup_window_seconds?: number;
}

interface VoiceSession {
  id: string;
  user_id: string | null;
  phone: string;
  ghl_contact_id: string | null;
  context: Record<string, unknown>;
  greeting_hint: string | null;
  created_at: string;
  matched_at: string | null;
  expires_at: string;
  status: string;
}

interface LookupResponse {
  success: boolean;
  phone?: string;
  ghl_contact_id?: string | null;
  context?: Record<string, unknown>;
  greeting_hint?: string;
  session_id?: string;
  user_id?: string | null;
  error?: string;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Session Lookup] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not configured'
        } satisfies LookupResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    let lookupWindowSeconds = 60; // Default: 60 seconds

    if (req.method === 'POST') {
      try {
        const body: LookupRequest = await req.json();
        if (body.lookup_window_seconds && body.lookup_window_seconds > 0) {
          lookupWindowSeconds = Math.min(body.lookup_window_seconds, 300); // Max 5 minutes
        }
      } catch {
        // No body or invalid JSON - use defaults
      }
    }

    console.log('[Session Lookup] Looking for non-expired pending session');

    // Current time for expiration check
    const now = new Date().toISOString();

    // Find the most recent PENDING session that has NOT EXPIRED
    // We don't limit by created_at window - just find any pending session that's still valid
    const { data: session, error: queryError } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', now) // Session has NOT expired (expires_at > now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('[Session Lookup] Query error:', queryError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error: ${queryError.message}`
        } satisfies LookupResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!session) {
      console.log('[Session Lookup] No pending session found in window');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No pending session found. User may not have loaded the Voice tab recently.'
        } satisfies LookupResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voiceSession = session as VoiceSession;

    // Mark session as matched
    const { error: updateError } = await supabase
      .from('voice_sessions')
      .update({
        status: 'matched',
        matched_at: new Date().toISOString(),
        call_started_at: new Date().toISOString()
      })
      .eq('id', voiceSession.id);

    if (updateError) {
      console.warn('[Session Lookup] Failed to mark session as matched:', updateError);
      // Continue anyway - we still have the session data
    }

    console.log('[Session Lookup] Session matched:', {
      id: voiceSession.id,
      phone: voiceSession.phone,
      greeting_hint: voiceSession.greeting_hint,
      user_id: voiceSession.user_id
    });

    // Return the session data for Voice AI
    const response: LookupResponse = {
      success: true,
      phone: voiceSession.phone,
      ghl_contact_id: voiceSession.ghl_contact_id,
      context: voiceSession.context,
      greeting_hint: voiceSession.greeting_hint || 'Hey there',
      session_id: voiceSession.id,
      user_id: voiceSession.user_id
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Session Lookup] Exception:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } satisfies LookupResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
