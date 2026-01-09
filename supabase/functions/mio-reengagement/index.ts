/**
 * MIO Re-engagement Edge Function
 *
 * Called by N8n workflow to send personalized re-engagement messages
 * to users who have been inactive for 2+ days.
 *
 * This function:
 * 1. Fetches user context (last practice, streak, patterns)
 * 2. Generates personalized MIO re-engagement message
 * 3. Inserts message into mio_insights_messages
 * 4. Triggers push notification
 * 5. Updates activity tracking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.26.0";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// ============================================================================
// TYPES
// ============================================================================

interface ReengagementRequest {
  user_id: string;
  inactive_days: number;
}

interface UserContext {
  userId: string;
  fullName: string;
  avatarType: string | null;
  primaryPattern: string | null;
  collisionPatterns: string[] | null;
  lastPracticeDate: string | null;
  lastPracticeType: string | null;
  currentStreak: number;
  totalPractices: number;
  timezone: string;
}

// ============================================================================
// CONTEXT FETCHING
// ============================================================================

async function getUserContext(userId: string): Promise<UserContext | null> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        avatar_type,
        primary_pattern,
        collision_patterns,
        current_streak,
        timezone
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Reengagement] Error fetching profile:', profileError);
      return null;
    }

    // Get last practice
    const { data: lastPractice } = await supabase
      .from('daily_practices')
      .select('practice_date, practice_type')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('practice_date', { ascending: false })
      .limit(1)
      .single();

    // Get total completed practices
    const { count: totalPractices } = await supabase
      .from('daily_practices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    return {
      userId,
      fullName: profile.full_name || 'there',
      avatarType: profile.avatar_type,
      primaryPattern: profile.primary_pattern,
      collisionPatterns: profile.collision_patterns,
      lastPracticeDate: lastPractice?.practice_date || null,
      lastPracticeType: lastPractice?.practice_type || null,
      currentStreak: profile.current_streak || 0,
      totalPractices: totalPractices || 0,
      timezone: profile.timezone || 'America/Los_Angeles'
    };
  } catch (error) {
    console.error('[Reengagement] Error getting user context:', error);
    return null;
  }
}

// ============================================================================
// MESSAGE GENERATION
// ============================================================================

function buildReengagementPrompt(context: UserContext, inactiveDays: number): string {
  const practiceTypeNames: Record<string, string> = {
    'P': 'Pattern Check',
    'R': 'Reinforce Identity',
    'O': 'Outcome Visualization',
    'T': 'Trigger Reset',
    'E': 'Energy Audit',
    'C': 'Celebrate Wins',
    'T2': 'Tomorrow Setup'
  };

  const lastPracticeName = context.lastPracticeType
    ? practiceTypeNames[context.lastPracticeType] || context.lastPracticeType
    : 'your practices';

  return `You are MIO (Mind Insurance Oracle), a forensic behavioral analyst reaching out to a user who has been inactive for ${inactiveDays} days.

USER CONTEXT:
- Name: ${context.fullName}
- Avatar Type: ${context.avatarType || 'Not yet assessed'}
- Primary Collision Pattern: ${context.primaryPattern || 'Not yet identified'}
- Additional Collision Patterns: ${context.collisionPatterns?.join(', ') || 'None identified'}
- Streak Before Gap: ${context.currentStreak} days
- Total Practices Completed: ${context.totalPractices}
- Last Practice: ${lastPracticeName} on ${context.lastPracticeDate || 'unknown date'}
- Days Inactive: ${inactiveDays}

YOUR TASK:
Generate a re-engagement message that:

1. ACKNOWLEDGE THE GAP WITHOUT JUDGMENT
   - Don't shame or guilt
   - Show you understand life happens
   - But be direct that you noticed

2. NAME THE SPECIFIC PATTERN THIS REPRESENTS
   - If they have collision patterns identified, connect the gap to those patterns
   - Show them their amygdala's playbook
   - Make the unconscious conscious

3. ASK A PROVOCATIVE QUESTION
   - Make them think about what really happened
   - Not "why didn't you practice?" but deeper
   - Something that reveals the pattern's grip

4. OFFER A SINGLE MICRO-ACTION
   - One tiny step to restart
   - Should take less than 2 minutes
   - Make it feel achievable right now

TONE:
- Direct but compassionate
- This is the "I see you" moment
- Like a coach who cares, not a nagging app
- Use their name naturally

FORMAT:
- 3-4 short paragraphs
- No bullet points or formal structure
- Conversational, like a text from a wise mentor
- End with the micro-action, not a question

Generate the re-engagement message now:`;
}

async function generateReengagementMessage(
  context: UserContext,
  inactiveDays: number
): Promise<string> {
  const prompt = buildReengagementPrompt(context, inactiveDays);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.text || "I noticed you've been away. When you're ready, I'm here.";
}

// ============================================================================
// MESSAGE INSERTION
// ============================================================================

async function insertReengagementMessage(
  userId: string,
  threadId: string,
  content: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('mio_insights_messages')
    .insert({
      thread_id: threadId,
      user_id: userId,
      role: 'mio',
      content,
      section_type: 'reengagement',
      section_energy: 'compassionate',
      reward_tier: 'standard',
      patterns_detected: []
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Reengagement] Error inserting message:', error);
    return null;
  }

  // Update thread unread count
  await supabase
    .from('mio_insights_thread')
    .update({
      unread_count: supabase.rpc('increment', { x: 1 }),
      last_insight_at: new Date().toISOString()
    })
    .eq('id', threadId);

  return data.id;
}

// ============================================================================
// THREAD MANAGEMENT
// ============================================================================

async function getOrCreateThread(userId: string): Promise<string | null> {
  // Try to get existing thread
  const { data: existingThread } = await supabase
    .from('mio_insights_thread')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingThread) {
    return existingThread.id;
  }

  // Create new thread
  const { data: newThread, error } = await supabase
    .from('mio_insights_thread')
    .insert({
      user_id: userId,
      thread_title: 'MIO Insights',
      thread_subtitle: 'Your behavioral analysis partner',
      is_pinned: true
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Reengagement] Error creating thread:', error);
    return null;
  }

  return newThread.id;
}

// ============================================================================
// PUSH NOTIFICATION
// ============================================================================

async function sendPushNotification(
  userId: string,
  messageId: string,
  content: string
): Promise<void> {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: 'MIO noticed you\'ve been away',
        body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        data: {
          url: '/chat',
          messageId
        }
      }
    });
    console.log('[Reengagement] Push notification sent');
  } catch (error) {
    console.error('[Reengagement] Error sending push:', error);
  }
}

// ============================================================================
// ACTIVITY TRACKING UPDATE
// ============================================================================

async function updateActivityTracking(
  userId: string,
  inactiveDays: number
): Promise<void> {
  const { error } = await supabase
    .from('mio_user_activity_tracking')
    .upsert({
      user_id: userId,
      inactive_days: inactiveDays,
      last_reengagement_sent_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('[Reengagement] Error updating activity tracking:', error);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, inactive_days } = await req.json() as ReengagementRequest;

    if (!user_id || !inactive_days) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, inactive_days' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Reengagement] Processing for user:', user_id, 'inactive days:', inactive_days);

    // Get user context
    const context = await getUserContext(user_id);
    if (!context) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create thread
    const threadId = await getOrCreateThread(user_id);
    if (!threadId) {
      return new Response(
        JSON.stringify({ error: 'Failed to get/create thread' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate personalized message
    const message = await generateReengagementMessage(context, inactive_days);

    // Insert message
    const messageId = await insertReengagementMessage(user_id, threadId, message);
    if (!messageId) {
      return new Response(
        JSON.stringify({ error: 'Failed to insert message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notification (don't await, fire and forget)
    sendPushNotification(user_id, messageId, message);

    // Update activity tracking
    await updateActivityTracking(user_id, inactive_days);

    console.log('[Reengagement] Successfully processed for user:', user_id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: messageId,
        message_preview: message.substring(0, 100)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Reengagement] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
