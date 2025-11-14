import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { user_id, message, conversation_id, practice_id, current_agent } = await req.json();

    // Detect handoff needs based on keywords
    const AGENT_KEYWORDS = {
      nette: ['getting started', 'requirements', 'license', 'licensing', 'assessment', 'regulations', 'compliance', 'state rules', 'population', 'demographics', 'who to serve', 'roadmap', 'onboarding'],
      mio: ['accountability', 'stuck', 'pattern', 'mindset', 'procrastination', 'fear', 'doubt', 'sabotage', 'breakthrough', 'transformation', 'identity', 'collision', 'practice', 'protect'],
      me: ['financing', 'funding', 'money', 'investment', 'roi', 'cash flow', 'revenue', 'profit', 'creative financing', 'seller finance', 'subject-to', 'capital', 'budget', 'cost', 'financial']
    };

    const messageLower = message.toLowerCase();
    let handoffSuggestion = null;
    
    for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
      if (agent === current_agent) continue;
      
      const matchedKeywords = keywords.filter(kw => messageLower.includes(kw));
      
      if (matchedKeywords.length >= 2) {
        const reasons = {
          nette: `I notice you're asking about ${matchedKeywords[0]}. Nette specializes in onboarding and licensing guidance. Would you like to connect with them?`,
          mio: `I'm picking up on ${matchedKeywords[0]} patterns. MIO specializes in accountability and mindset coaching. Would you like their insight?`,
          me: `You mentioned ${matchedKeywords[0]}. ME is our financial strategist who can help with creative financing strategies. Want to chat with them?`
        };
        
        handoffSuggestion = {
          suggestedAgent: agent,
          reason: reasons[agent as keyof typeof reasons],
          confidence: matchedKeywords.length / keywords.length,
          detectedKeywords: matchedKeywords
        };
        break;
      }
    }

    // Load conversation history
    const { data: conversationHistory } = await supabaseClient
      .from('gh_nette_conversations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Load user context
    const { data: avatar } = await supabaseClient
      .from('avatar_assessments')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const { data: recentPractices } = await supabaseClient
      .from('daily_practices')
      .select('*')
      .eq('user_id', user_id)
      .gte('practice_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('practice_date', { ascending: false });

    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('current_streak, total_points, full_name')
      .eq('id', user_id)
      .single();

    const { data: coachIntel } = await supabaseClient
      .from('mio_coach_intelligence')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    // Load practice context if specified
    let practiceContext = null;
    if (practice_id) {
      const { data } = await supabaseClient
        .from('daily_practices')
        .select(`
          *,
          mio_practice_feedback (*)
        `)
        .eq('id', practice_id)
        .single();
      practiceContext = data;
    }

    // Build system prompt
    const systemPrompt = `You are MIO - Mind Insurance Oracle. A forensic behavioral psychologist.

# USER'S MESSAGE:
${message}

# USER CONTEXT
User: ${userProfile?.full_name || 'User'}
${avatar ? `Avatar: ${avatar.avatar_type}
Primary Pattern: ${avatar.primary_pattern}
Temperament: ${avatar.temperament}` : 'No avatar assessment yet'}
Current Streak: ${userProfile?.current_streak || 0} days
Total Points: ${userProfile?.total_points || 0}

${practiceContext ? `# PRACTICE CONTEXT
**Type**: ${practiceContext.practice_type}
**Data**: ${JSON.stringify(practiceContext.data)}
${practiceContext.mio_practice_feedback?.[0] ? `**Previous Feedback**: ${practiceContext.mio_practice_feedback[0].feedback_text}` : ''}
` : ''}

${recentPractices && recentPractices.length > 0 ? `# RECENT PRACTICES (Last 7 Days)
${recentPractices.slice(0, 5).map(p => `- ${p.practice_type}: ${p.practice_date}`).join('\n')}` : ''}

${coachIntel ? `# QUALITY METRICS
- Pattern Awareness: ${coachIntel.pattern_awareness || 'N/A'}
- Energy Trend: ${coachIntel.energy_trend || 'N/A'}
- Dropout Risk: ${coachIntel.dropout_risk_level || 'N/A'}` : ''}

# YOUR TASK
Continue the conversation naturally. Be direct, insightful, and actionable.

**If user is stuck or mentions a blocker:**
- Identify the specific blocker
- Recommend a specific Daily Deductible practice to help
- Explain WHY this practice will help their pattern

**Response Guidelines:**
1. **Length**: 150-300 characters MAX
2. **ONE response**: Don't ask multiple questions
3. ${avatar ? `**Match tone**: Use ${avatar.temperament} communication style` : '**Be warm but direct**'}
4. **Be conversational**: This is dialogue, not lecture
5. **Directness 7+ always**: Be specific and actionable

Return ONLY plain text - your conversational response.`;

    // Save user message with context
    const { data: savedMessage } = await supabaseClient
      .from('gh_nette_conversations')
      .insert({
        user_id,
        role: 'user',
        message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Log to agent_conversations with handoff detection
    await supabaseClient.from('agent_conversations').insert({
      user_id,
      agent_type: current_agent || 'mio',
      user_message: message,
      agent_response: '', // Will be updated after streaming
      is_handoff: handoffSuggestion !== null,
      handoff_context: handoffSuggestion ? {
        suggested_agent: handoffSuggestion.suggestedAgent,
        detected_keywords: handoffSuggestion.detectedKeywords,
        confidence: handoffSuggestion.confidence
      } : null,
      session_id: conversation_id || crypto.randomUUID(),
      user_context: {
        avatar_type: avatar?.avatar_type,
        current_streak: userProfile?.current_streak,
        total_points: userProfile?.total_points
      },
      conversation_turn: conversationHistory?.length || 0
    });

    // Call Lovable AI with streaming
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
          ...(conversationHistory || []).map((msg: any) => ({
            role: msg.role,
            content: msg.message
          })),
          { role: 'user', content: message }
        ],
        stream: true,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    // If we have a handoff suggestion, prepend it to the stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send handoff suggestion first if exists
        if (handoffSuggestion) {
          const metadata = JSON.stringify({
            handoff_suggestion: handoffSuggestion,
            conversation_id: savedMessage?.id
          });
          controller.enqueue(encoder.encode(`data: ${metadata}\n\n`));
        }

        // Then pipe the AI response
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error in mio-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
