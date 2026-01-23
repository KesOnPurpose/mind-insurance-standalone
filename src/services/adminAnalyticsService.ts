import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useCanReadAnalytics, useCanExportAnalytics, useAdmin } from '@/contexts/AdminContext';
import {
  getCachedMetric,
  setCachedMetric,
  invalidateCache,
  TTL_CONFIG,
} from '@/services/metricsCache';
import {
  logAnalyticsView,
  logCacheAnalyticsView,
  logPerformanceMetricsView,
  logRAGQualityView,
  logHandoffAccuracyView,
  logUserAnalyticsView,
  logDataExport,
  logFilterChange,
} from '@/services/auditLogger';
import type {
  AgentType,
  TimeRange,
  MetricType,
  AnalyticsRequest,
  CacheHitRateData,
  CacheHitRateResponse,
  ResponseTimeData,
  AvgResponseTimeResponse,
  RAGQualityData,
  RAGQualityResponse,
  HandoffAccuracyData,
  HandoffAccuracyResponse,
  ConversationVolumeData,
  ConversationVolumeResponse,
  PerformanceData,
  UserAnalyticsData,
  DashboardKPIs,
  AnalyticsResponse,
  UserEngagementData,
  TopUserData,
} from '@/types/adminAnalytics';

/**
 * Admin Analytics Service
 * Provides functions to fetch analytics data from the get-analytics edge function
 * All functions include proper error handling, loading states, and TypeScript typing
 *
 * This service provides both:
 * 1. Direct async functions for imperative use
 * 2. React Query hooks for declarative use in components
 *
 * CACHING: All metric functions now use metricsCache service for improved performance
 *
 * GROUPHOME STANDALONE: Analytics now focused on Nette (GH coach) only.
 * MIO/ME fields in response types remain for edge function compatibility but return 0/empty.
 */

// Helper function to convert date range to time_range parameter
function getTimeRangeFromDates(startDate: Date, endDate: Date): TimeRange {
  const diffHours = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 24) return '24h';
  if (diffHours <= 168) return '7d';
  return '30d';
}

// Base function to call the analytics edge function
async function callAnalyticsEndpoint<T extends AnalyticsResponse>(
  request: AnalyticsRequest
): Promise<T> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      throw new Error('Authentication required to access analytics');
    }

    const response = await supabase.functions.invoke('get-analytics', {
      body: request,
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to fetch analytics');
    }

    return response.data as T;
  } catch (error) {
    console.error('[Analytics Service] Error calling endpoint:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching analytics');
  }
}

/**
 * Get cache hit rate analytics by agent
 * Returns cache performance metrics for the specified agent and time range
 * CACHED: 10 minute TTL
 */
export async function getCacheHitRateByAgent(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  adminUserId?: string
): Promise<CacheHitRateData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);
    const filters = agentType !== 'all' ? { agentType } : {};

    // Log analytics view (fire-and-forget)
    logCacheAnalyticsView(adminUserId, agentType === 'all' ? undefined : agentType, time_range, {
      filters,
    }).catch(() => {});

    // Check cache first
    const cached = await getCachedMetric('cache_hit_rate', time_range, filters);
    if (cached) {
      console.log('[Analytics Service] Cache hit: cache_hit_rate');
      return cached;
    }

    // Cache miss - fetch from endpoint
    const request: AnalyticsRequest = {
      metric_type: 'cache_hit_rate',
      time_range,
      ...(agentType !== 'all' && { agent_type: agentType }),
    };

    const response = await callAnalyticsEndpoint<CacheHitRateResponse>(request);

    // Write to cache (fire-and-forget)
    setCachedMetric('cache_hit_rate', time_range, filters, response.result, TTL_CONFIG.cache_hit_rate).catch(() => {});

    return response.result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching cache hit rate:', error);
    throw new Error('Failed to fetch cache hit rate analytics');
  }
}

/**
 * Get RAG quality metrics
 * Returns similarity scores, chunk usage, and RAG performance data
 * CACHED: 15 minute TTL
 */
