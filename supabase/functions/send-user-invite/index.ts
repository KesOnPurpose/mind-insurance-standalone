// Send User Invite - Edge Function for Admin User Management
// Sends a magic link email to newly approved users
// Uses direct SMTP to bypass Supabase Auth rate limits for bulk sends
//
// Usage from frontend:
// POST https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/send-user-invite
// Headers:
//   Authorization: Bearer <user_access_token>
//   Content-Type: application/json
// Body: { email, full_name?, redirect_to?, bulk?: boolean }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitePayload {
  email: string;
  full_name?: string;
  redirect_to?: string;
  bulk?: boolean; // If true, use direct SMTP to bypass rate limits
}

// Send email via SMTP (bypasses Supabase rate limits)
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<void> {
  const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
  const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPass = Deno.env.get('SMTP_PASS');
  const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;
  const smtpFromName = Deno.env.get('SMTP_FROM_NAME') || 'Mind Insurance';

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS in Edge Function secrets.');
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPass,
      },
    },
  });

  try {
    await client.send({
      from: `${smtpFromName} <${smtpFrom}>`,
      to: to,
      subject: subject,
      content: textContent,
      html: htmlContent,
    });
  } finally {
    await client.close();
  }
}

// Generate invite email HTML
function generateInviteEmailHTML(
  fullName: string | null,
  magicLink: string,
  appUrl: string
): string {
  const name = fullName || 'there';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Mind Insurance</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Mind Insurance</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-top: 0;">Hi ${name},</p>

    <p>You've been approved to access Mind Insurance! Click the button below to sign in and get started:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign In to Mind Insurance
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't request this invite, you can safely ignore this email.</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="color: #666; font-size: 12px; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${magicLink}" style="color: #667eea; word-break: break-all;">${magicLink}</a>
    </p>
  </div>

  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
    &copy; ${new Date().getFullYear()} Mind Insurance. All rights reserved.
  </p>
</body>
</html>
`;
}

// Generate plain text version
function generateInviteEmailText(
  fullName: string | null,
  magicLink: string
): string {
  const name = fullName || 'there';
  return `
Hi ${name},

You've been approved to access Mind Insurance!

Click this link to sign in and get started:
${magicLink}

This link will expire in 24 hours.

If you didn't request this invite, you can safely ignore this email.

- The Mind Insurance Team
`;
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

    // Use the actual app URL
    const appUrl = Deno.env.get('APP_URL') || 'https://mindhouse-prodigy.vercel.app';
    const finalRedirectTo = payload.redirect_to || `${appUrl}/dashboard`;

    // Check if SMTP is configured for direct email sending
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const useDirectSMTP = payload.bulk || (smtpUser && smtpPass);

    if (useDirectSMTP && smtpUser && smtpPass) {
      // Direct SMTP path - bypasses Supabase rate limits
      console.log(`Using direct SMTP for: ${email}`);

      // Generate magic link without sending email
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: finalRedirectTo,
        },
      });

      if (linkError) {
        console.error('Error generating magic link:', linkError);
        return new Response(
          JSON.stringify({ error: `Failed to generate invite link: ${linkError.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get the magic link URL from the response
      const magicLink = linkData.properties?.action_link;
      if (!magicLink) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate magic link URL' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Send email via SMTP
      try {
        await sendEmailViaSMTP(
          email,
          "You're Invited to Mind Insurance",
          generateInviteEmailHTML(payload.full_name || approvedUser.full_name, magicLink, appUrl),
          generateInviteEmailText(payload.full_name || approvedUser.full_name, magicLink)
        );
      } catch (smtpError) {
        console.error('SMTP error:', smtpError);
        return new Response(
          JSON.stringify({ error: `Failed to send email: ${smtpError instanceof Error ? smtpError.message : 'SMTP error'}` }),
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
            ? `${approvedUser.notes}\n[${new Date().toISOString()}] Invite sent via SMTP by ${caller.email}`
            : `[${new Date().toISOString()}] Invite sent via SMTP by ${caller.email}`
        })
        .eq('id', approvedUser.id);

      console.log(`Sent invite via SMTP to: ${email}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Invite email sent successfully via SMTP',
          email: email,
          is_existing_user: !!approvedUser.user_id,
          method: 'smtp',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fallback: Use Supabase Auth (has rate limits)
    console.log(`Using Supabase Auth for: ${email}`);

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
