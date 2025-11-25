# Analytics Endpoint Technical Analysis

## Overview
The `get-analytics` edge function provides comprehensive metrics queries for agent performance monitoring across the Mind Insurance platform. It's built as a Deno-based Supabase edge function that queries the `agent_conversations` table to extract performance metrics.

## Endpoint Details

**URL**: `https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/get-analytics`
**Method**: POST
**Authentication**: Requires valid Supabase authentication token

## API Documentation

### Input Parameters

```typescript
interface AnalyticsRequest {
  metric_type: 'cache_hit_rate' | 'avg_response_time' | 'rag_quality' | 'handoff_accuracy' | 'conversation_volume';
  time_range?: '24h' | '7d' | '30d'; // Default: '7d'
  agent_type?: 'nette' | 'mio' | 'me'; // Optional filter
}
```

### Output Structure

The response varies based on the `metric_type` requested:

#### 1. Cache Hit Rate Response
```typescript
interface CacheHitRateResponse {
  metric_type: 'cache_hit_rate';
  time_range: string;
  agent_type: string; // 'all' or specific agent
  result: {
    overall_rate: number; // Percentage (0-100)
    total_requests: number;
    cache_hits: number;
    cache_misses: number;
    by_agent: {
      [agentType: string]: {
        total: number;
        hits: number;
        rate: number; // Percentage (0-100)
      }
    }
  }
}
```

#### 2. Average Response Time Response
```typescript
interface AvgResponseTimeResponse {
  metric_type: 'avg_response_time';
  time_range: string;
  agent_type: string;
  result: {
    overall_avg_ms: number;
    by_agent: {
      [agentType: string]: {
        avg_ms: number;
        avg_cache_hit_ms: number;
        avg_cache_miss_ms: number;
        total_requests: number;
      }
    }
  }
}
```

#### 3. RAG Quality Response
```typescript
interface RAGQualityResponse {
  metric_type: 'rag_quality';
  time_range: string;
  agent_type: string;
  result: {
    overall_avg_similarity: string; // Fixed to 3 decimal places
    overall_avg_chunks: number;
    overall_avg_rag_time_ms: number;
    total_rag_queries: number;
    by_agent: {
      [agentType: string]: {
        avg_similarity: string; // Fixed to 3 decimal places
        avg_chunks: number;
        avg_rag_time_ms: number;
        total_queries: number;
      }
    }
  }
}
```

#### 4. Handoff Accuracy Response
```typescript
interface HandoffAccuracyResponse {
  metric_type: 'handoff_accuracy';
  time_range: string;
  agent_type: string;
  result: {
    total_handoff_suggestions: number;
    overall_avg_confidence: string; // Fixed to 3 decimal places
    by_source_agent: {
      [agentType: string]: {
        total_suggestions: number;
        avg_confidence: string; // Fixed to 3 decimal places
        target_breakdown: {
          [targetAgent: string]: number;
        }
      }
    }
  }
}
```

#### 5. Conversation Volume Response
```typescript
interface ConversationVolumeResponse {
  metric_type: 'conversation_volume';
  time_range: string;
  agent_type: string;
  result: {
    total_conversations: number;
    by_agent: {
      [agentType: string]: number;
    };
    by_day: {
      [date: string]: number; // ISO date format YYYY-MM-DD
    }
  }
}
```

## TypeScript Interfaces for All Data Structures

```typescript
// Union type for all possible responses
type AnalyticsResponse =
  | CacheHitRateResponse
  | AvgResponseTimeResponse
  | RAGQualityResponse
  | HandoffAccuracyResponse
  | ConversationVolumeResponse;

// Error response structure
interface AnalyticsErrorResponse {
  error: string;
}

// Agent types
type AgentType = 'nette' | 'mio' | 'me';

// Time range options
type TimeRange = '24h' | '7d' | '30d';

// Metric types
type MetricType =
  | 'cache_hit_rate'
  | 'avg_response_time'
  | 'rag_quality'
  | 'handoff_accuracy'
  | 'conversation_volume';
```

## Query Patterns and Composite Index Usage

### Database Table: `agent_conversations`

