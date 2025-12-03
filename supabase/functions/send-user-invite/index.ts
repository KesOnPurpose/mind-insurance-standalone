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
      tls: smtpPort === 465, // Implicit TLS for port 465, STARTTLS for port 587
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
  appUrl: string,
  isExistingUser: boolean = false
): string {
  const name = fullName || 'there';
  const actionText = isExistingUser ? 'Sign In to Mind Insurance' : 'Create Your Account';
  const bodyText = isExistingUser
    ? "You've been approved to access Mind Insurance! Click the button below to sign in and get started:"
    : "You've been approved to access Mind Insurance! Click the button below to create your account and get started:";

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

    <p>${bodyText}</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ${actionText}
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
  magicLink: string,
  isExistingUser: boolean = false
): string {
  const name = fullName || 'there';
  const actionText = isExistingUser ? 'sign in' : 'create your account';
  return `
Hi ${name},

You've been approved to access Mind Insurance!

Click this link to ${actionText} and get started:
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

    // Use the actual app URL
    const appUrl = Deno.env.get('APP_URL') || 'https://grouphome4newbies.com';
    const finalRedirectTo = payload.redirect_to || `${appUrl}/dashboard`;

    // Check if SMTP is configured for direct email sending
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    // Always use SMTP if configured (more reliable than inviteUserByEmail)
    const useDirectSMTP = smtpUser && smtpPass;

    if (useDirectSMTP && smtpUser && smtpPass) {
      // Direct SMTP path - bypasses Supabase rate limits and database trigger issues
      console.log(`Using direct SMTP for: ${email}`);

      // For NEW users: Don't create auth account - send signup link instead
      // For EXISTING users: Send OTP magic link
      let magicLink: string;

      if (existingUser) {
        // User exists - use admin.generateLink for existing user (doesn't trigger user creation)
        console.log(`Generating magic link for existing user: ${email}`);
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: finalRedirectTo,
          },
        });

        if (linkError) {
          console.error('Error generating magic link for existing user:', linkError);
          return new Response(
            JSON.stringify({ error: `Failed to generate login link: ${linkError.message}` }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const actionLink = linkData.properties?.action_link;
        if (!actionLink) {
          return new Response(
            JSON.stringify({ error: 'Failed to generate magic link URL for existing user' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        magicLink = actionLink;
      } else {
        // New user - send custom signup link (bypasses auth.users creation and trigger)
        // User will self-register when they click the link
        console.log(`Generating signup invitation link for new user: ${email}`);

        // Generate a secure token for the invite
        const inviteToken = crypto.randomUUID();

        // Store invite token in approved_users notes for verification
        const inviteData = {
          token: inviteToken,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        await supabaseAdmin
          .from('gh_approved_users')
          .update({
            notes: approvedUser.notes
              ? `${approvedUser.notes}\n[INVITE_TOKEN] ${JSON.stringify(inviteData)}`
              : `[INVITE_TOKEN] ${JSON.stringify(inviteData)}`
          })
          .eq('id', approvedUser.id);

        // Create signup link with pre-filled email and secure token
        magicLink = `${appUrl}/auth/signup?email=${encodeURIComponent(email)}&token=${inviteToken}&redirect_to=${encodeURIComponent(finalRedirectTo)}`;
      }

      // Send email via SMTP
      try {
        await sendEmailViaSMTP(
          email,
          "You're Invited to Mind Insurance",
          generateInviteEmailHTML(payload.full_name || approvedUser.full_name, magicLink, appUrl, !!existingUser),
          generateInviteEmailText(payload.full_name || approvedUser.full_name, magicLink, !!existingUser)
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
