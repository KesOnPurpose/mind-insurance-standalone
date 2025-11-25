# MIO Protocol Database Insertion Guide

## Overview

**Script**: `insert_to_supabase.py`
**Purpose**: Batch insert 205 MIO protocols with embeddings into Supabase `mio_knowledge_chunks` table
**Timeline**: Week 2, Day 6 of 6-week MIO transformation
**Input**: `output/all-protocols-with-embeddings.json` (205 protocols)
**Target**: Supabase database `hpyodaugrkctagkrfofj.supabase.co`

---

## Prerequisites

### 1. Environment Setup

```bash
# Supabase credentials (REQUIRED)
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweW9kYXVncmtjdGFna3Jmb2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc4NjYyMiwiZXhwIjoyMDc0MzYyNjIyfQ.wRAsxPF9-mnl_O6nfK_9yog5IopYN42-bUd1ymLtVBQ"
```

### 2. Python Dependencies

```bash
# supabase-py already installed
python3 -c "import supabase; print('Ready')"
```

### 3. Input File

**Expected**: `protocol-parsing/output/all-protocols-with-embeddings.json`
**Source**: Parallel embedding generation task (Week 2 Day 5-6)
**Format**: JSON array of 205 protocol objects with OpenAI embeddings (1536 dimensions)

---

## Database Schema

**Table**: `mio_knowledge_chunks`

```sql
CREATE TABLE mio_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  file_number INTEGER,
  chunk_number INTEGER,
  chunk_text TEXT NOT NULL,
  chunk_summary TEXT,
  embedding vector(1536),           -- OpenAI ada-002 embeddings
  category TEXT,
  applicable_patterns TEXT[],       -- e.g., ['past_prison', 'success_sabotage']
  temperament_match TEXT[],         -- e.g., ['sage', 'connector']
  time_commitment_min INTEGER,
  time_commitment_max INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  state_created TEXT[],             -- e.g., ['hope', 'connection']
  search_text TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(chunk_summary, '') || ' ' || coalesce(chunk_text, ''))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Usage

### Dry Run (Validation Only)

**Recommended first step** - validates data without inserting:

```bash
cd protocol-parsing
python3 insert_to_supabase.py --dry-run
```

**What it validates**:
- Input file exists and is valid JSON
- All 205 protocols have embeddings
- Embedding dimension = 1536
- Required fields present (source_file, chunk_text, embedding)
- Difficulty levels are valid ('beginner', 'intermediate', 'advanced')
- Array fields are properly formatted
- Time commitment fields are integers

**Expected output**:
```
============================================================
MIO Protocol Database Insertion - Week 2 Day 6
============================================================

✓ Connected to Supabase: https://hpyodaugrkctagkrfofj.supabase.co
✓ Loaded 205 protocols from all-protocols-with-embeddings.json

============================================================
Validating Protocol Data
============================================================

Total protocols: 205
Protocols with embeddings: 205
Protocols without embeddings: 0
✓ All protocols passed validation

⚠️  DRY RUN MODE - No records will be inserted
✓ Dry run validation complete - ready for insertion
```

---

### Full Insertion (Day 6 Execution)

```bash
# With environment variable
SUPABASE_SERVICE_KEY=your_key python3 insert_to_supabase.py

# Or export first
export SUPABASE_SERVICE_KEY="your_key"
python3 insert_to_supabase.py
```

**Batch Strategy**:
- **Batch size**: 50 records per batch (Supabase recommended)
- **Total batches**: 205 ÷ 50 = 5 batches
  - Batch 1: 50 records
  - Batch 2: 50 records
  - Batch 3: 50 records
  - Batch 4: 50 records
  - Batch 5: 5 records
- **Retry logic**: 3 attempts per failed batch with 2-second delay
- **Progress tracking**: Real-time percentage and record count

**Expected output**:
```
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
```

---

### Custom Batch Size

For slower connections or rate limiting:

```bash
# Smaller batches (25 records)
python3 insert_to_supabase.py --batch-size 25

# Larger batches (100 records) - not recommended
python3 insert_to_supabase.py --batch-size 100
```

---

### Skip Verification or Test Queries

```bash
# Skip post-insertion verification
python3 insert_to_supabase.py --no-verify

# Skip test queries
python3 insert_to_supabase.py --no-test-queries