export async function getRAGQualityMetrics(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  adminUserId?: string
): Promise<RAGQualityData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);
    const filters = agentType !== 'all' ? { agentType } : {};

    // Log analytics view (fire-and-forget)
    logRAGQualityView(adminUserId, agentType === 'all' ? undefined : agentType, time_range, {
      filters,
    }).catch(() => {});

    // Check cache first
    const cached = await getCachedMetric('rag_quality', time_range, filters);
    if (cached) {
      console.log('[Analytics Service] Cache hit: rag_quality');
      return cached;
    }

    // Cache miss - fetch from endpoint
    const request: AnalyticsRequest = {
      metric_type: 'rag_quality',
      time_range,
      ...(agentType !== 'all' && { agent_type: agentType }),
    };

    const response = await callAnalyticsEndpoint<RAGQualityResponse>(request);

    // Write to cache (fire-and-forget)
    setCachedMetric('rag_quality', time_range, filters, response.result, TTL_CONFIG.rag_quality).catch(() => {});

    return response.result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching RAG quality metrics:', error);
    throw new Error('Failed to fetch RAG quality metrics');
  }
}

/**
 * Get handoff accuracy metrics
 * Returns handoff suggestion accuracy and confidence data
 * CACHED: 15 minute TTL
 */
export async function getHandoffAccuracyMetrics(
  startDate: Date,
  endDate: Date,
  adminUserId?: string
): Promise<HandoffAccuracyData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);

    // Log analytics view (fire-and-forget)
    logHandoffAccuracyView(adminUserId, time_range).catch(() => {});

    // Check cache first
    const cached = await getCachedMetric('handoff_accuracy', time_range, {});
    if (cached) {
      console.log('[Analytics Service] Cache hit: handoff_accuracy');
      return cached;
    }

    // Cache miss - fetch from endpoint
    const request: AnalyticsRequest = {
      metric_type: 'handoff_accuracy',
      time_range,
    };

    const response = await callAnalyticsEndpoint<HandoffAccuracyResponse>(request);

    // Write to cache (fire-and-forget)
    setCachedMetric('handoff_accuracy', time_range, {}, response.result, TTL_CONFIG.handoff_accuracy).catch(() => {});

    return response.result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching handoff accuracy:', error);
    throw new Error('Failed to fetch handoff accuracy metrics');
  }
}

/**
 * Get performance metrics for a specific agent
 * Returns response times, cache hit rates, and conversation counts
 * CACHED: 10 minute TTL (composed of multiple cached metrics)
 */
export async function getPerformanceMetrics(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  adminUserId?: string
): Promise<PerformanceData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);

    // Log analytics view (fire-and-forget)
    logPerformanceMetricsView(adminUserId, agentType === 'all' ? undefined : agentType, time_range).catch(
      () => {}
    );

    // Fetch both response time and cache hit rate data (will use cache layer)
    const [responseTimeRequest, cacheHitRequest, volumeRequest] = await Promise.all([
      callAnalyticsEndpoint<AvgResponseTimeResponse>({
        metric_type: 'avg_response_time',
        time_range,
        ...(agentType !== 'all' && { agent_type: agentType }),
      }),
      callAnalyticsEndpoint<CacheHitRateResponse>({
        metric_type: 'cache_hit_rate',
        time_range,
        ...(agentType !== 'all' && { agent_type: agentType }),
      }),
      callAnalyticsEndpoint<ConversationVolumeResponse>({
        metric_type: 'conversation_volume',
        time_range,
        ...(agentType !== 'all' && { agent_type: agentType }),
      }),
    ]);

    // Aggregate the data into performance metrics
    const targetAgent = agentType === 'all' ? 'overall' : agentType;

    return {
      agent_type: agentType === 'all' ? 'nette' : agentType,
      avg_response_time_ms: responseTimeRequest.result.overall_avg_ms,
      cache_hit_rate: cacheHitRequest.result.overall_rate,
      total_conversations: volumeRequest.result.total_conversations,
    };
  } catch (error) {
    console.error('[Analytics Service] Error fetching performance metrics:', error);
    throw new Error('Failed to fetch performance metrics');
  }
}

/**
 * Get user-specific analytics
 * Returns conversation history and usage patterns for a specific user
 * CACHED: 30 minute TTL
 */
