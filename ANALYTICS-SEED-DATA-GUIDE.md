# Analytics Seed Data - Deployment Guide

## Overview

This seed script generates **1000-1200 realistic conversation records** across 90 days to test the Phase 1 Analytics Dashboard.

**Seed File**: [supabase/seed/seed_analytics_data.sql](supabase/seed/seed_analytics_data.sql)

## What the Seed Script Creates

### Conversation Distribution
- **Nette Agent**: ~500-600 conversations (50%) - Primary chatbot
- **MIO Agent**: ~300-360 conversations (30%) - Behavioral analysis
- **ME Agent**: ~200-240 conversations (20%) - Multi-agent orchestrator

### Realistic Patterns

**Cache Hit Rates** (mirrors production behavior):
- Nette: 80% cache hit rate (frequently asked questions)
- MIO: 60% cache hit rate (personalized insights with some caching)
- ME: 40% cache hit rate (orchestration requires fresh context)

**Response Times**:
- Cache hits: 50-200ms
- Cache misses: 300-1200ms

**RAG Usage**:
- 70% of non-cached responses use RAG retrieval
- Similarity scores: 0.65-0.95
- Chunks retrieved: 3-8 per query
- RAG time: 100-400ms

**Handoff Patterns**:
- ME → Nette/MIO: 30% handoff rate (orchestrator delegates)
- Nette → MIO: 5% handoff rate (rare escalations)
- MIO → Nette: 5% handoff rate (return to general chatbot)

**Time Distribution**:
- 90 days of historical data
- More conversations in recent days (simulates growth)
- Business hours + evening (6 AM - 11 PM)

### Generated Columns Verification

The seed script automatically tests that generated columns work correctly:
- ✅ `created_date` populated for all records
- ✅ `created_hour` populated for all records
- ✅ `created_week` populated for all records

## Deployment Instructions

### Step 1: Open Supabase SQL Editor

1. Navigate to your Supabase project dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**

### Step 2: Copy and Execute Seed Script

```bash
# Copy the seed script
cat supabase/seed/seed_analytics_data.sql
```

1. Paste the entire script into SQL Editor
2. Click **RUN** button
3. Wait for completion (~5-10 seconds)

### Step 3: Verify Seed Data

The script includes automatic verification queries. You should see:

**Agent Distribution**:
```
agent_type | total_conversations | percentage
-----------+--------------------+-----------
nette      | 500-600            | 50%
mio        | 300-360            | 30%
me         | 200-240            | 20%
```

**Cache Hit Rates**:
```
agent_type | cache_hit_rate_pct
-----------+-------------------
nette      | 78-82%
mio        | 58-62%
me         | 38-42%
```

**Response Times**:
```
agent_type | cache_hit | avg_response_time_ms
-----------+-----------+---------------------
nette      | true      | 100-150ms
nette      | false     | 600-900ms
mio        | true      | 120-180ms
mio        | false     | 700-1000ms
me         | true      | 150-200ms
me         | false     | 800-1100ms
```

### Step 4: Test Index Usage

The seed script automatically runs EXPLAIN ANALYZE on key queries to verify indexes are being used.

Look for these in the output:
```
Index Scan using idx_agent_conversations_daily_volume
Index Scan using idx_agent_conversations_hourly_analytics
Index Scan using idx_agent_conversations_cache_performance
```

**Expected Execution Times**:
- Daily volume query: <50ms (with 1000+ rows)
- Hourly analytics: <30ms (with 300+ rows)
- Cache performance: <40ms (with 700+ rows)

## What Happens After Seeding

### Generated Columns Auto-Populated ✅

All 1000+ records will have:
- `created_date`: Date portion at UTC (e.g., '2024-11-20')
- `created_hour`: Hour-truncated timestamp (e.g., '2024-11-20 14:00:00')
- `created_week`: Week-truncated timestamp (e.g., '2024-11-18 00:00:00')

### Indexes Ready for Testing ✅

All 11 composite indexes will have data to work with:
1. ✅ idx_agent_conversations_daily_volume (500+ unique dates)
2. ✅ idx_agent_conversations_error_tracking (700+ non-null response times)
3. ✅ idx_agent_conversations_cache_performance (700+ with response times)
4. ✅ idx_agent_conversations_hourly_analytics (100+ unique hours)
5. ✅ idx_agent_conversations_weekly_rollups (12+ unique weeks)
6. ✅ idx_agent_conversations_multi_metric (700+ multi-metric records)

### Dashboard Ready to Test ✅

Navigate to `/admin/analytics` and you should see:
- **KPI Cards**: Real numbers (not "0" or "No data")
- **Cache Hit Rate Chart**: 90-day trend with 3 agent lines
- **Response Time Chart**: Performance trends by agent
- **Agent Comparison Table**: Sortable metrics with real data

## Data Cleanup (Optional)

If you want to remove the seed data later:

```sql
-- Remove all seed data (3 test users)
DELETE FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Verify cleanup
SELECT COUNT(*) FROM agent_conversations
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);
-- Expected: 0
```

## Troubleshooting

### Error: "function gen_random_uuid() does not exist"

**Solution**: Enable the pgcrypto extension:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: "permission denied for table agent_conversations"

**Solution**: Ensure you're using Supabase service role key or postgres superuser.

### Error: "relation agent_conversations does not exist"

**Solution**: Run the base schema migration first:
```bash
supabase db push
```

### Seed Script Runs But No Data Appears

**Check 1**: Verify the query is filtering correctly:
```sql
SELECT COUNT(*) FROM agent_conversations;
-- Should show 1000+ if seed succeeded
```

**Check 2**: Check if RLS policies are blocking:
```sql
-- Temporarily disable RLS for testing (re-enable after!)
ALTER TABLE agent_conversations DISABLE ROW LEVEL SECURITY;
```

## Next Steps After Seeding

1. **Test Analytics Dashboard** (15 min)
   - Navigate to `/admin/analytics`
   - Take Playwright screenshots (mobile/tablet/desktop)
   - Verify charts render with real data
   - Test export functionality

2. **Verify Index Performance** (5 min)
   - Run EXPLAIN ANALYZE queries (included in seed script)
   - Confirm indexes are being used (not sequential scans)
   - Check execution times are <200ms

3. **Test Dashboard Features** (10 min)
   - Date range filtering
   - Agent-specific filtering
   - CSV/JSON export
   - Chart interactions (hover tooltips)

4. **Monitor Query Performance** (ongoing)
   - Check `pg_stat_user_indexes` after 24 hours
   - Verify index scan counts > 0
   - Monitor for slow queries

## Expected Results Summary

| Metric | Expected Value | Purpose |
|--------|----------------|---------|
| **Total Records** | 1000-1200 | Sufficient for realistic testing |
| **Date Range** | 90 days | Tests time-series indexes |
| **Agents** | 3 (Nette, MIO, ME) | Tests agent-specific filtering |
| **Cache Hit Rate** | 50-80% overall | Tests cache performance index |
| **RAG Usage** | ~50% of conversations | Tests RAG quality metrics |
| **Handoffs** | ~10% of conversations | Tests handoff analytics |
| **Query Performance** | <200ms avg | Validates index optimization |
| **Generated Columns** | 100% populated | Verifies IMMUTABLE fix works |

---

**Status**: ✅ READY FOR DEPLOYMENT
**Estimated Execution Time**: 5-10 seconds
**Risk Level**: LOW (uses test user IDs, easily removable)
**Storage Impact**: ~2-5 MB (negligible)
