// User Invite Service
// Handles sending invite emails to approved users via Supabase Edge Function

import { supabase } from '@/integrations/supabase/client';

interface SendInviteParams {
  email: string;
  full_name?: string;
  redirect_to?: string;
}

interface SendInviteResponse {
  success: boolean;
  message: string;
  email: string;
  user_id?: string;
  is_existing_user?: boolean;
}

/**
 * Send an invite email to an approved user
 * This calls the send-user-invite Edge Function which:
 * 1. Verifies the caller is an admin
 * 2. Verifies the email is in the approved list
 * 3. Sends a magic link email via Supabase Auth
 */
export async function sendUserInvite(params: SendInviteParams): Promise<SendInviteResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await supabase.functions.invoke('send-user-invite', {
    body: {
      email: params.email,
      full_name: params.full_name,
      redirect_to: params.redirect_to,
    },
  });

  if (response.error) {
    // Try to extract error message from response data
    const errorMsg = response.data?.error || response.data?.message || response.error.message || 'Failed to send invite';
    console.error('Invite error details:', { error: response.error, data: response.data });
    throw new Error(errorMsg);
  }

  return response.data as SendInviteResponse;
}

/**
 * Send invites to multiple users
 * Returns results for each email
 */
export async function sendBulkInvites(
  emails: string[],
  options?: { redirect_to?: string }
): Promise<{
  success: string[];
  failed: { email: string; error: string }[];
}> {
  const results = {
    success: [] as string[],
    failed: [] as { email: string; error: string }[],
  };

  // Process sequentially to avoid rate limiting
  for (const email of emails) {
    try {
      await sendUserInvite({
        email,
        redirect_to: options?.redirect_to,
      });
      results.success.push(email);
    } catch (error) {
      results.failed.push({
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}