export async function getUserAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date,
  adminUserId?: string
): Promise<UserAnalyticsData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);

    // Log analytics view (fire-and-forget)
    logUserAnalyticsView(adminUserId, userId, time_range).catch(() => {});

    // Query user's conversation history directly
    const { data: conversations, error } = await supabase
      .from('agent_conversations')
      .select('agent_type, created_at, response_time_ms, cache_hit')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!conversations || conversations.length === 0) {
      return {
        user_id: userId,
        total_conversations: 0,
        favorite_agent: 'nette',
        avg_session_duration: 0,
        last_active: new Date().toISOString(),
        conversation_history: [],
      };
    }

    // Calculate favorite agent
    const agentCounts: Record<string, number> = {};
    conversations.forEach((conv) => {
      agentCounts[conv.agent_type] = (agentCounts[conv.agent_type] || 0) + 1;
    });

    const favorite_agent = Object.entries(agentCounts).reduce(
      (a, b) => (b[1] > a[1] ? b : a)
    )[0] as AgentType;

    // Calculate average session duration (simplified - based on response times)
    const avgDuration = conversations.reduce((sum, conv) => sum + (conv.response_time_ms || 0), 0) / conversations.length;

    return {
      user_id: userId,
      total_conversations: conversations.length,
      favorite_agent,
      avg_session_duration: avgDuration,
      last_active: conversations[0].created_at,
      conversation_history: conversations.slice(0, 10).map((conv) => ({
        agent_type: conv.agent_type as AgentType,
        timestamp: conv.created_at,
        response_time_ms: conv.response_time_ms || 0,
        cache_hit: conv.cache_hit || false,
      })),
    };
  } catch (error) {
    console.error('[Analytics Service] Error fetching user analytics:', error);
    throw new Error('Failed to fetch user analytics');
  }
}

/**
 * Get conversation volume analytics
 * Returns total conversations and breakdowns by agent and day
 * CACHED: 10 minute TTL
 */
export async function getConversationVolume(
  startDate: Date,
  endDate: Date,
  agentType?: AgentType,
  adminUserId?: string
): Promise<ConversationVolumeData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);
    const filters = agentType ? { agentType } : {};

    // Log analytics view (fire-and-forget)
    logAnalyticsView(adminUserId, 'conversation_volume', {
      agent_type: agentType,
      time_range,
      filters,
    }).catch(() => {});

    // Check cache first
    const cached = await getCachedMetric('conversation_volume', time_range, filters);
    if (cached) {
      console.log('[Analytics Service] Cache hit: conversation_volume');
      return cached;
    }

    // Cache miss - fetch from endpoint
    const request: AnalyticsRequest = {
      metric_type: 'conversation_volume',
      time_range,
      ...(agentType && { agent_type: agentType }),
    };

    const response = await callAnalyticsEndpoint<ConversationVolumeResponse>(request);

    // Write to cache (fire-and-forget)
    setCachedMetric('conversation_volume', time_range, filters, response.result, TTL_CONFIG.conversation_volume).catch(() => {});

    return response.result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching conversation volume:', error);
    throw new Error('Failed to fetch conversation volume');
  }
}

/**
 * Get response time analytics
 * Returns average response times with cache hit/miss breakdown
 * CACHED: 10 minute TTL
 */
export async function getResponseTimeMetrics(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  adminUserId?: string
): Promise<ResponseTimeData> {
  try {
    const time_range = getTimeRangeFromDates(startDate, endDate);
    const filters = agentType !== 'all' ? { agentType } : {};

    // Log analytics view (fire-and-forget)
    logAnalyticsView(adminUserId, 'response_time_metrics', {
      agent_type: agentType === 'all' ? undefined : agentType,
      time_range,
      filters,
    }).catch(() => {});

    // Check cache first
    const cached = await getCachedMetric('avg_response_time', time_range, filters);
    if (cached) {
      console.log('[Analytics Service] Cache hit: avg_response_time');
      return cached;
    }

    // Cache miss - fetch from endpoint
    const request: AnalyticsRequest = {
      metric_type: 'avg_response_time',
      time_range,
      ...(agentType !== 'all' && { agent_type: agentType }),
    };

    const response = await callAnalyticsEndpoint<AvgResponseTimeResponse>(request);

    // Write to cache (fire-and-forget)
    setCachedMetric('avg_response_time', time_range, filters, response.result, TTL_CONFIG.avg_response_time).catch(() => {});

    return response.result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching response time metrics:', error);
    throw new Error('Failed to fetch response time metrics');
  }
}

