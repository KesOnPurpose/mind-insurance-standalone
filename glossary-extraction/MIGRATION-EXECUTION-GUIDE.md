# Database Migration Execution Guide
## Week 4: Add Glossary & Reading Level Columns

**Estimated Time**: 5 minutes
**Difficulty**: Easy
**Risk Level**: Low (uses IF NOT EXISTS, safe to re-run)

---

## Prerequisites

✅ Access to Supabase dashboard
✅ Project: `hpyodaugrkctagkrfofj`
✅ File: `add-glossary-columns.sql` (in this directory)

---

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your browser
2. Navigate to: [https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new](https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new)
3. You should see the SQL Editor interface

**Screenshot Location**: Should show "New Query" tab

---

### Step 2: Copy the Migration SQL

1. Open the file: `add-glossary-columns.sql` (in this directory)
2. Select all content (Cmd+A or Ctrl+A)
3. Copy to clipboard (Cmd+C or Ctrl+C)

**SQL Preview** (first few lines):
```sql
-- Week 4 Agent 2: Add glossary and readability columns to mio_knowledge_chunks
-- This migration adds columns for storing simplified text, glossary terms, and reading levels

-- Add simplified_text column (stores user-friendly version with tooltips)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS simplified_text TEXT;
...
```

---

### Step 3: Paste into SQL Editor

1. Click in the SQL Editor text area
2. Paste the copied SQL (Cmd+V or Ctrl+V)
3. Review the SQL (should be ~40 lines)

**What the SQL Does**:
- ✅ Adds 5 new columns to `mio_knowledge_chunks` table
- ✅ Creates 2 indexes for performance
- ✅ Adds column comments for documentation
- ✅ Uses `IF NOT EXISTS` (safe to re-run)

---

### Step 4: Execute the Migration

1. Click the **"Run"** button (top-right or bottom-right of editor)
2. Wait for execution (~2-5 seconds)
3. Check for success message

**Expected Output**:
```
Success. No rows returned
```
OR
```
ALTER TABLE
CREATE INDEX
COMMENT
```

**If You See an Error**: See troubleshooting section below

---

### Step 5: Verify Migration Success

**Option A: Quick Check (Recommended)**

Run this query in the same SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks'
AND column_name IN ('simplified_text', 'glossary_terms',
                     'reading_level_before', 'reading_level_after',
                     'language_variant')
ORDER BY column_name;
```

**Expected Result**: 5 rows showing:
```
column_name           | data_type        | column_default
----------------------|------------------|------------------
glossary_terms        | jsonb            | '{}'::jsonb
language_variant      | character varying| 'clinical'::character varying
reading_level_after   | double precision | NULL
reading_level_before  | double precision | NULL
simplified_text       | text             | NULL
```

**Option B: Full Table Schema Check**

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks'
ORDER BY ordinal_position;
```

**Expected**: Should see all existing columns PLUS the 5 new ones

---

### Step 6: Verify Indexes Created

Run this query:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks'
AND indexname IN ('idx_mio_chunks_language_variant', 'idx_mio_chunks_glossary_terms');
```

**Expected Result**: 2 rows showing the new indexes

---

### Step 7: Resume Week 4 Execution

**Once migration is verified**, return to terminal and run:

```bash
cd /Users/kesonpurpose/Downloads/UIB\ ASSETS/Cursor\ App\ Build/Grouphome\ App\ LOVABLE/mindhouse-prodigy/glossary-extraction

python3 execute-week-4-agent-2.py
```

**What This Will Do**:
1. Check for new columns (should pass now)
2. Load 40-term glossary
3. Process all 205 protocols in batches
4. Inject tooltips and calculate reading levels
5. Update database
6. Generate execution log

**Estimated Runtime**: 15 minutes

---

## Troubleshooting

### Error: "permission denied for table mio_knowledge_chunks"

**Cause**: Insufficient database permissions

**Solution**:
1. Check you're logged in with the correct Supabase account
2. Verify you have admin/owner access to the project
3. Try using Service Role Key (not recommended for production)

---

### Error: "relation mio_knowledge_chunks does not exist"

**Cause**: Table name typo or wrong database

**Solution**:
1. Verify you're in project `hpyodaugrkctagkrfofj`
2. Check table exists:
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```
3. Look for `mio_knowledge_chunks` in results

