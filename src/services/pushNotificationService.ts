/**
 * Push Notification Service
 *
 * Handles push notification subscription, registration, and management.
 * Uses the Web Push API with VAPID authentication.
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

export interface PushSubscriptionData {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

export interface PushPermissionStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
}

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('[Push] Service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('[Push] Error getting service worker:', error);
    return null;
  }
}

// ============================================================================
// PERMISSION MANAGEMENT
// ============================================================================

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) {
    console.log('[Push] Notifications not supported');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    console.log('[Push] Notification permission was denied');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return 'denied';
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get the VAPID public key from environment or Supabase
 * Note: In production, this should be stored securely
 */
async function getVapidPublicKey(): Promise<string | null> {
  // For now, we'll fetch this from a Supabase function or use a hardcoded value
  // In production, this should be in environment variables
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) throw error;
    return data?.publicKey || null;
  } catch (error) {
    console.error('[Push] Error getting VAPID key:', error);
    // Fallback to environment variable if available
    return import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
  }
}

/**
 * Convert a base64 string to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.log('[Push] Push not supported');
    return false;
  }

  try {
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('[Push] Permission not granted');
      return false;
    }

    // Get service worker registration
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      console.log('[Push] No service worker registration');
      return false;
    }

    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.error('[Push] No VAPID public key available');
      return false;
    }

    // Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[Push] Already subscribed');
      // Update Supabase with existing subscription
      await saveSubscriptionToSupabase(userId, existingSubscription);
      return true;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('[Push] Subscription created:', subscription);

    // Save to Supabase
    await saveSubscriptionToSupabase(userId, subscription);

    return true;
  } catch (error) {
    console.error('[Push] Subscription error:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('[Push] No active subscription');
      return true;
    }

    // Unsubscribe
    await subscription.unsubscribe();
    console.log('[Push] Unsubscribed successfully');

    // Remove from Supabase
    await removeSubscriptionFromSupabase(userId, subscription.endpoint);

    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return false;
  }
}

/**
 * Check if currently subscribed to push
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('[Push] Error checking subscription:', error);
    return false;
  }
}

/**
 * Get the full permission status
 */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  const isSupported = isPushSupported();
  const permission = getNotificationPermission();
  const isSubscribed = await isSubscribedToPush();

  return {
    isSupported,
    permission,
    isSubscribed
  };
}

// ============================================================================
// SUPABASE INTEGRATION
// ============================================================================

/**
 * Save a push subscription to Supabase
 */
async function saveSubscriptionToSupabase(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  const subscriptionJSON = subscription.toJSON();

  if (!subscriptionJSON.keys) {
    throw new Error('Subscription has no keys');
  }

  const subscriptionData: PushSubscriptionData = {
    endpoint: subscription.endpoint,
    p256dh_key: subscriptionJSON.keys.p256dh,
    auth_key: subscriptionJSON.keys.auth
  };

  // Use upsert to handle existing subscriptions
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: subscriptionData.endpoint,
      p256dh_key: subscriptionData.p256dh_key,
      auth_key: subscriptionData.auth_key,
      is_active: true
    }, {
      onConflict: 'user_id,endpoint'
    });

  if (error) {
    console.error('[Push] Error saving subscription:', error);
    throw error;
  }

  console.log('[Push] Subscription saved to Supabase');
}

/**
 * Remove a push subscription from Supabase
 */
async function removeSubscriptionFromSupabase(
  userId: string,
  endpoint: string
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Push] Error removing subscription:', error);
    throw error;
  }

  console.log('[Push] Subscription removed from Supabase');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize push notifications for the app
 * Call this on app startup
 */
export async function initializePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    console.log('[Push] Push notifications not supported in this browser');
    return;
  }

  try {
    // Register service worker
    await registerServiceWorker();
    console.log('[Push] Push notifications initialized');
  } catch (error) {
    console.error('[Push] Initialization error:', error);
  }
}
