# Document Management System - Migration Deployment Instructions

## Overview
This guide provides instructions for deploying the 4 database migrations for the Document Management System to Supabase.

## Database Details
- **Project URL**: `https://hpyodaugrkctagkrfofj.supabase.co`
- **Database**: `hpyodaugrkctagkrfofj`
- **Migration Files**: 4 files in `supabase/migrations/`

## Deployment Method: Supabase Dashboard SQL Editor

Since direct psql connection is having authentication issues, use the Supabase Dashboard SQL Editor:

### Step 1: Access SQL Editor
1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new
2. Log in with your Supabase account

### Step 2: Execute Migrations (In Order)

#### Migration 1: gh_documents Table
1. Open file: `supabase/migrations/20251120120000_create_gh_documents_table.sql`
2. Copy entire contents (94 lines)
3. Paste into SQL Editor
4. Click "Run" button
5. Verify success message

#### Migration 2: gh_document_tactic_links Table
1. Open file: `supabase/migrations/20251120120001_create_gh_document_tactic_links_table.sql`
2. Copy entire contents (44 lines)
3. Paste into SQL Editor
4. Click "Run" button
5. Verify success message

#### Migration 3: gh_user_document_activity Table
1. Open file: `supabase/migrations/20251120120002_create_gh_user_document_activity_table.sql`
2. Copy entire contents (80 lines)
3. Paste into SQL Editor
4. Click "Run" button
5. Verify success message

#### Migration 4: gh_training_chunks Enhancements
1. Open file: `supabase/migrations/20251120120003_enhance_gh_training_chunks_table.sql`
2. Copy entire contents (69 lines)
3. Paste into SQL Editor
4. Click "Run" button
5. Verify success message

### Step 3: Verify Deployment

Run this verification query in SQL Editor:

\`\`\`sql
-- Verify tables exist
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size('public.' || table_name)) AS table_size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'gh_documents',
    'gh_document_tactic_links',
    'gh_user_document_activity'
  )
ORDER BY table_name;

-- Verify gh_training_chunks new columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gh_training_chunks'
  AND column_name IN ('document_id', 'ownership_model', 'applicable_populations', 'difficulty')
ORDER BY column_name;

-- Verify RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('gh_documents', 'gh_document_tactic_links', 'gh_user_document_activity')
ORDER BY tablename, policyname;

-- Verify triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('gh_documents', 'gh_document_tactic_links', 'gh_user_document_activity', 'gh_training_chunks')
ORDER BY event_object_table, trigger_name;

-- Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename = 'gh_documents'
    OR tablename = 'gh_document_tactic_links'
    OR tablename = 'gh_user_document_activity'
    OR tablename = 'gh_training_chunks'
  )
  AND (
    indexname LIKE 'idx_documents%'
    OR indexname LIKE 'idx_doc_tactic%'
    OR indexname LIKE 'idx_user_doc%'
    OR indexname LIKE 'idx_training_chunks%'
  )
ORDER BY tablename, indexname;
\`\`\`

### Expected Results

**Tables Created:**
- `gh_documents` (17 columns)
- `gh_document_tactic_links` (6 columns)
- `gh_user_document_activity` (6 columns)
- `gh_training_chunks` (4 new columns added)

**Indexes Created:**
- 5 indexes on `gh_documents` (category, states, ownership, populations, search)
- 4 indexes on `gh_document_tactic_links` (tactic, doc, type, order)
- 5 indexes on `gh_user_document_activity` (user, doc, type, tactic, referrer)
- 4 indexes on `gh_training_chunks` (document, ownership, populations, difficulty)

**RLS Policies:**
- `gh_documents`: 4 policies (SELECT, INSERT, UPDATE, DELETE)
- `gh_document_tactic_links`: 2 policies (SELECT, ALL)
- `gh_user_document_activity`: 3 policies (SELECT own, INSERT own, SELECT all for admins)

**Triggers:**
- `set_gh_documents_updated_at` (auto-update timestamp)
- `update_document_counts_on_activity` (view/download counters)
- `sync_chunk_metadata_on_document_link` (metadata sync)
- `propagate_metadata_to_chunks_on_document_update` (metadata propagation)

## Alternative: Use Combined Migration File

If you prefer to run all migrations at once:

1. Open file: `scripts/deploy-document-migrations.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" button
5. Check output for success messages

## Troubleshooting

### Issue: Table already exists
**Solution**: Skip to next migration or use `DROP TABLE IF EXISTS` first (not recommended for production)

### Issue: RLS policy already exists
**Solution**: This is normal if re-running migrations. The `DO $$` blocks handle this gracefully.

### Issue: Foreign key constraint fails
**Solution**: Ensure migrations run in order:
1. gh_documents (referenced by others)
2. gh_document_tactic_links (references gh_documents + gh_tactic_instructions)
3. gh_user_document_activity (references gh_documents)
4. gh_training_chunks enhancements (references gh_documents)

### Issue: admin_users table not found
**Solution**: Verify `admin_users` table exists from previous analytics migration. If not, create it first or modify RLS policies to use a different admin check.

## Next Steps After Deployment

1. **Verify Storage Bucket**:
   - Check bucket `training-materials` exists in Supabase Storage
   - Verify RLS policies applied

2. **Upload Documents**:
   - Upload 38 PDF files to `training-materials` bucket
   - Organize into category folders

3. **Seed Document Metadata**:
   - Insert records into `gh_documents` table
   - Link documents to tactics in `gh_document_tactic_links`

4. **Test Access**:
   - Test document viewing as authenticated user
   - Test document upload as admin user
   - Test activity tracking

## Migration Rollback (Emergency Only)

If you need to rollback migrations:

\`\`\`sql
-- Drop in reverse order to avoid foreign key issues
DROP TRIGGER IF EXISTS propagate_metadata_to_chunks_on_document_update ON gh_documents;
DROP TRIGGER IF EXISTS sync_chunk_metadata_on_document_link ON gh_training_chunks;
DROP FUNCTION IF EXISTS propagate_document_metadata_to_chunks();
DROP FUNCTION IF EXISTS sync_chunk_metadata_from_document();

ALTER TABLE gh_training_chunks
DROP COLUMN IF EXISTS document_id,
DROP COLUMN IF EXISTS ownership_model,
DROP COLUMN IF EXISTS applicable_populations,
DROP COLUMN IF EXISTS difficulty;

DROP TABLE IF EXISTS gh_user_document_activity CASCADE;
DROP TABLE IF EXISTS gh_document_tactic_links CASCADE;
DROP TABLE IF EXISTS gh_documents CASCADE;

DROP FUNCTION IF EXISTS update_document_activity_counts();
DROP FUNCTION IF EXISTS update_gh_documents_updated_at();
\`\`\`

## Success Criteria

✅ All 3 tables created with proper schemas
✅ All indexes created (18 total)
✅ All RLS policies active (9 total)
✅ All triggers functioning (4 total)
✅ Foreign key relationships established
✅ Verification queries return expected results
✅ No errors in Supabase logs

---

**Migration Version**: Phase 1 - Document Management System
**Created**: 2024-11-20
**Last Updated**: 2024-11-20
**Related**: CLAUDE.md, DOCUMENT-DELIVERY-SYSTEM-SPEC.md
