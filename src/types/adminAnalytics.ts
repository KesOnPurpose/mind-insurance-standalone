// Admin Analytics Type Definitions
// These types correspond to the get-analytics edge function responses

// Agent types supported by the system
export type AgentType = 'nette' | 'mio' | 'me';

// Time range options for analytics queries
export type TimeRange = '24h' | '7d' | '30d';

// Available metric types
export type MetricType =
  | 'cache_hit_rate'
  | 'avg_response_time'
  | 'rag_quality'
  | 'handoff_accuracy'
  | 'conversation_volume';

// Request structure for analytics endpoint
export interface AnalyticsRequest {
  metric_type: MetricType;
  time_range?: TimeRange;
  agent_type?: AgentType;
}

// Cache Hit Rate Data Structures
export interface CacheHitAgentData {
  total: number;
  hits: number;
  rate: number;
}

export interface CacheHitRateData {
  overall_rate: number;
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  by_agent: Record<string, CacheHitAgentData>;
}

export interface CacheHitRateResponse {
  metric_type: 'cache_hit_rate';
  time_range: string;
  agent_type: string;
  result: CacheHitRateData;
}

// Response Time Data Structures
export interface ResponseTimeAgentData {
  avg_ms: number;
  avg_cache_hit_ms: number;
  avg_cache_miss_ms: number;
  total_requests: number;
}

export interface ResponseTimeData {
  overall_avg_ms: number;
  by_agent: Record<string, ResponseTimeAgentData>;
}

export interface AvgResponseTimeResponse {
  metric_type: 'avg_response_time';
  time_range: string;
  agent_type: string;
  result: ResponseTimeData;
}

// RAG Quality Data Structures
export interface RAGQualityAgentData {
  avg_similarity: string;
  avg_chunks: number;
  avg_rag_time_ms: number;
  total_queries: number;
}

export interface RAGQualityData {
  overall_avg_similarity: string;
  overall_avg_chunks: number;
  overall_avg_rag_time_ms: number;
  total_rag_queries: number;
  by_agent: Record<string, RAGQualityAgentData>;
}

export interface RAGQualityResponse {
  metric_type: 'rag_quality';
  time_range: string;
  agent_type: string;
  result: RAGQualityData;
}

// Handoff Accuracy Data Structures
export interface HandoffAgentData {
  total_suggestions: number;
  avg_confidence: string;
  target_breakdown: Record<string, number>;
}

export interface HandoffAccuracyData {
  total_handoff_suggestions: number;
  overall_avg_confidence: string;
  by_source_agent: Record<string, HandoffAgentData>;
}

export interface HandoffAccuracyResponse {
  metric_type: 'handoff_accuracy';
  time_range: string;
  agent_type: string;
  result: HandoffAccuracyData;
}

// Conversation Volume Data Structures
export interface ConversationVolumeData {
  total_conversations: number;
  by_agent: Record<string, number>;
  by_day: Record<string, number>;
}

export interface ConversationVolumeResponse {
  metric_type: 'conversation_volume';
  time_range: string;
  agent_type: string;
  result: ConversationVolumeData;
}

// Union type for all analytics responses
export type AnalyticsResponse =
  | CacheHitRateResponse
  | AvgResponseTimeResponse
  | RAGQualityResponse
  | HandoffAccuracyResponse
  | ConversationVolumeResponse;

// Error response
export interface AnalyticsErrorResponse {
  error: string;
}

// Performance metrics for dashboard display
export interface PerformanceData {
  agent_type: AgentType;
  avg_response_time_ms: number;
  cache_hit_rate: number;
  total_conversations: number;
  p50_response_time?: number;
  p90_response_time?: number;
  p99_response_time?: number;
}

// User-specific analytics
export interface UserAnalyticsData {
  user_id: string;
  total_conversations: number;
  favorite_agent: AgentType;
  avg_session_duration: number;
  last_active: string;
  conversation_history: Array<{
    agent_type: AgentType;
    timestamp: string;
    response_time_ms: number;
    cache_hit: boolean;
  }>;
}

// Dashboard KPI Summary
export interface DashboardKPIs {
  system_health_score: number; // 0-100
  cache_efficiency: number; // percentage
  ai_quality_score: number; // 0-1
  routing_accuracy: number; // percentage
  daily_active_users: number;
  total_conversations_today: number;
  total_conversations_all_time: number; // All synced conversations
  conversations_by_agent: Record<string, number>; // Breakdown by agent type
  avg_response_time_ms: number;
  error_rate: number; // percentage
  // New fields from multi-source analytics
  total_messages?: number; // Total messages across all sources
  verified_users?: number; // Users with verified IDs (from MIO)
  data_source?: 'multi_source' | 'agent_conversations'; // Data source indicator
}

// Top Users Leaderboard Data
export interface TopUserData {
  user_id: string;
  email: string | null;
  full_name: string | null;
  total_conversations: number;
  favorite_agent: AgentType;
  last_active: string;
  engagement_level: 'high' | 'medium' | 'low';
}

// Time series data point for charts
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// Chart data structure
export interface ChartData {
  series: Array<{
    name: string;
    data: TimeSeriesDataPoint[];
    color?: string;
  }>;
  xAxis?: {
    type: 'datetime' | 'category';
    categories?: string[];
  };
  yAxis?: {
    title: string;
    min?: number;
    max?: number;
  };
}

// User Engagement Metrics
export interface UserEngagementData {
  daily_active_users: number;
  monthly_active_users: number;
  dau_mau_ratio: number; // DAU/MAU ratio (engagement health)
  messages_per_user_monthly: number;
  tactics_completed_weekly: number;
  avg_practice_streak_days: number;
  engagement_trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  user_retention_rate: number; // percentage
  session_frequency: number; // sessions per week
  feature_adoption_rate: number; // percentage of users using key features
  time_to_first_action_minutes: number; // avg time from login to first meaningful action
}