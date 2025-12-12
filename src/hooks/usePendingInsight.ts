/**
 * usePendingInsight Hook
 *
 * Manages the pending MIO insight notification that appears after section completion.
 * Persists to localStorage so the banner survives navigation and page refreshes.
 *
 * Features:
 * - Auto-expires after 24 hours
 * - Clears when user views or dismisses
 * - Shared across all Mind Insurance pages
 */

import { useState, useEffect, useCallback } from 'react';
import { PendingInsight } from '@/components/mind-insurance/MIOInsightBanner';

const PENDING_INSIGHT_KEY = 'mio_pending_insight';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UsePendingInsightReturn {
  pendingInsight: PendingInsight | null;
  setPendingInsight: (insight: Omit<PendingInsight, 'timestamp'>) => void;
  clearPendingInsight: () => void;
  hasPendingInsight: boolean;
}

export function usePendingInsight(): UsePendingInsightReturn {
  const [pendingInsight, setPendingInsightState] = useState<PendingInsight | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PENDING_INSIGHT_KEY);
      if (stored) {
        const parsed: PendingInsight = JSON.parse(stored);

        // Check if expired (older than 24 hours)
        if (Date.now() - parsed.timestamp < EXPIRY_MS) {
          setPendingInsightState(parsed);
        } else {
          // Clean up expired insight
          localStorage.removeItem(PENDING_INSIGHT_KEY);
        }
      }
    } catch (error) {
      console.error('[usePendingInsight] Error loading from localStorage:', error);
      localStorage.removeItem(PENDING_INSIGHT_KEY);
    }
  }, []);

  // Set a new pending insight
  const setPendingInsight = useCallback((insight: Omit<PendingInsight, 'timestamp'>) => {
    const fullInsight: PendingInsight = {
      ...insight,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(PENDING_INSIGHT_KEY, JSON.stringify(fullInsight));
      setPendingInsightState(fullInsight);
      console.log('[usePendingInsight] Saved pending insight:', fullInsight);
    } catch (error) {
      console.error('[usePendingInsight] Error saving to localStorage:', error);
    }
  }, []);

  // Clear the pending insight
  const clearPendingInsight = useCallback(() => {
    try {
      localStorage.removeItem(PENDING_INSIGHT_KEY);
      setPendingInsightState(null);
      console.log('[usePendingInsight] Cleared pending insight');
    } catch (error) {
      console.error('[usePendingInsight] Error clearing localStorage:', error);
    }
  }, []);

  return {
    pendingInsight,
    setPendingInsight,
    clearPendingInsight,
    hasPendingInsight: pendingInsight !== null
  };
}

export default usePendingInsight;
