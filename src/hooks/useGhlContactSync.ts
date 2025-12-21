/**
 * useGhlContactSync Hook
 *
 * Syncs user with GoHighLevel contact on login/signup.
 * If contact found by email, populates ghl_contact_id for SMS notifications.
 * If not found, user can opt-in via SMS settings.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface SyncResult {
  success: boolean;
  ghl_contact_id: string | null;
  source: 'existing' | 'matched' | 'created' | 'not_found';
  message?: string;
  ghl_contact?: {
    id: string;
    email: string;
    phone: string;
    name: string;
  };
}

interface UseGhlContactSyncReturn {
  isLoading: boolean;
  isSynced: boolean;
  ghlContactId: string | null;
  error: string | null;
  syncNow: () => Promise<SyncResult | null>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useGhlContactSync(): UseGhlContactSyncReturn {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [ghlContactId, setGhlContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if already synced from profile
  useEffect(() => {
    if (profile?.ghl_contact_id) {
      setGhlContactId(profile.ghl_contact_id);
      setIsSynced(true);
    }
  }, [profile]);

  // Sync function
  const syncNow = useCallback(async (): Promise<SyncResult | null> => {
    if (!user?.id || !user?.email) {
      setError('User not authenticated');
      return null;
    }

    // Already synced
    if (profile?.ghl_contact_id) {
      return {
        success: true,
        ghl_contact_id: profile.ghl_contact_id,
        source: 'existing',
        message: 'Already synced',
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'sync-ghl-contact',
        {
          body: {
            user_id: user.id,
            email: user.email,
            full_name: profile?.full_name || undefined,
            create_if_not_found: false, // Only match existing, don't create
          },
        }
      );

      if (invokeError) {
        console.error('[GHL Sync] Error:', invokeError);
        setError(invokeError.message);
        return null;
      }

      const result = data as SyncResult;

      if (result.success && result.ghl_contact_id) {
        setGhlContactId(result.ghl_contact_id);
        setIsSynced(true);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[GHL Sync] Exception:', err);
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  // Auto-sync on first load if not already synced
  useEffect(() => {
    if (user?.id && user?.email && !profile?.ghl_contact_id && !isLoading && !isSynced) {
      // Delay slightly to avoid race with profile loading
      const timer = setTimeout(() => {
        syncNow();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, profile, isLoading, isSynced, syncNow]);

  return {
    isLoading,
    isSynced,
    ghlContactId,
    error,
    syncNow,
  };
}

// ============================================================================
// CREATE GHL CONTACT (for SMS Opt-In)
// ============================================================================

export async function createGhlContact(
  userId: string,
  email: string,
  phone: string,
  fullName?: string
): Promise<SyncResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-ghl-contact', {
      body: {
        user_id: userId,
        email,
        phone,
        full_name: fullName,
        create_if_not_found: true,
        send_welcome_sms: true, // Send welcome SMS on opt-in
      },
    });

    if (error) {
      console.error('[GHL Create] Error:', error);
      return null;
    }

    return data as SyncResult;
  } catch (err) {
    console.error('[GHL Create] Exception:', err);
    return null;
  }
}

export default useGhlContactSync;
