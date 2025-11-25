# MIO Knowledge Chunks - FINAL DEPLOYMENT INSTRUCTIONS

## 🎯 ROOT CAUSE IDENTIFIED!

**Problem**: Step 7 (constraints) fails because the constraint name `unique_chunk` already exists in PostgreSQL's catalog from a previous migration attempt.

**Evidence from Step-by-Step Diagnostic**:
- ✅ Steps 1-6 complete successfully
- ❌ **Step 7 FAILS**: "ERROR: 42P07: relation 'unique_chunk' already exists"
- ✅ pgvector extension IS enabled
- ✅ Table creation works
- ✅ Vector column works
- ✅ All other features work

**Root Cause**: PostgreSQL constraint names can persist in the system catalog even after `DROP TABLE CASCADE`. The standard cleanup script doesn't remove orphaned constraint names.

---

## ✅ SOLUTION: Enhanced Cleanup + Full Migration

### Step 1: Run Enhanced Cleanup Script

**Purpose**: Remove orphaned constraint names from PostgreSQL catalog

**Instructions**:
1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new
2. Copy entire contents of: `supabase/migrations/20251122000000_cleanup_mio_ENHANCED.sql`
3. Paste into SQL Editor
4. Click "Run"

**Expected Output**:
```
✓ Removed orphaned constraint: unique_chunk
✓ Removed orphaned constraint: valid_time_commitment (or "No orphaned constraint found")
==================================================
Enhanced Cleanup Complete!
==================================================
✓ Table removed
✓ All constraints removed from catalog
✓ Ready for fresh migration
==================================================
```

### Step 2: Run Complete Migration

**Purpose**: Create the full `mio_knowledge_chunks` table with all features

**Instructions**:
1. In the same SQL Editor (or open a new one)
2. Copy entire contents of: `STEP-BY-STEP-MIO-MIGRATION.sql`
3. Paste into SQL Editor
4. Click "Run"

**Expected Output**:
```
✓ STEP 1: Vector extension works!
✓ STEP 2: Basic table created!
✓ STEP 3: Vector column added!
✓ STEP 4: Array columns added!
✓ STEP 5: Metadata columns added!
✓ STEP 6: Full-text search column added!
✓ STEP 7: Constraints added!
✓ STEP 8: Vector HNSW index created!
✓ STEP 9: All 12 remaining indexes created!
✓ STEP 10: Trigger function created!
✓ STEP 11: Search function created!
✓ STEP 12: RLS enabled with 2 policies!
==================================================
MIO KNOWLEDGE CHUNKS MIGRATION COMPLETE!
==================================================
Table: mio_knowledge_chunks ✓
Columns: 22 total ✓
Indexes: 14 total ✓
Functions: search_mio_knowledge ✓
Triggers: Auto-update timestamps ✓
RLS: Enabled with 2 policies ✓
==================================================
Database is ready for protocol data import!
==================================================
```

### Step 3: Verify Success

**Instructions**:
1. In SQL Editor, run: `CHECK-MIO-TABLE-STATUS.sql`
2. Or manually check:

```sql
-- Verify table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks';

-- Check column count (should be 22)
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks';

-- Check indexes (should be 14 including primary key)
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks';

-- Check search function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'search_mio_knowledge';
```

**Expected Results**:
- Table exists: ✅ `mio_knowledge_chunks`
- Columns: ✅ 22 total
- Indexes: ✅ 14 total (13 created + 1 primary key)
- Function: ✅ `search_mio_knowledge`

---

## Known Migration History

From AI browser investigation:
- Migration `20251122000419` ran on Nov 22, 2025 at 00:04:19 UTC
- This migration number doesn't match our local files
- May indicate someone else ran a migration attempt

**Action**: After diagnostic, we may need to:
1. Check migration history: `SELECT * FROM supabase_migrations.schema_migrations WHERE version LIKE '20251122%'`
2. Manually rollback any partial migrations
3. Ensure clean slate before final deployment

---

## Success Criteria

✅ Step-by-step migration completes all 12 steps
✅ `CHECK-MIO-TABLE-STATUS.sql` returns table with 22 columns
✅ Vector extension test passes
✅ Search function exists
✅ RLS policies are active
✅ Can insert test data successfully

---

## Next Steps After Success

Once table exists:
1. Mark "Deploy and verify migration with extension check" as completed ✅
2. Begin Week 2: Protocol parsing
3. Start with Daily Deductible Library (45 practices)
4. Parse Avatar Assessment protocols (160+)
5. Parse research protocols (29 across 4 categories)

---

## Contact Points

**Database**: `hpyodaugrkctagkrfofj.supabase.co`
**SQL Editor**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new
**Extensions**: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/settings/extensions

**Files Ready**:
- ✅ `STEP-BY-STEP-MIO-MIGRATION.sql` (diagnostic)
- ✅ `CHECK-MIO-TABLE-STATUS.sql` (verification)
- ✅ `20251122000000_cleanup_mio_partial.sql` (cleanup)
- ✅ `20251122000003_create_mio_knowledge_chunks_WITH_EXTENSION_CHECK.sql` (full migration)
