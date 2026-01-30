/**
 * GHCF Webhook Handler Edge Function
 * FEAT-GHCF-002: Processes contract_signed and payment_received webhooks
 * from N8N (which receives them from GHL).
 *
 * Flow: GHL -> N8N -> this Edge Function -> gh_approved_users + ghl_enrollment_log
 *
 * Design rules:
 * - Idempotency via ghl_enrollment_log.idempotency_key (UNIQUE)
 * - UPSERT with COALESCE to merge webhook data without overwriting
 * - Service role key only (server-side)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  webhook_type: 'contract_signed' | 'payment_received';
  contact_email: string;
  contact_name: string;
  ghl_contact_id: string;
  idempotency_key: string;
  raw_payload: Record<string, unknown>;
  whop_membership_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: WebhookPayload = await req.json();
    const {
      webhook_type,
      contact_email,
      contact_name,
      ghl_contact_id,
      idempotency_key,
      raw_payload,
      whop_membership_id,
    } = body;

    // Input validation
    if (!webhook_type || !contact_email || !idempotency_key) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required fields: webhook_type, contact_email, idempotency_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['contract_signed', 'payment_received'].includes(webhook_type)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid webhook_type. Must be contract_signed or payment_received' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check idempotency - if key exists, return early (already processed)
    const { data: existing } = await supabase
      .from('ghl_enrollment_log')
      .select('id, processing_status')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existing) {
      console.log(`Duplicate webhook detected: ${idempotency_key}, status: ${existing.processing_status}`);
      return new Response(
        JSON.stringify({ status: 'duplicate', message: 'Already processed', existing_status: existing.processing_status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Log the webhook
    const { error: logError } = await supabase.from('ghl_enrollment_log').insert({
      idempotency_key,
      webhook_type,
      ghl_contact_id: ghl_contact_id || null,
      email: contact_email.toLowerCase(),
      full_name: contact_name || null,
      raw_payload: raw_payload || {},
      processing_status: 'processing',
    });

    if (logError) {
      // If insert fails due to unique constraint, it's a race condition duplicate
      if (logError.code === '23505') {
        return new Response(
          JSON.stringify({ status: 'duplicate', message: 'Already processed (race condition)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Failed to log webhook:', logError);
    }

    // 3. UPSERT into gh_approved_users via RPC
    let upsertError: string | null = null;

    if (webhook_type === 'contract_signed') {
      const { error } = await supabase.rpc('upsert_approved_user_contract', {
        p_email: contact_email,
        p_full_name: contact_name || null,
        p_ghl_contact_id: ghl_contact_id || null,
        p_contract_signed_at: new Date().toISOString(),
        p_enrollment_source: 'ghcf_contract',
      });
      if (error) {
        upsertError = error.message;
        console.error('Contract upsert error:', error);
      }
    } else if (webhook_type === 'payment_received') {
      const { error } = await supabase.rpc('upsert_approved_user_payment', {
        p_email: contact_email,
        p_full_name: contact_name || null,
        p_ghl_contact_id: ghl_contact_id || null,
        p_whop_membership_id: whop_membership_id || null,
        p_payment_verified_at: new Date().toISOString(),
        p_enrollment_source: 'ghcf_payment',
      });
      if (error) {
        upsertError = error.message;
        console.error('Payment upsert error:', error);
      }
    }

    // 4. Update log status
    const finalStatus = upsertError ? 'failed' : 'completed';
    await supabase
      .from('ghl_enrollment_log')
      .update({
        processing_status: finalStatus,
        processed_at: new Date().toISOString(),
        error_message: upsertError,
      })
      .eq('idempotency_key', idempotency_key);

    if (upsertError) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Upsert failed', detail: upsertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Webhook processed successfully: ${webhook_type} for ${contact_email}`);

    return new Response(
      JSON.stringify({ status: 'success', webhook_type, email: contact_email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ghcf-webhook-handler error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
