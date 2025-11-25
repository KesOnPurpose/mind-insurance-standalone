# RLS Policy Fix - Technical Summary

## Error Message
```
Failed to create link: new row violates row-level security policy for table "gh_document_tactic_links"
```

## Root Cause Analysis

The RLS policies were checking the WRONG UUID column in the `admin_users` table.

### The admin_users Table Schema
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),      -- ❌ Auto-generated UUID
  user_id UUID REFERENCES auth.users(id),             -- ✅ The actual user's auth ID
  role TEXT,
  permissions JSONB,
  ...
);
```

### The Problem

**Broken RLS policies were doing this:**
```sql
WHERE admin_users.id = auth.uid()
      ^^^^^^^^^^^^^^  ^^^^^^^^^^^^^
      Auto-generated  User's auth ID
      random UUID     from session

      THESE WILL NEVER MATCH!
```

**Correct RLS policies should do this:**
```sql
WHERE admin_users.user_id = auth.uid()
      ^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^
      FK to auth.users      User's auth ID

      THESE WILL MATCH! ✅
```

## Before (BROKEN)

### gh_document_tactic_links Migration (20251120120001)
```sql
-- RLS Policy: Only admins can manage links
CREATE POLICY "Admins can manage links"
  ON gh_document_tactic_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()  -- ❌ WRONG COLUMN
    )
  );
```

### gh_documents Migration (20251120120000)
```sql
-- RLS Policy: Only admins can insert documents
CREATE POLICY "Admins can insert documents"
  ON gh_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()  -- ❌ WRONG COLUMN
    )
  );

-- Same issue for UPDATE and DELETE policies...
```

## After (FIXED)

### gh_document_tactic_links - New Migration (20251121000001)
```sql
-- Create corrected policies with granular permissions
CREATE POLICY "Admins can insert links"
  ON gh_document_tactic_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT COLUMN
    )
  );

CREATE POLICY "Admins can update links"
  ON gh_document_tactic_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT COLUMN
    )
  );

CREATE POLICY "Admins can delete links"
  ON gh_document_tactic_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT COLUMN
    )
  );
```

### gh_documents - New Migration (20251121000001)
```sql
-- All INSERT, UPDATE, DELETE policies now use:
WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT COLUMN
```

## Why This Happened

Looking at the original migrations, they followed the same pattern as the `is_admin()` function, which correctly uses `user_id`:

```sql
-- This was CORRECT (from 20251119150000_create_admin_schema.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()  -- ✅ Uses user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**However**, the document table RLS policies mistakenly used `id` instead of `user_id`.

## The Fix

**File:** `/supabase/migrations/20251121000001_fix_document_rls_policies.sql`

**What it does:**
1. Drops the broken policies on both tables
2. Recreates them with the correct `user_id` column
3. Splits the `FOR ALL` policy into separate INSERT/UPDATE/DELETE for better granularity

## Impact Assessment

### Tables Affected
- ✅ `gh_documents` - Now admins can INSERT/UPDATE/DELETE
- ✅ `gh_document_tactic_links` - Now admins can INSERT/UPDATE/DELETE

### Features Unblocked
- ✅ AI-generated document-tactic suggestions
- ✅ Manual document linking in admin UI
- ✅ CSV import for document links
- ✅ Document CRUD operations

### Tables NOT Affected
- `gh_user_document_activity` - Different RLS policies
- `gh_document_tactic_suggestions` - Uses correct `is_admin()` function
- All other tables

## Verification Commands

### 1. Check if you're an admin
```sql
SELECT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = auth.uid()
) as am_i_admin;
```

### 2. View all active RLS policies
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('gh_documents', 'gh_document_tactic_links')
ORDER BY tablename, policyname;
```

### 3. Test creating a document link
```sql
INSERT INTO gh_document_tactic_links (
  document_id,
  tactic_id,
  link_type,
  display_order
)
VALUES (1, 'test-tactic', 'recommended', 0)
RETURNING *;
```

## Deployment

**Where to run:**
- **Supabase Dashboard:** https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/editor
- **SQL Editor:** Copy/paste the migration file contents
- **Or use CLI:** `supabase db push`

**Full instructions:** See `FIX-RLS-DEPLOYMENT.md`

## Related Code

### TypeScript Service (No Changes Needed)
The `documentService.ts` was already using the Supabase client correctly:

```typescript
export const createTacticLink = async (
  documentId: number,
  tacticId: string,
  linkType: TacticLinkType,
  displayOrder: number | null,
  adminId: string
): Promise<GHDocumentTacticLink> => {
  try {
    const { data, error } = await supabase
      .from('gh_document_tactic_links')
      .insert([{ document_id: documentId, tactic_id: tacticId, ... }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating tactic link:', error);
    throw error;
  }
};
```

The service was fine - it was the database RLS policies that were broken.

## Conclusion

**What was wrong:** RLS policies checked `admin_users.id` (auto-generated UUID) instead of `admin_users.user_id` (auth ID)

**How to fix:** Run migration `20251121000001_fix_document_rls_policies.sql`

**Risk level:** LOW (only fixes policies, no data changes)

**Priority:** CRITICAL (blocks document management features)

**Status:** Ready to deploy
