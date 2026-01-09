/**
 * useUnstartedProtocol Hook
 * Protocol Unlock + Hub Tour System
 *
 * Detects protocols with `started_at === null` and manages modal/badge state.
 * Supports behavioral science-driven engagement:
 * - Zeigarnik Effect: Create "open loop" about incomplete transformation
 * - Variable Reward Anticipation: Tease what's waiting
 * - Identity Priming: Reference their detected pattern
 * - Commitment Consistency: They took assessment, protocol is next step
 * - Loss Aversion: "7-day window is open"
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveInsightProtocol } from '@/services/mioInsightProtocolService';
import { hasCompletedFirstEngagement } from '@/services/mioInsightsThreadService';
import { useIdentityCollisionStatus } from '@/hooks/useIdentityCollisionStatus';
import type { MIOInsightProtocolWithProgress } from '@/types/protocol';

// ============================================================================
// TYPES
// ============================================================================

export type PatternType = 'past_prison' | 'success_sabotage' | 'compass_crisis';

export interface UnstartedProtocolData {
  id: string;
  title: string;
  insightSummary: string;
  whyItMatters?: string;
  neuralPrinciple?: string;
  patternType: PatternType;
  daysTotal: number;
  createdAt: string;
}

export interface UseUnstartedProtocolReturn {
  unstartedProtocol: UnstartedProtocolData | null;
  activeProtocol: UnstartedProtocolData | null;  // Protocol data for active (started) protocols
  isLoading: boolean;
  hasUnstartedProtocol: boolean;
  isNewUser: boolean;         // Has completed first engagement with MIO
  isReturningUser: boolean;   // Has protocol but no first engagement
  shouldShowModal: boolean;
  dismissModal: () => void;
  showBadge: boolean;
  refreshProtocol: () => Promise<void>;
  setModalDelay: () => void;  // Set 30-min delay (call when tour completes)
  // Daily modal support (for active protocols)
  currentDay: number;                  // Current day of active protocol (1-7)
  shouldShowDailyModal: boolean;       // Show modal for current day
  dismissDailyModal: () => void;       // Dismiss daily modal for today
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODAL_DISMISSED_KEY_PREFIX = 'protocol_unlock_modal_dismissed_';
const MODAL_DISMISSED_AT_KEY_PREFIX = 'protocol_unlock_modal_dismissed_at_';
const BADGE_DISMISSED_KEY_PREFIX = 'protocol_badge_dismissed_';
const DAILY_MODAL_SHOWN_KEY_PREFIX = 'protocol_daily_modal_shown_';
const MODAL_DELAY_KEY = 'protocol_modal_delayed_until';
const MODAL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const MODAL_DELAY_MS = 30 * 60 * 1000; // 30 minutes delay after tour
const BADGE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get localStorage key for a specific protocol
 */
function getModalDismissedKey(protocolId: string): string {
  return `${MODAL_DISMISSED_KEY_PREFIX}${protocolId}`;
}

function getModalDismissedAtKey(protocolId: string): string {
  return `${MODAL_DISMISSED_AT_KEY_PREFIX}${protocolId}`;
}

function getBadgeDismissedKey(protocolId: string): string {
  return `${BADGE_DISMISSED_KEY_PREFIX}${protocolId}`;
}

/**
 * Get today's date as YYYY-MM-DD string for daily modal tracking
 */
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if modal is in delay period (after tour completion)
 * Returns true if we're still within the delay window
 */
function isModalDelayed(): boolean {
  try {
    const delayedUntil = localStorage.getItem(MODAL_DELAY_KEY);
    if (!delayedUntil) return false;
    const delayEndTime = parseInt(delayedUntil, 10);
    const isDelayed = Date.now() < delayEndTime;
    if (isDelayed) {
      const remainingMs = delayEndTime - Date.now();
      console.log('[useUnstartedProtocol] Modal delayed for', Math.round(remainingMs / 1000 / 60), 'more minutes');
    }
    return isDelayed;
  } catch {
    return false;
  }
}

/**
 * Set modal delay (called when tour completes to prevent overwhelming user)
 */
