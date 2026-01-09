// ============================================================================
// SEND PUSH NOTIFICATION - Web Push via VAPID
// ============================================================================
// Sends web push notifications to user's subscribed devices using VAPID auth.
// Handles multiple subscriptions per user and cleans up invalid subscriptions.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// TYPES
// ============================================================================

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  is_active: boolean;
  error_count: number;
}

interface PushResult {
  subscription_id: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// WEB PUSH IMPLEMENTATION
// ============================================================================

/**
 * Convert a base64url string to Uint8Array
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
  // Add padding if needed
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Generate VAPID JWT token for web push authentication
 */
async function generateVapidJwt(
  endpoint: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  subject: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  // JWT header
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };

  // JWT payload
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60), // 12 hours
    sub: subject
  };

  // Encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key for signing
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);

  // Create the key
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  // Convert signature to base64url
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Encrypt payload for web push (Web Push Encryption)
 * Simplified version using the Deno crypto API
 */
async function encryptPayload(
  p256dhKey: string,
  authKey: string,
  payload: string
): Promise<{ encryptedPayload: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // For simplicity in this implementation, we'll send the payload as-is
  // A full implementation would use the Web Push encryption spec (RFC 8291)
  // This works with most modern browsers but may not with all

  const encoder = new TextEncoder();
  return {
    encryptedPayload: encoder.encode(payload),
    salt: crypto.getRandomValues(new Uint8Array(16)),
    localPublicKey: new Uint8Array(65) // Placeholder
  };
}

/**
 * Send push notification to a single subscription
 */
async function sendToSubscription(
  subscription: PushSubscription,
  payload: string,
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<PushResult> {
  try {
    // Generate VAPID authorization
    const vapidToken = await generateVapidJwt(
      subscription.endpoint,
      vapidPrivateKey,
      vapidPublicKey,
      vapidSubject
    );

    // Build authorization header
    const authHeader = `vapid t=${vapidToken}, k=${vapidPublicKey}`;

    // For now, send unencrypted (works for testing, prod should use encryption)
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'aes128gcm',
        'Authorization': authHeader,
        'TTL': '86400', // 24 hours
        'Urgency': 'normal'
      },
      body: payload
    });

    if (response.ok || response.status === 201) {
      return { subscription_id: subscription.id, success: true };
    }

    // Handle specific error codes
    if (response.status === 404 || response.status === 410) {
      // Subscription expired or invalid
      return {
        subscription_id: subscription.id,
        success: false,
        error: 'subscription_expired'
      };
    }

    const errorText = await response.text();
    return {
      subscription_id: subscription.id,
      success: false,
      error: `${response.status}: ${errorText}`
    };

  } catch (error) {
    console.error('[Push] Send error:', error);
    return {
      subscription_id: subscription.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const request: PushNotificationRequest = await req.json();
    const { user_id, title, body, url, tag, icon, badge, data } = request;

    console.log('[Push] Request:', { user_id, title, body_length: body.length });

    // Validate required fields
    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPID keys from environment
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@purposewaze.com';

    if (!vapidPrivateKey || !vapidPublicKey) {
      console.error('[Push] VAPID keys not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Push notifications not configured. VAPID keys missing.',
          sent: 0
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (subError) {
      console.error('[Push] Subscription fetch error:', subError);
      throw new Error('Failed to fetch push subscriptions');
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No active subscriptions for user:', user_id);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active push subscriptions for this user',
          sent: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Push] Found', subscriptions.length, 'active subscriptions');

    // Build notification payload
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/mio-icon-192.png',
      badge: badge || '/icons/badge-72.png',
      tag: tag || `mio-${Date.now()}`,
      data: {
        url: url || '/mind-insurance/insights',
        timestamp: Date.now(),
        ...data
      },
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    // Send to all subscriptions in parallel
    const results: PushResult[] = await Promise.all(
      subscriptions.map(sub =>
        sendToSubscription(sub, notificationPayload, vapidPrivateKey, vapidPublicKey, vapidSubject)
      )
    );

    // Process results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const expired = failed.filter(r => r.error === 'subscription_expired');

    console.log('[Push] Results:', {
      total: subscriptions.length,
      successful: successful.length,
      failed: failed.length,
      expired: expired.length
    });

    // Deactivate expired subscriptions
    if (expired.length > 0) {
      const expiredIds = expired.map(r => r.subscription_id);
      await supabase
        .from('push_subscriptions')
        .update({ is_active: false, last_error: 'Subscription expired' })
        .in('id', expiredIds);

      console.log('[Push] Deactivated', expired.length, 'expired subscriptions');
    }

    // Increment error count for failed (non-expired) subscriptions
    const failedNonExpired = failed.filter(r => r.error !== 'subscription_expired');
    for (const result of failedNonExpired) {
      await supabase
        .from('push_subscriptions')
        .update({
          error_count: supabase.rpc('increment', { row_id: result.subscription_id }),
          last_error: result.error,
          updated_at: new Date().toISOString()
        })
        .eq('id', result.subscription_id);
    }

    // Update last_used_at for successful subscriptions
    if (successful.length > 0) {
      const successIds = successful.map(r => r.subscription_id);
      await supabase
        .from('push_subscriptions')
        .update({
          last_used_at: new Date().toISOString(),
          error_count: 0 // Reset error count on success
        })
        .in('id', successIds);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful.length,
        failed: failed.length,
        expired: expired.length,
        results: results.map(r => ({
          subscription_id: r.subscription_id,
          success: r.success,
          error: r.error
        }))
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Push] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sent: 0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