# Skip both
python3 insert_to_supabase.py --no-verify --no-test-queries
```

---

## Validation Features

### Schema Compliance Check

**Validates**:
- ✅ Required fields: `source_file`, `chunk_text`, `embedding`
- ✅ Embedding dimension: 1536 (OpenAI ada-002)
- ✅ Embedding values: All numeric (floats)
- ✅ Difficulty level: One of ['beginner', 'intermediate', 'advanced']
- ✅ Array fields: `applicable_patterns`, `temperament_match`, `state_created`
- ✅ Integer fields: `time_commitment_min`, `time_commitment_max`

**Example validation error**:
```
❌ Protocol 47 (daily_deductible_library.md): Invalid embedding dimension: 1024 (expected 1536)
```

---

## Error Handling

### Retry Strategy

**Failed batches are retried automatically**:
1. Initial attempt fails
2. Wait 2 seconds
3. Retry (attempt 1/3)
4. If fails, wait 2 seconds
5. Retry (attempt 2/3)
6. If fails, wait 2 seconds
7. Final retry (attempt 3/3)
8. If fails, log to `failed-insertions-*.json`

**Example**:
```
⚠️  Batch 3/5 failed: Connection timeout
ℹ️  Retrying in 2s... (attempt 1/3)
✓ Batch 3/5: Inserted 50 records
```

### Failed Records Log

If any records fail after 3 retries, they're saved to:

```
output/failed-insertions-20250122-143052.json
```

**Format**:
```json
[
  {
    "source_file": "daily_deductible_library.md",
    "chunk_number": 47,
    "error": "Connection timeout"
  }
]
```

**Recovery**: Manually review failed records and re-run insertion on specific batches.

---

## Post-Insertion Verification

### 1. Record Count Verification

```
============================================================
Verification
============================================================

