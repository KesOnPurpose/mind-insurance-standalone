# Admin Analytics Integration Plan

## Overview

This document outlines the plan to integrate Lovable's `get-analytics` edge function with the admin dashboard UI, following the architecture defined in [ADMIN-DASHBOARD-SPEC-v1.0.md](ADMIN-DASHBOARD-SPEC-v1.0.md).

## Current State (Completed ✓)

### Database Infrastructure
- ✅ Admin schema deployed ([20251119150000_create_admin_schema.sql](supabase/migrations/20251119150000_create_admin_schema.sql))
  - `admin_users` table with role-based permissions
  - `admin_audit_log` table for compliance tracking
  - `admin_metrics_cache` table for performance optimization
  - RLS policies with `is_admin()` and `has_admin_permission()` functions

### Analytics Composite Indexes
- ✅ Optimized indexes deployed ([20251119140000_add_analytics_composite_indexes.sql](supabase/migrations/20251119140000_add_analytics_composite_indexes.sql))
  - Time-series analytics by agent (cache hit rates)
  - RAG quality metrics (similarity scores, chunk retrieval)
  - Handoff analytics (accuracy by confidence threshold)
  - Performance metrics (response time, token usage)
  - User-specific analytics with performance metrics

### Cache Optimization
- ✅ Cache invalidation optimized ([supabase/functions/invalidate-cache/index.ts](supabase/functions/invalidate-cache/index.ts))
  - `profile_update` trigger now deletes only 3 specific context keys (<10ms)
  - Relies on TTL expiration for agent response caches (5min-1hr)
  - Avoids expensive Redis SCAN operations

### Authentication Infrastructure
- ✅ Admin authentication complete ([src/contexts/AdminContext.tsx](src/contexts/AdminContext.tsx))
  - Role-based access control (super_admin, analyst, content_manager, support)
  - Granular JSON permissions (users, analytics, content, system)
  - Permission helper hooks for component-level access checks
  - Auto-updates `last_login_at` timestamp

- ✅ Admin route protection ([src/components/AdminRoute.tsx](src/components/AdminRoute.tsx))
  - Enforces admin authentication
  - Supports granular permission checking
  - User-friendly loading/error states

- ✅ Admin placeholder dashboard ([src/pages/AdminDashboard.tsx](src/pages/AdminDashboard.tsx))
  - Displays admin role and permissions
  - Visual permission breakdown by category
  - "Coming soon" notice for full dashboard

- ✅ Seed script for first admin ([scripts/seed-admin-user.sql](scripts/seed-admin-user.sql))
  - Step-by-step instructions
  - Examples for all admin roles
  - Troubleshooting guide

## Next Steps (Phase 1 Completion)

### 1. Understand Lovable's Analytics Endpoint (Research - 2 hours)

**Objective**: Analyze the existing `get-analytics` edge function to understand data structures and query patterns.

