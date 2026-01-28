// =============================================================================
// SEND BROADCAST EDGE FUNCTION
// Processes and delivers notification broadcasts to target recipients
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Batch size for processing recipients
const BATCH_SIZE = 500;

// Helper function for improved logging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-BROADCAST] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create a client with the ANON key for user authorization
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Validate the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !userData.user) {
      throw new Error('Unauthorized: Invalid token');
    }
    logStep("User authenticated", { userId: userData.user.id });

    // Check if user has admin privileges
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }

    const isAdmin = ['admin', 'super_admin', 'owner'].includes(profileData?.subscription_tier || '');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin privileges required' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    logStep("Admin privileges verified");

    // Parse the request body
    const { broadcast_id } = await req.json();
    if (!broadcast_id) {
      throw new Error("Missing required field: broadcast_id");
    }
    logStep("Request payload validated", { broadcast_id });

    // Get broadcast details
    const { data: broadcast, error: fetchError } = await supabaseAdmin
      .from('notification_broadcasts')
      .select('*')
      .eq('id', broadcast_id)
      .single();

    if (fetchError || !broadcast) {
      throw new Error(`Broadcast not found: ${fetchError?.message || 'Unknown error'}`);
    }
    logStep("Broadcast fetched", {
      title: broadcast.title,
      targetType: broadcast.target_type,
      status: broadcast.status
    });

    // Validate broadcast status
    if (!['approved', 'scheduled'].includes(broadcast.status)) {
      throw new Error(`Broadcast cannot be sent: status is '${broadcast.status}'`);
    }

    // Resolve recipients based on target_type
    let recipientIds: string[] = [];

    if (broadcast.target_type === 'global') {
      // Get all approved users
      const { data: users, error: usersError } = await supabaseAdmin
        .from('gh_approved_users')
        .select('user_id')
        .eq('is_approved', true);

      if (usersError) {
        throw new Error(`Error fetching users: ${usersError.message}`);
      }
      recipientIds = users?.map((u: { user_id: string }) => u.user_id) || [];
      logStep("Global recipients resolved", { count: recipientIds.length });

    } else if (broadcast.target_type === 'group') {
      // Get group members
      const { data: members, error: membersError } = await supabaseAdmin
        .from('user_notification_group_members')
        .select('user_id')
        .eq('group_id', broadcast.target_group_id);

      if (membersError) {
        throw new Error(`Error fetching group members: ${membersError.message}`);
      }
      recipientIds = members?.map((m: { user_id: string }) => m.user_id) || [];
      logStep("Group recipients resolved", { groupId: broadcast.target_group_id, count: recipientIds.length });

    } else if (broadcast.target_type === 'tier') {
      // Get users by tier
      const { data: users, error: usersError } = await supabaseAdmin
        .from('gh_approved_users')
        .select('user_id')
        .eq('tier', broadcast.target_tier)
        .eq('is_approved', true);

      if (usersError) {
        throw new Error(`Error fetching tier users: ${usersError.message}`);
      }
      recipientIds = users?.map((u: { user_id: string }) => u.user_id) || [];
      logStep("Tier recipients resolved", { tier: broadcast.target_tier, count: recipientIds.length });

    } else if (broadcast.target_type === 'individual') {
      // Use the specified user IDs
      recipientIds = broadcast.target_user_ids || [];
      logStep("Individual recipients resolved", { count: recipientIds.length });
    }

    if (recipientIds.length === 0) {
      throw new Error('No recipients found for this broadcast');
    }

    // Filter by consent preferences
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('user_id')
      .in('user_id', recipientIds)
      .eq('broadcast_consent', false);

    if (prefsError) {
      logStep("Warning: Error fetching preferences", { error: prefsError.message });
      // Continue anyway - default to opted-in
    } else {
      const optedOutIds = new Set(prefs?.map((p: { user_id: string }) => p.user_id) || []);
      const originalCount = recipientIds.length;
      recipientIds = recipientIds.filter(id => !optedOutIds.has(id));
      logStep("Consent filtering applied", {
        originalCount,
        optedOut: optedOutIds.size,
        remaining: recipientIds.length
      });
    }

    // Update broadcast status to 'sending' and set total recipients
    const { error: updateStartError } = await supabaseAdmin
      .from('notification_broadcasts')
      .update({
        total_recipients: recipientIds.length,
        status: 'sending',
        sent_at: new Date().toISOString()
      })
      .eq('id', broadcast_id);

    if (updateStartError) {
      throw new Error(`Error updating broadcast status: ${updateStartError.message}`);
    }
    logStep("Broadcast status updated to 'sending'", { totalRecipients: recipientIds.length });

    // Log the send action to audit log
    const { error: auditError } = await supabaseAdmin
      .from('notification_broadcast_audit_log')
      .insert({
        broadcast_id,
        actor_id: userData.user.id,
        action: 'sent',
        details: {
          total_recipients: recipientIds.length,
          target_type: broadcast.target_type
        }
      });

    if (auditError) {
      logStep("Warning: Error creating audit log entry", { error: auditError.message });
    }

    // Batch insert deliveries
    let deliveredCount = 0;

    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batch = recipientIds.slice(i, i + BATCH_SIZE);
      const deliveries = batch.map(user_id => ({
        broadcast_id,
        user_id,
        status: 'delivered',
        delivered_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabaseAdmin
        .from('notification_broadcast_deliveries')
        .upsert(deliveries, { onConflict: 'broadcast_id,user_id' });

      if (insertError) {
        logStep("Warning: Error inserting delivery batch", {
          batchStart: i,
          batchSize: batch.length,
          error: insertError.message
        });
        // Continue with next batch
        continue;
      }

      deliveredCount += batch.length;

      // Update delivered count on broadcast
      await supabaseAdmin
        .from('notification_broadcasts')
        .update({ delivered_count: deliveredCount })
        .eq('id', broadcast_id);

      logStep("Batch processed", {
        batchStart: i,
        batchSize: batch.length,
        totalDelivered: deliveredCount
      });
    }

    // Mark broadcast as sent
    const { error: updateCompleteError } = await supabaseAdmin
      .from('notification_broadcasts')
      .update({
        status: 'sent',
        delivered_count: deliveredCount
      })
      .eq('id', broadcast_id);

    if (updateCompleteError) {
      logStep("Warning: Error updating final status", { error: updateCompleteError.message });
    }

    logStep("Broadcast sent successfully", {
      broadcastId: broadcast_id,
      recipientsDelivered: deliveredCount
    });

    // Trigger realtime notification via broadcast channel
    // This notifies connected clients that a new broadcast is available
    try {
      await supabaseAdmin.channel('broadcast-notifications').send({
        type: 'broadcast',
        event: 'new_broadcast',
        payload: { broadcast_id }
      });
      logStep("Realtime notification sent");
    } catch (realtimeError) {
      logStep("Warning: Realtime notification failed", {
        error: realtimeError instanceof Error ? realtimeError.message : String(realtimeError)
      });
    }

    return new Response(JSON.stringify({
      success: true,
      broadcast_id,
      recipients_delivered: deliveredCount,
      total_recipients: recipientIds.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-broadcast", { message: errorMessage });

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
