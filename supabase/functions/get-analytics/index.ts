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

        // Null-safe calculations
        const total = data?.length || 0;
        const cacheHits = data?.filter(d => d.cache_hit).length || 0;

        // Calculate by agent
        const byAgent: Record<string, { total: number; hits: number; rate: number }> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data?.filter(d => d.agent_type === agent) || [];
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

        // Null-safe average calculation
        const avgTime = data && data.length > 0
          ? data.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / data.length
          : 0;

        // Calculate by agent and cache status
        const byAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data?.filter(d => d.agent_type === agent) || [];
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

        // Null-safe average calculations
        const dataLen = data?.length || 0;
        const avgSimilarity = dataLen > 0
          ? data!.reduce((sum, d) => sum + (d.avg_similarity_score || 0), 0) / dataLen
          : 0;
        const avgChunks = dataLen > 0
          ? data!.reduce((sum, d) => sum + (d.chunks_retrieved || 0), 0) / dataLen
          : 0;
        const avgRagTime = dataLen > 0
          ? data!.reduce((sum, d) => sum + (d.rag_time_ms || 0), 0) / dataLen
          : 0;

        // Calculate by agent
        const byAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data?.filter(d => d.agent_type === agent) || [];
          byAgent[agent] = {
            avg_similarity: agentData.length > 0
              ? (agentData.reduce((sum, d) => sum + (d.avg_similarity_score || 0), 0) / agentData.length).toFixed(3)
              : '0.000',
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
          total_rag_queries: dataLen,
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

        // Null-safe average confidence calculation
        const dataLen = data?.length || 0;
        const avgConfidence = dataLen > 0
          ? data!.reduce((sum, d) => sum + (d.handoff_confidence || 0), 0) / dataLen
          : 0;

        // Calculate by source and target agent
        const bySourceAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentData = data?.filter(d => d.agent_type === agent) || [];
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
              : '0.000',
            target_breakdown: targets
          };
        });

        result = {
          total_handoff_suggestions: dataLen,
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
          .select('agent_type, created_date, user_id')
          .gte('created_at', timeFilter);

        if (agent_type) query = query.eq('agent_type', agent_type);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate unique users (for DAU calculation)
        const uniqueUsers = new Set(data?.map(d => d.user_id).filter(Boolean) || []).size;

        // Calculate by agent
        const byAgent: Record<string, number> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          byAgent[agent] = data?.filter(d => d.agent_type === agent).length || 0;
        });

        // Calculate by day - uses generated column created_date (already a date string)
        const byDay: Record<string, number> = {};
        data?.forEach(d => {
          const day = d.created_date; // Generated column is already a date
          if (day) {
            byDay[day] = (byDay[day] || 0) + 1;
          }
        });

        result = {
          total_conversations: data?.length || 0,
          unique_users: uniqueUsers,
          by_agent: byAgent,
          by_day: byDay
        };
        break;
      }

      case 'error_rate': {
        // Query error tracking
        let errorQuery = supabaseClient
          .from('agent_errors')
          .select('id, agent_type, severity, created_at')
          .gte('created_at', timeFilter);

        if (agent_type) errorQuery = errorQuery.eq('agent_type', agent_type);

        let conversationQuery = supabaseClient
          .from('agent_conversations')
          .select('id, agent_type')
          .gte('created_at', timeFilter);

        if (agent_type) conversationQuery = conversationQuery.eq('agent_type', agent_type);

        const [{ data: errors, error: errorError }, { data: conversations, error: convError }] = await Promise.all([
          errorQuery,
          conversationQuery
        ]);

        if (errorError) throw errorError;
        if (convError) throw convError;

        const totalRequests = conversations?.length || 0;
        const totalErrors = errors?.length || 0;
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests * 100) : 0;

        // Calculate by agent
        const byAgent: Record<string, any> = {};
        ['nette', 'mio', 'me'].forEach(agent => {
          const agentRequests = conversations?.filter(d => d.agent_type === agent).length || 0;
          const agentErrors = errors?.filter(d => d.agent_type === agent).length || 0;
          byAgent[agent] = {
            total_requests: agentRequests,
            total_errors: agentErrors,
            error_rate: agentRequests > 0 ? (agentErrors / agentRequests * 100) : 0
          };
        });

        // Calculate by severity
        const bySeverity: Record<string, number> = {};
        ['low', 'medium', 'high', 'critical'].forEach(severity => {
          bySeverity[severity] = errors?.filter(e => e.severity === severity).length || 0;
        });

        result = {
          overall_error_rate: errorRate,
          total_requests: totalRequests,
          total_errors: totalErrors,
          by_agent: byAgent,
          by_severity: bySeverity
        };
        break;
      }

      case 'user_engagement': {
        // Query user engagement metrics
        const dau7Query = supabaseClient
          .from('agent_conversations')
          .select('user_id')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const mau30Query = supabaseClient
          .from('agent_conversations')
          .select('user_id')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const practicesQuery = supabaseClient
          .from('daily_practices')
          .select('user_id, completed, practice_date')
          .gte('practice_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .eq('completed', true);

        const sessionsQuery = supabaseClient
          .from('user_sessions')
          .select('user_id, started_at')
          .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const [{ data: dauData }, { data: mauData }, { data: practicesData }, { data: sessionsData }] = await Promise.all([
          dau7Query,
          mau30Query,
          practicesQuery,
          sessionsQuery
        ]);

        // Calculate unique users
        const dau = new Set(dauData?.map(d => d.user_id) || []).size;
        const mau = new Set(mauData?.map(d => d.user_id) || []).size;
        const dauMauRatio = mau > 0 ? (dau / mau * 100) : 0;

        // Calculate weekly tactics completed (practices)
        const weeklyTactics = practicesData?.length || 0;
        const uniqueUsersPracticing = new Set(practicesData?.map(d => d.user_id) || []).size;
        const avgTacticsPerUser = uniqueUsersPracticing > 0 ? (weeklyTactics / uniqueUsersPracticing) : 0;

        // Calculate session frequency
        const uniqueUsersWithSessions = new Set(sessionsData?.map(d => d.user_id) || []).size;
        const totalSessions = sessionsData?.length || 0;
        const avgSessionsPerWeek = uniqueUsersWithSessions > 0 ? (totalSessions / uniqueUsersWithSessions) : 0;

        // Mock/default values for metrics that require more complex calculations
        // These would be calculated from historical data in production
        const avgPracticeStreak = 7; // Default placeholder
        const userRetentionRate = 85; // Default placeholder
        const timeToFirstAction = 3; // Default placeholder in minutes

        result = {
          daily_active_users: dau,
          monthly_active_users: mau,
          dau_mau_ratio: dauMauRatio,
          tactics_completed_weekly: weeklyTactics,
          avg_practice_streak_days: avgPracticeStreak,
          user_retention_rate: userRetentionRate,
          session_frequency: avgSessionsPerWeek,
          time_to_first_action_minutes: timeToFirstAction,
        };
        break;
      }

      case 'feature_adoption': {
        // Query feature usage stats
        const { data: featureData, error: featureError } = await supabaseClient
          .from('feature_usage')
          .select('user_id, feature_name, feature_category, usage_count');

        if (featureError) throw featureError;

        // Get total registered users
        const { data: profilesData, error: profilesError } = await supabaseClient
          .from('user_profiles')
          .select('id')
          .gte('created_at', timeFilter);

        if (profilesError) throw profilesError;

        const totalUsers = profilesData?.length || 0;
        const uniqueFeatureUsers = new Set(featureData?.map(d => d.user_id) || []).size;
        const adoptionRate = totalUsers > 0 ? (uniqueFeatureUsers / totalUsers * 100) : 0;

        // Calculate by feature
        const byFeature: Record<string, any> = {};
        const allFeatures = new Set(featureData?.map(d => d.feature_name) || []);
        allFeatures.forEach(feature => {
          const featureUsers = new Set(featureData?.filter(d => d.feature_name === feature).map(d => d.user_id) || []).size;
          byFeature[feature] = {
            unique_users: featureUsers,
            adoption_rate: totalUsers > 0 ? (featureUsers / totalUsers * 100) : 0
          };
        });

        // Calculate by category
        const byCategory: Record<string, any> = {};
        const allCategories = new Set(featureData?.map(d => d.feature_category) || []);
        allCategories.forEach(category => {
          const categoryUsers = new Set(featureData?.filter(d => d.feature_category === category).map(d => d.user_id) || []).size;
          byCategory[category] = {
            unique_users: categoryUsers,
            adoption_rate: totalUsers > 0 ? (categoryUsers / totalUsers * 100) : 0
          };
        });

        result = {
          overall_adoption_rate: adoptionRate,
          total_users: totalUsers,
          users_with_feature_usage: uniqueFeatureUsers,
          by_feature: byFeature,
          by_category: byCategory
        };
        break;
      }

      case 'conversation_volume_multi_source': {
        // ============================================================================
        // MULTI-SOURCE CONVERSATION VOLUME
        // ============================================================================
        // Queries chat data directly from source tables instead of agent_conversations
        // This provides accurate counts even when sync hasn't run
        // ============================================================================

        // Query nette_chat_histories (count messages)
        const { count: netteMessageCount, error: netteError } = await supabaseClient
          .from('nette_chat_histories')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', timeFilter);

        if (netteError) console.error('[Analytics] Nette query error:', netteError);

        // Get unique Nette sessions
        const { data: netteSessions } = await supabaseClient
          .from('nette_chat_histories')
          .select('session_id')
          .gte('created_at', timeFilter);
        const uniqueNetteSessions = new Set(netteSessions?.map(s => s.session_id) || []).size;

        // Query me_chat_histories (count messages)
        const { count: meMessageCount, error: meError } = await supabaseClient
          .from('me_chat_histories')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', timeFilter);

        if (meError) console.error('[Analytics] ME query error:', meError);

        // Get unique ME sessions
        const { data: meSessions } = await supabaseClient
          .from('me_chat_histories')
          .select('session_id')
          .gte('created_at', timeFilter);
        const uniqueMeSessions = new Set(meSessions?.map(s => s.session_id) || []).size;

        // Query mio_conversations (these have REAL user_ids!)
        const { data: mioData, error: mioError } = await supabaseClient
          .from('mio_conversations')
          .select('user_id, total_messages, created_at')
          .gte('created_at', timeFilter);

        if (mioError) console.error('[Analytics] MIO query error:', mioError);

        // MIO is the only reliable source for real user IDs
        const uniqueMioUsers = new Set(mioData?.map(m => m.user_id).filter(Boolean) || []);
        const mioConversationCount = mioData?.length || 0;
        const mioMessageCount = mioData?.reduce((sum, m) => sum + (m.total_messages || 0), 0) || 0;

        // Calculate daily breakdown from MIO (has timestamps)
        const byDay: Record<string, number> = {};
        mioData?.forEach(m => {
          const day = m.created_at?.split('T')[0];
          if (day) {
            byDay[day] = (byDay[day] || 0) + 1;
          }
        });

        // Total messages across all sources
        const totalMessages = (netteMessageCount || 0) + (meMessageCount || 0) + mioMessageCount;
        // Total sessions/conversations
        const totalConversations = uniqueNetteSessions + uniqueMeSessions + mioConversationCount;

        result = {
          total_messages: totalMessages,
          total_conversations: totalConversations,
          nette: {
            messages: netteMessageCount || 0,
            sessions: uniqueNetteSessions,
          },
          me: {
            messages: meMessageCount || 0,
            sessions: uniqueMeSessions,
          },
          mio: {
            conversations: mioConversationCount,
            messages: mioMessageCount,
            unique_users: uniqueMioUsers.size,
          },
          // Only MIO has reliable user data
          unique_users_verified: uniqueMioUsers.size,
          active_sessions_total: uniqueNetteSessions + uniqueMeSessions + mioConversationCount,
          by_agent: {
            nette: uniqueNetteSessions,
            me: uniqueMeSessions,
            mio: mioConversationCount,
          },
          by_day: byDay,
          data_quality_note: 'Nette/ME show session counts. Only MIO has verified user_ids.',
        };
        break;
      }

      case 'top_users': {
        // ============================================================================
        // TOP USERS LEADERBOARD (Using MIO data for real users)
        // ============================================================================
        // MIO is the only source with verified user_ids that link to auth.users
        // Nette/ME use random session UUIDs, not real user IDs
        // ============================================================================

        // Get MIO conversations (these have REAL user_ids!)
        const { data: mioConversations, error: mioError } = await supabaseClient
          .from('mio_conversations')
          .select('user_id, conversation_type, total_messages, created_at')
          .gte('created_at', timeFilter)
          .not('user_id', 'is', null);

        if (mioError) throw mioError;

        if (!mioConversations || mioConversations.length === 0) {
          // Fallback: Show message about no verified user data
          result = {
            users: [],
            total_conversations: 0,
            note: 'No MIO conversations found with verified user IDs. Nette/ME use session IDs, not user IDs.'
          };
          break;
        }

        // Aggregate MIO conversations by user
        const userStats = new Map<string, {
          total: number;
          totalMessages: number;
          lastActive: string;
          conversationTypes: Record<string, number>;
        }>();

        mioConversations.forEach((conv) => {
          const userId = conv.user_id;
          const existing = userStats.get(userId) || {
            total: 0,
            totalMessages: 0,
            lastActive: conv.created_at,
            conversationTypes: {},
          };

          existing.total++;
          existing.totalMessages += conv.total_messages || 0;

          const convType = conv.conversation_type || 'general';
          existing.conversationTypes[convType] = (existing.conversationTypes[convType] || 0) + 1;

          if (new Date(conv.created_at) > new Date(existing.lastActive)) {
            existing.lastActive = conv.created_at;
          }

          userStats.set(userId, existing);
        });

        // Get user profiles for emails/names
        const userIds = Array.from(userStats.keys());

        // Try user_profiles first
        const { data: profilesData } = await supabaseClient
          .from('user_profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        // Also check gh_approved_users for user info
        const { data: approvedUsersData } = await supabaseClient
          .from('gh_approved_users')
          .select('user_id, email, full_name')
          .in('user_id', userIds);

        // Fetch from Supabase Auth admin API
        const authUsersResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/users`,
          {
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
            },
          }
        );
        const authUsersData = authUsersResponse.ok ? await authUsersResponse.json() : { users: [] };

        // Merge data: priority order is user_profiles > gh_approved_users > auth.users
        const profileMap = new Map<string, { email: string | null; full_name: string | null }>();

        // First add auth.users data (lowest priority)
        (authUsersData.users || []).forEach((u: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
          if (userIds.includes(u.id)) {
            profileMap.set(u.id, {
              email: u.email || null,
              full_name: u.user_metadata?.full_name || null
            });
          }
        });

        // Then add gh_approved_users data
        (approvedUsersData || []).forEach(p => {
          const existing = profileMap.get(p.user_id);
          profileMap.set(p.user_id, {
            email: p.email || existing?.email || null,
            full_name: p.full_name || existing?.full_name || null
          });
        });

        // Finally overlay user_profiles data (highest precedence)
        (profilesData || []).forEach(p => {
          const existing = profileMap.get(p.id);
          profileMap.set(p.id, {
            email: p.email || existing?.email || null,
            full_name: p.full_name || existing?.full_name || null
          });
        });

        // Calculate average for engagement levels
        const allTotals = Array.from(userStats.values()).map(s => s.total);
        const avgTotal = allTotals.length > 0
          ? allTotals.reduce((a, b) => a + b, 0) / allTotals.length
          : 0;

        // Convert to array and sort by total conversations
        const topUsers = Array.from(userStats.entries())
          .map(([userId, stats]) => {
            const profile = profileMap.get(userId);

            // Determine most common conversation type
            const favoriteType = Object.entries(stats.conversationTypes)
              .sort(([, a], [, b]) => b - a)[0]?.[0] || 'general';

            // Determine engagement level
            let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
            if (stats.total >= avgTotal * 1.5) {
              engagementLevel = 'high';
            } else if (stats.total < avgTotal * 0.5) {
              engagementLevel = 'low';
            }

            return {
              user_id: userId,
              email: profile?.email || null,
              full_name: profile?.full_name || null,
              total_conversations: stats.total,
              total_messages: stats.totalMessages,
              favorite_agent: 'mio', // All from MIO
              favorite_conversation_type: favoriteType,
              last_active: stats.lastActive,
              engagement_level: engagementLevel,
            };
          })
          .sort((a, b) => b.total_conversations - a.total_conversations)
          .slice(0, 10); // Top 10

        result = {
          users: topUsers,
          total_conversations: mioConversations.length,
          unique_users: userStats.size,
          data_source: 'mio_conversations',
          note: 'Only MIO has verified user IDs. Nette/ME use session UUIDs.',
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
