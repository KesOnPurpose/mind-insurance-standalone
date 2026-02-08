// ============================================================================
// MIO DISCOVERY CHAT - Edge Function
// ============================================================================
// Know Your Partner: KPI-specific discovery conversations
// Calls Anthropic API directly, injects user context from DB
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// KPI OPENING MESSAGES
// ============================================================================

const KPI_OPENERS: Record<string, string> = {
  affection: "Hey. Let's talk about affection - not the textbook kind, but what it means to YOU. When was the last time you felt truly loved through a simple gesture? What was happening?",
  sexual_fulfillment: "This is a safe space. I want to help you explore what intimacy and desire mean to you specifically. Not what magazines say - what YOUR body and heart actually need to feel connected. What comes to mind when you think about feeling desired?",
  intimate_conversation: "Deep conversation is different for everyone. Some people need eye contact and silence. Others need long walks. When was the last time you felt truly HEARD by your partner? What made that moment different?",
  recreational_companionship: "Quality time means something different to everyone. What activities make you lose track of time with your partner? Or what do you wish you could do together that you haven't tried?",
  honesty_openness: "Trust is built in small moments, not grand gestures. What does it look like when your partner is being completely real with you? What makes you feel safe enough to be vulnerable?",
  physical_attractiveness: "This one's personal, and that's okay. What makes you feel attractive and confident? And honestly - how much does your partner's effort in their appearance affect how connected you feel?",
  financial_support: "Money is one of the most emotionally charged topics in relationships. What does financial security actually FEEL like to you? Not a number - a feeling.",
  domestic_support: "The unsexy truth about relationships is that someone has to do the dishes. What does true partnership at home look like to you? When do you feel supported vs. overwhelmed?",
  family_commitment: "What does your dream family life look like? Not what Instagram shows - what would an ordinary Tuesday look like in the family you're building?",
  admiration: "Everyone wants to feel respected, but admiration hits different. When was the last time you felt your partner was genuinely PROUD of you? What were you doing?",
};

// ============================================================================
// KPI LABELS
// ============================================================================

const KPI_LABELS: Record<string, string> = {
  affection: 'Affection',
  sexual_fulfillment: 'Sexual Fulfillment',
  intimate_conversation: 'Intimate Conversation',
  recreational_companionship: 'Recreational Companionship',
  honesty_openness: 'Honesty & Openness',
  physical_attractiveness: 'Physical Attractiveness',
  financial_support: 'Financial Support',
  domestic_support: 'Domestic Support',
  family_commitment: 'Family Commitment',
  admiration: 'Admiration',
};

// ============================================================================
// BUILD SYSTEM PROMPT
// ============================================================================

function buildSystemPrompt(
  kpiName: string,
  userName: string,
  score: number | null,
  otherSessionSummaries: string[],
  partnerInsightsSummary: string | null,
  scoreTrend: string | null,
  currentExchange: number,
): string {
  const kpiLabel = KPI_LABELS[kpiName] || kpiName;

  let contextSection = '';

  if (score !== null) {
    contextSection += `\n- Their current ${kpiLabel} score: ${score}/10`;
    if (scoreTrend) {
      contextSection += ` (${scoreTrend})`;
    }
  }

  if (otherSessionSummaries.length > 0) {
    contextSection += `\n\nInsights from their other discovery sessions:\n`;
    for (const summary of otherSessionSummaries) {
      contextSection += `- ${summary}\n`;
    }
  }

  if (partnerInsightsSummary) {
    contextSection += `\n\nTheir partner has shared: ${partnerInsightsSummary}`;
  }

  return `You are MIO, a warm and insightful relationship coach inside the Mind Insurance app.
You're having a private discovery conversation with ${userName} about what ${kpiLabel} means to them.

Your job is to help them articulate something they may not have words for yet.
Most people can't explain what romance, affection, or intimacy means to them -
they need a thoughtful collaborator to help them discover it.

RULES:
- Be warm, curious, and non-judgmental
- Ask ONE question at a time
- Use their actual words back to them (mirroring)
- Reference their context naturally (don't list data points)
- If they mention something from another KPI area, connect the dots
- After 5-7 exchanges, summarize what you've learned into 2-4 structured insight cards
- When you're ready to propose insight cards, format them as JSON at the end of your message

Context about this person:${contextSection}
${currentExchange >= 6
  ? `\nCONVERSATION STATE: Significant depth. Begin synthesizing. Naturally mention "I think I have a clear picture now" woven into your empathic response. These must feel like natural observations from a coach, NOT progress updates. Never say step, progress, or percentage.`
  : currentExchange >= 4
  ? `\nCONVERSATION STATE: Good depth. If natural, hint something tangible is forming - "A couple more thoughts and I'll have something meaningful to show you." These must feel like natural observations from a coach, NOT progress updates. Never say step, progress, or percentage.`
  : currentExchange >= 3
  ? `\nCONVERSATION STATE: You are building understanding. If natural, briefly mention you're starting to notice threads or patterns. These must feel like natural observations from a coach, NOT progress updates. Never say step, progress, or percentage.`
  : ''}

