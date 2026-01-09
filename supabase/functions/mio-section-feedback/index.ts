/**
 * MIO Section Feedback Edge Function
 *
 * Enhanced version with:
 * - Variable reward system (60/25/15 distribution)
 * - Section-specific energies (Commander, Strategist, Celebration)
 * - MIO Insights Thread integration
 * - Previous conversation context recall
 * - Push notification triggers
 * - Deep forensic analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildMIOSectionPrompt, type SectionType, type SectionEnergy } from '../_shared/mio-prompts.ts';
import { rollVariableReward, getAdjustedWeights, rollWithWeights, type RewardTier } from '../_shared/variable-reward.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Section configuration
const SECTION_PRACTICES: Record<SectionType, string[]> = {
  'PRO': ['P', 'R', 'O'],
  'TE': ['T', 'E'],
  'CT': ['C', 'T2']
};

const SECTION_ENERGIES: Record<SectionType, SectionEnergy> = {
  'PRO': 'commander',
  'TE': 'strategist',
  'CT': 'celebration'
};

const SECTION_NAMES: Record<SectionType, string> = {
  'PRO': 'Champion Setup',
  'TE': 'NASCAR Pit Stop',
  'CT': 'Victory Lap'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getOrCreateThread(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Try to get existing thread
  const { data: existing } = await supabase
    .from('mio_insights_thread')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing?.id) {
    return existing.id;
  }

  // Create new thread
  const { data: newThread, error } = await supabase
    .from('mio_insights_thread')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error) throw error;
  return newThread.id;
}

async function getPreviousMessages(
  supabase: SupabaseClient,
  threadId: string,
  limit: number = 5
): Promise<Array<{ role: 'mio' | 'user'; content: string; created_at: string }>> {
  const { data } = await supabase
    .from('mio_insights_messages')
    .select('role, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).reverse();
}

async function getDaysSinceLastBreakthrough(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from('mio_insights_messages')
    .select('created_at')
    .eq('user_id', userId)
    .eq('reward_tier', 'pattern_breakthrough')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return 30; // Never had one

  const lastBreakthrough = new Date(data[0].created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastBreakthrough.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getSameSectionHistory(
  supabase: SupabaseClient,
  userId: string,
  section: SectionType
): Promise<Array<{ practice_date: string; quality_score?: number }>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('mio_practice_feedback')
    .select('created_at, depth_score')
    .eq('user_id', userId)
    .eq('practice_type', section)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false });

  return (data || []).map(d => ({
    practice_date: d.created_at,
    quality_score: d.depth_score
  }));
}

async function calculateQualityTrend(
  history: Array<{ quality_score?: number }>
): Promise<'improving' | 'stable' | 'declining'> {
  const scores = history.map(h => h.quality_score).filter((s): s is number => s !== undefined);

  if (scores.length < 2) return 'stable';

  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 1) return 'improving';
  if (diff < -1) return 'declining';
  return 'stable';
}

async function sendPushNotification(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  url: string,
  tag: string
): Promise<boolean> {
  try {
    // Call the send-push-notification edge function
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          body,
          url,
          tag
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.warn('Push notification failed:', error);
    return false;
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Also create user client for RLS-protected operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { user_id, section, practice_date } = await req.json() as {
      user_id: string;
      section: SectionType;
      practice_date: string;
    };

    console.log(`[MIO Section Feedback] Processing ${section} for user ${user_id}`);

    // ========================================================================
    // STEP 1: Fetch all context in parallel
    // ========================================================================

    const [
      practicesResult,
      avatarResult,
      profileResult,
      patternsResult,
      threadId,
      daysSinceBreakthrough,
      sectionHistory
    ] = await Promise.all([
      // Today's practices for this section
      supabaseAdmin
        .from('daily_practices')
        .select('*')
        .eq('user_id', user_id)
        .eq('practice_date', practice_date)
        .in('practice_type', SECTION_PRACTICES[section]),

      // Avatar assessment
      supabaseAdmin
        .from('avatar_assessments')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle(),

      // User profile
      supabaseAdmin
        .from('user_profiles')
        .select('daily_streak_count, total_points, full_name, timezone')
        .eq('id', user_id)
        .single(),

      // Recent forensic patterns
      supabaseAdmin
        .from('mio_forensic_analysis')
        .select('pattern_detected, confidence_score')
        .eq('user_id', user_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(5),

      // Get or create MIO Insights Thread
      getOrCreateThread(supabaseAdmin, user_id),

      // Days since last breakthrough
      getDaysSinceLastBreakthrough(supabaseAdmin, user_id),

      // Same section history
      getSameSectionHistory(supabaseAdmin, user_id, section)
    ]);

    const practices = practicesResult.data || [];
    const avatar = avatarResult.data;
    const userProfile = profileResult.data;
    const recentPatterns = patternsResult.data || [];

    // ========================================================================
    // STEP 2: Get previous conversation messages for context
    // ========================================================================

    const previousMessages = await getPreviousMessages(supabaseAdmin, threadId, 5);

    // ========================================================================
    // STEP 3: Roll for variable reward tier
    // ========================================================================

    const currentStreak = userProfile?.daily_streak_count || 0;
    const hasSignificantPatternData = recentPatterns.length >= 3;

    // Get adjusted weights based on user context
    const weights = getAdjustedWeights(
      daysSinceBreakthrough,
      currentStreak,
      hasSignificantPatternData
    );

    // Roll with adjusted weights
    const rewardRoll = rollWithWeights(weights);
    const sectionEnergy = SECTION_ENERGIES[section];

    console.log(`[MIO Section Feedback] Reward roll: ${rewardRoll.tier} (${(rewardRoll.probability * 100).toFixed(1)}%)`);

    // ========================================================================
    // STEP 4: Calculate forensic context
    // ========================================================================

    const qualityTrend = await calculateQualityTrend(sectionHistory);

    const forensicContext = {
      recent_patterns: recentPatterns.map(p => ({
        pattern_detected: p.pattern_detected,
        confidence_score: p.confidence_score
      })),
      same_section_history: sectionHistory,
      quality_trend: qualityTrend
    };

    const conversationContext = {
      recent_messages: previousMessages
    };

    // ========================================================================
    // STEP 5: Build the AI prompt
    // ========================================================================

    // Get user's timezone for formatting practice times
    const userTimezone = userProfile?.timezone || 'America/New_York';

    // Helper to format time in user's timezone
    const formatTimeInUserTz = (isoString: string | null): string => {
      if (!isoString) return 'unknown';
      try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone
        });
      } catch {
        return 'unknown';
      }
    };

    // Format practices for the prompt
    const practicesSummary = practices.map(p => {
      const practiceData = p.data || {};
      const formattedData = Object.entries(practiceData)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `  - ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');

      // Convert completed_at to user's local timezone for display
      const localTime = formatTimeInUserTz(p.completed_at);

      return `**${p.practice_type}** (completed at ${localTime}):\n${formattedData || '  (no data recorded)'}`;
    }).join('\n\n');

    const userContext = {
      full_name: userProfile?.full_name || 'User',
      avatar_type: avatar?.avatar_type,
      primary_pattern: avatar?.primary_pattern,
      temperament: avatar?.temperament,
      current_streak: currentStreak,
      total_points: userProfile?.total_points || 0
    };

    const { systemPrompt, userPrompt } = buildMIOSectionPrompt(
      section,
      rewardRoll.tier,
      practicesSummary,
      userContext,
      forensicContext,
      conversationContext
    );

    // ========================================================================
    // STEP 6: Call AI API (Claude via Anthropic)
    // ========================================================================

    let feedbackText: string;
    let patternsDetected: Array<{ pattern_name: string; confidence_score: number }> = [];

    try {
      // Try Anthropic Claude first
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

      if (anthropicKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: rewardRoll.tier === 'pattern_breakthrough' ? 500 : 350,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        feedbackText = data.content[0].text;
      } else {
        // Fallback to Lovable AI gateway
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: rewardRoll.tier === 'pattern_breakthrough' ? 500 : 350
          })
        });

        if (!response.ok) {
          throw new Error(`Lovable AI API error: ${response.status}`);
        }

        const data = await response.json();
        feedbackText = data.choices[0].message.content;
      }
    } catch (aiError) {
      console.error('AI API error:', aiError);
      // Generate fallback response
      feedbackText = `I've analyzed your ${SECTION_NAMES[section]} practices. Your patterns are becoming clearer with each session. Let's connect tomorrow to dig deeper into what I'm seeing.`;
    }

    // ========================================================================
    // STEP 7: Calculate quality scores
    // ========================================================================

    // Calculate average quality score from practices
    const practiceDataLengths = practices.map(p => {
      const data = p.data || {};
      return Object.values(data).filter(v => v && typeof v === 'string').join(' ').length;
    });
    const avgLength = practiceDataLengths.reduce((a, b) => a + b, 0) / practiceDataLengths.length;

    // Quality score based on content depth (0-10)
    let qualityScore = 5; // Default
    if (avgLength > 200) qualityScore = 9;
    else if (avgLength > 100) qualityScore = 7;
    else if (avgLength > 50) qualityScore = 5;
    else if (avgLength > 20) qualityScore = 3;
    else qualityScore = 1;

    // Depth score based on number of practices and completeness
    const depthScore = Math.min(10, Math.round((practices.length / SECTION_PRACTICES[section].length) * 10));

    // ========================================================================
    // STEP 8: Save feedback to mio_practice_feedback
    // ========================================================================

    // Map section to valid feedback_type
    const feedbackTypeMap: Record<SectionType, string> = {
      'PRO': 'pattern_warning',      // Commander energy = pattern detection
      'TE': 'coaching_suggestion',   // Strategist energy = tactical coaching
      'CT': 'celebration'            // Celebration energy = celebrating wins
    };

    // Use the first practice type from the section (e.g., 'P' for PRO, 'T' for TE, 'C' for CT)
    const firstPracticeType = SECTION_PRACTICES[section][0];

    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('mio_practice_feedback')
      .insert({
        user_id,
        practice_id: practices[0]?.id,
        feedback_type: feedbackTypeMap[section] || 'coaching_suggestion',
        feedback_text: feedbackText,
        practice_type: firstPracticeType, // Use valid practice type (P, R, O, T, E, C, T2)
        section_energy: sectionEnergy,
        reward_tier: rewardRoll.tier,
        depth_score: depthScore,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving feedback:', feedbackError);
      throw feedbackError;
    }

    // ========================================================================
    // STEP 9: Create MIO Insights Message
    // ========================================================================

    const { data: insightMessage, error: messageError } = await supabaseAdmin
      .from('mio_insights_messages')
      .insert({
        thread_id: threadId,
        user_id,
        role: 'mio',
        content: feedbackText,
        section_type: section,
        section_energy: sectionEnergy,
        reward_tier: rewardRoll.tier,
        reward_probability: rewardRoll.probability,
        feedback_id: feedback.id,
        forensic_analysis_ids: recentPatterns.map(p => p.pattern_detected), // Using pattern names as reference
        patterns_detected: patternsDetected,
        quality_score: qualityScore,
        depth_score: depthScore,
        delivered_at: new Date().toISOString()
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving insight message:', messageError);
      throw messageError;
    }

    // Update feedback with insights_message_id
    await supabaseAdmin
      .from('mio_practice_feedback')
      .update({ insights_message_id: insightMessage.id })
      .eq('id', feedback.id);

    // ========================================================================
    // STEP 10: Create in-app notification
    // ========================================================================

    const notificationTitle = rewardRoll.tier === 'pattern_breakthrough'
      ? `${rewardRoll.icon} MIO Pattern Breakthrough!`
      : rewardRoll.tier === 'bonus_insight'
        ? `${rewardRoll.icon} MIO Bonus Insight`
        : `💡 MIO: ${SECTION_NAMES[section]} Complete`;

    const notificationMessage = feedbackText.length > 100
      ? feedbackText.substring(0, 97) + '...'
      : feedbackText;

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        type: 'mio_feedback',
        title: notificationTitle,
        message: notificationMessage,
        action_url: '/mind-insurance/insights',
        created_at: new Date().toISOString()
      });

    // ========================================================================
    // STEP 11: Send push notification
    // ========================================================================

    const pushSent = await sendPushNotification(
      supabaseAdmin,
      user_id,
      notificationTitle,
      notificationMessage,
      '/mind-insurance/insights',
      `mio-${section}-${practice_date}`
    );

    // ========================================================================
    // STEP 12: Update activity tracking
    // ========================================================================

    await supabaseAdmin
      .from('mio_user_activity_tracking')
      .upsert({
        user_id,
        last_practice_at: new Date().toISOString(),
        last_section_completed_at: new Date().toISOString(),
        last_section_completed: section,
        inactive_days: 0,
        is_at_risk: false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    // ========================================================================
    // STEP 13: Return response
    // ========================================================================

    console.log(`[MIO Section Feedback] Complete. Message ID: ${insightMessage.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        feedback_text: feedbackText,
        message_id: insightMessage.id,
        thread_id: threadId,
        feedback_id: feedback.id,
        reward_tier: rewardRoll.tier,
        section_energy: sectionEnergy,
        patterns_detected: patternsDetected,
        protocol_suggested: null, // TODO: Add protocol suggestion for breakthroughs
        push_sent: pushSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mio-section-feedback:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        errorType: error?.constructor?.name || 'Unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