The endpoint queries the following columns:
- `created_at` - Timestamp filtering (all queries)
- `agent_type` - Agent filtering (optional)
- `cache_hit` - Cache performance metrics
- `response_time_ms` - Performance metrics
- `avg_similarity_score` - RAG quality metrics
- `max_similarity_score` - RAG quality metrics
- `chunks_retrieved` - RAG performance
- `rag_time_ms` - RAG timing
- `rag_context_used` - RAG usage flag
- `handoff_suggested` - Handoff metrics
- `handoff_confidence` - Handoff quality
- `handoff_target` - Handoff routing

### Composite Index Opportunities

1. **Time-based queries**: `(created_at, agent_type)`
   - Used by ALL metric types
   - Enables efficient time range filtering with optional agent filtering

2. **Cache metrics**: `(created_at, cache_hit, agent_type)`
   - Optimizes cache hit rate calculations
   - Supports filtering by cache status

3. **RAG quality**: `(created_at, rag_context_used, agent_type)`
   - Filters only RAG-enabled conversations
   - Enables quality metric aggregation

4. **Handoff metrics**: `(created_at, handoff_suggested, agent_type)`
   - Filters only handoff events
   - Supports confidence analysis

## Mapping to Admin Dashboard KPIs

### Primary KPIs

1. **System Performance**
   - Metric: `avg_response_time`
   - Dashboard Display: Overall p50, p90, p99 response times
   - Agent breakdown for performance comparison

2. **Cache Efficiency**
   - Metric: `cache_hit_rate`
   - Dashboard Display: Overall cache hit percentage
   - Per-agent cache optimization opportunities

3. **AI Quality**
   - Metric: `rag_quality`
   - Dashboard Display: Average similarity scores
   - Chunk retrieval efficiency
   - RAG processing time

4. **Routing Accuracy**
   - Metric: `handoff_accuracy`
   - Dashboard Display: Handoff confidence distribution
   - Target agent routing matrix
   - Suggestion accuracy over time

5. **Usage Metrics**
   - Metric: `conversation_volume`
   - Dashboard Display: Daily active users
   - Agent utilization rates
   - Traffic patterns and trends

### Secondary KPIs (Derived)

1. **Cost Optimization**
   - Calculated from: cache_hit_rate + avg_response_time
   - Shows potential token savings from caching

2. **User Experience Score**
   - Calculated from: response_time + handoff_accuracy
   - Indicates overall system responsiveness

3. **System Health Score**
   - Calculated from: all metrics combined
   - Provides single overview metric

## Performance Considerations

1. **Time Filtering**: All queries use `created_at >= timeFilter`
   - 24h: 24 hours of data
   - 7d: 168 hours of data
   - 30d: 720 hours of data

2. **Data Volume**: Based on conversation frequency
   - Estimated 100-1000 conversations per day
   - 30-day queries process 3,000-30,000 records

3. **Query Complexity**: Simple aggregations
   - No joins required
   - In-memory aggregation for small result sets
   - JavaScript reduce/filter operations

4. **Response Size**: Compact JSON responses
   - Typically < 10KB per response
   - Aggregated data only (no raw records)

## Security Considerations

1. **Authentication**: Requires valid Supabase token
2. **CORS**: Configured for cross-origin requests
3. **Service Role Key**: Used for database access (server-side only)
4. **Input Validation**: Validates metric_type parameter
5. **Error Handling**: Generic error messages (no sensitive data exposure)

## Integration Requirements

1. **Frontend Service Layer**:
   - TypeScript service with proper typing
   - Error handling and retry logic
   - Loading state management
   - Permission checking (admin only)

2. **Caching Strategy**:
   - Client-side caching for dashboard data
   - 30-second cache for real-time metrics
   - 5-minute cache for historical data

3. **UI Components**:
   - KPI cards for overview metrics
   - Time-series charts for trends
   - Data tables for detailed breakdowns
   - Date range selectors

## Recommendations

1. **Add Composite Indexes**: Create the suggested indexes for optimal query performance
2. **Implement Result Caching**: Cache expensive aggregations at the edge function level
3. **Add Metric Batching**: Allow requesting multiple metrics in a single call
4. **Include Percentiles**: Add p50, p90, p99 for response times
5. **Add Export Capability**: Support CSV/JSON export for compliance reporting