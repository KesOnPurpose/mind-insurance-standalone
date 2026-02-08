// ============================================================================
// DETECT-AFFECT Edge Function
// LLM-based affect detection for deeper emotional analysis.
// Called as the second layer after fast regex detection.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AFFECT_SYSTEM_PROMPT = `You are an expert clinical affect detector for a relational coaching system. Analyze the user's message and return a JSON object with:

{
  "primary_emotion": one of: anger, sadness, fear, shame, confusion, hope, joy, frustration, grief, relief, disgust, neutral,
  "secondary_emotion": the emotion underneath the surface one (often the real one),
  "emotional_intensity": 1-10 scale,
  "energy_level": "high_arousal" | "moderate" | "low_energy" | "shutdown",
  "readiness_for_change": "precontemplation" | "contemplation" | "preparation" | "action" | "maintenance",
  "linguistic_markers": {
    "minimizing": boolean,
    "overgeneralizing": boolean,
    "helplessness": boolean,
    "breakthrough_signal": boolean,
    "emotional_flooding": boolean,
    "humor_as_defense": boolean,
    "intellectualizing": boolean,
    "blame_external": boolean,
    "self_blame": boolean,
    "catastrophizing": boolean,
    "seeking_permission": boolean
  },
  "clinical_note": a brief (1 sentence) clinical observation about the emotional state
}

Be precise. Only flag markers you see clear evidence for. Return ONLY valid JSON, no explanation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversation_history } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Build context-aware prompt
    let userPrompt = `Analyze this message:\n\n"${message}"`;
    if (conversation_history && conversation_history.length > 0) {
      const recentHistory = conversation_history.slice(-3).join('\n---\n');
      userPrompt = `Recent conversation context:\n${recentHistory}\n\nAnalyze the LATEST message:\n\n"${message}"`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        temperature: 0.1,
        system: AFFECT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content[0]?.text || '{}';

    // Parse the JSON response
    let affectData;
    try {
      affectData = JSON.parse(text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      affectData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!affectData) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse affect analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ affect: affectData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('detect-affect error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
