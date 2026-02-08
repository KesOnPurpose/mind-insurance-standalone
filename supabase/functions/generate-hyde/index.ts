// ============================================================================
// GENERATE-HYDE Edge Function
// Generates a hypothetical ideal therapeutic answer for HyDE embedding.
// Keeps the Anthropic/OpenAI API key server-side.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { system_prompt, user_prompt, max_tokens = 400, temperature = 0.3, mode, text } = body;

    // Mode: embed_only — just generate embedding for given text, no HyDE
    if (mode === 'embed_only') {
      if (!text) {
        return new Response(
          JSON.stringify({ error: 'text is required for embed_only mode' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
          dimensions: 1536,
        }),
      });

      if (!embResponse.ok) {
        throw new Error(`OpenAI embedding error: ${embResponse.status}`);
      }

      const embResult = await embResponse.json();
      return new Response(
        JSON.stringify({ embedding: embResult.data[0].embedding }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!user_prompt) {
      return new Response(
        JSON.stringify({ error: 'user_prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let text: string;

    // Prefer Anthropic (Claude) for HyDE generation
    if (ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens,
          temperature,
          system: system_prompt || 'You are a helpful relational therapist.',
          messages: [{ role: 'user', content: user_prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const result = await response.json();
      text = result.content[0]?.text || '';
    } else if (OPENAI_API_KEY) {
      // Fallback to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens,
          temperature,
          messages: [
            { role: 'system', content: system_prompt || 'You are a helpful relational therapist.' },
            { role: 'user', content: user_prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      text = result.choices[0]?.message?.content || '';
    } else {
      return new Response(
        JSON.stringify({ error: 'No API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('generate-hyde error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
