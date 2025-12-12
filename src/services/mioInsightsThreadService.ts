/**
 * MIO Insights Thread Service
 *
 * Handles all operations for the MIO Insights Thread feature:
 * - Thread CRUD operations
 * - Message fetching and sending
 * - Real-time subscriptions
 * - Unread count management
 */

import { supabase } from "@/integrations/supabase/client";
import {
  MIOInsightsThread,
  MIOInsightsMessage,
  SectionType,
  SectionEnergy,
  RewardTier,
  SECTION_ENERGY_CONFIG,
  REWARD_TIER_CONFIG
} from "@/types/mio-insights";

// ============================================================================
// TYPES
// ============================================================================

export interface ThreadWithUnread {
  thread: MIOInsightsThread;
  unreadCount: number;
  lastMessage?: MIOInsightsMessage;
}

export interface SendReplyResult {
  success: boolean;
  userMessageId?: string;
  mioResponseId?: string;
  mioResponse?: string;
  rewardTier?: RewardTier;
  patternsDetected?: Array<{ pattern_name: string; confidence: number }>;
  error?: string;
}

// ============================================================================
// THREAD OPERATIONS
// ============================================================================

/**
 * Get or create the MIO Insights Thread for a user
 */
export async function getOrCreateThread(userId: string): Promise<MIOInsightsThread | null> {
  try {
    // First try to get existing thread
    const { data: existingThread, error: fetchError } = await supabase
      .from('mio_insights_thread')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingThread) {
      return existingThread as MIOInsightsThread;
    }

    // If no thread exists (PGRST116 = no rows), create one
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newThread, error: createError } = await supabase
        .from('mio_insights_thread')
        .insert({
          user_id: userId,
          thread_title: 'MIO Insights',
          thread_subtitle: 'Your daily behavioral analysis',
          is_pinned: true
        })
        .select()
        .single();

      if (createError) {
        console.error('[MIOInsights] Error creating thread:', createError);
        return null;
      }

      return newThread as MIOInsightsThread;
    }

    console.error('[MIOInsights] Error fetching thread:', fetchError);
    return null;

  } catch (error) {
    console.error('[MIOInsights] Unexpected error:', error);
    return null;
  }
}

/**
 * Get thread with unread count and last message
 */
