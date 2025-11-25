// ============================================================================
// ANALYTICS DASHBOARD FUNCTION
// ============================================================================
// Provides metrics queries for agent performance monitoring:
// - cache_hit_rate: Percentage of cached responses by agent
// - avg_response_time: Average response time in ms by agent
// - rag_quality: RAG similarity scores and chunk usage
// - handoff_accuracy: Handoff suggestion metrics
// - conversation_volume: Message counts by agent and time
// ============================================================================

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { metric_type, time_range = '7d', agent_type } = await req.json();
    
    if (!metric_type) {
      throw new Error('metric_type is required');
    }

    // Calculate time filter
    let hoursAgo = 168; // 7 days default
    if (time_range === '24h') hoursAgo = 24;
    else if (time_range === '7d') hoursAgo = 168;
    else if (time_range === '30d') hoursAgo = 720;
    
    const timeFilter = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    let result;

    switch (metric_type) {
      case 'cache_hit_rate': {
        // Query cache hit rates
        let query = supabaseClient
          .from('agent_conversations')
          .select('cache_hit, agent_type')
          .gte('created_at', timeFilter);
        
        if (agent_type) query = query.eq('agent_type', agent_type);
        
        const { data, error } = await query;
        if (error) throw error;
        
        const total = data.length;
        const cacheHits = data.filter(d => d.cache_hit).length;
        
        // Calculate by agent
        const byAgent: Record<string, { total: number; hits: number; rate: number }> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data.filter(d => d.agent_type === agent);
          const agentHits = agentData.filter(d => d.cache_hit).length;
          byAgent[agent] = {
            total: agentData.length,
            hits: agentHits,
            rate: agentData.length > 0 ? (agentHits / agentData.length * 100) : 0
          };
        });
        
        result = {
          overall_rate: total > 0 ? (cacheHits / total * 100) : 0,
          total_requests: total,
          cache_hits: cacheHits,
          cache_misses: total - cacheHits,
          by_agent: byAgent
        };
        break;
      }

      case 'avg_response_time': {
        // Query response times
        let query = supabaseClient
          .from('agent_conversations')
          .select('response_time_ms, agent_type, cache_hit')
          .gte('created_at', timeFilter)
          .not('response_time_ms', 'is', null);
        
        if (agent_type) query = query.eq('agent_type', agent_type);
        
        const { data, error } = await query;
        if (error) throw error;
        
        const avgTime = data.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / data.length;
        
        // Calculate by agent and cache status
        const byAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data.filter(d => d.agent_type === agent);
          const cacheHitData = agentData.filter(d => d.cache_hit);
          const cacheMissData = agentData.filter(d => !d.cache_hit);
          
          byAgent[agent] = {
            avg_ms: agentData.length > 0 
              ? Math.round(agentData.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / agentData.length)
              : 0,
            avg_cache_hit_ms: cacheHitData.length > 0
              ? Math.round(cacheHitData.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / cacheHitData.length)
              : 0,
            avg_cache_miss_ms: cacheMissData.length > 0
              ? Math.round(cacheMissData.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / cacheMissData.length)
              : 0,
            total_requests: agentData.length
          };
        });
        
        result = {
          overall_avg_ms: Math.round(avgTime),
          by_agent: byAgent
        };
        break;
      }

      case 'rag_quality': {
        // Query RAG metrics
        let query = supabaseClient
          .from('agent_conversations')
          .select('avg_similarity_score, max_similarity_score, chunks_retrieved, rag_time_ms, agent_type, rag_context_used')
          .gte('created_at', timeFilter)
          .eq('rag_context_used', true);
        
        if (agent_type) query = query.eq('agent_type', agent_type);
        
        const { data, error } = await query;
        if (error) throw error;
        
        const avgSimilarity = data.reduce((sum, d) => sum + (d.avg_similarity_score || 0), 0) / data.length;
        const avgChunks = data.reduce((sum, d) => sum + (d.chunks_retrieved || 0), 0) / data.length;
        const avgRagTime = data.reduce((sum, d) => sum + (d.rag_time_ms || 0), 0) / data.length;
        
        // Calculate by agent
        const byAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data.filter(d => d.agent_type === agent);
          byAgent[agent] = {
            avg_similarity: agentData.length > 0
              ? (agentData.reduce((sum, d) => sum + (d.avg_similarity_score || 0), 0) / agentData.length).toFixed(3)
              : 0,
            avg_chunks: agentData.length > 0
              ? Math.round(agentData.reduce((sum, d) => sum + (d.chunks_retrieved || 0), 0) / agentData.length)
              : 0,
            avg_rag_time_ms: agentData.length > 0
              ? Math.round(agentData.reduce((sum, d) => sum + (d.rag_time_ms || 0), 0) / agentData.length)
              : 0,
            total_queries: agentData.length
          };
        });
        
        result = {
          overall_avg_similarity: avgSimilarity.toFixed(3),
          overall_avg_chunks: Math.round(avgChunks),
          overall_avg_rag_time_ms: Math.round(avgRagTime),
          total_rag_queries: data.length,
          by_agent: byAgent
        };
        break;
      }

      case 'handoff_accuracy': {
        // Query handoff suggestions
        let query = supabaseClient
          .from('agent_conversations')
          .select('handoff_suggested, handoff_confidence, handoff_target, agent_type')
          .gte('created_at', timeFilter)
          .eq('handoff_suggested', true);
        
        if (agent_type) query = query.eq('agent_type', agent_type);
        
        const { data, error } = await query;
        if (error) throw error;
        
        const avgConfidence = data.reduce((sum, d) => sum + (d.handoff_confidence || 0), 0) / data.length;
        
        // Calculate by source and target agent
        const bySourceAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data.filter(d => d.agent_type === agent);
          const targets: Record<string, number> = {};
          agentData.forEach(d => {
            if (d.handoff_target) {
              targets[d.handoff_target] = (targets[d.handoff_target] || 0) + 1;
            }
          });
          
          bySourceAgent[agent] = {
            total_suggestions: agentData.length,
            avg_confidence: agentData.length > 0
              ? (agentData.reduce((sum, d) => sum + (d.handoff_confidence || 0), 0) / agentData.length).toFixed(3)
              : 0,
            target_breakdown: targets
          };
        });
        
        result = {
          total_handoff_suggestions: data.length,
          overall_avg_confidence: avgConfidence.toFixed(3),
          by_source_agent: bySourceAgent
        };
        break;
      }

      case 'conversation_volume': {
        // Query conversation counts
        // NOTE: Uses generated column 'created_date' for efficient daily grouping
        // This leverages idx_agent_conversations_daily_volume index
        let query = supabaseClient
          .from('agent_conversations')
          .select('agent_type, created_date')
          .gte('created_at', timeFilter);

        if (agent_type) query = query.eq('agent_type', agent_type);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate by agent
        const byAgent: Record<string, number> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          byAgent[agent] = data.filter(d => d.agent_type === agent).length;
        });

        // Calculate by day - uses generated column created_date (already a date string)
        const byDay: Record<string, number> = {};
        data.forEach(d => {
          const day = d.created_date; // Generated column is already a date
          byDay[day] = (byDay[day] || 0) + 1;
        });

        result = {
          total_conversations: data.length,
          by_agent: byAgent,
          by_day: byDay
        };
        break;
      }

      default:
        throw new Error(`Unknown metric type: ${metric_type}`);
    }

    return new Response(
      JSON.stringify({ 
        metric_type, 
        time_range, 
        agent_type: agent_type || 'all',
        result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Analytics] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
