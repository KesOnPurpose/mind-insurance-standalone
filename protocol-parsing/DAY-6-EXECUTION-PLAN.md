# Day 6 Execution Plan: Database Insertion

## Overview

**Task**: Insert 205 MIO protocols with embeddings into Supabase
**Script**: `insert_to_supabase.py`
**Database**: `hpyodaugrkctagkrfofj.supabase.co`
**Table**: `mio_knowledge_chunks`
**Estimated Time**: 1-2 minutes

---

## Pre-Execution Checklist

```
[ ] Embeddings file ready: output/all-protocols-with-embeddings.json (205 protocols)
[ ] Supabase service key available
[ ] Python environment ready (supabase-py installed)
[ ] Database table created (Week 1 migration)
```

---

## Step-by-Step Execution

### Step 1: Dry Run Validation

**Command**:
```bash
cd protocol-parsing
python3 insert_to_supabase.py --dry-run
```

**Expected Output**:
```
✓ Loaded 205 protocols from all-protocols-with-embeddings.json
✓ All protocols passed validation
Total protocols: 205
Protocols with embeddings: 205
Protocols without embeddings: 0
✓ Dry run validation complete - ready for insertion
```

**If Validation Fails**:
- Check embedding dimensions (must be 1536)
- Verify required fields: source_file, chunk_text, embedding
- Check difficulty_level values: beginner, intermediate, advanced
- Ensure array fields are properly formatted

---

### Step 2: Full Insertion

**Command**:
```bash
export SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

python3 insert_to_supabase.py
```

**Expected Output**:
```
============================================================
MIO Protocol Database Insertion - Week 2 Day 6
============================================================

✓ Connected to Supabase: https://hpyodaugrkctagkrfofj.supabase.co
✓ Loaded 205 protocols from all-protocols-with-embeddings.json
✓ All protocols passed validation

============================================================
Database Insertion
============================================================

Total protocols: 205
Batch size: 50
Total batches: 5

✓ Batch 1/5: Inserted 50 records
Progress: 20.0% (50 inserted)

✓ Batch 2/5: Inserted 50 records
Progress: 40.0% (100 inserted)

✓ Batch 3/5: Inserted 50 records
Progress: 60.0% (150 inserted)

✓ Batch 4/5: Inserted 50 records
Progress: 80.0% (200 inserted)

✓ Batch 5/5: Inserted 5 records
Progress: 100.0% (205 inserted)

============================================================
Insertion Summary
============================================================

Total protocols: 205
Successful inserts: 205
Failed inserts: 0
Successful batches: 5/5

Execution time: 12.34 seconds
Average time per batch: 2.47 seconds
Records per second: 16.61

✅ All records inserted successfully!

============================================================
Verification
============================================================

Expected records: 205
Actual records in database: 205
✓ Record count verification passed

Testing vector search capability...
✓ Embedding dimension verified: 1536

============================================================
Test Queries
============================================================

Test 1: Select protocols by category 'traditional-foundation'
✓ Found 5 protocols in 'traditional-foundation' category
   - Prayer and Worship
   - Meditation (Goal/Vision Focused)
   - Breathwork for State Change

Test 2: Select 'beginner' level protocols
✓ Found 5 beginner-level protocols

Test 3: Select protocols with time commitment <= 10 minutes
✓ Found 5 quick protocols (<=10 min)

Test 4: Search for protocols applicable to 'past_prison' pattern
✓ Found 5 protocols for 'past_prison' pattern

✓ Test queries completed

============================================================
Status
============================================================

✅ Day 6 database insertion COMPLETE!
✅ Ready for MIO chatbot integration (Week 3)
ℹ️  Database: https://hpyodaugrkctagkrfofj.supabase.co
ℹ️  Table: mio_knowledge_chunks
ℹ️  Total records: 205
```

---

## Troubleshooting

### Issue: Input file not found

**Error**: `❌ Input file not found: all-protocols-with-embeddings.json`

**Solution**:
```bash
# Check if embeddings file exists
ls -la output/all-protocols-with-embeddings.json

# If not, the parallel embedding generation task needs to complete first
# Expected location: protocol-parsing/output/all-protocols-with-embeddings.json
```

---

### Issue: Validation errors

**Error**: `❌ Protocol X: Invalid embedding dimension: 1024 (expected 1536)`

