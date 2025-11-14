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

    const { user_id, message, conversation_id, practice_id } = await req.json();

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

    // Save user message
    await supabaseClient
      .from('gh_nette_conversations')
      .insert({
        user_id,
        role: 'user',
        message,
        created_at: new Date().toISOString()
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

    // Return streaming response
    return new Response(response.body, {
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
