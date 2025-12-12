import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get and manage user's timezone
 * - Fetches saved timezone from user_profiles
 * - Auto-detects and saves if not set
 * - Returns timezone string (IANA format like 'America/New_York')
 */
export function useUserTimezone(): string {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>(() => {
    // Default to browser timezone for immediate use
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  });

  useEffect(() => {
    const fetchAndSaveTimezone = async () => {
      if (!user?.id) return;

      try {
        // Get from profile
        const { data, error } = await supabase
          .from('user_profiles')
          .select('timezone')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('[useUserTimezone] Error fetching timezone:', error);
          return;
        }

        if (data?.timezone) {
          // Use saved timezone
          setTimezone(data.timezone);
        } else {
          // Auto-detect and save
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
          setTimezone(detected);

          // Save to profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ timezone: detected })
            .eq('id', user.id);

          if (updateError) {
            console.warn('[useUserTimezone] Error saving timezone:', updateError);
          }
        }
      } catch (err) {
        console.error('[useUserTimezone] Unexpected error:', err);
      }
    };

    fetchAndSaveTimezone();
  }, [user?.id]);

  return timezone;
}

/**
 * Format a timestamp in the user's timezone
 * Utility function that can be used outside of React components
 */
export function formatTimeInTimezone(
  timestamp: string | Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  };

  return date.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
}

/**
 * Get current hour in a specific timezone
 * Useful for time-based greetings and deadline checks
 */
export function getCurrentHourInTimezone(timezone: string): number {
  const now = new Date();
  const timeString = now.toLocaleString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  });
  return parseInt(timeString, 10);
}

export default useUserTimezone;