// Response type for multi-source conversation volume
interface MultiSourceVolumeResult {
  total_messages: number;
  total_conversations: number;
  nette: { messages: number; sessions: number };
  me: { messages: number; sessions: number };
  mio: { conversations: number; messages: number; unique_users: number };
  unique_users_verified: number;
  active_sessions_total: number;
  by_agent: Record<string, number>;
  by_day: Record<string, number>;
  data_quality_note: string;
}

/**
 * Get dashboard KPIs
 * Returns aggregated KPIs for the admin dashboard overview
 * CACHED: 5 minute TTL (HIGHEST PRIORITY)
 *
 * NOTE: Uses conversation_volume_multi_source to query source tables directly
 * for accurate conversation counts (bypasses empty agent_conversations table)
 */
export async function getDashboardKPIs(
  timeRange: TimeRange = '7d',
  adminUserId?: string
): Promise<DashboardKPIs> {
  try {
    // Log analytics view (fire-and-forget)
    logAnalyticsView(adminUserId, 'dashboard_kpis', {
      time_range: timeRange,
    }).catch(() => {});

    // Check cache first (HIGHEST PRIORITY - 5 minute TTL)
    const cached = await getCachedMetric('dashboard_kpis', timeRange, {});
    if (cached) {
      console.log('[Analytics Service] Cache hit: dashboard_kpis');
      return cached;
    }

    // Cache miss - fetch all metrics in parallel for efficiency
    // Use conversation_volume_multi_source for accurate counts from source tables
    const [cacheData, responseData, ragData, handoffData, multiSourceVolumeData] = await Promise.all([
      callAnalyticsEndpoint<CacheHitRateResponse>({
        metric_type: 'cache_hit_rate',
        time_range: timeRange,
      }),
      callAnalyticsEndpoint<AvgResponseTimeResponse>({
        metric_type: 'avg_response_time',
        time_range: timeRange,
      }),
      callAnalyticsEndpoint<RAGQualityResponse>({
        metric_type: 'rag_quality',
        time_range: timeRange,
      }),
      callAnalyticsEndpoint<HandoffAccuracyResponse>({
        metric_type: 'handoff_accuracy',
        time_range: timeRange,
      }),
      // Use multi-source endpoint to get accurate counts from chat tables
      callAnalyticsEndpoint<{ result: MultiSourceVolumeResult }>({
        metric_type: 'conversation_volume_multi_source',
        time_range: timeRange,
      }),
    ]);

    // Calculate system health score (weighted average)
    // NOTE: Cache hit rate will be 0 until proper cache tracking is implemented
    const cacheScore = cacheData.result.overall_rate || 0;
    const responseScore = responseData.result.overall_avg_ms
      ? Math.max(0, 100 - (responseData.result.overall_avg_ms / 20)) // 2000ms = 0 score
      : 50; // Default to 50 if no data
    const ragScore = ragData.result.overall_avg_similarity
      ? parseFloat(ragData.result.overall_avg_similarity) * 100
      : 0;
    const handoffScore = handoffData.result.overall_avg_confidence
      ? parseFloat(handoffData.result.overall_avg_confidence) * 100
      : 0;

    const system_health_score = (cacheScore * 0.25 + responseScore * 0.35 + ragScore * 0.25 + handoffScore * 0.15);

    // Extract multi-source volume data
    const volumeResult = (multiSourceVolumeData as unknown as { result: MultiSourceVolumeResult }).result;

    // Get verified unique users from MIO (only source with real user_ids)
    const daily_active_users = volumeResult.unique_users_verified || 0;

    // Get real error rate from error tracking using selected time range
    const errorData = await callAnalyticsEndpoint<{ result: { overall_error_rate: number; total_errors: number; total_requests: number } }>({
      metric_type: 'error_rate',
      time_range: timeRange,
    });

    // Get all-time conversation count using multi-source (30d)
    const allTimeVolumeData = await callAnalyticsEndpoint<{ result: MultiSourceVolumeResult }>({
      metric_type: 'conversation_volume_multi_source',
      time_range: '30d',
    });

    const allTimeResult = allTimeVolumeData.result;

    const result: DashboardKPIs = {
      system_health_score: Math.round(system_health_score),
      cache_efficiency: cacheData.result.overall_rate,
      ai_quality_score: parseFloat(ragData.result.overall_avg_similarity) || 0,
      routing_accuracy: parseFloat(handoffData.result.overall_avg_confidence) * 100 || 0,
      daily_active_users,
      // Use total_conversations (sessions) for "today's requests"
      total_conversations_today: volumeResult.total_conversations || 0,
      // Use all-time count for total
      total_conversations_all_time: allTimeResult.total_conversations || 0,
      // Use by_agent breakdown from multi-source
      conversations_by_agent: allTimeResult.by_agent || {},
      avg_response_time_ms: responseData.result.overall_avg_ms || 0,
      error_rate: errorData.result.overall_error_rate || 0,
      // Add new fields for enhanced display
      total_messages: allTimeResult.total_messages || 0,
      verified_users: allTimeResult.unique_users_verified || 0,
      data_source: 'multi_source', // Indicates we're using direct table queries
    };

    // Write to cache (fire-and-forget)
    setCachedMetric('dashboard_kpis', timeRange, {}, result, TTL_CONFIG.dashboard_kpis).catch(() => {});

    return result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching dashboard KPIs:', error);
    throw new Error('Failed to fetch dashboard KPIs');
  }
}

