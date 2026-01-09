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

// ============================================================================
// FIRST ENGAGEMENT (ONBOARDING)
// ============================================================================

export interface FirstEngagementData {
  userId: string;
  protocolId?: string;
  patternName: string;
  questionAsked: string;
  responseText: string;
  wasSkipped?: boolean;
}

/**
 * Save the user's first engagement response from FirstSessionPage
 * Stores in mio_insights_messages with section_type = 'first_engagement'
 *
 * This captures the user's first authentic insight about their pattern,
 * when MIO asks pattern-specific questions like:
 * - "What was the last thing you said 'yes' to, that a part of you was screaming 'no'?"
 * - "Who taught you that your needs come last?"
 */
export async function saveFirstEngagementToThread(
  data: FirstEngagementData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { userId, patternName, questionAsked, responseText, wasSkipped = false } = data;

  try {
    // Get or create the user's MIO insights thread
    const thread = await getOrCreateThread(userId);
    if (!thread) {
      return { success: false, error: 'Failed to get/create thread' };
    }

    // Check if first engagement already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from('mio_insights_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('section_type', 'first_engagement')
      .eq('role', 'user')
      .single();

    if (existing) {
      console.warn('[FirstEngagement] User already has first engagement response');
      return { success: true, messageId: existing.id }; // Idempotent - return existing
    }

    // First, insert MIO's question as a message
    const { data: mioMessage, error: mioError } = await supabase
      .from('mio_insights_messages')
      .insert({
        thread_id: thread.id,
        user_id: userId,
        role: 'mio',
        content: questionAsked,
        section_type: 'first_engagement',
        section_energy: 'commander', // First session uses commander energy
        reward_tier: 'standard',
        patterns_detected: [{ pattern_name: patternName, confidence: 1.0 }],
      })
      .select('id')
      .single();

    if (mioError) {
      console.error('[FirstEngagement] Error saving MIO question:', mioError);
      return { success: false, error: mioError.message };
    }

    // Then insert user's response
    const { data: userMessage, error: userError } = await supabase
      .from('mio_insights_messages')
      .insert({
        thread_id: thread.id,
        user_id: userId,
        role: 'user',
        content: wasSkipped ? '[SKIPPED]' : responseText,
        section_type: 'first_engagement',
        in_reply_to: mioMessage.id,
        patterns_detected: [{ pattern_name: patternName, confidence: 1.0, was_skipped: wasSkipped }],
      })
      .select('id')
      .single();

    if (userError) {
      console.error('[FirstEngagement] Error saving user response:', userError);
      return { success: false, error: userError.message };
    }

    console.log('[FirstEngagement] Successfully saved first engagement for user:', userId);
    return { success: true, messageId: userMessage.id };

  } catch (error) {
    console.error('[FirstEngagement] Unexpected error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Check if user has completed first engagement
 * Used by FirstSessionGuard to determine if user can access Coverage Center
 */
export async function hasCompletedFirstEngagement(userId: string): Promise<boolean> {
  try {
    // Use limit(1) instead of single() to avoid 406 error if multiple rows exist
    const { data, error } = await supabase
      .from('mio_insights_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('section_type', 'first_engagement')
      .eq('role', 'user')
      .limit(1);

    if (error) {
      console.error('[FirstEngagement] Error checking completion:', error);
      return false;
    }

    // Return true if any messages exist
    return data && data.length > 0;
  } catch (error) {
    console.error('[FirstEngagement] Unexpected error checking completion:', error);
    return false;
  }
}

/**
 * Get user's first engagement response
 */
export async function getFirstEngagementResponse(userId: string): Promise<MIOInsightsMessage | null> {
  try {
    // Use limit(1) instead of single() to avoid 406 error if multiple rows exist
    // Order by created_at desc to get the most recent response
    const { data, error } = await supabase
      .from('mio_insights_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('section_type', 'first_engagement')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[FirstEngagement] Error fetching response:', error);
      return null;
    }

    // Return first item or null
    return (data && data.length > 0 ? data[0] : null) as MIOInsightsMessage | null;
  } catch (error) {
    console.error('[FirstEngagement] Unexpected error fetching response:', error);
    return null;
  }
}

// ============================================================================
// PATTERN CONFIGURATION FOR FIRST ENGAGEMENT
// ============================================================================

/**
 * Pattern information for MIO's first engagement message
 *
 * Design Philosophy:
 * - MIO should feel like a wise coach who just discovered something profound about you
 * - Messages should be warm but direct, personal but professional
 * - Start with a personalized observation, not clinical diagnosis
 * - Make the user feel understood, not analyzed
 */
export const PATTERN_INFO: Record<string, {
  name: string;
  shortDescription: string;
  greeting: string;
  insight: string;
  whatThisMeans: string;
  question: string;
}> = {
  past_prison: {
    name: 'Past Prison',
    shortDescription: 'Your past creates invisible barriers',
    greeting: `Hey. I'm MIO — your Mind Insurance Oracle.

I just analyzed your assessment, and I need to tell you something important.`,
    insight: `You're carrying something heavy. Something from your past that whispers *"who do you think you are?"* every time you try to level up.

Maybe it's where you came from. Maybe it's what someone told you. Maybe it's a ceiling you built so long ago you forgot it was there.`,
    whatThisMeans: `This is your **Past Prison** — and here's what I want you to understand:

You're not broken. You're not behind. You've just been operating with an outdated map of who you're allowed to be.

The work we'll do together isn't about forgetting your past. It's about *using* it as fuel instead of letting it be a cage.`,
    question: `So let me ask you something real:

**What's one thing from your past that still shows up when you're about to make a bold move?**

It could be a voice, a memory, a fear. I'm not here to judge — I'm here to help you see it clearly so we can work with it.`,
  },
  success_sabotage: {
    name: 'Success Sabotage',
    shortDescription: 'You pull back when breakthrough is near',
    greeting: `Hey. I'm MIO — your Mind Insurance Oracle.

I just finished analyzing your assessment, and something fascinating came up.`,
    insight: `You know that feeling when you're *this close* to a breakthrough... and then something pulls you back?

It's not laziness. It's not bad luck. It's something much more interesting.

Your brain has learned to associate success with danger. Visibility feels risky. Outgrowing your circle feels threatening. Winning feels... somehow unsafe.`,
    whatThisMeans: `This is your **Success Sabotage** pattern, and honestly? It's one of the most common patterns I see in high-performers.

The very thing you want most is the thing your nervous system has flagged as a threat.

But here's the good news: we can rewire this. I'm going to help you build a new relationship with winning.`,
    question: `Here's what I want to know:

**When was the last time you were right on the edge of something big — and found yourself pulling back or creating chaos?**

Don't overthink it. First thing that comes to mind.`,
  },
  compass_crisis: {
    name: 'Compass Crisis',
    shortDescription: 'Unclear direction creates paralysis',
    greeting: `Hey. I'm MIO — your Mind Insurance Oracle.

I've been looking at your assessment, and I see something interesting.`,
    insight: `You're pulled in a lot of directions, aren't you?

Maybe you see others who seem so *certain* about their path, and you wonder why you can't find that same clarity. Maybe you start things but struggle to finish because something newer or shinier appears.

Here's the truth: you don't lack drive. You lack a clear compass.`,
    whatThisMeans: `This is your **Compass Crisis** — and it's not a weakness. It's actually a sign of possibility.

You see so many paths because you're capable of walking many of them. The problem isn't your potential — it's that without clarity, all that energy just... spins.

I'm going to help you build an internal compass. Not by limiting your options, but by helping you commit to *one* direction long enough to gain momentum.`,
    question: `Let me ask you this:

**If you could only pursue ONE thing for the next 90 days — and everything else had to wait — what would it be?**

Don't worry about the "right" answer. I want to hear what your gut says.`,
  },
};

/**
 * Get the pattern-specific question for first engagement
 */
export function getPatternQuestion(pattern: string): string {
  const normalizedPattern = pattern.toLowerCase().replace(/ /g, '_');
  return PATTERN_INFO[normalizedPattern]?.question || PATTERN_INFO.past_prison.question;
}

/**
 * Inject MIO's first engagement question into thread
 * Called when user first visits MIO thread after Identity Collision Assessment
 *
 * This creates MIO's opening message with:
 * - Pattern recognition
 * - Pattern description
 * - Protocol preview (if available)
 * - Pattern-specific question
 */
export async function injectMIOFirstEngagementQuestion(
  userId: string,
  patternName: string,
  protocolPreview?: { title: string; day1Task: string } | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const thread = await getOrCreateThread(userId);
    if (!thread) {
      return { success: false, error: 'Failed to get/create thread' };
    }

    // Check if MIO already asked the question (prevent duplicates)
    const { data: existing } = await supabase
      .from('mio_insights_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('section_type', 'first_engagement')
      .eq('role', 'mio')
      .maybeSingle();

    if (existing) {
      console.log('[FirstEngagement] MIO question already exists for user:', userId);
      return { success: true, messageId: existing.id }; // Already exists - idempotent
    }

    // Get pattern-specific info
    const normalizedPattern = patternName.toLowerCase().replace(/ /g, '_');
    const patternInfo = PATTERN_INFO[normalizedPattern] || PATTERN_INFO.past_prison;

    // Build MIO's intro message - warm, personal, and dynamic
    let mioContent = `${patternInfo.greeting}

${patternInfo.insight}

${patternInfo.whatThisMeans}`;

    // Add protocol preview if available (from N8n webhook)
    if (protocolPreview) {
      mioContent += `

---

🎯 **I've already built your first protocol**: *${protocolPreview.title}*

Here's what we'll tackle on **Day 1**: ${protocolPreview.day1Task}

When you're ready, head to the Coverage Center to see your full 7-day roadmap.`;
    }

    mioContent += `

---

${patternInfo.question}`;

    // Insert MIO's question message using RPC function (bypasses RLS restriction on MIO role)
    const { data: messageId, error: mioError } = await supabase
      .rpc('inject_mio_first_engagement_message', {
        p_thread_id: thread.id,
        p_user_id: userId,
        p_content: mioContent,
        p_pattern_name: patternInfo.name,
      });

    if (mioError) {
      console.error('[FirstEngagement] Error inserting MIO question:', mioError);
      return { success: false, error: mioError.message };
    }

    const mioMessage = { id: messageId };

    console.log('[FirstEngagement] MIO question injected for user:', userId);
    return { success: true, messageId: mioMessage.id };
  } catch (error) {
    console.error('[FirstEngagement] Error:', error);
    return { success: false, error: String(error) };
  }
}
