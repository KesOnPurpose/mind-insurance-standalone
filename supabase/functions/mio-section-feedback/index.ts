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

    const { user_id, section, practice_date } = await req.json();

    // Fetch context
    const sectionPractices: Record<string, string[]> = {
      'PRO': ['P', 'R', 'O'],
      'TE': ['T', 'E'],
      'CT': ['C', 'T2']
    };

    const { data: practices } = await supabaseClient
      .from('daily_practices')
      .select('*')
      .eq('user_id', user_id)
      .eq('practice_date', practice_date)
      .in('practice_type', sectionPractices[section]);

    const { data: avatar } = await supabaseClient
      .from('avatar_assessments')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const { data: userProfile } = await supabaseClient
      .from('user_profiles')
      .select('current_streak, total_points, full_name')
      .eq('id', user_id)
      .single();

    const { data: recentPatterns } = await supabaseClient
      .from('mio_forensic_analysis')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    // Format practices for AI prompt
    const practicesSummary = practices?.map(p => {
      return `${p.practice_type}: ${JSON.stringify(p.data)}`;
    }).join('\n');

    // Build AI prompt
    const systemPrompt = `You are MIO - Mind Insurance Oracle. A forensic behavioral psychologist with the uncanny ability to read between the lines of user data and reveal patterns users can't see themselves.

# CURRENT CONTEXT
User: ${userProfile?.full_name || 'User'}
${avatar ? `Avatar Type: ${avatar.avatar_type}
Primary Pattern: ${avatar.primary_pattern}
Temperament: ${avatar.temperament}` : 'No avatar assessment yet'}
Current Streak: ${userProfile?.current_streak || 0} days
Total Points: ${userProfile?.total_points || 0}

# SECTION COMPLETED: ${section}
${section === 'PRO' ? 'Championship Setup (P+R+O) - Morning practices for pattern awareness and identity reinforcement' : 
  section === 'TE' ? 'NASCAR Pit Stop (T+E) - Midday reset for trigger awareness and energy management' : 
  'Victory Lap (C+T2) - Evening celebration and tomorrow planning'}

# PRACTICES SUBMITTED:
${practicesSummary}

${recentPatterns && recentPatterns.length > 0 ? `# RECENT PATTERNS DETECTED:
${recentPatterns.map(p => `- ${p.pattern_detected} (confidence: ${p.confidence_score}%)`).join('\n')}` : ''}

# YOUR TASK:
Analyze their ${section} practices and provide feedback using the Mirror Reveal framework:

1. **Pattern Recognition**: What do you notice in their responses? Be specific about what they wrote.
2. **Insight**: What does it mean about their collision pattern or current state?
3. **Micro-Action**: One specific thing to do next (not generic advice)

Format:
I notice [specific observation from their practice].

That's [pattern/insight about what this reveals].

Micro-Action: [specific, actionable next step]

Be direct, insightful, and actionable. 150-200 words max.
${avatar ? `Match their ${avatar.temperament} temperament communication style.` : 'Be warm but direct.'}`;

    // Call Lovable AI
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
          { role: 'user', content: 'Analyze my practices and give me feedback.' }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const feedbackText = aiData.choices[0].message.content;

    // Save feedback
    const { data: feedback, error: feedbackError } = await supabaseClient
      .from('mio_practice_feedback')
      .insert({
        user_id,
        practice_id: practices?.[0]?.id,
        feedback_type: `${section}_complete`,
        feedback_text: feedbackText,
        practice_type: section,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (feedbackError) throw feedbackError;

    // Create notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        type: 'mio_feedback',
        title: `MIO Feedback: ${section} Complete`,
        message: feedbackText.substring(0, 100) + '...',
        action_url: '/protect',
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        feedback_text: feedbackText,
        feedback_id: feedback.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mio-section-feedback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