/**
 * Batch fetch multiple metrics
 * Optimized function to fetch multiple metric types in parallel
 */
export async function batchFetchMetrics(
  metrics: MetricType[],
  timeRange: TimeRange = '7d',
  agentType?: AgentType
): Promise<Record<MetricType, AnalyticsResponse>> {
  try {
    const requests = metrics.map((metric_type) =>
      callAnalyticsEndpoint({
        metric_type,
        time_range: timeRange,
        ...(agentType && { agent_type: agentType }),
      })
    );

    const responses = await Promise.all(requests);

    return metrics.reduce((acc, metric, index) => {
      acc[metric] = responses[index];
      return acc;
    }, {} as Record<MetricType, AnalyticsResponse>);
  } catch (error) {
    console.error('[Analytics Service] Error batch fetching metrics:', error);
    throw new Error('Failed to batch fetch metrics');
  }
}

/**
 * Export analytics data
 * Prepares analytics data for CSV/JSON export
 */
export async function exportAnalyticsData(
  metricType: MetricType,
  timeRange: TimeRange,
  format: 'csv' | 'json' = 'json',
  adminUserId?: string
): Promise<string | object> {
  try {
    // Log data export (fire-and-forget)
    logDataExport(adminUserId, format, { metric_type: metricType, time_range: timeRange }).catch(() => {});

    const response = await callAnalyticsEndpoint({
      metric_type: metricType,
      time_range: timeRange,
    });

    if (format === 'json') {
      return response;
    }

    // Convert to CSV format
    // This is a simplified implementation - would need proper CSV library for production
    const csvData = convertToCSV(response);
    return csvData;
  } catch (error) {
    console.error('[Analytics Service] Error exporting analytics data:', error);
    throw new Error('Failed to export analytics data');
  }
}

// Helper function to convert data to CSV (simplified)
function convertToCSV(data: any): string {
  // This would need a proper implementation with a CSV library
  // For now, return a basic string representation
  return JSON.stringify(data, null, 2);
}

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================
// These hooks provide declarative data fetching with automatic caching,
// loading states, and permission checking for React components
// ============================================================================

/**
 * Hook to fetch cache hit rate metrics
 */
export function useCacheHitRate(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  options?: UseQueryOptions<CacheHitRateData>
): UseQueryResult<CacheHitRateData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'cache-hit-rate', agentType, startDate, endDate],
    queryFn: () => getCacheHitRateByAgent(agentType, startDate, endDate, adminUser?.id),
    enabled: canRead,
    staleTime: 30000, // 30 seconds
    ...options,
  });
}

/**
 * Hook to fetch RAG quality metrics
 */
