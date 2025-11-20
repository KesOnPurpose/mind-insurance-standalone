# GHFN Admin Dashboard Specification v1.0

**Document Version**: 1.0
**Created**: November 19, 2025
**Database**: hpyodaugrkctagkrfofj.supabase.co
**Project**: Grouphome For Newbies (Mind Insurance Platform)
**Status**: Specification Phase → Ready for Implementation

---

## Executive Summary

This specification defines a comprehensive admin dashboard infrastructure for monitoring the GHFN platform's 85% complete ecosystem (25+ database tables, 403 tactics, 3-agent AI system). The dashboard provides visibility into user engagement, platform health, AI agent performance, content management, and business metrics.

**Build Estimate**: 165-220 hours (4-5 weeks full-time)
**Timeline**: 5-week phased rollout (MVP → Full Production)
**Infrastructure**: Leverages existing Edge Functions, extends with 6 new functions

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Admin Dashboard Structure](#admin-dashboard-structure)
4. [Key Metrics (40+)](#key-metrics)
5. [Data Visualization](#data-visualization)
6. [Edge Functions](#edge-functions)
7. [Security & Access Control](#security--access-control)
8. [Build Phases](#build-phases)
9. [Success Criteria](#success-criteria)

---

## System Architecture

### Current Platform State

**Frontend**: React 18 + TypeScript + Vite + ShadCN UI
**Backend**: Supabase (PostgreSQL + Edge Functions) + Lovable Cloud AI
**AI Gateway**: Google Gemini 2.5 Flash via Lovable proxy
**Caching**: Upstash Redis (1hr context, 24hr embeddings, 5-60min responses)
**Database Tables**: 25+ tables tracking users, tactics, AI conversations, progress

### Admin Dashboard Architecture

```
User (Admin Role) → Admin Routes (/admin/*)
                   ↓
         Protected by AdminRoute Component
                   ↓
         AdminLayout (Sidebar Navigation)
                   ↓
    6 Main Dashboard Sections
    ├── Overview (KPIs, Growth, Health)
    ├── Users (Directory, Segments, Cohorts)
    ├── AI Agents (Performance, RAG, Handoffs)
    ├── Content (Tactics, Enrichment, KB)
    ├── Platform Health (Errors, DB, API)
    └── Business (Growth, Engagement, Funnels)
                   ↓
    Edge Functions (Metrics Aggregation)
    ├── get-admin-dashboard-metrics (Overview)
    ├── get-user-segments (User filtering)
    ├── get-tactic-analytics (Content insights)
    ├── get-cohort-retention (Business metrics)
    ├── get-ai-agent-health (Agent monitoring)
    └── audit-log-action (Admin action tracking)
                   ↓
    Supabase Database (25+ tables)
    + Admin Tables (admin_users, admin_audit_log, admin_metrics_cache)
```

---

## Database Schema

### New Tables Required

#### 1. `admin_users` - Role-Based Access Control

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'analyst', 'content_manager', 'support')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- RLS Policy: Only super_admins can manage admin_users
CREATE POLICY "super_admin_manage_admins" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    )
  );
```

#### 2. `admin_audit_log` - Action Tracking

```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) NOT NULL,
  action_type TEXT NOT NULL, -- 'view_user', 'edit_tactic', 'delete_user', 'export_data', etc.
  target_type TEXT, -- 'user', 'tactic', 'system', 'report'
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups by admin or date
CREATE INDEX idx_admin_audit_admin_user ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_action_type ON admin_audit_log(action_type, created_at DESC);

-- RLS Policy: Admins can view all audit logs
CREATE POLICY "admins_view_audit_logs" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );
```

#### 3. `admin_metrics_cache` - Pre-Calculated Aggregates

```sql
CREATE TABLE admin_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE, -- 'dau_2025_11_19', 'mau_2025_11', 'total_users'
  metric_value JSONB NOT NULL, -- Flexible JSON storage for different metric types
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  calculation_time_ms INTEGER -- Track query performance
);

-- Index for fast metric retrieval
CREATE INDEX idx_metrics_cache_key ON admin_metrics_cache(metric_key);
CREATE INDEX idx_metrics_cache_expires ON admin_metrics_cache(expires_at);

-- Auto-delete expired metrics
CREATE OR REPLACE FUNCTION delete_expired_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_metrics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Existing Tables (Metrics Sources)

**User Management**:
- `user_profiles` - 25+ fields including gamification (points, streaks, levels), tier, role
- `user_onboarding` - 19-question assessment with readiness scores
- `user_roadmap_state` - Personalized filtering preferences

**AI Agent System**:
- `agent_conversations` - All Nette/MIO/ME interactions with response_time_ms, cache_hit
- `nette_knowledge_chunks` - ~600 chunks for Nette agent
- `me_knowledge_chunks` - ~80 chunks for ME agent
- `mio_knowledge_chunks` - ~100 chunks for MIO agent (in progress)

**Content & Progress**:
- `gh_tactic_instructions` - 403 tactics with enrichment metadata (Batch 4 complete: 70/86 succeeded)
- `user_tactic_progress` - Individual tactic completion tracking (status: not_started | in_progress | completed | skipped)
- `daily_practices` - PROTECT method tracking (MIO accountability)

**Analytics**:
- `ai_weekly_summaries` - AI-generated progress reports
- `avatar_assessments` - Identity collision detection (MIO)
- `notifications` - In-app notification system

---

## Admin Dashboard Structure

### Page Layout

```
/admin
├── / (Overview Dashboard)
├── /users
│   ├── / (User Directory Table)
│   ├── /segments (Pre-defined + Custom Segment Builder)
│   ├── /cohorts (Cohort Retention Analysis)
│   └── /:userId (User Detail Drill-Down)
├── /ai-agents
│   ├── /performance (Response Time, Cache Hit %, RAG Quality)
│   ├── /conversations (Volume Trends, Session Depth)
│   ├── /rag (Knowledge Base Health, Search Performance)
│   └── /handoffs (Flow Diagram, Success Rates)
├── /content
│   ├── /tactics (Management Table with Filters)
│   ├── /enrichment (Status Tracking, Batch 4 Results)
│   ├── /knowledge-base (Chunk Browser by Agent)
│   └── /summaries (Weekly AI Summary Monitor)
├── /health
│   ├── /system (Database CPU, Cache Performance, API Latency)
│   ├── /errors (Searchable Error Log)
│   └── /database (Table Sizes, Slow Queries, Index Hit Rates)
├── /business
│   ├── /growth (Signups, DAU/WAU/MAU, Growth Rate)
│   ├── /engagement (Agent Usage, Feature Adoption, Session Metrics)
│   ├── /funnels (Assessment → Onboarding → Active Usage)
│   └── /retention (Day 1/7/30 Retention by Cohort)
└── /settings
    ├── /admins (Manage Admin Users)
    ├── /alerts (Configure Alert Thresholds)
    └── /export (Data Export Tools)
```

### Navigation Structure

**Sidebar Navigation** (always visible on desktop, collapsible on mobile):

```tsx
<AdminSidebar>
  <SidebarHeader>
    <Logo />
    <AdminBadge role={currentAdmin.role} />
  </SidebarHeader>

  <SidebarNav>
    <NavItem icon={LayoutDashboard} to="/admin" label="Overview" />
    <NavItem icon={Users} to="/admin/users" label="Users" />
    <NavItem icon={Bot} to="/admin/ai-agents" label="AI Agents" />
    <NavItem icon={BookOpen} to="/admin/content" label="Content" />
    <NavItem icon={Activity} to="/admin/health" label="Platform Health" />
    <NavItem icon={TrendingUp} to="/admin/business" label="Business" />
    <NavItem icon={Settings} to="/admin/settings" label="Settings" />
  </SidebarNav>

  <SidebarFooter>
    <QuickActions />
    <AdminProfile />
  </SidebarFooter>
</AdminSidebar>
```

---

## Key Metrics

### Real-Time Metrics (Live Updates Every 30s)

**Priority 1 - Critical**:
1. **Active Users Now** - WebSocket connections or last action <5min
2. **AI Response Errors** - Count in last hour (threshold: <5%)
3. **Database Connection Pool** - Current usage % (threshold: <80%)
4. **Cache Hit Rate** - Current 15min window (threshold: >40%)
5. **System Health Score** - Composite: green (100%), yellow (50-99%), red (<50%)

**Priority 2 - High**:
6. **Messages Sent Today** - By agent (Nette/MIO/ME breakdown)
7. **New Signups Today** - Count since midnight
8. **Tactics Completed Today** - Total across all users
9. **Active Conversations** - In-progress chat sessions
10. **Avg Response Time** - Rolling 1hr average (threshold: <2s)

### Daily Metrics (24-Hour Trends)

**Priority 1**:
11. **Daily Active Users (DAU)** - Unique users with activity in last 24h
12. **New User Signups** - Total new accounts created
13. **Assessment Completions** - % of new users completing 19-question assessment
14. **First-Time Agent Interactions** - New users who sent first message
15. **Handoff Acceptance Rate** - % of handoff suggestions accepted by users

**Priority 2**:
16. **Tactics Started vs Completed** - Ratio to identify high-dropout tactics
17. **PROTECT Practices Logged** - MIO accountability feature usage
18. **Cache Hit Rate (Daily Avg)** - Overall cache effectiveness
19. **RAG Quality Score (Daily Avg)** - Similarity scores from hybrid search
20. **Error Count by Type** - Grouped by error category (AI, DB, API, Client)

### Weekly Metrics (7-Day Trends)

**Priority 1**:
21. **Weekly Active Users (WAU)** - Unique users with activity in last 7 days
22. **Week-over-Week Growth Rate** - % change in key metrics vs previous week
23. **Cohort Retention (Day 7)** - % of users active 7 days after signup
24. **Avg Tactics per Active User** - Total tactics completed / active users
25. **Agent Engagement Distribution** - % using Nette vs MIO vs ME

**Priority 2**:
26. **Tactic Completion Rate by Category** - Operations, Finance, Staffing, etc.
27. **Average Streak Length** - PROTECT practice consistency (MIO)
28. **Weekly Summary Generation Success** - % of summaries generated without errors
29. **Knowledge Base Search Accuracy** - % of searches with relevant results
30. **Top 10 Most Completed Tactics** - By completion count

### Historical Metrics (Growth Over Time)

**Priority 1**:
31. **Total User Count (Cumulative)** - All-time registered users
32. **Monthly Active Users (MAU) Trend** - Last 12 months
33. **Total Tactics Completed (Cumulative)** - Platform-wide completion count
34. **Total Messages Sent (Cumulative)** - All agent interactions
35. **Retention Curves by Cohort** - Day 1/7/30 retention by signup month

**Priority 2**:
36. **Enrichment Status Trend** - % enriched tactics over time (Batch 1-4)
37. **Knowledge Base Growth** - Chunks added per month by agent
38. **Average Readiness Score Trend** - Changing user quality over time
39. **Tier Distribution Change** - Free vs Bootcamp vs Premium vs VIP
40. **Geographic Expansion** - New states/populations served per month

### Alert Thresholds

**🔴 Red Alerts (Immediate Action Required)**:
- Error rate >5% in last hour
- Database CPU >90% for 5min
- AI gateway 429 errors >10 in 1hr
- Zero new signups for 24hr (if typically >10/day)
- Cache complete failure (Redis unavailable)

**🟡 Yellow Alerts (Investigate Soon)**:
- DAU dropped >20% vs 7-day average
- Response time >3s average for 1hr
- Cache hit rate <30% for 6hr
- No tactic completions in 12hr
- Handoff success rate <60% for 24hr

**🟢 Green Thresholds (Healthy System)**:
- Error rate <1%
- Response time <2s average
- Cache hit rate >40%
- DAU/MAU >35%
- Retention Day 7 >70%

---

## Data Visualization

### Chart Types by Section

#### Overview Dashboard
- **Hero KPI Cards** (4 cards): Total Users, Active Today, Messages Today, Tactics Completed Today
- **Line Chart**: 30-day growth trend (signups + DAU overlay)
- **Status Grid**: System health indicators (4x2 grid: Database, Cache, AI Gateway, API)
- **Activity Feed Table**: Recent 50 events (user signups, tactic completions, agent interactions)

#### Users Section
- **Data Table**: Searchable user directory (columns: Name, Email, Signup Date, Tier, Readiness, Last Active, Total Tactics, Streak)
- **Donut Chart**: User distribution by tier (Bootcamp/Premium/VIP)
- **Bar Chart**: Users by readiness level (Foundation/Accelerated/Fast Track/Expert)
- **Cohort Heatmap**: Retention by signup cohort (rows: months, columns: days since signup, color: retention %)

#### AI Agents Section
- **Multi-Line Chart**: Response time by agent over 7 days (3 lines: Nette, MIO, ME)
- **Stacked Bar Chart**: Cache hits vs misses by agent (daily)
- **Sankey Diagram**: Handoff flows (Nette → MIO, MIO → ME, etc.)
- **Gauge Charts**: RAG quality score per agent (0-1 scale, target: 0.80+)

#### Content Section
- **Data Table**: Tactic management (columns: ID, Name, Category, Week, Enrichment Status, Completion Rate)
- **Progress Ring**: Enrichment status (enriched: 373/403, generic: 16/403, validated: 14/403)
- **Horizontal Bar Chart**: Top 20 tactics by completion rate
- **Treemap**: Tactics by parent category (size = completion count, color = category)

#### Platform Health Section
- **Line Chart**: Database CPU/Memory usage (p50/p95/p99)
- **Status Indicator Grid**: All services (green/yellow/red dots)
- **Log Table**: Recent errors with severity, timestamp, affected users
- **Scatter Plot**: API response time distribution (x: endpoint, y: response time ms)

#### Business Section
- **Area Chart**: Cumulative user growth (all-time)
- **Funnel Chart**: Assessment → First interaction → Week 1 complete
- **Line Chart**: DAU/WAU/MAU over last 90 days
- **Cohort Table**: Retention by signup month (Day 1/7/30 columns)

### Time Range Selectors

**Standard Options** (applied globally to all charts in section):
- Last 24 hours (hourly granularity)
- Last 7 days (daily granularity)
- Last 30 days (daily granularity)
- Last 90 days (weekly granularity)
- All time (monthly granularity)
- Custom date range picker

**Auto-Refresh Intervals**:
- Real-time metrics: 30 seconds
- Daily metrics: 5 minutes
- Weekly metrics: 15 minutes
- Historical metrics: On-demand only (manual refresh)

---

## Edge Functions

### 1. `get-admin-dashboard-metrics` (Priority 1)

**Purpose**: Aggregates all KPIs for overview dashboard
**Estimate**: 15-20 hours to build
**Caching**: 5-minute TTL (Upstash Redis)

**Request**:
```typescript
{
  time_range?: '24h' | '7d' | '30d', // Default: '24h'
  metrics?: string[] // Optional filter, default: all
}
```

**Response**:
```typescript
{
  total_users: number,
  active_today: number,
  messages_today: number,
  tactics_completed_today: number,
  new_signups_today: number,
  dau: number,
  wau: number,
  mau: number,
  system_health: {
    status: 'green' | 'yellow' | 'red',
    database_cpu: number,
    cache_hit_rate: number,
    ai_error_rate: number,
    avg_response_time_ms: number
  },
  growth_trend: Array<{
    date: string,
    signups: number,
    dau: number
  }>,
  recent_activity: Array<{
    type: 'signup' | 'tactic_completion' | 'agent_interaction',
    user_id: string,
    user_name: string,
    details: any,
    timestamp: string
  }>
}
```

**SQL Queries**:
```sql
-- Total Users
SELECT COUNT(*) FROM user_profiles WHERE created_at IS NOT NULL;

-- Active Today (DAU)
SELECT COUNT(DISTINCT user_id) FROM agent_conversations
WHERE created_at >= CURRENT_DATE;

-- Messages Today
SELECT COUNT(*) FROM agent_conversations
WHERE created_at >= CURRENT_DATE;

-- Tactics Completed Today
SELECT COUNT(*) FROM user_tactic_progress
WHERE status = 'completed' AND completed_at >= CURRENT_DATE;

-- 30-Day Growth Trend
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS signups,
  (SELECT COUNT(DISTINCT user_id) FROM agent_conversations
   WHERE DATE(created_at) = DATE(up.created_at)) AS dau
FROM user_profiles up
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. `get-user-segments` (Priority 1)

**Purpose**: Returns counts and user lists for pre-defined or custom segments
**Estimate**: 8-10 hours to build
**Caching**: 15-minute TTL

**Request**:
```typescript
{
  segment_type: 'new_users' | 'active_users' | 'at_risk' | 'churned' | 'power_users' | 'custom',
  custom_filters?: {
    tier?: string[],
    readiness_level?: string[],
    min_tactics?: number,
    max_tactics?: number,
    last_active_days?: number
  },
  include_user_ids?: boolean, // Default: false (just counts)
  page?: number, // Pagination
  limit?: number // Default: 50
}
```

**Response**:
```typescript
{
  segment_name: string,
  total_count: number,
  user_ids?: string[], // Only if include_user_ids = true
  users?: Array<{
    id: string,
    full_name: string,
    email: string,
    tier: string,
    readiness_level: string,
    total_tactics: number,
    last_active_at: string
  }>
}
```

### 3. `get-tactic-analytics` (Priority 1)

**Purpose**: Per-tactic completion rates, dropout rates, avg completion time
**Estimate**: 6-8 hours to build
**Caching**: 1-hour TTL

**Request**:
```typescript
{
  tactic_ids?: string[], // Optional filter
  sort_by?: 'completion_rate' | 'dropout_rate' | 'avg_time' | 'total_attempts',
  category?: string
}
```

**Response**:
```typescript
{
  tactics: Array<{
    tactic_id: string,
    tactic_name: string,
    category: string,
    enrichment_status: 'enriched' | 'generic' | 'validated',
    total_attempts: number,
    total_completions: number,
    completion_rate: number, // %
    dropout_rate: number, // %
    avg_completion_minutes: number,
    step_count: number,
    specificity_score: number // 0.0-1.0
  }>
}
```

### 4. `get-cohort-retention` (Priority 1)

**Purpose**: Calculates Day 1/7/30 retention by signup cohort
**Estimate**: 10-12 hours to build
**Caching**: 6-hour TTL (expensive query)

**Request**:
```typescript
{
  cohort_granularity: 'daily' | 'weekly' | 'monthly',
  start_date?: string, // Default: 90 days ago
  end_date?: string // Default: today
}
```

**Response**:
```typescript
{
  cohorts: Array<{
    cohort_date: string, // '2025-11' or '2025-11-19' depending on granularity
    cohort_size: number,
    day1_retention: number, // %
    day7_retention: number, // %
    day30_retention: number, // %
    active_now: number
  }>
}
```

**SQL Query**:
```sql
WITH cohorts AS (
  SELECT
    DATE_TRUNC('month', created_at) AS cohort_month,
    id AS user_id
  FROM user_profiles
  WHERE created_at >= NOW() - INTERVAL '90 days'
),
retention AS (
  SELECT
    c.cohort_month,
    COUNT(DISTINCT c.user_id) AS cohort_size,
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM agent_conversations ac
        WHERE ac.user_id = c.user_id
        AND ac.created_at >= c.cohort_month + INTERVAL '1 day'
        AND ac.created_at < c.cohort_month + INTERVAL '2 days'
      ) THEN c.user_id
    END) AS day1_retained,
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM agent_conversations ac
        WHERE ac.user_id = c.user_id
        AND ac.created_at >= c.cohort_month + INTERVAL '7 days'
      ) THEN c.user_id
    END) AS day7_retained,
    COUNT(DISTINCT CASE
      WHEN EXISTS (
        SELECT 1 FROM agent_conversations ac
        WHERE ac.user_id = c.user_id
        AND ac.created_at >= c.cohort_month + INTERVAL '30 days'
      ) THEN c.user_id
    END) AS day30_retained
  FROM cohorts c
  GROUP BY c.cohort_month
)
SELECT
  cohort_month,
  cohort_size,
  ROUND(100.0 * day1_retained / NULLIF(cohort_size, 0), 2) AS day1_retention_pct,
  ROUND(100.0 * day7_retained / NULLIF(cohort_size, 0), 2) AS day7_retention_pct,
  ROUND(100.0 * day30_retained / NULLIF(cohort_size, 0), 2) AS day30_retention_pct
