# RLS Policy Fix - Deployment Guide

## Problem

Document linking is failing with RLS policy violation:
```
Failed to create link: new row violates row-level security policy for table "gh_document_tactic_links"
```

## Root Cause

The RLS policies were checking the WRONG column in the `admin_users` table:

**BROKEN (before):**
```sql
WHERE admin_users.id = auth.uid()  -- ❌ 'id' is the primary key (auto-generated UUID)
```

**FIXED (after):**
```sql
WHERE admin_users.user_id = auth.uid()  -- ✅ 'user_id' is the FK to auth.users(id)
```

### Table Structure
```
admin_users:
  - id (UUID PRIMARY KEY)           ← Auto-generated, NOT the user's auth ID
  - user_id (UUID → auth.users.id)  ← The actual user's authentication ID
  - role (TEXT)
  - permissions (JSONB)
```

## Solution

The migration file `/supabase/migrations/20251121000001_fix_document_rls_policies.sql` fixes:

1. **gh_documents** - INSERT, UPDATE, DELETE policies
2. **gh_document_tactic_links** - INSERT, UPDATE, DELETE policies

## Deployment Steps

### Option 1: Supabase Dashboard (RECOMMENDED)

1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/editor
2. Log in as the project owner
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy and paste the contents of:
   `/supabase/migrations/20251121000001_fix_document_rls_policies.sql`
6. Click **Run**
7. Verify success (should see "Success. No rows returned")

### Option 2: Supabase CLI

```bash
cd "/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy"

# Apply the migration
supabase db push
```

## Verification

After applying the migration, run these queries in the Supabase SQL Editor:

### 1. Verify you're recognized as an admin
```sql
SELECT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = auth.uid()
) as am_i_admin;
```
**Expected:** `am_i_admin = true` (if you're logged in as kes@purposewaze.com)

### 2. Check active policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('gh_documents', 'gh_document_tactic_links')
ORDER BY tablename, policyname;
```
**Expected:** Should see policies with `admin_users.user_id = auth.uid()` in the `qual` column

### 3. Test document link creation
```sql
-- Get a valid document ID and tactic ID first
SELECT id FROM gh_documents LIMIT 1;
SELECT tactic_id FROM gh_tactic_instructions LIMIT 1;

-- Then try to insert a link (replace with actual IDs)
INSERT INTO gh_document_tactic_links (document_id, tactic_id, link_type, display_order)
VALUES (1, 'tactic-1', 'recommended', 0)
RETURNING *;
```
**Expected:** Should succeed without RLS policy error

## Affected Tables

| Table | Before (Broken) | After (Fixed) |
|-------|----------------|---------------|
| `gh_documents` | `admin_users.id = auth.uid()` | `admin_users.user_id = auth.uid()` |
| `gh_document_tactic_links` | `admin_users.id = auth.uid()` | `admin_users.user_id = auth.uid()` |

## Impact

- **Documents:** Admin CRUD operations now work correctly
- **Document-Tactic Links:** AI suggestions feature can now create links
- **User Activity:** No impact (different table)

## Rollback (if needed)

If something goes wrong, run this to revert:

```sql
-- This will restore the broken policies (not recommended, but available)
DROP POLICY IF EXISTS "Admins can insert documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can insert links" ON gh_document_tactic_links;
DROP POLICY IF EXISTS "Admins can update links" ON gh_document_tactic_links;
DROP POLICY IF EXISTS "Admins can delete links" ON gh_document_tactic_links;

-- Then re-run the original migrations:
-- 20251120120000_create_gh_documents_table.sql
-- 20251120120001_create_gh_document_tactic_links_table.sql
```

## Related Files

- **Migration:** `/supabase/migrations/20251121000001_fix_document_rls_policies.sql`
- **Original (broken) migrations:**
  - `/supabase/migrations/20251120120000_create_gh_documents_table.sql`
  - `/supabase/migrations/20251120120001_create_gh_document_tactic_links_table.sql`
- **Service using these:** `/src/services/documentService.ts`

## Status

- **Created:** 2025-11-21
- **Status:** Ready to deploy
- **Priority:** CRITICAL (blocks AI suggestions feature)
- **Risk:** LOW (only fixes broken policies, doesn't change data)