export function useRAGQuality(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  options?: UseQueryOptions<RAGQualityData>
): UseQueryResult<RAGQualityData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'rag-quality', agentType, startDate, endDate],
    queryFn: () => getRAGQualityMetrics(agentType, startDate, endDate, adminUser?.id),
    enabled: canRead,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch handoff accuracy metrics
 */
export function useHandoffAccuracy(
  startDate: Date,
  endDate: Date,
  options?: UseQueryOptions<HandoffAccuracyData>
): UseQueryResult<HandoffAccuracyData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'handoff-accuracy', startDate, endDate],
    queryFn: () => getHandoffAccuracyMetrics(startDate, endDate, adminUser?.id),
    enabled: canRead,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch performance metrics
 */
export function usePerformanceMetrics(
  agentType: AgentType | 'all',
  startDate: Date,
  endDate: Date,
  options?: UseQueryOptions<PerformanceData>
): UseQueryResult<PerformanceData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'performance', agentType, startDate, endDate],
    queryFn: () => getPerformanceMetrics(agentType, startDate, endDate, adminUser?.id),
    enabled: canRead,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch user analytics
 */
export function useUserAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date,
  options?: UseQueryOptions<UserAnalyticsData>
): UseQueryResult<UserAnalyticsData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'user', userId, startDate, endDate],
    queryFn: () => getUserAnalytics(userId, startDate, endDate, adminUser?.id),
    enabled: canRead && !!userId,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch conversation volume
 */
export function useConversationVolume(
  startDate: Date,
  endDate: Date,
  agentType?: AgentType,
  options?: UseQueryOptions<ConversationVolumeData>
): UseQueryResult<ConversationVolumeData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'conversation-volume', agentType, startDate, endDate],
    queryFn: () => getConversationVolume(startDate, endDate, agentType, adminUser?.id),
    enabled: canRead,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Hook to fetch dashboard KPIs
 */
export function useDashboardKPIs(
  timeRange: TimeRange = '7d',
  options?: UseQueryOptions<DashboardKPIs>
): UseQueryResult<DashboardKPIs> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'dashboard-kpis', timeRange],
    queryFn: () => getDashboardKPIs(timeRange, adminUser?.id),
    enabled: canRead,
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute for real-time dashboard
    ...options,
  });
}

/**
 * Hook to batch fetch multiple metrics
 */
export function useBatchMetrics(
  metrics: MetricType[],
  timeRange: TimeRange = '7d',
  agentType?: AgentType,
  options?: UseQueryOptions<Record<MetricType, AnalyticsResponse>>
): UseQueryResult<Record<MetricType, AnalyticsResponse>> {
  const canRead = useCanReadAnalytics();

  return useQuery({
    queryKey: ['analytics', 'batch', metrics, timeRange, agentType],
    queryFn: () => batchFetchMetrics(metrics, timeRange, agentType),
    enabled: canRead && metrics.length > 0,
    staleTime: 30000,
    ...options,
  });
}

/**
 * Get user engagement metrics
 * Returns DAU, MAU, engagement ratios, and user behavior metrics
 * CACHED: 15 minute TTL
 */