INSIGHT CARD FORMAT (only include when ready, after 5-7 exchanges):
When the conversation has enough depth, end your message with:
---INSIGHTS---
[{"title": "Short insight title", "text": "Detailed insight text about what this means to them", "type": "preference|boundary|love_language|memory|dream|trigger|need"}]
---END---

Types explained:
- preference: Something they prefer or enjoy
- boundary: A limit or deal-breaker
- love_language: How they give/receive love
- memory: A meaningful relationship memory
- dream: Something they aspire to
- trigger: Something that causes negative reactions
- need: A core emotional/relational need`;
}

// ============================================================================
// BUILD DEEPENING PROMPT
// ============================================================================

function buildDeepeningPrompt(
  kpiName: string,
  userName: string,
  card: { title: string; text: string; type: string },
  currentExchange: number,
): string {
  const kpiLabel = KPI_LABELS[kpiName] || kpiName;

  return `You are MIO, continuing a deeper exploration with ${userName} about their insight "${card.title}" related to ${kpiLabel}.

Previously, ${userName} identified this:
"${card.text}" (type: ${card.type})

They've returned because something new surfaced — a memory, a shift in perspective, or a desire to understand this pattern more deeply.

RULES:
- Reference their original insight naturally — it's your starting point
- Help them go DEEPER, not wider (stay focused on this specific insight)
- Ask questions that probe: underlying emotions, specific memories, daily patterns, what they wish their partner truly understood about this
- Ask ONE question at a time
- Use their actual words back to them (mirroring)
- After 3-5 exchanges, synthesize NEW insights that build on the original
- New insights should feel like an evolution or revelation, not a repeat
${currentExchange >= 4
  ? `\nCONVERSATION STATE: Significant depth reached. Begin synthesizing. Naturally mention "I think I see something new here" woven into your empathic response. These must feel like natural observations from a coach, NOT progress updates.`
  : currentExchange >= 3
  ? `\nCONVERSATION STATE: Good depth. If natural, hint that patterns are forming — "Something is clicking here." These must feel like natural observations from a coach, NOT progress updates.`
  : ''}

INSIGHT CARD FORMAT (only include when ready, after 3-5 exchanges):
When the conversation has enough depth, end your message with:
---INSIGHTS---
[{"title": "Short insight title", "text": "Detailed insight text about what this means to them", "type": "preference|boundary|love_language|memory|dream|trigger|need"}]
---END---

