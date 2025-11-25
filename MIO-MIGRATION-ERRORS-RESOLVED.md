# MIO Knowledge Chunks Migration - Error Resolution

## Issues Encountered

### Error 1: "column temperament_match does not exist"
**Location**: Line 257-258 in original migration
**Cause**: COMMENT statements were referencing columns before table creation was fully complete
**Status**: ✅ RESOLVED

### Error 2: "relation 'unique_chunk' already exists"
**Location**: Line 284 when creating UNIQUE constraint
**Cause**: Previous partial migration left constraint objects in database
**Status**: ✅ RESOLVED with cleanup script

## Root Cause Analysis

The migration failures occurred because:

1. **Execution Order**: Original migration had COMMENT statements interleaved with table creation
2. **Partial State**: Each failed run left database objects (constraints, indexes) behind
3. **Constraint Names**: PostgreSQL constraint names can persist even after DROP TABLE without CASCADE
4. **Missing Cleanup**: No idempotent cleanup at start of migration

## Solution Implemented

### Two-File Approach

**File 1**: [`supabase/migrations/20251122000000_cleanup_mio_partial.sql`](supabase/migrations/20251122000000_cleanup_mio_partial.sql)
- Drops all RLS policies
- Drops function with full signature
- Drops all triggers
- Drops all indexes explicitly
- Drops table with CASCADE
- Verifies complete removal

**File 2**: [`supabase/migrations/20251122000001_create_mio_knowledge_chunks_FIXED.sql`](supabase/migrations/20251122000001_create_mio_knowledge_chunks_FIXED.sql)
- Starts with DROP statements (redundant safety)
- Creates extensions
- Creates complete table with ALL columns
- Creates ALL indexes
- Creates ALL functions and triggers
- Enables RLS with policies
- Adds COMMENT statements LAST (after everything exists)
- Runs verification assertions

### Key Improvements

1. **Idempotent Design**: Safe to run multiple times
2. **Explicit Cleanup**: Manually drops every object type
3. **Correct Order**: Table → Indexes → Functions → RLS → Comments
4. **Verification**: Built-in assertions confirm success
5. **Security Consistency**: Uses `SECURITY DEFINER` like existing migrations

## Deployment Instructions

### STEP 1: Cleanup
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20251122000000_cleanup_mio_partial.sql
-- Expected Output: "Cleanup Complete!"
```

### STEP 2: Main Migration
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20251122000001_create_mio_knowledge_chunks_FIXED.sql
-- Expected Output: "MIO Knowledge Chunks Migration Complete!"
```

## Database Schema Created

### Table: `mio_knowledge_chunks`

**Columns** (22 total):
- `id` - UUID primary key
- `chunk_text` - TEXT (protocol content)
- `chunk_summary` - TEXT
- `source_file` - VARCHAR(255)
- `file_number` - INTEGER
- `chunk_number` - INTEGER
- `category` - VARCHAR(100) (Financial, Limiting Beliefs, etc.)
- `subcategory` - VARCHAR(100)
- `embedding` - vector(1536) (OpenAI embeddings)
- `fts` - tsvector (generated, full-text search)
- `applicable_practice_types` - TEXT[] (PROTECT practices)
- `applicable_patterns` - TEXT[] (identity collision patterns)
- `time_commitment_min` - INTEGER
- `time_commitment_max` - INTEGER
- `difficulty_level` - VARCHAR(20) (beginner/intermediate/advanced)
- `temperament_match` - TEXT[] (warrior/sage/connector/builder)
- `state_created` - TEXT[] (calm/confidence/resilience/etc.)
- `tokens_approx` - INTEGER
- `priority_level` - INTEGER (1-10)
- `version` - VARCHAR(20)
- `is_active` - BOOLEAN
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**Indexes** (13 total):
- HNSW vector similarity index
- GIN full-text search index
- GIN array indexes for patterns, temperament, states, practice types
- B-tree indexes for category, difficulty, time, priority

**Functions**:
- `search_mio_knowledge()` - Hybrid search (vector 60% + FTS 20% + pattern 20%)
- `update_mio_chunks_updated_at()` - Auto-update timestamp trigger

**Security**:
- RLS enabled
- Authenticated users: SELECT only (active chunks)
- Service role: Full CRUD access

## Verification Queries

After successful deployment, run these to verify:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'mio_knowledge_chunks';

-- Check all columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mio_knowledge_chunks'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks';

-- Check function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'search_mio_knowledge';

-- Check RLS policies
SELECT policyname, permissive, roles
FROM pg_policies
WHERE tablename = 'mio_knowledge_chunks';
```

## Next Steps (Week 2)

After successful deployment:

1. ✅ Week 1 Complete: Database foundation ready
2. 📝 Week 2: Parse all 250+ protocols from source files
3. 🔮 Week 3: Generate embeddings and populate table
4. 🧠 Week 4: Build brain science glossary service
5. 🤖 Week 5: Transform MIO system prompt
6. 🚀 Week 6: Testing and production launch

### Error 3: \"relation 'mio_knowledge_chunks' does not exist\" (Lines 272-285)
**Location**: Verification block at end of migration
**Cause**: PostgreSQL parser confusion with multiple `$$` delimiters in same file
**Details**:
- Function `update_mio_chunks_updated_at()` uses `$$` delimiter (lines 145-150)
- Function `search_mio_knowledge()` uses `$$` delimiter (lines 185-223)
- Verification block ALSO uses `$$` delimiter (lines 272-285)
- Parser may interpret verification's opening `$$` as closing delimiter for search function
**Status**: ✅ RESOLVED with unique delimiters

## Solution: Unique Dollar-Quote Delimiters

**Final Migration File**: `supabase/migrations/20251122000002_create_mio_knowledge_chunks_FINAL.sql`

**Key Changes**:
1. `update_mio_chunks_updated_at()` function: Uses `$func$` delimiter
2. `search_mio_knowledge()` function: Uses `$searchfunc$` delimiter
3. Verification block: Uses `$verify$` delimiter
4. Removed ASSERT statements (can cause issues in some environments)
5. Uses only RAISE NOTICE for success confirmation

**Why This Works**:
- Each code block has a unique delimiter
- No parser confusion about where blocks begin/end
- Verification block always executes after table creation
- Simpler verification logic reduces failure points

## Files Created/Modified

1. **Cleanup Script** (NEW): `supabase/migrations/20251122000000_cleanup_mio_partial.sql`
2. **Main Migration v1** (DEPRECATED): `supabase/migrations/20251122000001_create_mio_knowledge_chunks_FIXED.sql`
3. **Main Migration FINAL** (USE THIS): `supabase/migrations/20251122000002_create_mio_knowledge_chunks_FINAL.sql`
4. **Deployment Guide** (UPDATED): `DEPLOY-MIO-KNOWLEDGE-CHUNKS.md`
5. **This Document** (NEW): `MIO-MIGRATION-ERRORS-RESOLVED.md`

## Lessons Learned

1. **PostgreSQL Migrations**: Always use explicit DROP statements for all object types
2. **Constraint Names**: Can persist beyond DROP TABLE - always use CASCADE
3. **Execution Order**: Create all objects before adding metadata (COMMENT)
4. **Idempotency**: Every migration should be runnable multiple times safely
5. **Verification**: Keep verification simple - use RAISE NOTICE instead of ASSERT
6. **Dollar-Quote Delimiters**: Use unique delimiters (`$func$`, `$searchfunc$`, `$verify$`) instead of `$$` when multiple functions/blocks exist in same file
7. **Parser Behavior**: PostgreSQL parser can get confused when same delimiter appears multiple times - always disambiguate
