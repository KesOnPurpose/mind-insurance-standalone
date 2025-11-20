# Admin Dashboard Deployment Guide

## Error Encountered

```
Error: Failed to run sql query: ERROR: 42P01: relation "public.admin_users" does not exist
```

**Root Cause**: The admin database schema migration hasn't been deployed to production yet.

## Deployment Steps (Do These in Order)

### Step 1: Deploy Admin Schema Migration

Navigate to your Supabase project dashboard:
1. Go to https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the entire contents of the migration file below

**Migration File**: [supabase/migrations/20251119150000_create_admin_schema.sql](supabase/migrations/20251119150000_create_admin_schema.sql)

**What This Creates**:
- `admin_users` table with RLS policies
- `admin_audit_log` table for compliance
- `admin_metrics_cache` table for performance
- Security functions: `is_admin()`, `has_admin_permission()`

**Expected Result**:
- Query should execute successfully
- You should see: "Success. No rows returned"

### Step 2: Deploy Analytics Composite Indexes (Optional but Recommended)

This improves dashboard query performance by 10-100x.

**Migration File**: [supabase/migrations/20251119140000_add_analytics_composite_indexes.sql](supabase/migrations/20251119140000_add_analytics_composite_indexes.sql)

1. In SQL Editor, click "New Query"
2. Copy and paste the entire contents of the analytics indexes migration
3. Run the query

**What This Creates**:
- 5 composite indexes on `agent_conversations` table
- Partial indexes for last 90 days (60-70% size reduction)
- Optimized for cache hit rate, RAG quality, handoff accuracy, performance metrics

**Expected Result**:
- Query should execute successfully
- Indexes are created for analytics queries

### Step 3: Verify Schema Creation

Run this verification query in SQL Editor:

```sql
-- Check that all admin tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache')
ORDER BY table_name;
```

**Expected Result**:
```
admin_audit_log       | 9
admin_metrics_cache   | 8
admin_users           | 8
```

### Step 4: Verify Security Functions

```sql
-- Check that security functions exist
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'has_admin_permission')
ORDER BY routine_name;
```

**Expected Result**:
```
has_admin_permission | FUNCTION | DEFINER
is_admin             | FUNCTION | DEFINER
```

### Step 5: Create Your First Admin User

Now you can run the seed script!

**Prerequisites**:
1. You must have a user account created (sign up through the app first)
2. You need to find your `user_id` from the `auth.users` table

**Find Your User ID**:
```sql
-- Replace 'your-email@example.com' with your actual email
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

**Copy your user_id** (it will look like: `e539ea85-7d78-43f6-8595-defa6aaab0f1`)

**Create Admin User**:
```sql
-- Replace 'YOUR-USER-UUID-HERE' with your actual user_id from above
INSERT INTO public.admin_users (
  user_id,
  role,
  permissions,
  is_active,
  created_at
) VALUES (
  'YOUR-USER-UUID-HERE',  -- ← REPLACE THIS
  'super_admin',
  '{
    "users": {"read": true, "write": true, "delete": true},
    "analytics": {"read": true, "export": true},
    "content": {"read": true, "write": true, "publish": true},
    "system": {"read": true, "configure": true}
  }'::jsonb,
  true,
  NOW()
);
```

**Expected Result**:
```
Success. 1 row inserted.
```

### Step 6: Verify Admin User Creation

```sql
-- Verify your admin user was created correctly
SELECT
  au.id,
  au.role,
  au.is_active,
  au.created_at,
  u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.role = 'super_admin';
```

**Expected Result**:
You should see your admin user record with your email.

### Step 7: Test Admin Access

1. Navigate to your app: https://your-app-url.com
2. Log in with the email you used above
3. Navigate to: https://your-app-url.com/admin
4. You should see the Admin Dashboard with your role and permissions

**If you see "Access Denied"**:
- Check that you're logged in with the correct email
- Verify `is_active = true` in the admin_users table
- Check browser console for errors

## Quick Deployment Checklist

- [ ] Deploy admin schema migration (Step 1)
- [ ] Deploy analytics indexes migration (Step 2)
- [ ] Verify schema creation (Step 3)
- [ ] Verify security functions (Step 4)
- [ ] Find your user_id (Step 5)
- [ ] Create your admin user (Step 5)
- [ ] Verify admin user created (Step 6)
- [ ] Test admin access in app (Step 7)

## Troubleshooting

### Error: "violates foreign key constraint"
**Problem**: The user_id doesn't exist in auth.users table
**Solution**: Sign up through the app first, then run the seed script

### Error: "duplicate key value violates unique constraint"
**Problem**: An admin user with this user_id already exists
**Solution**: Use UPDATE instead of INSERT:

```sql
UPDATE public.admin_users
SET
  role = 'super_admin',
  permissions = '{
    "users": {"read": true, "write": true, "delete": true},
    "analytics": {"read": true, "export": true},
    "content": {"read": true, "write": true, "publish": true},
    "system": {"read": true, "configure": true}
  }'::jsonb,
  is_active = true
WHERE user_id = 'YOUR-USER-UUID-HERE';
```

### Error: "permission denied"
**Problem**: You're trying to access /admin but not in admin_users table
**Solution**: Verify your email matches the one in admin_users table

### Can't find my user_id
**Solution**: List all users:
```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Drop security functions
DROP FUNCTION IF EXISTS has_admin_permission(TEXT[]);
DROP FUNCTION IF EXISTS is_admin();

-- Drop tables (this will delete all admin users and audit logs!)
DROP TABLE IF EXISTS admin_metrics_cache;
DROP TABLE IF EXISTS admin_audit_log;
DROP TABLE IF EXISTS admin_users;
```

**Warning**: This will permanently delete all admin users and audit logs!

## Next Steps After Deployment

1. Test admin dashboard access
2. Review the [ADMIN-ANALYTICS-INTEGRATION-PLAN.md](ADMIN-ANALYTICS-INTEGRATION-PLAN.md)
3. Begin Phase 1 analytics integration (16-19 hours)
4. Add additional admin users if needed (see [scripts/seed-admin-user.sql](scripts/seed-admin-user.sql))

## Support

If you encounter issues not covered here:
1. Check the Supabase logs: Dashboard → Logs → Postgres Logs
2. Verify RLS policies are enabled: Dashboard → Database → Policies
3. Review the complete migration file: [20251119150000_create_admin_schema.sql](supabase/migrations/20251119150000_create_admin_schema.sql)

---

**Last Updated**: 2025-11-19
**Database**: hpyodaugrkctagkrfofj.supabase.co
**Migration Version**: 20251119150000