export async function getUserEngagementMetrics(
  timeRange: TimeRange = '7d',
  adminUserId?: string
): Promise<UserEngagementData> {
  try {
    // Log analytics view (fire-and-forget)
    logAnalyticsView(adminUserId, 'user_engagement', {
      time_range: timeRange,
    }).catch(() => {});

    // Check cache first
    const cached = await getCachedMetric('user_engagement', timeRange, {});
    if (cached) {
      console.log('[Analytics Service] Cache hit: user_engagement');
      return cached;
    }

    // For now, we'll query the database directly
    // In production, this would be an edge function call
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get DAU (Daily Active Users) - users with activity in last 24 hours
    const { count: dauCount } = await supabase
      .from('agent_conversations')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString())
      .not('user_id', 'is', null);

    // Get MAU (Monthly Active Users) - users with activity in last 30 days
    const { count: mauCount } = await supabase
      .from('agent_conversations')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('user_id', 'is', null);

    // Get weekly conversation data for engagement metrics
    const { data: weeklyData } = await supabase
      .from('agent_conversations')
      .select('user_id, created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get total conversations (30d) for better messages per user calculation
    const { count: totalConversations30d } = await supabase
      .from('agent_conversations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get unique users in 30d for better average calculation
    const { data: monthlyUsersData } = await supabase
      .from('agent_conversations')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const monthlyUniqueUsers = new Set(monthlyUsersData?.map(d => d.user_id) || []);

    // Calculate messages per user using monthly data (more representative)
    const messagesPerUser = monthlyUniqueUsers.size > 0 && totalConversations30d
      ? totalConversations30d / monthlyUniqueUsers.size
      : 0;

    // Get real user engagement data from edge function
    const engagementData = await callAnalyticsEndpoint<{
      daily_active_users: number;
      monthly_active_users: number;
      tactics_completed_weekly: number;
      avg_practice_streak_days: number;
      user_retention_rate: number;
      session_frequency: number;
      time_to_first_action_minutes: number;
    }>({
      metric_type: 'user_engagement',
      time_range: timeRange,
    });

    // Get real feature adoption data from edge function
    const featureData = await callAnalyticsEndpoint<{
      overall_adoption_rate: number;
    }>({
      metric_type: 'feature_adoption',
      time_range: timeRange,
    });

    // Calculate DAU/MAU ratio (engagement health metric)
    const dauMauRatio = engagementData.result.monthly_active_users > 0
      ? engagementData.result.daily_active_users / engagementData.result.monthly_active_users
      : 0;

    // Determine engagement trend
    let engagementTrend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    // Compare to previous period (simplified)
    const prevWeekStart = new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { count: prevWeekCount } = await supabase
      .from('agent_conversations')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', prevWeekStart.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    const currentWeekCount = weeklyData?.length || 0;

    // Calculate trend - handle edge cases gracefully
    if (prevWeekCount && prevWeekCount > 0) {
      trendPercentage = ((currentWeekCount - prevWeekCount) / prevWeekCount) * 100;

      // If current week has 0 activity but previous had some, it's a decline
      // but we cap it at -100% and mark as "down" with special handling in UI
      if (currentWeekCount === 0 && prevWeekCount > 0) {
        trendPercentage = -100;
        engagementTrend = 'down';
      } else if (trendPercentage > 5) {
        engagementTrend = 'up';
      } else if (trendPercentage < -5) {
        engagementTrend = 'down';
      }
    } else if (currentWeekCount > 0 && (!prevWeekCount || prevWeekCount === 0)) {
      // New activity this week with no previous data = positive trend
      engagementTrend = 'up';
      trendPercentage = 100; // Show as "new growth"
    }

    const result: UserEngagementData = {
      daily_active_users: engagementData.result.daily_active_users,
      monthly_active_users: engagementData.result.monthly_active_users,
      dau_mau_ratio: dauMauRatio,
      messages_per_user_monthly: Math.round(messagesPerUser), // Already monthly calculation
      tactics_completed_weekly: engagementData.result.tactics_completed_weekly,
      avg_practice_streak_days: engagementData.result.avg_practice_streak_days,
      engagement_trend: engagementTrend,
      trend_percentage: Math.abs(trendPercentage),
      user_retention_rate: engagementData.result.user_retention_rate,
      session_frequency: engagementData.result.session_frequency,
      feature_adoption_rate: featureData.result.overall_adoption_rate,
      time_to_first_action_minutes: engagementData.result.time_to_first_action_minutes,
    };

    // Write to cache (fire-and-forget)
    setCachedMetric('user_engagement', timeRange, {}, result, 900000).catch(() => {}); // 15 min TTL

    return result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching user engagement metrics:', error);
    throw new Error('Failed to fetch user engagement metrics');
  }
}

/**
 * Hook to fetch user engagement metrics
 */
export function useUserEngagement(
  timeRange: TimeRange = '7d',
  options?: UseQueryOptions<UserEngagementData>
): UseQueryResult<UserEngagementData> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'user-engagement', timeRange],
    queryFn: () => getUserEngagementMetrics(timeRange, adminUser?.id),
    enabled: canRead,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refresh every 5 minutes
    ...options,
  });
}

// ============================================================================
// ANALYTICS SYNC FUNCTIONS
// ============================================================================

