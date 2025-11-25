# Analytics Dashboard - Quick Start Testing Guide

**Goal**: Test Phase 1 Analytics Dashboard in 10 minutes

---

## Step 1: Find Your User ID (2 minutes)

Open Supabase SQL Editor and run:

```sql
SELECT id, email FROM auth.users WHERE email = 'your@email.com';
```

Copy the `id` value - you'll need it in Step 2.

---

## Step 2: Create Admin User (1 minute)

Run this SQL (replace `YOUR_USER_ID` with the ID from Step 1):

```sql
INSERT INTO admin_users (
  user_id, role, permissions, is_active, created_at, last_login_at
) VALUES (
  'YOUR_USER_ID'::UUID,
  'super_admin',
  '{"users": {"read": true, "write": true, "delete": true}, "analytics": {"read": true, "export": true}, "content": {"read": true, "write": true, "publish": true}, "system": {"read": true, "configure": true}}'::jsonb,
  true, NOW(), NOW()
) ON CONFLICT (user_id) DO UPDATE SET is_active = true;
```

---

## Step 3: Access Dashboard (2 minutes)

1. Go to: http://localhost:8082/auth
2. Login with your email
3. Navigate to: http://localhost:8082/admin
4. Click **"Analytics"** tab

---

## Step 4: Verify Components (3 minutes)

You should see:

### KPI Cards (Top Row)
- **Total Conversations**: 563+
- **Cache Hit Rate**: ~60-70%
- **Avg Response Time**: ~400-600ms
- **RAG Quality**: ~0.75-0.85

### Charts
- **Cache Hit Rate Chart**: Line chart with 3 agents (Nette ~80%, MIO ~60%, ME ~40%)
- **Response Time Chart**: Performance by agent (cache hits 50-200ms, misses 300-1200ms)

### Table
- **Agent Comparison**: Sortable table with all 3 agents

### Export
- **CSV Export** button
- **JSON Export** button

---

## Step 5: Test Functionality (2 minutes)

1. **Click "Export CSV"** - Should download a CSV file
2. **Click "Export JSON"** - Should download a JSON file
3. **Open DevTools (F12)** - Check console for errors (should be zero)
4. **Resize browser** - Test mobile (375px), tablet (768px), desktop (1440px)

---

## Step 6: Verify Audit Logs (1 minute)

Run this SQL (replace `YOUR_USER_ID`):

```sql
SELECT action_type, created_at FROM admin_audit_log
WHERE admin_user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC LIMIT 5;
```

You should see:
- `analytics_export` (if you clicked export)
- `analytics_view` (when you loaded dashboard)

---

## Expected Results ✅

- ✅ Dashboard loads in <2 seconds
- ✅ All KPI cards show data
- ✅ Charts render with realistic patterns
- ✅ Export buttons work
- ✅ Zero console errors
- ✅ Responsive design works

---

## Troubleshooting

**Dashboard shows "No data"**:
```sql
SELECT COUNT(*) FROM agent_conversations;
-- Should show 1000+
```

**"Permission denied" error**:
```sql
SELECT is_active, role FROM admin_users WHERE user_id = 'YOUR_USER_ID';
-- Should show: is_active = true, role = super_admin
```

**Charts not rendering**:
- Check browser console for errors
- Verify dev server is running (http://localhost:8082)
- Clear browser cache and reload

---

## Performance Verification

Run EXPLAIN ANALYZE to verify indexes are being used:

```sql
EXPLAIN ANALYZE
SELECT created_date, agent_type, COUNT(*)
FROM agent_conversations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY created_date, agent_type;
```

Look for: `Index Scan using idx_agent_conversations_daily_volume`
Execution time should be: <200ms

---

## What Was Deployed

- **11 composite indexes** for 75-90% performance improvement
- **3 generated columns** (created_date, created_hour, created_week)
- **1000+ seed records** with realistic patterns
- **6 React components** for analytics dashboard
- **Audit logging** for all admin actions
- **Metrics caching** for 70% faster loads

---

## Next Steps

After successful testing:

1. **Deploy edge function** (if not already deployed):
   ```bash
   supabase functions deploy get-analytics
   ```

2. **Monitor index usage** (after 24 hours):
   ```sql
   SELECT indexname, idx_scan FROM pg_stat_user_indexes
   WHERE indexname LIKE 'idx_agent_conversations_%'
   ORDER BY idx_scan DESC;
   ```

3. **Review audit logs** weekly for compliance

4. **Plan Phase 2** features:
   - Real-time updates
   - Custom date ranges
   - Advanced filtering
   - Scheduled reports
   - Anomaly detection

---

**Documentation**: See [PHASE-1-FINAL-SUMMARY.md](PHASE-1-FINAL-SUMMARY.md) for complete details

**Status**: ✅ READY FOR TESTING
**Time Required**: 10 minutes
**Prerequisites**: Admin user created in admin_users table
