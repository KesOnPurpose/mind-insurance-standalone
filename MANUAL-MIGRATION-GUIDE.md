# Manual Schema Migration Guide
## Step-by-Step Instructions for Supabase SQL Editor

**Target**: Add simplified language support to `mio_knowledge_chunks` table
**Time Required**: 5-10 minutes
**Risk Level**: LOW (all changes are additive, uses IF NOT EXISTS)

---

## Prerequisites

- [ ] Access to Supabase Dashboard (https://supabase.com/dashboard)
- [ ] Admin/Owner permissions on project `hpyodaugrkctagkrfofj`
- [ ] Migration file: `glossary-extraction/schema-migration.sql`

---

## Step 1: Access Supabase SQL Editor

### 1.1 Open Supabase Dashboard
Navigate to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj

### 1.2 Open SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New Query** button (top right)
3. You should see an empty SQL editor window

---

## Step 2: Prepare Migration SQL

### 2.1 Locate Migration File
Open the file on your local machine:
```
/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/glossary-extraction/schema-migration.sql
```

### 2.2 Copy Migration SQL
1. Open the file in your text editor
2. Select all content (Cmd+A on Mac, Ctrl+A on Windows)
3. Copy to clipboard (Cmd+C on Mac, Ctrl+C on Windows)

**Alternatively**: Use the SQL content from the box below:

<details>
<summary>Click to expand migration SQL</summary>

```sql
-- ============================================================================
-- Week 4 Agent 1: Database Schema Migration
-- ============================================================================
-- Mission: Add simplified language support columns to mio_knowledge_chunks
-- Execute this SQL in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add new columns for simplified language variant
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS simplified_text TEXT,
ADD COLUMN IF NOT EXISTS glossary_terms TEXT[],
ADD COLUMN IF NOT EXISTS reading_level_before NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS reading_level_after NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS language_variant VARCHAR(20) DEFAULT 'clinical';

-- Step 2: Add column comments for documentation
COMMENT ON COLUMN mio_knowledge_chunks.simplified_text IS 'User-friendly version with glossary tooltips (format: {{term||definition}})';
COMMENT ON COLUMN mio_knowledge_chunks.glossary_terms IS 'Array of technical terms used in this protocol';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_before IS 'Original Flesch-Kincaid grade level (before simplification)';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_after IS 'Post-simplification Flesch-Kincaid grade level';
COMMENT ON COLUMN mio_knowledge_chunks.language_variant IS 'Language variant: clinical (original) or simplified';

-- Step 3: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_language_variant ON mio_knowledge_chunks(language_variant);
CREATE INDEX IF NOT EXISTS idx_glossary_terms ON mio_knowledge_chunks USING GIN(glossary_terms);
CREATE INDEX IF NOT EXISTS idx_reading_level_after ON mio_knowledge_chunks(reading_level_after);
CREATE INDEX IF NOT EXISTS idx_reading_level_before ON mio_knowledge_chunks(reading_level_before);

-- Step 4: Verify schema changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks'
  AND column_name IN (
    'simplified_text',
    'glossary_terms',
    'reading_level_before',
    'reading_level_after',
    'language_variant'
  )
ORDER BY column_name;

-- Step 5: Verify indexes created
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks'
  AND indexname IN (
    'idx_language_variant',
    'idx_glossary_terms',
    'idx_reading_level_after',
    'idx_reading_level_before'
  )
ORDER BY indexname;
```

</details>

---

## Step 3: Execute Migration

### 3.1 Paste SQL into Editor
1. Click in the SQL Editor window
2. Paste the migration SQL (Cmd+V on Mac, Ctrl+V on Windows)
3. Review the SQL to ensure it pasted correctly

### 3.2 Run Migration
1. Click the **Run** button (or press Cmd+Enter on Mac, Ctrl+Enter on Windows)
2. Wait for execution to complete (should take <5 seconds)
3. Check the **Results** panel at the bottom

### 3.3 Expected Output
You should see TWO result sets in the Results panel:

**Result Set 1: Column Verification (5 rows)**
| column_name | data_type | is_nullable | column_default |
|-------------|-----------|-------------|----------------|
| glossary_terms | ARRAY | YES | NULL |
| language_variant | character varying | YES | 'clinical'::character varying |
| reading_level_after | numeric | YES | NULL |
| reading_level_before | numeric | YES | NULL |
| simplified_text | text | YES | NULL |

**Result Set 2: Index Verification (4 rows)**
| indexname | indexdef |
|-----------|----------|
| idx_glossary_terms | CREATE INDEX idx_glossary_terms... |
| idx_language_variant | CREATE INDEX idx_language_variant... |
| idx_reading_level_after | CREATE INDEX idx_reading_level_after... |
| idx_reading_level_before | CREATE INDEX idx_reading_level_before... |

### 3.4 Success Indicators
✅ No error messages in the Results panel
✅ Query shows "5 rows" for column verification
✅ Query shows "4 rows" for index verification
✅ All column names appear in alphabetical order

---

## Step 4: Verify Migration Success

### 4.1 Option A: Run Python Verification Script (Recommended)

Open your terminal and run:

```bash
cd /Users/kesonpurpose/Downloads/UIB\ ASSETS/Cursor\ App\ Build/Grouphome\ App\ LOVABLE/mindhouse-prodigy
python3 verify-schema.py
```

**Expected Output**:
```
✅ SCHEMA MIGRATION COMPLETE

All required schema changes have been applied successfully.

Next Steps:
  1. Week 4 Agent 2: Generate glossary from clinical protocols
  2. Week 4 Agent 3: Process simplified language with tooltips
  3. Week 4 Agent 4: Calculate reading levels (before/after)
```

### 4.2 Option B: Manual SQL Verification

Run this query in Supabase SQL Editor:

```sql
-- Migration Completeness Check
WITH column_check AS (
    SELECT COUNT(*) as column_count
    FROM information_schema.columns
    WHERE table_name = 'mio_knowledge_chunks'
      AND column_name IN (
        'simplified_text',
        'glossary_terms',
        'reading_level_before',
        'reading_level_after',
        'language_variant'
      )
),
index_check AS (
    SELECT COUNT(*) as index_count
    FROM pg_indexes
    WHERE tablename = 'mio_knowledge_chunks'
      AND indexname IN (
        'idx_language_variant',
        'idx_glossary_terms',
        'idx_reading_level_after',
        'idx_reading_level_before'
      )
)
SELECT
    c.column_count,
    i.index_count,
    CASE
        WHEN c.column_count = 5 AND i.index_count = 4 THEN 'COMPLETE ✅'
        WHEN c.column_count > 0 OR i.index_count > 0 THEN 'PARTIAL ⚠️'
        ELSE 'NOT STARTED ❌'
    END as migration_status,
    CASE
        WHEN c.column_count = 5 AND i.index_count = 4 THEN 'Ready for Week 4 Agents 2-4'
        WHEN c.column_count > 0 OR i.index_count > 0 THEN 'Re-run migration to complete'
        ELSE 'Execute schema-migration.sql first'
    END as next_step
FROM column_check c, index_check i;
```

**Expected Result**:
| column_count | index_count | migration_status | next_step |
|--------------|-------------|------------------|-----------|
| 5 | 4 | COMPLETE ✅ | Ready for Week 4 Agents 2-4 |

---

## Step 5: Update Migration Report

### 5.1 Open Report File
Open: `SCHEMA-MIGRATION-EXECUTION-REPORT.md`

### 5.2 Update Status
Change the status line at the top from:
```markdown
**Status**: ⚠️ PENDING MANUAL EXECUTION
```

To:
```markdown
**Status**: ✅ COMPLETE
**Executed By**: [Your Name]
**Execution Date**: [Date/Time]
**Verification**: All 5 columns + 4 indexes confirmed
```

### 5.3 Save File
Save the updated report file.

---

## Troubleshooting

### Problem: "Permission denied" error
**Cause**: Insufficient database permissions
**Solution**:
1. Ensure you're logged into Supabase with admin/owner account
2. Check project permissions in Settings → Team
3. Use service role key authentication if needed

---

### Problem: "Column already exists" error
**Cause**: Migration was partially executed previously
**Solution**:
1. This is OK! The migration uses `IF NOT EXISTS` clauses
2. Check which columns exist using verification queries
3. Migration will skip existing columns and create missing ones

---

### Problem: Index creation takes a long time
**Cause**: Large table size (many rows)
**Solution**:
1. This is normal for tables with >100K rows
2. Wait for completion (may take 30-60 seconds)
3. Do not cancel the query

---

### Problem: Verification queries show fewer than 5 columns
**Cause**: Migration did not execute completely
**Solution**:
1. Check the Results panel for error messages
2. Copy any error messages for debugging
3. Re-run the migration SQL
4. Contact database administrator if errors persist

---

## Rollback Instructions (If Needed)

**⚠️ WARNING: Only use if you need to undo the migration**

If you need to remove the schema changes:

```sql
-- Rollback: Remove all schema changes
BEGIN;

-- Remove columns
ALTER TABLE mio_knowledge_chunks
DROP COLUMN IF EXISTS simplified_text,
DROP COLUMN IF EXISTS glossary_terms,
DROP COLUMN IF EXISTS reading_level_before,
DROP COLUMN IF EXISTS reading_level_after,
DROP COLUMN IF EXISTS language_variant;

-- Remove indexes
DROP INDEX IF EXISTS idx_language_variant;
DROP INDEX IF EXISTS idx_glossary_terms;
DROP INDEX IF EXISTS idx_reading_level_after;
DROP INDEX IF EXISTS idx_reading_level_before;

COMMIT;
```

**Note**: This will permanently delete any data in these columns. Only use if absolutely necessary.

---

## Success Checklist

After completing all steps, confirm:

- [ ] Migration SQL executed without errors
- [ ] Column verification shows 5 rows
- [ ] Index verification shows 4 rows
- [ ] Python verification script shows "COMPLETE ✅"
- [ ] Migration report updated with completion status
- [ ] No error messages in Supabase SQL Editor

---

## Next Steps After Migration

Once migration is verified complete:

### Week 4 Agent Pipeline
1. **Agent 2: Glossary Extractor**
   - File: `glossary-extraction/extract-glossary.py`
   - Purpose: Generate clinical terminology glossary from protocols

2. **Agent 3: Language Simplifier**
   - File: `glossary-extraction/simplify-language.py`
   - Purpose: Process simplified language with tooltip injection

3. **Agent 4: Reading Level Calculator**
   - File: `glossary-extraction/calculate-reading-levels.py`
   - Purpose: Calculate Flesch-Kincaid scores (before/after)

---

## Contact & Support

**Project**: Grouphome App (Mind Insurance)
**Database**: hpyodaugrkctagkrfofj.supabase.co
**Migration File**: glossary-extraction/schema-migration.sql
**Verification**: verify-schema.py

**Documentation**:
- Migration Report: `SCHEMA-MIGRATION-EXECUTION-REPORT.md`
- Verification Queries: `verify-schema.sql`
- This Guide: `MANUAL-MIGRATION-GUIDE.md`

---

**Last Updated**: 2025-11-22
**Agent**: Schema Migration Agent (Week 4, Agent 1)