export interface SyncAnalyticsResult {
  success: boolean;
  nette_synced: number;
  mio_synced: number;
  me_synced: number;
  total: number;
  cache_invalidated?: boolean;
  error?: string;
  synced_at?: string;
}

/**
 * Trigger analytics sync
 * Calls the sync-analytics edge function to populate agent_conversations
 * from chat history tables (nette_chat_histories, me_chat_histories, mio_conversations)
 */
export async function triggerAnalyticsSync(
  fullSync: boolean = false,
  sinceHours: number = 24
): Promise<SyncAnalyticsResult> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      throw new Error('Authentication required to sync analytics');
    }

    const response = await supabase.functions.invoke('sync-analytics', {
      body: {
        full_sync: fullSync,
        since_hours: sinceHours,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to sync analytics');
    }

    return response.data as SyncAnalyticsResult;
  } catch (error) {
    console.error('[Analytics Service] Error triggering sync:', error);
    return {
      success: false,
      nette_synced: 0,
      mio_synced: 0,
      me_synced: 0,
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Hook to trigger analytics sync with mutation
 */
export function useSyncAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fullSync, sinceHours }: { fullSync?: boolean; sinceHours?: number } = {}) =>
      triggerAnalyticsSync(fullSync, sinceHours),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate all analytics queries to refresh with new data
        queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }
    },
  });
}

// ============================================================================
// TOP USERS LEADERBOARD FUNCTIONS
// ============================================================================

/**
 * Get top users by conversation count
 * Returns the most active users with their conversation stats
 * Uses edge function to bypass RLS and access all conversation data
 * CACHED: 15 minute TTL
 */
export async function getTopUsers(
  timeRange: TimeRange = '30d',
  limit: number = 10,
  adminUserId?: string
): Promise<TopUserData[]> {
  try {
    // Log analytics view (fire-and-forget)
    logAnalyticsView(adminUserId, 'top_users', {
      time_range: timeRange,
      limit,
    }).catch(() => {});

    // Check cache first
    const cacheKey = `top_users_${limit}`;
    const cached = await getCachedMetric(cacheKey, timeRange, {});
    if (cached) {
      console.log('[Analytics Service] Cache hit: top_users');
      return cached;
    }

    // Call edge function to get top users (uses service role, bypasses RLS)
    const { data, error } = await supabase.functions.invoke('get-analytics', {
      body: {
        metric_type: 'top_users',
        time_range: timeRange,
      },
    });

    if (error) {
      console.error('[Analytics Service] Error fetching top users from edge function:', error);
      throw error;
    }

    if (!data?.result?.users || data.result.users.length === 0) {
      console.log('[Analytics Service] No top users data returned');
      return [];
    }

    // Map edge function response to TopUserData format
    const result: TopUserData[] = data.result.users
      .slice(0, limit)
      .map((user: {
        user_id: string;
        email: string | null;
        full_name: string | null;
        total_conversations: number;
        favorite_agent: string;
        last_active: string;
        engagement_level: 'high' | 'medium' | 'low';
      }) => ({
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        total_conversations: user.total_conversations,
        favorite_agent: user.favorite_agent as TopUserData['favorite_agent'],
        last_active: user.last_active,
        engagement_level: user.engagement_level,
      }));

    // Write to cache (fire-and-forget)
    setCachedMetric(cacheKey, timeRange, {}, result, 900000).catch(() => {}); // 15 min TTL

    return result;
  } catch (error) {
    console.error('[Analytics Service] Error fetching top users:', error);
    throw new Error('Failed to fetch top users');
  }
}

/**
 * Hook to fetch top users leaderboard
 */
export function useTopUsers(
  timeRange: TimeRange = '30d',
  limit: number = 10,
  options?: UseQueryOptions<TopUserData[]>
): UseQueryResult<TopUserData[]> {
  const canRead = useCanReadAnalytics();
  const { adminUser } = useAdmin();

  return useQuery({
    queryKey: ['analytics', 'top-users', timeRange, limit],
    queryFn: () => getTopUsers(timeRange, limit, adminUser?.id),
    enabled: canRead,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refresh every 5 minutes
    ...options,
  });
}