export async function getThreadWithDetails(userId: string): Promise<ThreadWithUnread | null> {
  try {
    const thread = await getOrCreateThread(userId);
    if (!thread) return null;

    // Get last message
    const { data: lastMessage } = await supabase
      .from('mio_insights_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      thread,
      unreadCount: thread.unread_count || 0,
      lastMessage: lastMessage as MIOInsightsMessage | undefined
    };

  } catch (error) {
    console.error('[MIOInsights] Error getting thread details:', error);
    return null;
  }
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Fetch messages from the thread with pagination
 */
export async function getThreadMessages(
  threadId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MIOInsightsMessage[]> {
  try {
    const { data, error } = await supabase
      .from('mio_insights_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[MIOInsights] Error fetching messages:', error);
      return [];
    }

    // Reverse to get chronological order for display
    return (data || []).reverse() as MIOInsightsMessage[];

  } catch (error) {
    console.error('[MIOInsights] Unexpected error:', error);
    return [];
  }
}

/**
 * Send a reply in the MIO Insights Thread
 * This calls the n8n workflow webhook for processing
 */
export async function sendReply(
  threadId: string,
  userId: string,
  content: string,
  inReplyTo?: string
): Promise<SendReplyResult> {
  try {
    // Call n8n webhook instead of Supabase edge function for better reliability
    const response = await fetch('https://n8n-n8n.vq00fr.easypanel.host/webhook/mio-insights-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_id: threadId,
        user_id: userId,
        content,
        in_reply_to: inReplyTo
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MIOInsights] N8n webhook error:', response.status, errorText);
      return { success: false, error: `Request failed: ${response.status}` };
    }

    const data = await response.json();

    return {
      success: data.success,
      userMessageId: data.user_message_id,
      mioResponseId: data.mio_response_id,
      mioResponse: data.mio_response,
      rewardTier: data.reward_tier,
      patternsDetected: data.patterns_detected,
      error: data.error
    };

  } catch (error) {
    console.error('[MIOInsights] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark a message as read
 */
export async function markMessageRead(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mio_insights_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .is('read_at', null); // Only update if not already read

    if (error) {
      console.error('[MIOInsights] Error marking message read:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[MIOInsights] Unexpected error:', error);
    return false;
  }
}

/**
 * Mark all unread messages in thread as read
 */
export async function markAllRead(threadId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mio_insights_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('[MIOInsights] Error marking all read:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[MIOInsights] Unexpected error:', error);
    return false;
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to new messages in a thread
 */
export function subscribeToThread(
  threadId: string,
  onMessage: (message: MIOInsightsMessage) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`mio-insights-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mio_insights_messages',
        filter: `thread_id=eq.${threadId}`
      },
      (payload) => {
        console.log('[MIOInsights] New message received:', payload);
        onMessage(payload.new as MIOInsightsMessage);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to thread updates (unread count, etc.)
 */
export function subscribeToThreadUpdates(
  userId: string,
  onUpdate: (thread: MIOInsightsThread) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`mio-thread-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mio_insights_thread',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('[MIOInsights] Thread updated:', payload);
        onUpdate(payload.new as MIOInsightsThread);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get section energy configuration for display
 */
export function getSectionEnergyConfig(sectionType: SectionType) {
  return SECTION_ENERGY_CONFIG[sectionType];
}

/**
 * Get reward tier configuration for display
 */
export function getRewardTierConfig(tier: RewardTier) {
  return REWARD_TIER_CONFIG[tier];
}

/**
 * Format message timestamp for display
 * @param timestamp - ISO timestamp string
 * @param userTimezone - Optional IANA timezone (e.g., 'America/New_York')
 */
export function formatMessageTime(timestamp: string, userTimezone?: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older messages, show date and time in user's timezone
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  // Add timezone if provided
  if (userTimezone) {
    options.timeZone = userTimezone;
  }

  return date.toLocaleString('en-US', options);
}

/**
 * Get section badge color
 */
export function getSectionBadgeColor(sectionType: SectionType | null): string {
  if (!sectionType) return 'bg-gray-500';

  const colors: Record<SectionType, string> = {
    PRO: 'bg-yellow-500', // Gold for Commander
    TE: 'bg-cyan-500',    // Cyan for Strategist
    CT: 'bg-purple-500'   // Purple for Celebration
  };

  return colors[sectionType] || 'bg-gray-500';
}

/**
 * Get reward tier badge styling
 */
export function getRewardBadgeStyling(tier: RewardTier): {
  className: string;
  icon: string;
  animate: boolean;
} {
  switch (tier) {
    case 'pattern_breakthrough':
      return {
        className: 'bg-gradient-to-r from-yellow-400 to-purple-500 text-white',
        icon: '🌟',
        animate: true
      };
    case 'bonus_insight':
      return {
        className: 'bg-cyan-500 text-white',
        icon: '✨',
        animate: true
      };
    case 'standard':
    default:
      return {
        className: 'bg-slate-600 text-white',
        icon: '💡',
        animate: false
      };
  }
}

/**
 * Check if current time is within a section window
 */
export function getCurrentSectionFromTime(timezone: string = 'America/Los_Angeles'): SectionType | null {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone
  });
  const currentHour = parseInt(formatter.format(now), 10);

  // PRO: 3 AM - 10 AM (Champion Setup)
  if (currentHour >= 3 && currentHour < 10) return 'PRO';

  // TE: 10 AM - 3 PM (NASCAR Pit Stop)
  if (currentHour >= 10 && currentHour < 15) return 'TE';

  // CT: 3 PM - 10 PM (Victory Lap)
  if (currentHour >= 15 && currentHour < 22) return 'CT';

  return null;
}
