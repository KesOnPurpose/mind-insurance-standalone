# Quick Migration Execution Guide

## TL;DR - Execute the Corrected Migration

### Step 1: Copy the SQL

```bash
# Copy the corrected migration file contents
cat supabase/migrations/20251121000001_create_gh_document_tactic_suggestions_FINAL.sql
```

### Step 2: Execute in Supabase Dashboard

1. Go to: **[Supabase SQL Editor](https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new)**

2. Paste the SQL from the file above

3. Click **"Run"**

4. You should see: `Success. No rows returned`

### Step 3: Verify

Run this query in the SQL Editor:

```sql
-- Check table exists and has correct structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gh_document_tactic_suggestions'
ORDER BY ordinal_position;
```

Expected result: **8 columns** (id, document_id, tactic_id, tactic_name, confidence, suggested_link_type, match_reasons, created_at)

```sql
-- Verify RLS policies exist
SELECT
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'gh_document_tactic_suggestions';
```

Expected result: **4 policies** (SELECT, INSERT, UPDATE, DELETE)

```sql
-- Verify indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'gh_document_tactic_suggestions';
```

Expected result: **4 indexes** (1 primary key + 3 performance indexes)

---

## What Was Fixed?

**Original Error:**
```
ERROR: 42703: column user_profiles.role does not exist
```

**Root Cause:**
Migration tried to check `profiles.role = 'admin'` but this column doesn't exist.

**Solution:**
Use the existing `is_admin()` function that checks the `admin_users` table (the correct way this codebase handles admin authorization).

---

## Changed Lines (At a Glance)

### Before (Broken)
```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'  -- ❌ Column doesn't exist
  )
);
```

### After (Fixed)
```sql
USING ((SELECT is_admin()));  -- ✅ Uses established pattern
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20251121000001_create_gh_document_tactic_suggestions_FINAL.sql` | **Execute this** - Corrected migration |
| `MIGRATION-FIX-SUMMARY.md` | Detailed explanation of what went wrong and how to fix it |
| `MIGRATION-BEFORE-AFTER-COMPARISON.md` | Side-by-side comparison of before/after code |
| `QUICK-MIGRATION-GUIDE.md` | This file - Quick reference for execution |

---

## Troubleshooting

### If you get "table already exists" error:

The failed migration may have partially created the table. Drop it first:

```sql
DROP TABLE IF EXISTS gh_document_tactic_suggestions CASCADE;
```

Then re-run the corrected migration.

### If you get "function is_admin() does not exist" error:

The `is_admin()` function should exist (created in earlier migrations). Verify:

```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';
```

If it doesn't exist, you need to run the admin schema migration first:
```bash
supabase/migrations/20251119150000_create_admin_schema.sql
```

### If you get RLS policy conflicts:

Drop existing policies first:

```sql
DROP POLICY IF EXISTS "Admins can view all suggestions" ON gh_document_tactic_suggestions;
DROP POLICY IF EXISTS "Admins can insert suggestions" ON gh_document_tactic_suggestions;
DROP POLICY IF EXISTS "Admins can update suggestions" ON gh_document_tactic_suggestions;
DROP POLICY IF EXISTS "Admins can delete suggestions" ON gh_document_tactic_suggestions;
```

Then re-run the migration.

---

## Full Migration SQL (Copy-Paste Ready)

```sql
-- Create table for AI-powered document-to-tactic suggestions
-- This stores the AI-generated match scores from review-queue.csv

CREATE TABLE IF NOT EXISTS gh_document_tactic_suggestions (
  id BIGSERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES gh_documents(id) ON DELETE CASCADE,
  tactic_id TEXT NOT NULL,
  tactic_name TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  suggested_link_type TEXT NOT NULL CHECK (suggested_link_type IN ('required', 'recommended', 'supplemental')),
  match_reasons TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique suggestions per document-tactic pair
  UNIQUE(document_id, tactic_id)
);

-- Add indexes for performance
CREATE INDEX idx_document_tactic_suggestions_doc_id ON gh_document_tactic_suggestions(document_id);
CREATE INDEX idx_document_tactic_suggestions_confidence ON gh_document_tactic_suggestions(confidence DESC);
CREATE INDEX idx_document_tactic_suggestions_tactic_id ON gh_document_tactic_suggestions(tactic_id);

-- Add RLS policies
ALTER TABLE gh_document_tactic_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can read all suggestions
-- Uses the is_admin() function which checks admin_users table
CREATE POLICY "Admins can view all suggestions"
  ON gh_document_tactic_suggestions
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin()));

-- Admins can insert suggestions (for CSV import)
CREATE POLICY "Admins can insert suggestions"
  ON gh_document_tactic_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT is_admin()));

-- Admins can update suggestions
CREATE POLICY "Admins can update suggestions"
  ON gh_document_tactic_suggestions
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin()));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
  ON gh_document_tactic_suggestions
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin()));

-- Add helpful comment
COMMENT ON TABLE gh_document_tactic_suggestions IS 'AI-generated suggestions for linking documents to tactics, based on content analysis and matching algorithms. Confidence scores range from 40-100%.';
```

---

## Success Confirmation

After running the migration, you should be able to:

1. **Insert a test suggestion** (as an admin):
```sql
INSERT INTO gh_document_tactic_suggestions
  (document_id, tactic_id, tactic_name, confidence, suggested_link_type, match_reasons)
VALUES
  (1, 'test-tactic', 'Test Tactic', 85, 'recommended', 'Test reason');
```

2. **Query suggestions**:
```sql
SELECT * FROM gh_document_tactic_suggestions WHERE confidence >= 80;
```

3. **Delete test data**:
```sql
DELETE FROM gh_document_tactic_suggestions WHERE tactic_id = 'test-tactic';
```

If all 3 operations work without errors, the migration is successful!

---

## Next Steps After Migration

1. Import AI suggestions from CSV
2. Build admin UI to review/approve suggestions
3. Implement approval workflow (suggestion → approved link)
4. Add audit logging for suggestion approvals

---

## Questions?

- **What table stores admin users?** `public.admin_users`
- **How do I check if I'm an admin?** `SELECT is_admin();`
- **Can regular users see suggestions?** No, RLS policies restrict to admins only
- **Can I test without being an admin?** Yes, use `SECURITY INVOKER` or `set local role` in test environment

For detailed technical explanation, see `MIGRATION-FIX-SUMMARY.md`
