# 🚀 Deploy Admin Schema NOW

**Status**: Table doesn't exist yet - need to deploy QUICK-DEPLOY-ADMIN-FULL.sql

---

## Step 1: Deploy Complete Schema (2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj
   - Navigate to: **SQL Editor** (left sidebar)

2. **Copy the deployment script**
   - Open: [QUICK-DEPLOY-ADMIN-FULL.sql](./QUICK-DEPLOY-ADMIN-FULL.sql)
   - Select ALL content (Cmd+A)
   - Copy it (Cmd+C)

3. **Run the script**
   - Click "New Query" in Supabase SQL Editor
   - Paste the entire script (Cmd+V)
   - Click **RUN** button (or F5)
   - Wait for: "✅ Admin schema deployed successfully!" message

---

## Step 2: Create Your Admin User (1 minute)

After the schema deploys, run this INSERT query:

```sql
INSERT INTO public.admin_users (
  user_id,
  role,
  permissions,
  is_active,
  created_at
) VALUES (
  '77062c24-be2a-41e2-9fee-4af8274d0d2f',  -- ← Your actual user_id from console
  'super_admin',
  '{
    "users": {"read": true, "write": true, "delete": true},
    "analytics": {"read": true, "export": true},
    "content": {"read": true, "write": true, "publish": true},
    "system": {"read": true, "configure": true}
  }'::jsonb,
  true,
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;
```

**Important**: The user_id `77062c24-be2a-41e2-9fee-4af8274d0d2f` comes from your browser console error. This is your currently logged-in account.

---

## Step 3: Verify Deployment (30 seconds)

Run this verification query:

```sql
-- Check table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'admin_users';

-- Check your admin record
SELECT
  au.*,
  u.email
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE au.user_id = '77062c24-be2a-41e2-9fee-4af8274d0d2f';
```

**Expected results**:
- First query: Should return `admin_users`
- Second query: Should show your admin record with role `super_admin`

---

## Step 4: Test Admin Dashboard (1 minute)

1. **Refresh the app**
   - Go to: http://localhost:8081/admin
   - The page should load (no more "table not found" error)

2. **What you should see**:
   ```
   Admin Dashboard
   Role: super_admin
   User ID: 77062c24-be2a-41e2-9fee-4af8274d0d2f

   Permissions:
   ✓ users.read
   ✓ users.write
   ✓ users.delete
   ✓ analytics.read
   ✓ analytics.export
   ✓ content.read
   ✓ content.write
   ✓ content.publish
   ✓ system.read
   ✓ system.configure
   ```

---

## Troubleshooting

### If you still see "Could not find table" error:

1. **Check if script ran successfully**
   ```sql
   SELECT COUNT(*) FROM information_schema.tables
   WHERE table_name IN ('admin_users', 'admin_audit_log', 'admin_metrics_cache');
   ```
   - Should return 3

2. **Check if functions exist**
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name IN ('is_admin', 'is_super_admin', 'has_admin_permission');
   ```
   - Should return 3 functions

3. **Refresh browser hard (Cmd+Shift+R)** - Clear Supabase client cache

### If you see "Access Denied" instead:

Your admin record wasn't inserted correctly. Re-run Step 2 INSERT query.

---

## What Gets Created

- **Tables** (3):
  - `admin_users` - Your admin account
  - `admin_audit_log` - Tracks all admin actions
  - `admin_metrics_cache` - Performance optimization

- **Security Functions** (3):
  - `is_admin()` - Checks if user is any admin
  - `is_super_admin()` - Checks for super admin role
  - `has_admin_permission()` - Granular permission checking

- **RLS Policies** (8):
  - Admin users: SELECT, INSERT, UPDATE, DELETE policies
  - Audit log: SELECT, INSERT policies
  - Metrics cache: SELECT, ALL policies

- **Indexes** (9):
  - Optimized for user lookups, role checks, timestamp queries

---

## After Successful Deployment

Once the admin dashboard loads successfully, we'll proceed to Phase 1:

**[ADMIN-ANALYTICS-INTEGRATION-PLAN.md](./ADMIN-ANALYTICS-INTEGRATION-PLAN.md)** (16-19 hours)
- Research Lovable's analytics endpoint
- Build analytics service layer
- Create analytics dashboard UI
- Implement audit logging
- Build metrics cache system
- Add export functionality
- Testing & validation

---

**Current Status**: Waiting for you to run QUICK-DEPLOY-ADMIN-FULL.sql ⏳