Expected records: 205
Actual records in database: 205
✓ Record count verification passed
```

### 2. Embedding Dimension Check

```
Testing vector search capability...
✓ Embedding dimension verified: 1536
```

### 3. Test Queries

**Test 1: Category Filter**
```sql
SELECT id, source_file, category, chunk_summary
FROM mio_knowledge_chunks
WHERE category = 'traditional-foundation'
LIMIT 5;
```

**Test 2: Difficulty Filter**
```sql
SELECT id, chunk_summary, difficulty_level
FROM mio_knowledge_chunks
WHERE difficulty_level = 'beginner'
LIMIT 5;
```

**Test 3: Time Commitment Filter**
```sql
SELECT id, chunk_summary, time_commitment_max
FROM mio_knowledge_chunks
WHERE time_commitment_max <= 10
LIMIT 5;
```

**Test 4: Pattern Search**
```sql
SELECT id, chunk_summary, applicable_patterns
FROM mio_knowledge_chunks
WHERE 'past_prison' = ANY(applicable_patterns)
LIMIT 5;
```

**Expected output**:
```
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
```

---

## Advanced: Vector Search Examples

Once data is inserted, create an RPC function for semantic search:

### Create Search Function (Supabase SQL Editor)

```sql
CREATE OR REPLACE FUNCTION search_mio_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source_file text,
  chunk_summary text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mio_knowledge_chunks.id,
    mio_knowledge_chunks.source_file,
    mio_knowledge_chunks.chunk_summary,
    mio_knowledge_chunks.chunk_text,
    1 - (mio_knowledge_chunks.embedding <=> query_embedding) as similarity
  FROM mio_knowledge_chunks
  WHERE 1 - (mio_knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY mio_knowledge_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Test Vector Search (Python)

```python
from supabase import create_client
import openai

# Initialize clients
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
openai.api_key = "your_openai_key"

# Generate embedding for user question
question = "What practices help with feeling stuck in the past?"
response = openai.embeddings.create(
    model="text-embedding-ada-002",
    input=question
)
query_embedding = response.data[0].embedding

# Search for similar protocols
result = supabase.rpc('search_mio_knowledge', {
    'query_embedding': query_embedding,
    'match_threshold': 0.7,
    'match_count': 5
}).execute()

# Display results
for protocol in result.data:
    print(f"Similarity: {protocol['similarity']:.2f}")
    print(f"Protocol: {protocol['chunk_summary']}")
    print(f"Source: {protocol['source_file']}")
    print()
```

---

## Troubleshooting

### Issue: "SUPABASE_SERVICE_KEY environment variable not set"

**Solution**:
```bash
# Option 1: Export environment variable
export SUPABASE_SERVICE_KEY="your_key_here"
python3 insert_to_supabase.py

# Option 2: Inline environment variable
SUPABASE_SERVICE_KEY="your_key_here" python3 insert_to_supabase.py
```

### Issue: "Input file not found"

**Solution**:
```bash
# Check if embeddings file exists
ls -la output/all-protocols-with-embeddings.json

# If not, run the embedding generation task first (parallel task)
# Expected location: protocol-parsing/output/all-protocols-with-embeddings.json
```

### Issue: "Invalid embedding dimension: 1024 (expected 1536)"

**Cause**: Wrong OpenAI embedding model used (text-embedding-3-small instead of ada-002)

**Solution**:
- Regenerate embeddings with `text-embedding-ada-002` model
- Or update expected dimension in script if intentional

### Issue: "Connection timeout" or "Rate limit exceeded"

**Solution**:
```bash
# Reduce batch size
python3 insert_to_supabase.py --batch-size 25

# Script will auto-retry with 2-second delay
```

### Issue: Duplicate records

**Prevention**:
- Script does NOT use `upsert` to avoid unintentional overwrites
- To re-insert, first clear existing data:

```sql
-- DANGER: Only run if you need to start fresh
DELETE FROM mio_knowledge_chunks;
```

**Future enhancement**: Add `--upsert` flag with composite key on (source_file, chunk_number)

---

## Success Metrics

### Expected Results

✅ **205 protocols inserted**
✅ **5 batches completed**
✅ **0 failed insertions**
✅ **All embeddings 1536 dimensions**
✅ **Vector search functional**
✅ **Test queries return results**

### Execution Time

- **Dry run**: <1 second
- **Full insertion**: 10-15 seconds (205 records, 5 batches)
- **With verification**: 15-20 seconds
- **With test queries**: 20-25 seconds

### Database Size Impact

- **205 protocols** × ~2KB per protocol (avg) = **~410KB**
- **Embeddings**: 205 × 1536 floats × 4 bytes = **~1.26MB**
- **Total**: ~1.7MB (negligible impact)

---

## Next Steps (Week 3)

Once database insertion is complete:

1. ✅ **Verify data integrity** (automated by script)
2. ✅ **Test vector search** (automated by script)
3. 🔲 **Create hybrid search function** (vector + full-text)
4. 🔲 **Build MIO chatbot integration** (Week 3 Day 1)
5. 🔲 **Implement pattern-based filtering** (Week 3 Day 2)
6. 🔲 **Add temperament matching** (Week 3 Day 3)
7. 🔲 **Deploy to production** (Week 3 Day 5)

---

## Files Generated

```
protocol-parsing/
├── insert_to_supabase.py                      # Insertion script
├── output/
│   ├── all-protocols-with-embeddings.json    # Input (from parallel task)
│   └── failed-insertions-*.json              # Only if errors occur
└── README-SUPABASE-INSERTION.md              # This file
```

---

## CLI Reference

```
usage: insert_to_supabase.py [-h] [--dry-run] [--batch-size BATCH_SIZE]
                              [--no-verify] [--no-test-queries]
                              [--input-file INPUT_FILE]

Insert MIO protocols with embeddings into Supabase

optional arguments:
  -h, --help            show this help message and exit
  --dry-run             Validate data without inserting to database
  --batch-size BATCH_SIZE
                        Number of records per batch (default: 50)
  --no-verify           Skip verification after insertion
  --no-test-queries     Skip test queries after insertion
  --input-file INPUT_FILE
                        Path to input JSON file with embeddings

Examples:
  # Dry run (validation only)
  python3 insert_to_supabase.py --dry-run

  # Full insertion
  SUPABASE_SERVICE_KEY=your_key python3 insert_to_supabase.py

  # Custom batch size
  python3 insert_to_supabase.py --batch-size 25

  # Skip verification
  python3 insert_to_supabase.py --no-verify
```

---

## Day 6 Execution Checklist

```
PRE-EXECUTION:
[ ] Supabase service key exported
[ ] all-protocols-with-embeddings.json exists (205 protocols)
[ ] supabase-py installed
[ ] Dry run validation passes

EXECUTION:
[ ] Run: python3 insert_to_supabase.py
[ ] Monitor batch progress
[ ] Verify 205 records inserted
[ ] Check test queries pass

POST-EXECUTION:
[ ] Record count = 205
[ ] Embedding dimension = 1536
[ ] Vector search functional
[ ] No failed records
[ ] Ready for Week 3 chatbot integration
```

---

**Status**: Ready for Day 6 execution
**Estimated time**: 1-2 minutes (including validation and test queries)
**Risk level**: LOW (dry-run validated, auto-retry enabled, failed records logged)

