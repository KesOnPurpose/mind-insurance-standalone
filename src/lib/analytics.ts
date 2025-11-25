import { supabase } from '@/integrations/supabase/client';

// Analytics event types
export type AnalyticsEventName =
  | 'protocol_viewed'
  | 'language_variant_changed'
  | 'tooltip_hovered'
  | 'tooltip_clicked'
  | 'protocol_completed'
  | 'protocol_abandoned'
  | 'glossary_term_viewed';

// Event properties interface
export interface EventProperties {
  [key: string]: any;
  protocol_id?: string;
  language_variant?: 'clinical' | 'simplified';
  term?: string;
  definition?: string;
  time_spent_seconds?: number;
  tooltip_interactions?: number;
  completion_percentage?: number;
  has_simplified_version?: boolean;
  tooltip_count?: number;
}

// Session management
let sessionId: string | null = null;
let sessionStartTime: number = Date.now();

/**
 * Generate or retrieve the current session ID
 */
function getSessionId(): string {
  if (!sessionId) {
    // Check if we have a session in sessionStorage
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      sessionId = stored;
    } else {
      // Generate new session ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
      sessionStartTime = Date.now();
    }
  }
  return sessionId;
}

/**
 * Get the current user ID from Supabase auth
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  properties: EventProperties = {}
): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    // Don't track if no user is logged in (optional - remove if you want anonymous tracking)
    if (!userId) {
      console.log('Analytics: No user logged in, skipping event:', eventName);
      return;
    }

    const event = {
      user_id: userId,
      event_name: eventName,
      event_properties: properties,
      timestamp: new Date().toISOString(),
      session_id: getSessionId(),
      session_duration_ms: Date.now() - sessionStartTime,
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      device_pixel_ratio: window.devicePixelRatio,
      device_type: getDeviceType(),
      browser: getBrowserName(),
      platform: navigator.platform,
      url: window.location.pathname,
      referrer: document.referrer || null,
    };

    // Insert to Supabase analytics table
    const { error } = await supabase
      .from('protocol_analytics_events')
      .insert(event);

    if (error) {
      console.error('Analytics error:', error);
      // Don't throw - we don't want analytics failures to break the app
    } else {
      console.log(`Analytics: ${eventName} tracked`, properties);
    }
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    // Silent fail - analytics should never break the app
  }
}

/**
 * Get device type based on viewport width
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get browser name from user agent
 */
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Other';
}

// Convenience functions for common events

/**
 * Track when a protocol is viewed
 */
export function trackProtocolViewed(
  protocolId: string,
  variant: 'clinical' | 'simplified',
  hasSimplifiedVersion: boolean,
  tooltipCount: number = 0
): void {
  trackEvent('protocol_viewed', {
    protocol_id: protocolId,
    language_variant: variant,
    has_simplified_version: hasSimplifiedVersion,
    tooltip_count: tooltipCount,
  });
}

/**
 * Track language variant change
 */
export function trackLanguageVariantChanged(
  from: 'clinical' | 'simplified',
  to: 'clinical' | 'simplified',
  protocolId?: string
): void {
  trackEvent('language_variant_changed', {
    from_variant: from,
    to_variant: to,
    protocol_id: protocolId,
  });
}

/**
 * Track tooltip interaction
 */
export function trackTooltipInteraction(
  action: 'hover' | 'click',
  term: string,
  definition: string,
  protocolId?: string
): void {
  const eventName = action === 'hover' ? 'tooltip_hovered' : 'tooltip_clicked';
  trackEvent(eventName, {
    term,
    definition,
    protocol_id: protocolId,
    language_variant: 'simplified', // Tooltips only appear in simplified mode
  });
}

/**
 * Track protocol completion
 */
export function trackProtocolCompleted(
  protocolId: string,
  variant: 'clinical' | 'simplified',
  timeSpentSeconds: number,
  tooltipInteractions: number = 0
): void {
  trackEvent('protocol_completed', {
    protocol_id: protocolId,
    language_variant: variant,
    time_spent_seconds: timeSpentSeconds,
    tooltip_interactions: tooltipInteractions,
    completion_percentage: 100,
  });
}

/**
 * Track protocol abandonment
 */
export function trackProtocolAbandoned(
  protocolId: string,
  variant: 'clinical' | 'simplified',
  timeSpentSeconds: number,
  completionPercentage: number
): void {
  trackEvent('protocol_abandoned', {
    protocol_id: protocolId,
    language_variant: variant,
    time_spent_seconds: timeSpentSeconds,
    completion_percentage: completionPercentage,
  });
}

// Export session utilities for component usage
export const sessionUtils = {
  getSessionId,
  resetSession: () => {
    sessionId = null;
    sessionStorage.removeItem('analytics_session_id');
    sessionStartTime = Date.now();
  },
  getSessionDuration: () => Date.now() - sessionStartTime,
};