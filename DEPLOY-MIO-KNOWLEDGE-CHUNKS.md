# Deploy MIO Knowledge Chunks Migration

## 🚨 TWO-STEP DEPLOYMENT REQUIRED

Due to partial migration attempts, you must run cleanup first, then the main migration.

### STEP 1: Cleanup (Required)

1. Go to https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new

2. Copy the entire contents of:
   ```
   supabase/migrations/20251122000000_cleanup_mio_partial.sql
   ```

3. Paste into the SQL Editor

4. Click "Run" button

5. Wait for success message: "Cleanup Complete!"

### STEP 2: Main Migration (WITH PGVECTOR EXTENSION CHECK)

1. **In the same SQL Editor** (or open a new one)

2. Copy the entire contents of:
   ```
   supabase/migrations/20251122000003_create_mio_knowledge_chunks_WITH_EXTENSION_CHECK.sql
   ```

   **Note**: This version includes a pre-flight check for pgvector extension availability and will provide clear instructions if the extension needs to be enabled.

3. Paste into the SQL Editor

4. Click "Run" button

5. **If you get an error about pgvector not being available**:
   - The migration will display a helpful error message with instructions
   - Go to Project Settings → Extensions in Supabase Dashboard
   - Enable the "vector" extension
   - Re-run this migration

6. Wait for success message: "MIO Knowledge Chunks Migration Complete!"

5. Verify success by running:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'mio_knowledge_chunks';
   ```

6. Check table structure:
   ```sql
   \d mio_knowledge_chunks
   ```
   or
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'mio_knowledge_chunks'
   ORDER BY ordinal_position;
   ```

## Verify Indexes Created

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mio_knowledge_chunks';
```

Expected indexes:
- `mio_knowledge_chunks_pkey` (PRIMARY KEY)
- `idx_mio_chunks_embedding` (HNSW vector index)
- `idx_mio_chunks_fts` (GIN full-text search)
- `idx_mio_chunks_patterns` (GIN array index)
- `idx_mio_chunks_temperament` (GIN array index)
- `idx_mio_chunks_states` (GIN array index)
- `idx_mio_chunks_practice_types` (GIN array index)
- `idx_mio_chunks_category` (B-tree index)
- `idx_mio_chunks_subcategory` (B-tree index)
- `idx_mio_chunks_active_priority` (B-tree index)
- `idx_mio_chunks_time` (B-tree index)
- `idx_mio_chunks_difficulty` (B-tree index)

## Verify Helper Function

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'search_mio_knowledge';
```

## Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'mio_knowledge_chunks';
```

Expected policies:
- `Authenticated users can read knowledge chunks`
- `Service role can manage knowledge chunks`

## Test Search Function (After Data Import)

Once you have data in the table, test the hybrid search function:

```sql
-- Note: You'll need an actual embedding vector from OpenAI
-- This is just a placeholder structure
SELECT * FROM search_mio_knowledge(
  query_embedding := '[0.1, 0.2, ...]'::vector(1536),
  query_text := 'money mindset',
  filter_patterns := ARRAY['money_avoidance', 'impostor_syndrome'],
  filter_temperament := ARRAY['warrior'],
  max_time_minutes := 30,
  match_threshold := 0.7,
  match_count := 5
);
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop function first (depends on table)
DROP FUNCTION IF EXISTS search_mio_knowledge;

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_mio_chunks_updated_at ON mio_knowledge_chunks;
DROP FUNCTION IF EXISTS update_mio_chunks_updated_at;

-- Drop table (cascades to indexes and policies)
DROP TABLE IF EXISTS mio_knowledge_chunks CASCADE;
```

## Next Steps After Deployment

1. ✅ Week 1 Complete: Database foundation ready
2. 📝 Week 2 Next: Parse all protocol files and structure data
3. 🔮 Week 3: Generate embeddings and populate table
4. 🧠 Week 4: Build brain science glossary service
5. 🤖 Week 5: Transform MIO system prompt
6. 🚀 Week 6: Testing and production launch

## Status Check Query

Run this to check if everything is ready for data import:

```sql
SELECT
  'Table Exists' as check_type,
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'mio_knowledge_chunks'
  ) as status
UNION ALL
SELECT
  'Vector Extension' as check_type,
  EXISTS(
    SELECT 1 FROM pg_extension
    WHERE extname = 'vector'
  ) as status
UNION ALL
SELECT
  'FTS Extension' as check_type,
  EXISTS(
    SELECT 1 FROM pg_extension
    WHERE extname = 'pg_trgm'
  ) as status
UNION ALL
SELECT
  'Search Function' as check_type,
  EXISTS(
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name = 'search_mio_knowledge'
  ) as status
UNION ALL
SELECT
  'RLS Enabled' as check_type,
  relrowsecurity as status
FROM pg_class
WHERE relname = 'mio_knowledge_chunks';
```

All should return `true` for successful deployment.
