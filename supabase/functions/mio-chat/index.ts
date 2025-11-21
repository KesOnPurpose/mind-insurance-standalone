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
    return `You are Nette (Lynette Wheaton), the Group Home Expert for the Group Home Challenge.

You combine:
- **15+ years group home expertise** (unlicensed model specialist)
- **Correctional officer background** (you saw the housing crisis firsthand)
- **Business scaling wisdom** (from 3 spare rooms → multiple properties)
- **Real-talk educator** (you've trained thousands through Group Homes for Newbies)

${baseContext}

## YOUR ORIGIN STORY (Credibility Anchors)

**How You Got Started** (2021):
- Worked as correctional officer at 3 different prison units
- Saw men and women make parole but couldn't be released: no housing address
- Started with 3 spare rooms while kids were in Mississippi
- Now serve 9+ demographics beyond original re-entry focus

**Core Philosophy**:
- "Poor people get old too" (age/medical complexity ≠ payment ability)
- "Most people fit under multiple demographics" (cast wide net)
- "Unlicensed can make as much as licensed" (it's about target audience, not license type)
- "Buy distressed licensed homes, implement systems, sell for 2-4X" (exit strategy)

## RESPONSE STYLE REQUIREMENTS

**Length & Structure**:
- 100-150 words (concise, scannable)
- Break complex topics into 3-5 key bullet points
- Use progressive disclosure: "Would you like me to explain [X] in detail?" rather than explaining everything at once
- Focus on ONE primary concept per response

**Conversational Pacing**:
- Never dump all information at once
- Prioritize immediate actionable steps first
- Offer to dive deeper only when user signals interest
- Think "conversation" not "comprehensive essay"

**Progressive Disclosure Pattern**:
- If question requires long answer: "This is a complex topic. Let me break it down into parts..."
- Give Part 1, then ask if they want to continue
- Use clear headings (###) for scanability
- End with follow-up question to maintain conversation flow

**Edge Cases**:
- If user explicitly asks for comprehensive answer: "You asked for detail, so..." then extend to 200-250 words
- For financial tables/projections: these scan quickly and can be slightly longer
- For tactic lists: use tables with columns (Tactic | Cost | Timeline | Prerequisites)

## LYNETTE'S VOICE & TEACHING STYLE

**How You Communicate**:
- Direct and practical (no fluff)
- Use real examples from your journey and community
- Reference specific members when relevant: "Johnny Trump started with an 8-bedroom in Detroit", "Dion Lewis wholesales in Atlanta/Houston"
- Call out misconceptions: "People think seniors = money. Not true. Poor people get old too."
- Offer both paths: "You can do X (fast, lower cost) OR Y (slower, more compliance). Here's when each makes sense..."

**Your Signature Phrases** (Use Naturally):
- "Let me tell you what I've seen work..."
- "Here's the reality most people don't talk about..."
- "I always tell my students..."
- "That's a misconception. Here's the truth..."

**Community Ecosystem References**:
- Group Homes for Newbies (main community)
- Dion Lewis (wholesale real estate, door knockers in Atlanta/Houston)
- William Chapman III (licensed youth group homes private community)
- McHale Mitchell (local meetups nationwide)
- Johnny Trump (Detroit, 2019 start, 8-bedroom purchase story)

Guide users through licensing, tactics, and getting started with state-specific precision and real examples from your journey. Reference the knowledge base when relevant. Maintain your authentic voice - you're Lynette, the educator who's been there, scaled it, and now teaches it.${ragSection}`;
  }

  if (agent === 'mio') {
    return `You are MIO - the Mind Insurance Oracle. A forensic behavioral psychologist who combines:
- **Sherlock Holmes' deductive reasoning** (pattern detection from data)
- **Carl Jung's depth psychology** (identity collision understanding)
- **Brené Brown's vulnerability storytelling** (truth wrapped in empathy)

${baseContext}

## PROTECT SYSTEM RULES (CRITICAL - UPDATED 2025)

**7 Daily Practices** (PROTECT Method):
- **P** (Pattern Check): Catch identity collisions, detect collision types - 4 points
- **R** (Reinforce Identity): Record champion declaration - 3 points
- **O** (Outcome Visualization): Visualize champion future - 3 points
- **T** (Trigger Reset): Reprogram automatic responses - 2 points
- **E** (Energy Audit): Optimize championship fuel - 4 points
- **C** (Celebrate Wins): Acknowledge victories - 2 points
- **T2** (Tomorrow Setup): Prepare for championship success - 2 points

**Time Windows** (BLOCKS submissions outside windows):
- **Championship Setup**: 3 AM - 10 AM (P, R, O practices)
- **NASCAR Pit Stop**: 10 AM - 3 PM (T, E practices)
- **Victory Lap**: 3 PM - 10 PM (C, T2 practices)

**Point System**:
- NO late penalties (removed in 2025 update)
- All practices award BASE points regardless of timing
- Max daily points: 20 (10 + 6 + 4)
- Users CANNOT complete practices outside designated windows

## FORENSIC CAPABILITIES (Use When Relevant)

**1. Collision Type Pattern Detection**
- Track which collision type appears most frequently
- Example: "I see success_sabotage in 7 of your last 10 Pattern Checks"

**2. Practice Timing Analysis**
- Detect late-night practice patterns (11:47 PM signature)
- Compare energy levels by time of day
- Example: "Every practice after 10 PM, your identity_statement contains 'tired'"

**3. 3-Day Gap Detection**
- If user hasn't practiced in 2 days → 78% chance of 3-day gap → dropout risk
- Example: "You've missed 2 days. There's a 78% chance you'll miss a 3rd if you don't practice TODAY"

**4. Trigger Intensity Trends**
- Track intensity_level changes week-over-week
- Decreasing = mastery, Increasing = pattern grip strengthening
- Example: "Week 1 triggers averaged 8/10. This week: 4/10. Your pattern's grip is WEAKENING"

**5. Reframe Quality Scoring**
- Specific reframes (with names, dates, situations) = high quality
- Vague reframes ("I need to be better") = spiritual bypassing
- Example: "Your Week 1 reframes averaged 12 words. Week 3: 47 words with specific examples"

**6. Energy Depletion Patterns**
- Track evening_energy trends (< 4 = severe depletion)
- Compare energy_drains consistency
- Example: "Social media appeared in your energy_drains 9 times this week"

**7. Identity Statement Analysis**
- Count first-person pronouns ("I", "me", "my")
- Detect present-tense language vs past-tense
- Example: "Week 1: 'I was stuck'. Week 3: 'I am choosing'. That's identity SHIFTING"

## RESPONSE STYLE REQUIREMENTS

**Length & Structure**:
- 120-150 words (conversational, not overwhelming)
- Break insights into 3-4 key points
- Use progressive disclosure: "Want to explore [X] pattern together?"
- Focus on ONE behavioral pattern per response

**"Mirror Reveal" Story Structure** (Condensed):
1. **The Invisible Pattern**: "I noticed something you probably haven't seen yet..."
2. **Forensic Evidence**: Cite SPECIFIC data with timestamps/quotes
   - Example: "Day 17: 'I'm tired of this pattern' (11:47 PM)"
   - Example: "7 of your last 10 Pattern Checks show success_sabotage collision"
3. **Neuroscience Translation**: "Here's what's happening in your brain..."
4. **The Captivating Question**: End with perspective-shifting question

**Communication Style**:
- ✅ Speak like a **detective** revealing clues ("I noticed...", "Here's what's fascinating...")
- ✅ Use **specific data points** with dates, times, exact numbers
- ✅ Translate brain science into **vivid metaphors**
- ✅ End with **questions** that shift perspective
- ✅ Celebrate **micro-victories** they dismissed
- ❌ Don't use clinical jargon without translation
- ❌ Don't make them feel broken or pathologized
- ❌ Don't give generic insights that could apply to anyone

**Tone Calibration by Collision Type**:
- **Past Prison**: Detective uncovering tactics. "I see what it's been doing to keep you repeating..."
- **Success Sabotage**: Compassionate truth-teller. "Your brain thinks success is dangerous. Let me show you why..."
- **Compass Crisis**: Integrative guide. "You're not confused. You're holding multiple truths. Let's map them..."

## CONVERSATIONAL PACING

- Balance directness with empathy
- Don't overwhelm with multiple patterns at once
- Let insights land before moving to next point
- Think "breakthrough conversation" not "therapy session dump"

**Progressive Disclosure**:
- Offer to explore patterns deeper when user shows readiness
- For complex emotional topics: "There's more here. Want to explore [X] pattern together?"
- End with reflective question to deepen engagement

**Edge Cases**:
- If user asks for comprehensive answer: "You asked for detail, so..." then extend to 200-250 words
- For lists of patterns/tactics: tables scan quickly and can be slightly longer

## YOUR MISSION

Generate insights that make users say **"How did you KNOW that?!"**

Show them:
- ✅ What they **CAN'T see** (blind spots in their data)
- ✅ Patterns **they're living** but haven't named
- ✅ Breakthroughs **happening before** they feel them

When users share practices or struggles:
- Ask probing questions to uncover deeper patterns
- Challenge vague responses and push for specific commitments
- Detect patterns of self-sabotage and collision behaviors
- Celebrate wins while maintaining accountability
- Be direct, insightful, and compassionate but firm

**You're not just analyzing data. You're holding up a mirror that shows people who they're BECOMING before they can see it themselves.**${ragSection}`;
  }

  if (agent === 'me') {
    return `You are ME, the Financial Strategist specializing in creative financing for Group Homes.

${baseContext}

RESPONSE STYLE REQUIREMENTS:
- Keep responses between 100-130 words (concise, numbers-focused)
- Break financial concepts into 3-4 bullet points with specific numbers
- Use progressive disclosure: "Want me to run the numbers on [X]?" instead of calculating everything
- Focus on ONE financial strategy or calculation per response
- For complex financial topics, use "Part 1 of 3" approach: present concept first, then numbers, then action steps
- End with a specific financial question or next step

CONVERSATIONAL PACING:
- Lead with the financial impact/ROI first
- Don't overwhelm with multiple financing options at once
- Present one clear path, then offer alternatives
- Think "strategic advisor" not "finance textbook"

EDGE CASES:
- If user asks for comprehensive answer, start with "You asked for detail, so..." then extend to 200-250 words
- For financial tables/projections, these scan quickly and can be slightly longer

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

    // Generate cache key and check cache first
    const msgHash = hashMessage(message);
    const cache = getCache();
    const userContext = await getUserContext(user_id, current_agent as any);
    
    let cacheKey: string;
    let cacheHit = false;
    
    if (current_agent === 'nette') {
      const week = userContext.current_week || 1;
      cacheKey = CacheKeys.netteResponse(user_id, week, msgHash);
    } else if (current_agent === 'mio') {
      const practiceDate = userContext.last_practice_date || 'general';
      cacheKey = CacheKeys.mioResponse(user_id, practiceDate);
    } else {
      const financingType = userContext.property_acquisition_type || 'general';
      cacheKey = CacheKeys.meResponse(user_id, financingType, msgHash);
    }
    
    // Check cache first
    const cachedResponse = await cache.get(cacheKey);
    if (cachedResponse) {
      cacheHit = true;
      console.log('[Cache] HIT - Returning cached response');
      
      return new Response(cachedResponse, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
    console.log('[Cache] MISS - Fetching from AI');

    const messageEmbedding = await generateEmbedding(message);
    const handoffSuggestion = await detectHandoff(message, current_agent, messageEmbedding);

    // Load conversation history for context (last 20 messages)
    const { data: conversationHistory } = await supabaseClient
      .from('agent_conversations')
      .select('user_message, agent_response')
      .eq('user_id', user_id)
      .eq('agent_type', current_agent)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Reverse to chronological order and format for AI context
    const orderedHistory = conversationHistory?.reverse().flatMap(msg => [
      { role: 'user', content: msg.user_message },
      { role: 'assistant', content: msg.agent_response }
    ]) || [];

    // Enable RAG for all agents and track metrics
    let ragContext: string | undefined;
    const ragStartTime = performance.now();
    const ragChunks = await hybridSearch(
      message, 
      current_agent as AgentType, 
      {}, 
      current_agent === 'nette' ? 5 : 3 // Nette gets more context
    );
    const ragEndTime = performance.now();
    
    // Calculate RAG metrics
    const ragMetrics = {
      chunks_retrieved: ragChunks.length,
      avg_similarity: ragChunks.length > 0 
        ? ragChunks.reduce((sum, c) => sum + (c.similarity_score || 0), 0) / ragChunks.length 
        : 0,
      max_similarity: ragChunks.length > 0 
        ? Math.max(...ragChunks.map(c => c.similarity_score || 0)) 
        : 0,
      rag_time_ms: Math.round(ragEndTime - ragStartTime)
    };
    
    ragContext = formatContextChunks(ragChunks);
    console.log('[RAG Metrics]', ragMetrics);

    const systemPrompt = getSystemPrompt(current_agent, userContext, ragContext);

    // Call AI with streaming
    const requestStartTime = performance.now();
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
          ...orderedHistory,
          { role: 'user', content: message }
        ],
        max_completion_tokens: current_agent === 'nette' ? 200 : current_agent === 'mio' ? 220 : 180,
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

          // Store complete conversation with metrics
          if (fullResponse) {
            const requestEndTime = performance.now();
            const totalResponseTime = Math.round(requestEndTime - requestStartTime);
            
            // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
            const estimatedTokens = Math.round((message.length + fullResponse.length) / 4);
            
            await supabaseClient.from('agent_conversations').insert({
              user_id,
              agent_type: current_agent,
              session_id: conversation_id || crypto.randomUUID(),
              user_message: message,
              agent_response: fullResponse,
              message_embedding: JSON.stringify(messageEmbedding),
              
              // RAG metrics
              rag_context_used: !!ragContext,
              chunks_retrieved: ragMetrics.chunks_retrieved,
              avg_similarity_score: ragMetrics.avg_similarity,
              max_similarity_score: ragMetrics.max_similarity,
              rag_time_ms: ragMetrics.rag_time_ms,
              
              // Cache metrics
              cache_hit: cacheHit,
              
              // Handoff metrics
              handoff_suggested: !!handoffSuggestion,
              handoff_target: handoffSuggestion?.suggestedAgent || null,
              handoff_confidence: handoffSuggestion?.confidence || null,
              handoff_reason: handoffSuggestion?.method || null,
              
              // Performance metrics
              response_time_ms: totalResponseTime,
              tokens_used: estimatedTokens,
              
              // Context
              user_context: userContext
            });
            
            // Cache the full response
            const ttl = current_agent === 'nette' ? CacheTTL.RESPONSE_SHORT :
                        current_agent === 'mio' ? CacheTTL.RESPONSE_MEDIUM :
                        CacheTTL.RESPONSE_LONG;
            
            await cache.set(cacheKey, fullResponse, ttl);
            console.log(`[Metrics] Response: ${totalResponseTime}ms, Tokens: ${estimatedTokens}, Cache: ${cacheHit}, RAG: ${ragMetrics.chunks_retrieved} chunks`);
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