---

### Error: "column X already exists"

**Cause**: Migration was partially run before

**Solution**:
- This is SAFE (SQL uses `IF NOT EXISTS`)
- The migration will skip existing columns
- Proceed with verification steps

---

### No Error, But Verification Fails

**Cause**: Query might be checking wrong schema

**Solution**:
1. Check current schema:
   ```sql
   SELECT current_schema();
   ```
2. Should return `public`
3. If different, prefix table name:
   ```sql
   SELECT * FROM public.mio_knowledge_chunks LIMIT 1;
   ```

---

### Migration Runs But Columns Still Missing

**Cause**: Transaction not committed (rare)

**Solution**:
1. Check for uncommitted transactions:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
   ```
2. If found, commit or rollback
3. Re-run migration

---

## Rollback (If Needed)

**⚠️ Only use if you need to undo the migration**

```sql
-- Remove columns (THIS WILL DELETE DATA if columns have data)
ALTER TABLE mio_knowledge_chunks DROP COLUMN IF EXISTS simplified_text;
ALTER TABLE mio_knowledge_chunks DROP COLUMN IF EXISTS glossary_terms;
ALTER TABLE mio_knowledge_chunks DROP COLUMN IF EXISTS reading_level_before;
ALTER TABLE mio_knowledge_chunks DROP COLUMN IF EXISTS reading_level_after;
ALTER TABLE mio_knowledge_chunks DROP COLUMN IF EXISTS language_variant;

-- Remove indexes
DROP INDEX IF EXISTS idx_mio_chunks_language_variant;
DROP INDEX IF EXISTS idx_mio_chunks_glossary_terms;
```

**⚠️ WARNING**: This will delete all simplified text data if already populated

---

## Migration Safety

### Why This Migration is Safe

✅ **Uses `IF NOT EXISTS`**: Won't fail if columns already exist
✅ **No data modification**: Only adds columns, doesn't change existing data
✅ **No data deletion**: Doesn't drop any columns or tables
✅ **Default values**: New columns have safe defaults (NULL, '{}', 'clinical')
✅ **Re-runnable**: Can be executed multiple times without issues
✅ **Indexes are conditional**: `IF NOT EXISTS` prevents duplicate indexes

### What Could Go Wrong (and how to fix)

❌ **Wrong database**: Verify project ID before running
✅ **Fix**: Check project URL, re-login if needed

❌ **Insufficient permissions**: Need admin/owner role
✅ **Fix**: Contact project owner to grant access

❌ **Disk space**: Large table might need space for indexes
✅ **Fix**: Check Supabase plan limits, upgrade if needed

---

## Post-Migration Checklist

After successful migration, check off:

- [ ] All 5 columns exist (`simplified_text`, `glossary_terms`, `reading_level_before`, `reading_level_after`, `language_variant`)
- [ ] 2 indexes created (`idx_mio_chunks_language_variant`, `idx_mio_chunks_glossary_terms`)
- [ ] Column defaults are correct (`glossary_terms` = `'{}'`, `language_variant` = `'clinical'`)
- [ ] Can query new columns without error: `SELECT simplified_text FROM mio_knowledge_chunks LIMIT 1;`
- [ ] Ready to run production update: `python3 execute-week-4-agent-2.py`

---

## Timeline After Migration

| Task | Duration | Script |
|------|----------|--------|
| Production Updates | 15 min | `execute-week-4-agent-2.py` |
| Validation | 5 min | `week4-validation.py` |
| Search Testing | 5 min | Manual testing |
| Final Reporting | 5 min | Automated generation |
| **TOTAL** | **30 min** | Week 4 complete |

---

## Need Help?

**Error Messages**: Copy full error text and check troubleshooting section

**Database Issues**: Review Supabase logs in dashboard

**Migration Questions**: See `WEEK-4-EXECUTION-STATUS.md` for context

**Execution Issues**: See `WEEK-4-AGENT-2-COMPLETE.md` for Agent 2 details

---

**Ready to migrate?** Follow Step 1 above ☝️

**Already migrated?** Run: `python3 execute-week-4-agent-2.py` 🚀
