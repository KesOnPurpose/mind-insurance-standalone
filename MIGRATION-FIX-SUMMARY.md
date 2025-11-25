# Database Migration Fix Summary

## Problem Diagnosed

**Error**: `ERROR: 42703: column user_profiles.role does not exist`

**Root Cause**: The failed migration (`20251121000000_create_gh_document_tactic_suggestions_table.sql`) referenced a non-existent column.

### Original (INCORRECT) Pattern:
```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'  -- ❌ This column doesn't exist
  )
);
```

### Issues Found:
1. Referenced `profiles` table instead of correct table name
2. Assumed a `role` column exists in `profiles`/`user_profiles`
3. Didn't follow the existing admin authorization pattern used across the codebase

## Solution Implemented

**Corrected Pattern**: Use the existing `is_admin()` function that checks the `admin_users` table.

### How Admin Authorization Works in This Codebase:

1. **Admin Users Table**: `public.admin_users`
   - Contains: `user_id`, `role`, `is_active`, `permissions`
   - Roles: `super_admin`, `analyst`, `content_manager`, `support`

2. **Security Function**: `public.is_admin()`
   ```sql
   CREATE OR REPLACE FUNCTION public.is_admin()
   RETURNS BOOLEAN
   LANGUAGE plpgsql
   SECURITY DEFINER
   STABLE
   AS $$
   BEGIN
     RETURN EXISTS (
       SELECT 1 FROM public.admin_users
       WHERE user_id = auth.uid()
       AND is_active = true
     );
   END;
   $$;
   ```

3. **RLS Policy Pattern** (Used across 10+ migrations):
   ```sql
   CREATE POLICY "Admins can view all suggestions"
     ON gh_document_tactic_suggestions
     FOR SELECT
     TO authenticated
     USING ((SELECT is_admin()));  -- ✅ Correct pattern
   ```

## Corrected Migration File

**Location**: `/supabase/migrations/20251121000001_create_gh_document_tactic_suggestions_FINAL.sql`

**Changes Made**:
- Replaced `profiles.role = 'admin'` checks
- Used `(SELECT is_admin())` pattern consistently
- Added clarifying comments about the authorization function

## How to Execute the Migration

### Option 1: Supabase Dashboard (RECOMMENDED)

1. Navigate to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new

2. Copy the contents of the corrected migration:
   ```bash
   /supabase/migrations/20251121000001_create_gh_document_tactic_suggestions_FINAL.sql
   ```

3. Paste into the SQL Editor

4. Click **Run** to execute

5. Verify success:
   ```sql
   -- Check table exists
   SELECT * FROM gh_document_tactic_suggestions LIMIT 1;

   -- Check RLS policies
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'gh_document_tactic_suggestions';

   -- Check indexes
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'gh_document_tactic_suggestions';
   ```

### Option 2: PostgreSQL Client (Alternative)

If you have direct database access:

```bash
psql "postgresql://postgres.hpyodaugrkctagkrfofj:[PASSWORD]@db.hpyodaugrkctagkrfofj.supabase.co:5432/postgres" \
  -f supabase/migrations/20251121000001_create_gh_document_tactic_suggestions_FINAL.sql
```

**Note**: Replace `[PASSWORD]` with the actual database password (not the service role key).

## Migration Contents

The corrected migration creates:

### Table: `gh_document_tactic_suggestions`
**Purpose**: Store AI-powered document-to-tactic suggestions for admin review

**Columns**:
- `id` - BIGSERIAL PRIMARY KEY
- `document_id` - INTEGER (FK to gh_documents)
- `tactic_id` - TEXT
- `tactic_name` - TEXT
- `confidence` - INTEGER (0-100)
- `suggested_link_type` - TEXT ('required', 'recommended', 'supplemental')
- `match_reasons` - TEXT (explanation of why this match was suggested)
- `created_at` - TIMESTAMPTZ

**Indexes**:
- `idx_document_tactic_suggestions_doc_id` - For document lookups
- `idx_document_tactic_suggestions_confidence` - For sorting by confidence (DESC)
- `idx_document_tactic_suggestions_tactic_id` - For tactic lookups

**RLS Policies** (Admin-only access):
- SELECT: Admins can view all suggestions
- INSERT: Admins can insert suggestions (for CSV import)
- UPDATE: Admins can update suggestions
- DELETE: Admins can delete suggestions

**Constraints**:
- UNIQUE(document_id, tactic_id) - Prevent duplicate suggestions
- confidence CHECK (0-100)
- suggested_link_type CHECK (enum validation)

## Verification Queries

After running the migration, verify with these queries:

```sql
-- 1. Check table structure
\d gh_document_tactic_suggestions

-- 2. Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'gh_document_tactic_suggestions';

-- 3. List all RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'gh_document_tactic_suggestions';

-- 4. Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'gh_document_tactic_suggestions'
ORDER BY indexname;

-- 5. Verify is_admin() function exists
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';
```

## Existing Pattern References

The corrected migration follows the same pattern used in these existing migrations:

1. **20251119150000_create_admin_schema.sql**
   - Defines `is_admin()` function
   - Uses it in RLS policies for `admin_users`, `admin_audit_log`, `admin_metrics_cache`

2. **DEPLOY-COMPLETE-ADMIN-SCHEMA.sql**
   - Comprehensive admin schema deployment
   - All RLS policies use `(SELECT is_admin())` pattern

3. **DEPLOY-STEP-4-rls-policies.sql**
   - RLS policy examples across multiple tables
   - Consistent `is_admin()` usage

## Summary

**What Was Wrong**:
- Migration referenced non-existent `profiles.role` column
- Didn't follow established admin authorization pattern

**How It Was Fixed**:
- Investigated actual schema using existing migrations
- Found the `is_admin()` function pattern (used in 10+ migrations)
- Replaced incorrect column checks with function calls
- Added comments explaining the pattern

**Files Created**:
- `/supabase/migrations/20251121000001_create_gh_document_tactic_suggestions_FINAL.sql` (corrected migration)
- `/MIGRATION-FIX-SUMMARY.md` (this document)

**Next Steps**:
1. Execute the corrected migration via Supabase Dashboard
2. Verify with the provided queries
3. Delete or rename the failed migration file (20251121000000_create_gh_document_tactic_suggestions_table.sql)

**Status**: ✅ Ready to execute