**Tasks**:
- [Read Lovable's `get-analytics` function implementation](supabase/functions/get-analytics/index.ts)
- Document input parameters and output structure
- Identify query patterns that can leverage composite indexes
- Map analytics queries to admin dashboard KPIs

**Deliverable**: Technical analysis document with:
- Analytics endpoint API documentation
- Data structure schemas (TypeScript interfaces)
- Query performance baseline measurements
- Mapping of analytics queries to admin dashboard metrics

### 2. Create Admin Analytics Service Layer (Development - 3 hours)

**Objective**: Build a React service layer to interact with the analytics endpoint.

**File**: `src/services/adminAnalyticsService.ts`

**Key Functions**:
```typescript
// Cache hit rate analytics
async function getCacheHitRateByAgent(
  agentType: 'nette' | 'mio' | 'me',
  startDate: Date,
  endDate: Date
): Promise<CacheHitRateData>

// RAG quality analytics
async function getRAGQualityMetrics(
  agentType: 'nette' | 'mio' | 'me',
  startDate: Date,
  endDate: Date
): Promise<RAGQualityData>

// Handoff accuracy analytics
async function getHandoffAccuracyMetrics(
  startDate: Date,
  endDate: Date
): Promise<HandoffAccuracyData>

// Performance metrics
async function getPerformanceMetrics(
  agentType: 'nette' | 'mio' | 'me',
  startDate: Date,
  endDate: Date
): Promise<PerformanceData>

// User analytics
async function getUserAnalytics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<UserAnalyticsData>
```

**Features**:
- TypeScript interfaces for all analytics data structures
- Error handling with user-friendly messages
- Loading state management
- Permission checking integration (use `useCanReadAnalytics()` hook)

### 3. Build Admin Analytics Dashboard UI (Development - 4-5 hours)

**Objective**: Create full analytics dashboard replacing the placeholder.

**File**: `src/pages/AdminAnalytics.tsx`

**Components to Build**:

#### 3.1 Overview KPI Cards
- Total conversations (last 7/30 days)
- Cache hit rate (overall and by agent)
- Average response time (overall and by agent)
- RAG quality score (average similarity)

#### 3.2 Cache Hit Rate Chart
- Time-series line chart (last 30 days)
- Breakdown by agent type (Nette, MIO, ME)
- Tooltip showing exact percentages
- Uses Recharts library (already in project)

#### 3.3 RAG Quality Dashboard
- Average similarity score by agent
- Chunks retrieved distribution
- Quality trends over time
- Filter by date range

#### 3.4 Performance Metrics Table
- Response time percentiles (p50, p90, p99)
- Token usage by agent
- Sortable columns
- Pagination for large datasets

#### 3.5 Handoff Accuracy Chart
- Handoff suggestion accuracy by confidence threshold
- Target agent distribution
- Confidence score distribution

**UI Framework**:
- ShadCN UI components (existing design system)
- Recharts for visualizations
- Tailwind CSS for styling

### 4. Implement Admin Audit Logging (Development - 2 hours)

**Objective**: Log all admin actions to `admin_audit_log` table for compliance.

**Integration Points**:
- Analytics exports (`action_type: 'analytics_export'`)
- User management actions (`action_type: 'user_view'`, `'user_edit'`, `'user_delete'`)
- System configuration changes (`action_type: 'system_config'`)

**Implementation**:
```typescript
// src/services/adminAuditService.ts
async function logAdminAction(
  actionType: AdminActionType,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>
): Promise<void>
```

**Automatic Logging**:
- Triggered automatically by admin context hooks
- Captures IP address and user agent
- Stores details as JSON for forensic analysis

### 5. Build Admin Metrics Cache System (Development - 2-3 hours)

**Objective**: Pre-calculate expensive analytics queries for dashboard performance.

**File**: `supabase/functions/calculate-admin-metrics/index.ts`

**Metrics to Cache**:
- Daily Active Users (DAU) - 7 day rolling
- Cache hit rate - 30 day rolling
- Average response time - 7 day rolling
- RAG quality scores - 30 day rolling
- Handoff accuracy - 30 day rolling

**Caching Strategy**:
- Calculate metrics every 6 hours (cron job)
- Store in `admin_metrics_cache` table
- Set TTL to 6 hours (`expires_at`)
- Track `calculation_time_ms` for performance monitoring
- Track `dependency_tables` for cache invalidation

**Implementation**:
```typescript
// Cron job configuration (Supabase Edge Functions)
// Schedule: Every 6 hours
async function calculateAdminMetrics(): Promise<void> {
  const metrics = [
    { key: 'dau_7d', calculate: calculateDAU },
    { key: 'cache_hit_rate_30d', calculate: calculateCacheHitRate },
    { key: 'avg_response_time_7d', calculate: calculateAvgResponseTime },
    { key: 'rag_quality_30d', calculate: calculateRAGQuality },
    { key: 'handoff_accuracy_30d', calculate: calculateHandoffAccuracy }
  ];

  for (const metric of metrics) {
    const startTime = Date.now();
    const value = await metric.calculate();
    const calculationTime = Date.now() - startTime;

    await supabase
      .from('admin_metrics_cache')
      .upsert({
        metric_key: metric.key,
        metric_value: value,
        calculated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        calculation_time_ms: calculationTime,
        dependency_tables: ['agent_conversations']
      });
  }
}
```

### 6. Add Export Functionality (Development - 1-2 hours)

**Objective**: Allow admins to export analytics data as CSV/JSON.

**Permissions Required**: `analytics.export` permission

**Features**:
- Export full analytics dataset within date range
- Format selection (CSV or JSON)
- Audit log entry for each export
- Progress indicator for large exports

**Implementation**:
```typescript
// src/utils/adminExport.ts
async function exportAnalytics(
  startDate: Date,
  endDate: Date,
  format: 'csv' | 'json'
): Promise<Blob>
```

### 7. Testing & Validation (QA - 2 hours)

**Objective**: Ensure admin dashboard works correctly with production data.

**Test Scenarios**:
1. **Permission Testing**
   - Super admin can access all analytics
   - Analyst can view but not export
   - Content manager cannot access analytics dashboard
   - Support user cannot access analytics dashboard

2. **Performance Testing**
   - Dashboard loads in <2 seconds with cached metrics
   - Charts render smoothly with 30 days of data
   - Pagination works correctly with 1000+ conversations

3. **Data Accuracy Testing**
   - Cache hit rates match actual data
   - RAG quality scores calculated correctly
   - Performance metrics align with database queries

4. **Export Testing**
   - CSV export contains all required fields
   - JSON export is valid and properly formatted
   - Audit log captures export actions

5. **Responsive Design Testing**
   - Dashboard works on desktop (1440px)
   - Dashboard works on tablet (768px)
   - Mobile shows simplified view or message

## Timeline Summary

| Task | Estimated Time | Priority |
|------|----------------|----------|
| 1. Research Lovable's analytics endpoint | 2 hours | High |
| 2. Create analytics service layer | 3 hours | High |
| 3. Build admin analytics dashboard UI | 4-5 hours | High |
| 4. Implement audit logging | 2 hours | Medium |
| 5. Build metrics cache system | 2-3 hours | Medium |
| 6. Add export functionality | 1-2 hours | Medium |
| 7. Testing & validation | 2 hours | High |
| **Total** | **16-19 hours** | |

## Success Criteria

- [ ] Admin dashboard loads in <2 seconds (using cached metrics)
- [ ] All charts and visualizations render correctly with production data
- [ ] Permission system correctly restricts access based on admin role
- [ ] Audit log captures all admin actions with IP address and details
- [ ] Export functionality works for both CSV and JSON formats
- [ ] Zero TypeScript build errors
- [ ] Responsive design works on desktop and tablet
- [ ] Performance metrics show 10-100x improvement from composite indexes

## Risks & Mitigation

### Risk 1: Lovable's analytics endpoint may have breaking changes
**Mitigation**: Version the analytics service layer, use TypeScript for type safety, add integration tests

### Risk 2: Large datasets may cause performance issues
**Mitigation**: Use pagination, implement metrics caching, leverage composite indexes

### Risk 3: Permission system may have edge cases
**Mitigation**: Comprehensive permission testing, add permission denial logging

### Risk 4: Export functionality may timeout for large datasets
**Mitigation**: Implement streaming exports, add progress indicators, limit export to 90 days max

## Post-Launch Monitoring

### Metrics to Track
- Admin dashboard load time (target: <2s)
- Analytics query performance (target: <500ms)
- Cache hit rate for metrics cache (target: >95%)
- Admin action audit log completeness (target: 100%)
- Export success rate (target: >99%)

### Alerts to Configure
- Admin dashboard load time >3 seconds
- Analytics query failure rate >5%
- Metrics cache expiration without refresh
- Failed export attempts

## Future Enhancements (Phase 2+)

- Real-time analytics dashboard (WebSocket updates)
- Custom date range selection with calendar picker
- Advanced filtering (by user segment, agent type, etc.)
- Scheduled report generation (daily/weekly email summaries)
- Anomaly detection (alert on unusual patterns)
- AI-powered insights (suggest optimizations based on patterns)
- Multi-tenancy support (if expanding to multiple organizations)

## References

- [Admin Dashboard Specification](ADMIN-DASHBOARD-SPEC-v1.0.md) - Complete technical specification
- [Admin Database Schema](supabase/migrations/20251119150000_create_admin_schema.sql) - Database structure
- [Analytics Composite Indexes](supabase/migrations/20251119140000_add_analytics_composite_indexes.sql) - Query optimization
- [Admin Authentication Context](src/contexts/AdminContext.tsx) - Permission system
- [Cache Service](supabase/functions/_shared/cache-service.ts) - Redis caching layer

---

**Last Updated**: 2025-11-19
**Status**: Phase 1 - Authentication Complete, Analytics Integration Pending
**Next Action**: Begin Task 1 - Research Lovable's analytics endpoint
