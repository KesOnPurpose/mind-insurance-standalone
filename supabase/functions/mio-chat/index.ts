// ============================================================================
// MULTI-AGENT CHAT FUNCTION (Nette, MIO, ME)
// ============================================================================
// Phase 3 Implementation: RAG-powered with shared services
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { generateEmbedding, cosineSimilarity } from '../_shared/embedding-service.ts';
import { hybridSearch, formatContextChunks } from '../_shared/rag-service.ts';
import { getCache, CacheKeys, CacheTTL, hashMessage } from '../_shared/cache-service.ts';
import { getUserContext, formatUserContextForPrompt } from '../_shared/user-context-service.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENT_EXPERTISE = {
  nette: "Onboarding, licensing, state regulations, compliance, tactics library, model weeks",
  mio: "Accountability, mindset coaching, identity collision, breakthrough patterns, PROTECT practices",
  me: "Creative financing, ROI calculations, seller financing, capital raising, deal structuring"
};

const AGENT_KEYWORDS = {
  nette: ['license', 'regulations', 'compliance', 'tactics', 'model week', 'getting started'],
  mio: ['stuck', 'fear', 'procrastination', 'breakthrough', 'mindset', 'accountability'],
  me: ['financing', 'funding', 'roi', 'cash flow', 'seller finance', 'capital']
};

async function detectHandoff(message: string, currentAgent: string, messageEmbedding: number[]): Promise<any> {
  try {
    const agentEmbeddings: Record<string, number[]> = {};
    for (const [agent, expertise] of Object.entries(AGENT_EXPERTISE)) {
      if (agent === currentAgent) continue;
      agentEmbeddings[agent] = await generateEmbedding(expertise);
    }
    
    const similarities = Object.entries(agentEmbeddings).map(([agent, embedding]) => ({
      agent,
      score: cosineSimilarity(messageEmbedding, embedding)
    })).sort((a, b) => b.score - a.score);
    
    if (similarities[0]?.score > 0.75) {
      return {
        suggestedAgent: similarities[0].agent,
        confidence: similarities[0].score,
        method: 'semantic_similarity'
      };
    }
  } catch (error) {
    console.error('[Handoff] Error:', error);
  }

  const messageLower = message.toLowerCase();
  for (const [agent, keywords] of Object.entries(AGENT_KEYWORDS)) {
    if (agent === currentAgent) continue;
    const matched = keywords.filter(kw => messageLower.includes(kw));
    if (matched.length >= 2) {
      return { suggestedAgent: agent, confidence: 0.8, method: 'keyword_match' };
    }
  }
  return null;
}

function getSystemPrompt(agent: string, userContext: any, ragContext?: string): string {
  const baseContext = formatUserContextForPrompt(userContext);
  const ragSection = ragContext ? `\n\nKNOWLEDGE BASE:\n${ragContext}` : '';

  if (agent === 'nette') {
    return `You are Nette, the Onboarding Specialist for the Group Home Challenge.

${baseContext}

Guide users through licensing, tactics, and getting started. Reference the knowledge base when relevant.${ragSection}`;
  }

  if (agent === 'mio') {
    return `You are MIO, the Accountability Coach specializing in mindset and breakthrough patterns.

${baseContext}

Help users overcome procrastination, fear, and self-sabotage. Be direct and insightful.`;
  }

  if (agent === 'me') {
    return `You are ME, the Financial Strategist specializing in creative financing.

${baseContext}

Guide users through financing strategies, ROI calculations, and deal structuring.`;
  }

  return `You are a helpful AI assistant.`;
}

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

    const { user_id, message, current_agent = 'nette' } = await req.json();

    const messageEmbedding = await generateEmbedding(message);
    const handoffSuggestion = await detectHandoff(message, current_agent, messageEmbedding);
    const userContext = await getUserContext(user_id, current_agent as any);

    const { data: conversationHistory } = await supabaseClient
      .from('gh_nette_conversations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(20);

    let ragContext: string | undefined;
    if (current_agent === 'nette') {
      const ragChunks = await hybridSearch(message, 'nette', {}, 5);
      ragContext = formatContextChunks(ragChunks);
    }

    const systemPrompt = getSystemPrompt(current_agent, userContext, ragContext);

    await supabaseClient.from('gh_nette_conversations').insert({
      user_id,
      role: 'user',
      message,
      handoff_suggested: !!handoffSuggestion,
      handoff_target: handoffSuggestion?.suggestedAgent || null
    });

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
          ...(conversationHistory || []).map((msg: any) => ({ role: msg.role, content: msg.message })),
          { role: 'user', content: message }
        ],
        stream: true
      })
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
