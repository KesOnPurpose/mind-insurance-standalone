# Quick Start: Schema Migration
## 5-Minute Guide for Immediate Execution

⚠️ **STATUS**: Migration required (0/5 columns exist)
⏱️ **TIME**: 5-10 minutes
🎯 **GOAL**: Add simplified language support to database

---

## Fast Track Execution

### Step 1: Open Supabase SQL Editor (1 min)
1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Copy & Paste Migration SQL (2 min)
Open the file:
```
glossary-extraction/schema-migration.sql
```

Copy ALL content and paste into SQL Editor.

**OR** Copy from here:

<details>
<summary>📋 Click to expand migration SQL</summary>

```sql
-- Week 4 Agent 1: Database Schema Migration
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS simplified_text TEXT,
ADD COLUMN IF NOT EXISTS glossary_terms TEXT[],
ADD COLUMN IF NOT EXISTS reading_level_before NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS reading_level_after NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS language_variant VARCHAR(20) DEFAULT 'clinical';

COMMENT ON COLUMN mio_knowledge_chunks.simplified_text IS 'User-friendly version with glossary tooltips (format: {{term||definition}})';
COMMENT ON COLUMN mio_knowledge_chunks.glossary_terms IS 'Array of technical terms used in this protocol';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_before IS 'Original Flesch-Kincaid grade level (before simplification)';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_after IS 'Post-simplification Flesch-Kincaid grade level';
COMMENT ON COLUMN mio_knowledge_chunks.language_variant IS 'Language variant: clinical (original) or simplified';

CREATE INDEX IF NOT EXISTS idx_language_variant ON mio_knowledge_chunks(language_variant);
CREATE INDEX IF NOT EXISTS idx_glossary_terms ON mio_knowledge_chunks USING GIN(glossary_terms);
CREATE INDEX IF NOT EXISTS idx_reading_level_after ON mio_knowledge_chunks(reading_level_after);
CREATE INDEX IF NOT EXISTS idx_reading_level_before ON mio_knowledge_chunks(reading_level_before);

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

### Step 3: Execute (1 min)
1. Click **Run** button (or Cmd+Enter / Ctrl+Enter)
2. Wait for completion (<5 seconds)

### Step 4: Verify Success (1 min)
Check Results panel shows:
- ✅ First result: 5 rows (columns)
- ✅ Second result: 4 rows (indexes)
- ✅ No error messages

### Step 5: Confirm with Script (Optional)
```bash
cd /Users/kesonpurpose/Downloads/UIB\ ASSETS/Cursor\ App\ Build/Grouphome\ App\ LOVABLE/mindhouse-prodigy
python3 verify-schema.py
```

Should show: **✅ SCHEMA MIGRATION COMPLETE**

---

## Expected Results

### ✅ SUCCESS looks like:

**In Supabase SQL Editor Results panel**:
```
Query 1: 5 rows
  - glossary_terms (ARRAY)
  - language_variant (character varying)
  - reading_level_after (numeric)
  - reading_level_before (numeric)
  - simplified_text (text)

Query 2: 4 rows
  - idx_glossary_terms
  - idx_language_variant
  - idx_reading_level_after
  - idx_reading_level_before
```

**In Terminal** (if you run verify-schema.py):
```
✅ SCHEMA MIGRATION COMPLETE

All required schema changes have been applied successfully.
```

---

## ❌ Troubleshooting

### Problem: "Permission denied"
→ Ensure you're logged in as admin/owner

### Problem: "Already exists"
→ That's OK! Re-run will skip existing items

### Problem: Takes longer than 5 seconds
→ Normal for large tables. Wait for completion.

---

## What This Migration Does

Adds 5 new columns to `mio_knowledge_chunks` table:
1. **simplified_text** - User-friendly version of clinical language
2. **glossary_terms** - List of technical terms in this chunk
3. **reading_level_before** - Original complexity score
4. **reading_level_after** - Simplified complexity score
5. **language_variant** - Type: 'clinical' or 'simplified'

Plus 4 performance indexes for fast queries.

---

## Safety

✅ Uses `IF NOT EXISTS` - safe to run multiple times
✅ No data deleted or modified
✅ No existing features affected
✅ Backward compatible with all existing code
✅ Can be rolled back if needed (see full report)

---

## After Migration

Proceed to Week 4 Agent pipeline:
1. **Agent 2**: Generate glossary from protocols
2. **Agent 3**: Create simplified language with tooltips
3. **Agent 4**: Calculate reading level scores

---

## Need More Details?

📖 **User-Friendly Guide**: `MANUAL-MIGRATION-GUIDE.md`
📊 **Technical Report**: `SCHEMA-MIGRATION-EXECUTION-REPORT.md`
📋 **Summary**: `WEEK-4-AGENT-1-SUMMARY.md`
🔍 **Verification**: `verify-schema.sql` or `verify-schema.py`

---

**Database**: hpyodaugrkctagkrfofj.supabase.co
**Table**: mio_knowledge_chunks
**Migration File**: glossary-extraction/schema-migration.sql

---

**Last Updated**: 2025-11-22
**Ready to execute? Follow steps above! ⬆️**