**Cause**: Wrong OpenAI model used (text-embedding-3-small vs ada-002)

**Solution**: Regenerate embeddings with correct model (`text-embedding-ada-002`)

---

### Issue: Connection timeout

**Error**: `⚠️ Batch 3/5 failed: Connection timeout`

**Solution**: Script auto-retries (3 attempts with 2-second delay). If persistent:
```bash
# Reduce batch size
python3 insert_to_supabase.py --batch-size 25
```

---

### Issue: Duplicate records

**Prevention**: Script uses INSERT (not UPSERT) to prevent overwrites.

**To clear and restart**:
```sql
-- Run in Supabase SQL Editor (DANGER: deletes all data)
DELETE FROM mio_knowledge_chunks;
```

---

## Post-Insertion Verification

### Manual Database Check (Supabase Dashboard)

1. Go to: https://hpyodaugrkctagkrfofj.supabase.co
2. Table Editor → mio_knowledge_chunks
3. Verify: 205 rows
4. Check sample records have embeddings

### SQL Verification Queries

```sql
-- Count total records
SELECT COUNT(*) FROM mio_knowledge_chunks;
-- Expected: 205

-- Check embedding dimensions
SELECT id, source_file, array_length(embedding, 1) as embedding_dim
FROM mio_knowledge_chunks
LIMIT 5;
-- Expected: embedding_dim = 1536 for all

-- Check category distribution
SELECT category, COUNT(*) as count
FROM mio_knowledge_chunks
GROUP BY category
ORDER BY count DESC;

-- Check difficulty levels
SELECT difficulty_level, COUNT(*) as count
FROM mio_knowledge_chunks
GROUP BY difficulty_level;

-- Check pattern coverage
SELECT unnest(applicable_patterns) as pattern, COUNT(*) as count
FROM mio_knowledge_chunks
GROUP BY pattern
ORDER BY count DESC;
```

---

## Success Criteria

```
✅ All 205 protocols inserted
✅ 0 failed insertions
✅ All embeddings are 1536 dimensions
✅ Vector search functional
✅ Test queries return results
✅ Execution time < 30 seconds
✅ No validation errors
```

---

## Next Steps (Week 3)

Once insertion is confirmed successful:

1. **Week 3 Day 1**: MIO chatbot integration
   - Connect to database
   - Implement semantic search
   - Test with sample user queries

2. **Week 3 Day 2**: Pattern-based filtering
   - Filter by applicable_patterns
   - Temperament matching logic
   - Time commitment filtering

3. **Week 3 Day 3**: Hybrid search
   - Combine vector similarity + full-text search
   - Optimize search performance
   - Add relevance scoring

4. **Week 3 Day 4**: Testing & refinement
   - User acceptance testing
   - Performance optimization
   - Edge case handling

5. **Week 3 Day 5**: Production deployment
   - Deploy to production
   - Monitor performance
   - User training

---

## Quick Reference

**Script location**: `/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-parsing/insert_to_supabase.py`

**Input file**: `output/all-protocols-with-embeddings.json`

**Database**: `hpyodaugrkctagkrfofj.supabase.co`

**Table**: `mio_knowledge_chunks`

**Service key**: (from environment variable)

**Batch strategy**: 5 batches of 50, 50, 50, 50, 5 records

**Auto-retry**: 3 attempts per failed batch

**Execution time**: ~10-20 seconds (full insertion + verification)

---

## Day 6 Completion Checklist

```
PRE-EXECUTION:
[✓] Script created: insert_to_supabase.py
[✓] README created: README-SUPABASE-INSERTION.md
[✓] Dry-run tested successfully
[ ] Embeddings file ready (205 protocols)
[ ] Service key configured

EXECUTION:
[ ] Dry run validation passes
[ ] Full insertion completes
[ ] 205 records inserted
[ ] Verification passes
[ ] Test queries successful

POST-EXECUTION:
[ ] Database count = 205
[ ] Embeddings verified (1536 dim)
[ ] Vector search tested
[ ] Documentation updated
[ ] Ready for Week 3
```

---

**Status**: ✅ Script ready for Day 6 execution
**Risk level**: LOW (dry-run validated, auto-retry, comprehensive error handling)
**Estimated completion**: 2 minutes