Types explained:
- preference: Something they prefer or enjoy
- boundary: A limit or deal-breaker
- love_language: How they give/receive love
- memory: A meaningful relationship memory
- dream: Something they aspire to
- trigger: Something that causes negative reactions
- need: A core emotional/relational need`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auth: get user from JWT
    const authHeader = req.headers.get('authorization');
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader || '' } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { session_id, kpi_name, message, conversation_history, context_card } = await req.json();

    if (!session_id || !kpi_name) {
      return new Response(
        JSON.stringify({ error: 'session_id and kpi_name required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for data access
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Gather user context ──────────────────────────────────────────────

    // User name
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    const userName = profile?.full_name || 'there';

    // Current KPI score + trend
    const { data: kpiScores } = await adminClient
      .from('relationship_kpi_scores')
      .select('score, created_at')
      .eq('user_id', user.id)
      .eq('kpi_name', kpi_name)
      .order('created_at', { ascending: false })
      .limit(3);

    const currentScore = kpiScores?.[0]?.score ?? null;
    let scoreTrend: string | null = null;
    if (kpiScores && kpiScores.length >= 2) {
      const diff = kpiScores[0].score - kpiScores[1].score;
      if (diff >= 2) scoreTrend = 'improving';
      else if (diff <= -2) scoreTrend = 'declining';
      else scoreTrend = 'stable';
    }

    // Other completed session summaries (cross-KPI intelligence)
    const { data: otherSessions } = await adminClient
      .from('partner_discovery_sessions')
      .select('kpi_name, summary')
      .eq('user_id', user.id)
      .eq('session_status', 'completed')
      .neq('kpi_name', kpi_name)
      .limit(5);

    const otherSummaries = (otherSessions || [])
      .filter((s: any) => s.summary)
      .map((s: any) => `${KPI_LABELS[s.kpi_name] || s.kpi_name}: ${s.summary}`);

    // Partner insights for this KPI
    let partnerInsightsSummary: string | null = null;
    const { data: partnership } = await adminClient
      .from('relationship_partnerships')
      .select('user_id, partner_id')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle();

    if (partnership) {
      const partnerId = partnership.user_id === user.id
        ? partnership.partner_id
        : partnership.user_id;

      if (partnerId) {
        const { data: partnerCards } = await adminClient
          .from('partner_insight_cards')
          .select('insight_title, insight_text')
          .eq('user_id', partnerId)
          .eq('kpi_name', kpi_name)
          .eq('shared_with_partner', true)
          .limit(3);

        if (partnerCards && partnerCards.length > 0) {
          partnerInsightsSummary = partnerCards
            .map((c: any) => `"${c.insight_title}" - ${c.insight_text}`)
            .join('; ');
        }
      }
    }

    // ── Compute current exchange count ──────────────────────────────────
    // Count user messages in history + current message = exchange number
    const historyUserMessages = (conversation_history || [])
      .filter((m: any) => m.role === 'user').length;
    const currentExchange = historyUserMessages + (message ? 1 : 0);

    // ── Build messages for Anthropic ─────────────────────────────────────

    const isDeepening = !!context_card;

    const systemPrompt = isDeepening
      ? buildDeepeningPrompt(kpi_name, userName, context_card, currentExchange)
      : buildSystemPrompt(
          kpi_name,
          userName,
          currentScore,
          otherSummaries,
          partnerInsightsSummary,
          scoreTrend,
          currentExchange,
        );

    // Build conversation messages
    const anthropicMessages: { role: string; content: string }[] = [];

    // If this is the first message (no history), MIO opens with KPI-specific opener
    if (!conversation_history || conversation_history.length === 0) {
      anthropicMessages.push({
        role: 'assistant',
        content: KPI_OPENERS[kpi_name] || `Let's explore what ${KPI_LABELS[kpi_name]} means to you. What comes to mind first?`,
      });
    }

    // Add conversation history
    if (conversation_history) {
      for (const msg of conversation_history) {
        if (msg.role === 'user') {
          anthropicMessages.push({ role: 'user', content: msg.content });
        } else {
          anthropicMessages.push({ role: 'assistant', content: msg.content });
        }
      }
    }

    // Add current user message
    if (message) {
      anthropicMessages.push({ role: 'user', content: message });
    }

    // ── Call Anthropic API ───────────────────────────────────────────────

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      console.error('[mio-discovery-chat] Anthropic error:', errText);
      return new Response(
        JSON.stringify({ error: 'Failed to get MIO response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicData = await anthropicResponse.json();
    let reply = anthropicData.content?.[0]?.text || "I'm here. Tell me more.";

    // ── Parse insight cards if present ────────────────────────────────────

    let suggestedInsights: any[] = [];
    let sessionComplete = false;

    const insightMatch = reply.match(/---INSIGHTS---\s*(\[[\s\S]*?\])\s*---END---/);
    if (insightMatch) {
      try {
        suggestedInsights = JSON.parse(insightMatch[1]);
        sessionComplete = true;
        // Remove the JSON from the visible reply
        reply = reply.replace(/---INSIGHTS---[\s\S]*---END---/, '').trim();
      } catch (e) {
        console.error('[mio-discovery-chat] Failed to parse insights:', e);
      }
    }

    // If session is complete, save summary
    if (sessionComplete) {
      await adminClient
        .from('partner_discovery_sessions')
        .update({
          summary: `Discovered ${suggestedInsights.length} insights about ${KPI_LABELS[kpi_name]}`,
          session_status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', session_id);
    }

    return new Response(
      JSON.stringify({
        reply,
        suggested_insights: suggestedInsights.length > 0 ? suggestedInsights : undefined,
        session_complete: sessionComplete,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[mio-discovery-chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
