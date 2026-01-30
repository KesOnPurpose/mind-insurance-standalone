/**
 * Link User After Signup Edge Function
 * FEAT-GHCF-004: Links new auth user_id to pre-approved gh_approved_users record.
 *
 * Called from /create-account page immediately after successful supabase.auth.signUp().
 * Uses service role to update gh_approved_users.user_id.
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

    const { user_id, email } = await req.json();

    // Input validation
    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ linked: false, reason: 'missing_fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the pre-approved record by email
    const { data: approved, error } = await supabase
      .from('gh_approved_users')
      .select('id, user_id')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !approved) {
      console.log(`No gh_approved_users record found for email: ${email}`);
      return new Response(
        JSON.stringify({ linked: false, reason: 'no_approved_record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only link if not already linked to a different user
    if (approved.user_id && approved.user_id !== user_id) {
      console.log(`Record already linked to different user: ${approved.user_id}`);
      return new Response(
        JSON.stringify({ linked: false, reason: 'already_linked_to_other_user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Link the user_id if not already linked
    if (!approved.user_id) {
      const { error: updateError } = await supabase
        .from('gh_approved_users')
        .update({
          user_id: user_id,
          enrollment_status: 'account_created',
          updated_at: new Date().toISOString(),
        })
        .eq('id', approved.id);

      if (updateError) {
        console.error('Failed to link user:', updateError);
        return new Response(
          JSON.stringify({ linked: false, reason: 'update_failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Successfully linked user ${user_id} to approved record ${approved.id}`);
    }

    return new Response(
      JSON.stringify({ linked: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('link-user-after-signup error:', error);
    return new Response(
      JSON.stringify({ linked: false, reason: 'internal_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
