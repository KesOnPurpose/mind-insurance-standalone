// ============================================================================
// DECOMPOSE-QUERY Edge Function
// Breaks complex user messages into focused sub-queries using Claude.
// Each sub-query targets a specific relational domain.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DECOMPOSE_SYSTEM_PROMPT = `You are a query decomposition expert for a relational coaching knowledge base. Given a user's message about their relationship, break it into 2-4 focused sub-queries, each targeting a specific domain.

Available domains:
- foundation_attachment: Attachment styles, bonding, emotional connection
- communication_conflict: Communication patterns, conflict resolution, Four Horsemen
- trauma_nervous_system: Trauma, nervous system regulation, PTSD, triggers
- abuse_narcissism: Abuse patterns, narcissism, safety, power dynamics
- addiction_codependency: Addiction, codependency, recovery, betrayal trauma
- neurodivergence: ADHD, autism, sensory needs in relationships
- modern_threats: Social media, technology, financial infidelity
- financial_mens: Money stress, financial conflict, identity/provider issues
- cultural_context: Cultural, religious, faith-based relationship dynamics
- premarital_formation: Pre-marriage, engagement, boundary setting

Return a JSON array of sub-queries:
[
  {
    "query_text": "a search-optimized query for the knowledge base",
    "target_domain": "one of the domains above",
    "reasoning": "why this sub-query is needed",
    "priority": 1-3 (1=highest)
  }
]

Rules:
- Only create sub-queries for domains you see clear evidence of in the message
- The query_text should be a statement (not a question) optimized for semantic search
- Maximum 4 sub-queries
- Return ONLY valid JSON array, no explanation`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, profile_context, triage_context } = await req.json();

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

    let userPrompt = `User message: "${message}"`;
    if (profile_context) {
      userPrompt += `\n\n${profile_context}`;
    }
    if (triage_context) {
      userPrompt += `\n\n${triage_context}`;
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
        temperature: 0.2,
        system: DECOMPOSE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content[0]?.text || '[]';

    let subQueries;
    try {
      subQueries = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      subQueries = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    return new Response(
      JSON.stringify({ sub_queries: subQueries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('decompose-query error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