function setModalDelayFn(): void {
  try {
    const delayUntil = Date.now() + MODAL_DELAY_MS;
    localStorage.setItem(MODAL_DELAY_KEY, delayUntil.toString());
    console.log('[useUnstartedProtocol] Modal delayed for 30 minutes');
  } catch (error) {
    console.error('[useUnstartedProtocol] Error setting modal delay:', error);
  }
}

/**
 * Get localStorage key for daily modal shown check
 * Format: protocol_daily_modal_shown_{protocolId}_{date}
 */
function getDailyModalShownKey(protocolId: string, date: string): string {
  return `${DAILY_MODAL_SHOWN_KEY_PREFIX}${protocolId}_${date}`;
}

/**
 * Check if daily modal has been shown today
 */
function hasDailyModalBeenShownToday(protocolId: string): boolean {
  try {
    const today = getTodayDateString();
    const key = getDailyModalShownKey(protocolId, today);
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark daily modal as shown for today
 */
function markDailyModalShown(protocolId: string): void {
  try {
    const today = getTodayDateString();
    const key = getDailyModalShownKey(protocolId, today);
    localStorage.setItem(key, 'true');
  } catch (error) {
    console.error('[useUnstartedProtocol] Error marking daily modal shown:', error);
  }
}

/**
 * Check if modal should be shown based on cooldown
 * Returns true if never dismissed, or if 24h have passed since dismissal
 */
function shouldShowModalForProtocol(protocolId: string): boolean {
  try {
    const dismissedAt = localStorage.getItem(getModalDismissedAtKey(protocolId));
    if (!dismissedAt) {
      return true; // Never dismissed
    }

    const dismissedTime = parseInt(dismissedAt, 10);
    const timeSinceDismissal = Date.now() - dismissedTime;

    // Re-show after 24h cooldown (with escalated urgency)
    return timeSinceDismissal >= MODAL_COOLDOWN_MS;
  } catch {
    return true;
  }
}

/**
 * Check if badge should be shown
 * Returns true if protocol is within 7 days and not manually dismissed
 */
function shouldShowBadgeForProtocol(protocolId: string, protocolCreatedAt: string): boolean {
  try {
    // Check if manually dismissed
    const badgeDismissed = localStorage.getItem(getBadgeDismissedKey(protocolId));
    if (badgeDismissed === 'true') {
      return false;
    }

    // Check if within 7-day window
    const createdTime = new Date(protocolCreatedAt).getTime();
    const protocolAge = Date.now() - createdTime;

    return protocolAge < BADGE_LIFETIME_MS;
  } catch {
    return true;
  }
}

/**
 * Map primary pattern to pattern type
 */
function normalizePatternType(pattern: string | null): PatternType {
  if (!pattern) return 'past_prison'; // Default fallback

  const normalized = pattern.toLowerCase().replace(/ /g, '_');

  if (normalized === 'success_sabotage') return 'success_sabotage';
  if (normalized === 'compass_crisis') return 'compass_crisis';
  return 'past_prison';
}

// ============================================================================
// HOOK
// ============================================================================

export function useUnstartedProtocol(): UseUnstartedProtocolReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // Pattern detection for identity-primed messaging
  const { data: patternStatus } = useIdentityCollisionStatus(userId);

  // State
  const [protocol, setProtocol] = useState<MIOInsightProtocolWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFirstEngagement, setHasFirstEngagement] = useState<boolean | null>(null);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Fetch active protocol and first engagement status
  const fetchProtocolData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch both in parallel
      const [activeProtocol, firstEngagementStatus] = await Promise.all([
        getActiveInsightProtocol(userId),
        hasCompletedFirstEngagement(userId),
      ]);

      // Debug logging
      console.log('[useUnstartedProtocol] Fetched data:', {
        hasProtocol: !!activeProtocol,
        protocolId: activeProtocol?.id,
        protocolStatus: activeProtocol?.status,
        protocolStartedAt: activeProtocol?.started_at,
        protocolDaysCompleted: activeProtocol?.days_completed,
        firstEngagementStatus,
      });

      setProtocol(activeProtocol);
      setHasFirstEngagement(firstEngagementStatus);
      setLastFetchTime(Date.now());

      // Check if modal was dismissed for this specific protocol
      if (activeProtocol?.id) {
        const shouldShow = shouldShowModalForProtocol(activeProtocol.id);
        console.log('[useUnstartedProtocol] Modal dismissal check:', {
          protocolId: activeProtocol.id,
          shouldShowFromStorage: shouldShow,
          settingModalDismissed: !shouldShow,
        });
        setModalDismissed(!shouldShow);
      }
    } catch (error) {
      console.error('[useUnstartedProtocol] Error fetching protocol data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchProtocolData();
  }, [fetchProtocolData]);

  // Computed: Is this an unstarted protocol?
  // Note: The RPC function doesn't return a 'status' field, so we check:
  // 1. Protocol exists
  // 2. started_at is null (not yet started)
  // 3. days_completed is 0 (no days done)
  const isUnstartedProtocol = useMemo(() => {
    if (!protocol) return false;

    // Debug: log the actual status value
    console.log('[useUnstartedProtocol] Protocol check:', {
      hasProtocol: true,
      status: protocol.status,
      started_at: protocol.started_at,
      days_completed: protocol.days_completed,
    });

    // Check if protocol is unstarted - don't require status field since RPC doesn't return it
    // A protocol is "unstarted" if:
    // - started_at is null (hasn't been started yet)
    // - days_completed is 0 (no progress)
    // - status is either undefined (RPC) or 'active' (direct query)
    const statusOk = protocol.status === undefined || protocol.status === 'active';
    const notStarted = protocol.started_at === null;
    const noDaysCompleted = protocol.days_completed === 0;

    return statusOk && notStarted && noDaysCompleted;
  }, [protocol]);

  // Computed: Is this an active (started but not completed) protocol?
  const isActiveProtocol = useMemo(() => {
    if (!protocol) return false;
    // Protocol is active if:
    // - It has been started (started_at is not null)
    // - It's not completed (days_completed < 7)
    // - Status is active (if defined)
    const hasStarted = protocol.started_at !== null;
    const notCompleted = (protocol.days_completed ?? 0) < 7;
    const statusOk = protocol.status === undefined || protocol.status === 'active';
    return hasStarted && notCompleted && statusOk;
  }, [protocol]);

  // Computed: Transform protocol to simplified data structure (for unstarted)
  const unstartedProtocolData = useMemo((): UnstartedProtocolData | null => {
    if (!protocol || !isUnstartedProtocol) return null;

    return {
      id: protocol.id,
      title: protocol.title,
      insightSummary: protocol.insight_summary,
      whyItMatters: protocol.why_it_matters,
      neuralPrinciple: protocol.neural_principle,
      patternType: normalizePatternType(patternStatus?.primaryPattern ?? null),
      daysTotal: protocol.day_tasks?.length || 7,
      createdAt: protocol.created_at,
    };
  }, [protocol, isUnstartedProtocol, patternStatus?.primaryPattern]);

  // Computed: Transform protocol to simplified data structure (for active - daily modal)
  const activeProtocolData = useMemo((): UnstartedProtocolData | null => {
    if (!protocol || !isActiveProtocol) return null;

    return {
      id: protocol.id,
      title: protocol.title,
      insightSummary: protocol.insight_summary,
      whyItMatters: protocol.why_it_matters,
      neuralPrinciple: protocol.neural_principle,
      patternType: normalizePatternType(patternStatus?.primaryPattern ?? null),
      daysTotal: protocol.day_tasks?.length || 7,
      createdAt: protocol.created_at,
    };
  }, [protocol, isActiveProtocol, patternStatus?.primaryPattern]);

  // Computed: User type classification
  const isNewUser = hasFirstEngagement === true;
  const isReturningUser = hasFirstEngagement === false && isUnstartedProtocol;

  // Computed: Should show modal?
  // Only show if:
  // 1. There's an unstarted protocol
  // 2. Modal hasn't been dismissed (or 24h cooldown passed)
  // 3. Modal is not in delay period (after tour completion)
  // 4. User has completed first engagement (for new user modal)
  //    OR is a returning user without first engagement
  const shouldShowModal = useMemo(() => {
    if (!isUnstartedProtocol || !protocol?.id) return false;
    if (modalDismissed) return false;

    // Don't show modal until we know engagement status
    if (hasFirstEngagement === null) return false;

    // Check if modal is in delay period (after tour completion)
    if (isModalDelayed()) return false;

    // Show modal if user completed first engagement (new user)
    // OR if user is returning without first engagement
    return isNewUser || isReturningUser;
  }, [isUnstartedProtocol, protocol?.id, modalDismissed, hasFirstEngagement, isNewUser, isReturningUser]);

  // Computed: Should show badge?
  // Show badge after modal dismissed, within 7-day window
  const showBadge = useMemo(() => {
    if (!isUnstartedProtocol || !protocol?.id) return false;

    // Only show badge if modal was dismissed
    if (!modalDismissed) return false;

    return shouldShowBadgeForProtocol(protocol.id, protocol.created_at);
  }, [isUnstartedProtocol, protocol, modalDismissed]);

  // ========== DAILY MODAL SUPPORT (for active protocols) ==========

  // Computed: Current day of the active protocol (1-7)
  // Days completed + 1 = current day user should be on
  const currentDay = useMemo(() => {
    if (!protocol || !isActiveProtocol) return 1;
    const daysCompleted = protocol.days_completed ?? 0;
    // Current day is days_completed + 1, capped at 7
    return Math.min(daysCompleted + 1, 7);
  }, [protocol, isActiveProtocol]);

  // State: Track if daily modal was dismissed today
  const [dailyModalDismissed, setDailyModalDismissed] = useState<boolean>(() => {
    if (!protocol?.id) return false;
    return hasDailyModalBeenShownToday(protocol.id);
  });

  // Update daily modal dismissed state when protocol changes
  useEffect(() => {
    if (protocol?.id) {
      setDailyModalDismissed(hasDailyModalBeenShownToday(protocol.id));
    }
  }, [protocol?.id]);

  // Computed: Should show daily modal?
  // Show if: active protocol, not shown today, not on day 1 (handled by main modal)
  const shouldShowDailyModal = useMemo(() => {
    if (!isActiveProtocol || !protocol?.id) return false;
    if (dailyModalDismissed) return false;
    // Only show daily modal for days 2-7 (day 1 is handled by main unlock modal)
    return currentDay > 1;
  }, [isActiveProtocol, protocol?.id, dailyModalDismissed, currentDay]);

  // Debug: Log computed values when they change
  useEffect(() => {
    if (!isLoading) {
      console.log('[useUnstartedProtocol] Computed values:', {
        isUnstartedProtocol,
        hasFirstEngagement,
        isNewUser,
        isReturningUser,
        modalDismissed,
        shouldShowModal,
        showBadge,
      });
    }
  }, [isLoading, isUnstartedProtocol, hasFirstEngagement, isNewUser, isReturningUser, modalDismissed, shouldShowModal, showBadge]);

  // Dismiss modal handler
  const dismissModal = useCallback(() => {
    if (!protocol?.id) return;

    try {
      const key = getModalDismissedKey(protocol.id);
      const atKey = getModalDismissedAtKey(protocol.id);

      localStorage.setItem(key, 'true');
      localStorage.setItem(atKey, Date.now().toString());
      setModalDismissed(true);

      console.log('[useUnstartedProtocol] Modal dismissed for protocol:', protocol.id);
    } catch (error) {
      console.error('[useUnstartedProtocol] Error saving modal dismissal:', error);
    }
  }, [protocol?.id]);

  // Dismiss daily modal handler (marks as shown for today)
  const dismissDailyModal = useCallback(() => {
    if (!protocol?.id) return;

    markDailyModalShown(protocol.id);
    setDailyModalDismissed(true);
    console.log('[useUnstartedProtocol] Daily modal dismissed for protocol:', protocol.id, 'day:', currentDay);
  }, [protocol?.id, currentDay]);

  // Refresh protocol data (exposed for manual refresh)
  const refreshProtocol = useCallback(async () => {
    await fetchProtocolData();
  }, [fetchProtocolData]);

  return {
    unstartedProtocol: unstartedProtocolData,
    activeProtocol: activeProtocolData,
    isLoading,
    hasUnstartedProtocol: isUnstartedProtocol,
    isNewUser,
    isReturningUser,
    shouldShowModal,
    dismissModal,
    showBadge,
    refreshProtocol,
    setModalDelay: setModalDelayFn,  // Call when tour completes to delay modal 30 min
    // Daily modal support
    currentDay,
    shouldShowDailyModal,
    dismissDailyModal,
  };
}

export default useUnstartedProtocol;
