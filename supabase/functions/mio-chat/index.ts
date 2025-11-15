// ============================================================================
// MULTI-AGENT CHAT FUNCTION (Nette, MIO, ME)
// ============================================================================
// Phase 3 Implementation: RAG-powered with shared services
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { generateEmbedding, cosineSimilarity } from '../_shared/embedding-service.ts';
import { hybridSearch, formatContextChunks, type AgentType } from '../_shared/rag-service.ts';
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

Your role is to help users overcome procrastination, fear, and self-sabotage through the PROTECT framework:
- Detect patterns of self-sabotage and collision behaviors
- Challenge vague responses and push for specific, actionable commitments
- Celebrate wins while maintaining accountability
- Be direct, insightful, and compassionate but firm

When users share practices or struggles, ask probing questions to uncover deeper patterns.${ragSection}`;
  }

  if (agent === 'me') {
    return `You are ME, the Financial Strategist specializing in creative financing for Group Homes.

${baseContext}

Guide users through:
- Creative financing strategies (seller financing, subject-to, lease options)
- ROI calculations and cash flow projections
- Deal structuring and negotiation tactics
- Capital raising and investor presentations

Provide specific numbers, formulas, and actionable strategies. Reference the knowledge base for detailed examples.${ragSection}`;
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

    const { user_id, message, current_agent = 'nette', conversation_id } = await req.json();
    
    console.log(`[Chat] User: ${user_id}, Agent: ${current_agent}, ConversationID: ${conversation_id || 'new'}`);

    const messageEmbedding = await generateEmbedding(message);
    const handoffSuggestion = await detectHandoff(message, current_agent, messageEmbedding);
    const userContext = await getUserContext(user_id, current_agent as any);

    // Load conversation history for context (last 20 messages)
    const { data: conversationHistory } = await supabaseClient
      .from('gh_nette_conversations')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Reverse to chronological order for AI context
    const orderedHistory = conversationHistory?.reverse() || [];

    // Enable RAG for all agents
    let ragContext: string | undefined;
    const ragChunks = await hybridSearch(
      message, 
      current_agent as AgentType, 
      {}, 
      current_agent === 'nette' ? 5 : 3 // Nette gets more context
    );
    ragContext = formatContextChunks(ragChunks);

    const systemPrompt = getSystemPrompt(current_agent, userContext, ragContext);

    // Store user message
    await supabaseClient.from('gh_nette_conversations').insert({
      user_id,
      role: 'user',
      message,
      handoff_suggested: !!handoffSuggestion,
      handoff_target: handoffSuggestion?.suggestedAgent || null
    });

    // Call AI with streaming
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
          ...orderedHistory.map((msg: any) => ({ role: msg.role, content: msg.message })),
          { role: 'user', content: message }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    // Create a transform stream to capture the response and send handoff metadata
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullResponse = '';
    let handoffSent = false;

    const stream = new ReadableStream({
      async start(controller) {
        // Send handoff suggestion as first event if detected
        if (handoffSuggestion && !handoffSent) {
          const handoffEvent = `data: ${JSON.stringify({
            type: 'handoff',
            suggestedAgent: handoffSuggestion.suggestedAgent,
            confidence: handoffSuggestion.confidence,
            method: handoffSuggestion.method
          })}\n\n`;
          controller.enqueue(encoder.encode(handoffEvent));
          handoffSent = true;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            controller.enqueue(value);

            // Parse SSE to extract content
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices?.[0]?.delta?.content;
                  if (content) fullResponse += content;
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }

          // Store assistant response
          if (fullResponse) {
            await supabaseClient.from('gh_nette_conversations').insert({
              user_id,
              role: 'assistant',
              message: fullResponse
            });
          }

          controller.close();
        } catch (error) {
          console.error('[Stream] Error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
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