FROM retention
ORDER BY cohort_month DESC;
```

### 5. `get-ai-agent-health` (Priority 2)

**Purpose**: Extends existing `get-analytics` with error rates, handoff loops
**Estimate**: 6-8 hours to extend existing function
**Caching**: 5-minute TTL

**New Metrics to Add**:
```typescript
{
  agent_type: 'nette' | 'mio' | 'me',
  error_rate: number, // % of failed responses
  handoff_loops: number, // A→B→A within 5 messages
  conversation_depth: number, // Avg messages per conversation
  user_satisfaction_score: number // Future: from user feedback
}
```

### 6. `audit-log-action` (Priority 1)

**Purpose**: Logs all admin actions to audit table
**Estimate**: 4-6 hours to build
**No caching** (writes only)

**Request**:
```typescript
{
  admin_user_id: string,
  action_type: 'view_user' | 'edit_tactic' | 'delete_user' | 'export_data' | 'impersonate_user',
  target_type: 'user' | 'tactic' | 'system' | 'report',
  target_id: string,
  details: any // JSON with action-specific data
}
```

**Response**:
```typescript
{
  audit_log_id: string,
  logged_at: string
}
```

---

## Security & Access Control

### Permission Matrix

| Feature | Super Admin | Analyst | Content Manager | Support |
|---------|-------------|---------|-----------------|---------|
| View all metrics | ✅ | ✅ | ✅ | ✅ |
| View user details | ✅ | ✅ | ❌ | ✅ (limited) |
| Edit user profiles | ✅ | ❌ | ❌ | ✅ (tier only) |
| Delete users | ✅ | ❌ | ❌ | ❌ |
| Edit tactics | ✅ | ❌ | ✅ | ❌ |
| Manage admin users | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ (tactics only) | ✅ (user data) |
| Impersonate users | ✅ | ❌ | ❌ | ✅ |
| View audit logs | ✅ | ✅ (read-only) | ❌ | ❌ |

### RLS Policies

```sql
-- Admin Route Protection
CREATE POLICY "admin_users_only" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- All Tables: Admin Bypass
CREATE POLICY "admins_bypass_rls" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Repeat for all tables: agent_conversations, user_tactic_progress, etc.
```

### Audit Logging

**All admin actions automatically logged**:
- Page views (which user details viewed)
- Data modifications (profile edits, tactic updates)
- User impersonation (start/end timestamps)
- Data exports (what data, how many records)
- System configuration changes (alert thresholds, feature flags)

**Audit Log Retention**: 90 days (configurable)

---

## Build Phases

### Week 1: MVP Foundation (40-50 hours)

**Database Schema** (6 hours):
- Create `admin_users` table with RLS policies
- Create `admin_audit_log` table with indexes
- Create `admin_metrics_cache` table with auto-expiry

**Admin Authentication** (8 hours):
- Create `/admin/login` route
- Implement JWT-based admin auth
- Build `AdminRoute` protection component
- Add role checking middleware

**Base Layout** (10 hours):
- Create `AdminLayout.tsx` with sidebar
- Build navigation menu (6 sections)
- Implement responsive design (collapse sidebar on mobile)
- Add breadcrumb navigation

**Overview Dashboard** (12 hours):
- Create `/admin` route
- Build 4 KPI hero cards
- Add 30-day growth trend chart
- Show system health indicators
- Display recent activity feed

**Edge Functions** (8 hours):
- Build `get-admin-dashboard-metrics`
- Build `audit-log-action`

**Deliverables**:
- ✅ Admin login functional
- ✅ Overview dashboard with live KPIs
- ✅ All admin actions logged to audit table

### Week 2: User Management (30-40 hours)

**User Directory** (10 hours):
- Create `/admin/users` page
- Build searchable/filterable data table
- Implement pagination (50 users per page)
- Add bulk actions (export CSV, update tier)

**User Detail Page** (8 hours):
- Create `/admin/users/:id` drill-down
- Show profile summary with assessment scores
- Display progress timeline (tactics by week)
- List conversation history (all agents)
- Show PROTECT practice calendar

**User Segmentation** (8 hours):
- Create `/admin/users/segments` page
- Build pre-defined segment cards with counts
- Implement custom segment builder (multi-filter)
- Build `get-user-segments` Edge Function

**User Actions** (6 hours):
- Implement edit user modal
- Add password reset functionality
- Create user impersonation feature (view as user)
- Add bulk update capability

**Deliverables**:
- ✅ Searchable user directory
- ✅ User detail drill-down with full history
- ✅ Custom segment builder
- ✅ User editing and impersonation

### Week 3: AI Agent Analytics (25-35 hours)

**Performance Metrics** (10 hours):
- Create `/admin/ai-agents/performance` page
- Build 3-column layout (Nette | MIO | ME)
- Add per-agent stat cards
- Implement 7-day trend charts
- Extend `get-analytics` Edge Function

**Conversation Analytics** (8 hours):
- Create `/admin/ai-agents/conversations` page
- Show conversation volume trends (daily breakdown)
- Display average session depth
- Add handoff suggestions and acceptance rate
- Filter by agent type, date range

**RAG System Health** (8 hours):
- Create `/admin/ai-agents/rag` page
- Display knowledge base metrics by agent
- Show search performance (vector + full-text + RRF)
- Track embedding cache hit rate
- Monitor chunk relevance scores

**Handoff Analysis** (8 hours):
- Create `/admin/ai-agents/handoffs` page
- Build Sankey diagram showing handoff flows
- Display handoff success rate metrics
- Detect handoff loops (A→B→A)
- Show confidence score distribution

**Deliverables**:
- ✅ AI agent performance dashboards
- ✅ RAG system health monitoring
- ✅ Handoff flow visualization
- ✅ Extended `get-analytics` function

### Week 4: Content + Health (35-45 hours)

**Tactic Management** (8 hours):
- Create `/admin/content/tactics` page
- Build filterable table of 403 tactics
- Add search by name/ID
- Filter by category, week, enrichment status
- Sort by any column

**Tactic Editor** (10 hours):
- Create modal editor for tactics
- Build rich text editor for step-by-step
- Update enrichment status, week assignment
- Edit cost/population/state targeting
- Preview changes before saving

**Enrichment Tracking** (6 hours):
- Create `/admin/content/enrichment` page
- Show overall enrichment rate (currently ~95%)
- Display step count distribution
- Track enrichment history (Batch 1-4)
- Build `get-tactic-analytics` Edge Function

**Knowledge Base Viewer** (6 hours):
- Create `/admin/content/knowledge-base` page
- Browse chunks by agent (Nette/MIO/ME)
- Show chunk text, embedding status, last updated
- Manual chunk editor
- Bulk import/export functionality

**System Metrics** (8 hours):
- Create `/admin/health/system` page
- Show database CPU, memory, connection pool
- Display cache performance (Redis hit rates, memory)
- Track API response times (p50/p95/p99)
- Real-time status indicators

**Error Log Viewer** (6 hours):
- Create `/admin/health/errors` page
- Build searchable error log table
- Filter by severity, type, date range
- Group by error type with counts
- Link to affected users/requests

**Database Health** (6 hours):
- Create `/admin/health/database` page
- Show table sizes and growth rates
- Display index hit rates
- List slow queries (>500ms)
- Track query performance breakdown

**Deliverables**:
- ✅ Tactic management and editing
- ✅ Enrichment status tracking
- ✅ Platform health monitoring
- ✅ Error log viewer

### Week 5: Business Metrics + Polish (35-45 hours)

**Growth Metrics** (8 hours):
- Create `/admin/business/growth` page
- Add new signups chart (30d/90d/all-time)
- Show cumulative user growth (area chart)
- Display DAU/WAU/MAU trends
- Calculate growth rate (% change MoM)

**Engagement Trends** (6 hours):
- Create `/admin/business/engagement` page
- Build agent usage distribution (donut chart)
- Add user activity heatmap (by day/hour)
- Show average session metrics
- Track feature adoption rates

**Conversion Funnels** (8 hours):
- Create `/admin/business/funnels` page
- Build funnel visualization (Assessment → First interaction → Week 1 complete)
- Show drop-off rates at each stage
- Calculate time-to-conversion metrics
- Add segment comparison

**Cohort Retention** (8 hours):
- Create `/admin/business/retention` page
- Display Day 1/7/30 retention by signup cohort
- Build cohort retention curves (line charts)
- Calculate churn rate
- Show resurrection rate (churned users returning)
- Build `get-cohort-retention` Edge Function

**Mobile Responsiveness** (6 hours):
- Optimize all pages for 768px+ breakpoint
- Collapse sidebar on mobile
- Stack charts vertically
- Simplify tables for mobile

**Performance Optimization** (6 hours):
- Implement virtualized tables (react-window)
- Add pagination to all large datasets
- Lazy load chart libraries
- Optimize database queries with indexes

**Documentation** (4 hours):
- Write admin user guide
- Document all metrics definitions
- Create troubleshooting guide
- Record demo video

**Testing** (4 hours):
- Test all admin actions with different roles
- Verify RLS policies working correctly
- Load test with 1,000+ users
- Cross-browser testing (Chrome, Safari, Firefox)

**Deliverables**:
- ✅ Complete business metrics dashboard
- ✅ Cohort retention analysis
- ✅ Mobile-responsive design
- ✅ Performance optimized
- ✅ Full documentation

---

## Success Criteria

### MVP Launch Readiness (Week 1)

- [ ] Overview page shows 10+ key metrics
- [ ] Admin authentication working with role-based access
- [ ] Audit log captures all admin actions
- [ ] Dashboard loads in <2s for 1,000 users
- [ ] System health indicators accurate (green/yellow/red)

### Production Readiness (Week 5)

- [ ] All 40 priority metrics implemented
- [ ] Real-time metrics update every 30s
- [ ] Error rate <0.1% on admin API calls
- [ ] Mobile-responsive design (768px+ breakpoint)
- [ ] Export functions support CSV + JSON
- [ ] Cohort retention analysis functional
- [ ] Alert system sends notifications
- [ ] Documentation complete (admin user guide)

### Scale Readiness (10,000+ users)

- [ ] Database queries optimized (<500ms p95)
- [ ] Pagination on all large datasets
- [ ] Materialized views for expensive aggregations
- [ ] CDN caching for static dashboard assets
- [ ] Load testing passed (100 concurrent admins)

---

## Next Steps

### Immediate Actions (This Week)

1. **Review Specification** - Stakeholder approval
2. **Prioritize Metrics** - Which 10-20 are must-have for MVP?
3. **Create Database Migration** - Admin tables SQL script
4. **Begin Week 1 Development** - Foundation + Overview page

### Timeline

- **Week 1 (Nov 25-29)**: MVP Foundation - Overview dashboard working
- **Week 2 (Dec 2-6)**: User Management - Directory + Detail pages
- **Week 3 (Dec 9-13)**: AI Agent Analytics - Performance monitoring
- **Week 4 (Dec 16-20)**: Content + Health - Tactic management + Error logs
- **Week 5 (Jan 6-10)**: Business Metrics + Polish - Cohort retention + Mobile

**Total Build Time**: 165-220 hours
**Estimated Calendar Time**: 5 weeks (1 developer full-time) or 10 weeks (half-time)

---

**Document End** - Ready for stakeholder review and implementation planning
