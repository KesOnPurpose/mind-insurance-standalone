// Send User Invite - Edge Function for Admin User Management
// Sends invite emails to newly approved users via Supabase Auth
//
// Usage from frontend:
// POST https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/send-user-invite
// Headers:
//   Authorization: Bearer <user_access_token>
//   Content-Type: application/json
// Body: { email, full_name?, redirect_to? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitePayload {
  email: string;
  full_name?: string;
  redirect_to?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Check environment variables
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User client to verify caller is admin
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is authenticated
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is admin or above
    const { data: callerAccess, error: accessError } = await supabaseAdmin
      .from('gh_approved_users')
      .select('tier')
      .eq('email', caller.email?.toLowerCase())
      .eq('is_active', true)
      .single();

    if (accessError || !callerAccess) {
      return new Response(JSON.stringify({ error: 'Access denied: Not an approved user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminTiers = ['admin', 'super_admin', 'owner'];
    if (!adminTiers.includes(callerAccess.tier)) {
      return new Response(JSON.stringify({ error: 'Access denied: Admin privileges required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const payload: InvitePayload = await req.json();

    // Validate email
    if (!payload.email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = payload.email.toLowerCase().trim();

    // Verify user is in approved list
    const { data: approvedUser, error: approvedError } = await supabaseAdmin
      .from('gh_approved_users')
      .select('id, email, full_name, tier, is_active, user_id, notes')
      .eq('email', email)
      .single();

    if (approvedError || !approvedUser) {
      return new Response(
        JSON.stringify({ error: 'User not found in approved list. Add user first before sending invite.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!approvedUser.is_active) {
      return new Response(
        JSON.stringify({ error: 'Cannot send invite to inactive user. Activate user first.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already exists and sync user_id if needed
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingAuthUser?.users?.find(u => u.email?.toLowerCase() === email);

    if (existingUser && approvedUser.user_id === null) {
      // User exists but user_id not linked - sync now
      console.log(`Syncing existing user_id for: ${email}`);
      await supabaseAdmin
        .from('gh_approved_users')
        .update({
          user_id: existingUser.id,
          last_access_at: existingUser.last_sign_in_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', approvedUser.id);

      console.log(`Successfully synced user_id for: ${email}`);
    }

    // Use the actual app URL for redirects
    const appUrl = Deno.env.get('APP_URL') || 'https://grouphome4newbies.com';
    const finalRedirectTo = payload.redirect_to || `${appUrl}/dashboard`;

    // Use Supabase Auth for reliable email delivery
    console.log(`Sending invite via Supabase Auth for: ${email}`);

    // Try inviteUserByEmail first (for new users)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: finalRedirectTo,
      data: {
        full_name: payload.full_name || approvedUser.full_name,
        invited_by: caller.email,
        tier: approvedUser.tier,
      },
    });

    if (inviteError) {
      // If user already exists, send magic link instead
      if (inviteError.message?.includes('already been registered') || inviteError.message?.includes('already exists')) {
        // User exists - use signInWithOtp which actually sends the email
        const supabaseForOtp = createClient(supabaseUrl, supabaseServiceKey);
        const { error: otpError } = await supabaseForOtp.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: finalRedirectTo,
            shouldCreateUser: false,
          },
        });

        if (otpError) {
          console.error('Error sending magic link to existing user:', otpError);
          return new Response(
            JSON.stringify({ error: `Failed to send magic link: ${otpError.message}` }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Update invited_at timestamp
        await supabaseAdmin
          .from('gh_approved_users')
          .update({
            invited_at: new Date().toISOString(),
            notes: approvedUser.notes
              ? `${approvedUser.notes}\n[${new Date().toISOString()}] Re-invite sent by ${caller.email}`
              : `[${new Date().toISOString()}] Re-invite sent by ${caller.email}`
          })
          .eq('id', approvedUser.id);

        console.log(`Re-sent magic link to existing user: ${email}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Magic link sent to existing user',
            email: email,
            is_existing_user: true,
            method: 'supabase_auth',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('Error inviting user:', inviteError);
      return new Response(
        JSON.stringify({ error: `Failed to send invite: ${inviteError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update the approved user record with invited timestamp
    await supabaseAdmin
      .from('gh_approved_users')
      .update({
        invited_at: new Date().toISOString(),
        notes: approvedUser.notes
          ? `${approvedUser.notes}\n[${new Date().toISOString()}] Invite sent by ${caller.email}`
          : `[${new Date().toISOString()}] Invite sent by ${caller.email}`
      })
      .eq('id', approvedUser.id);

    console.log(`Sent invite to new user: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invite email sent successfully',
        email: email,
        user_id: inviteData.user?.id,
        is_existing_user: false,
        method: 'supabase_auth',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Invite error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
