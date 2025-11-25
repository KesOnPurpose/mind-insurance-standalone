# MIO Protocol Library - Search Validation Guide

## Overview

This validation suite tests the complete MIO protocol library search functionality, including:
- **Vector Similarity Search** (semantic understanding)
- **Pattern Filtering** (15+ identity collision patterns)
- **Temperament Matching** (Warrior, Sage, Connector, Builder)
- **Time Commitment Filtering** (quick wins vs deep work)
- **Emergency Protocol Detection** (crisis interventions)
- **Full-Text Search** (keyword matching)
- **Hybrid Search** (multi-filter combinations)

## Prerequisites

### 1. Install Dependencies

```bash
pip install supabase openai
```

### 2. Set Environment Variables

Create or update `.env` file:

```bash
# Supabase
SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# OpenAI (for vector search)
OPENAI_API_KEY=sk-proj-your-key-here
```

### 3. Ensure Database is Populated

Run Day 6 insertion script first:

```bash
python3 insert_to_supabase.py
```

Expected: 205 protocols inserted into `mio_knowledge_chunks` table.

## Running Validation

### Full Validation Suite

```bash
cd protocol-parsing
python3 validate_search.py
```

### Expected Output

```
================================================================================
MIO Protocol Library - Search Validation Suite
================================================================================

✓ Prerequisites checked
✓ Connected to Supabase
✓ Found 205 protocols in database

Test 1/10: Vector Similarity: Motivation Issue
--------------------------------------------------------------------------------
   ✅ PASSED - 10 results
   Sample results:
      1. Morning Momentum Protocol (neural-rewiring)
         Patterns: motivation_collapse, burnout
      2. The Builder's Blueprint (research-protocol)
         Patterns: motivation_collapse, execution_breakdown
      3. Working Out/Movement Protocol (research-protocol)
         Patterns: motivation_collapse, burnout

Test 2/10: Vector Similarity: Comparison Struggles
--------------------------------------------------------------------------------
   ✅ PASSED - 10 results
   Sample results:
      1. The Warrior's Solo Race (neural-rewiring)
         Patterns: comparison_catastrophe
      2. Personal Best Tracking (neural-rewiring)
         Patterns: comparison_catastrophe
      3. Comparison Detox Protocol (research-protocol)
         Patterns: comparison_catastrophe, impostor_syndrome

...

================================================================================
VALIDATION SUMMARY
================================================================================

Tests Passed: 10/10 (100.0%)

✅ ALL TESTS PASSED - Protocol library search is fully functional!

✓ Results saved to: validation-results.json
```

## Test Cases Explained

### Test 1-2: Vector Similarity Search

**Purpose**: Test semantic understanding of user queries

**Example Query**: "I feel unmotivated and stuck in my business"

**How It Works**:
1. Generate embedding for query using OpenAI text-embedding-3-small
2. Call `search_mio_protocols()` PostgreSQL function
3. Return protocols with cosine similarity > 0.7
4. Ranked by relevance (highest similarity first)

**Expected Results**:
- At least 5 protocols returned
- Protocols match expected patterns (e.g., motivation_collapse, past_prison)

### Test 3: Pattern Filter

**Purpose**: Find all protocols for a specific identity collision pattern

**Example**: Filter by `success_sabotage`

**SQL Query**:
```sql
SELECT * FROM mio_knowledge_chunks
WHERE 'success_sabotage' = ANY(applicable_patterns)
LIMIT 20;
```

**Expected Results**:
- At least 10 protocols (should be ~45 total for success_sabotage)

### Test 4: Temperament Filter

**Purpose**: Find protocols matching user's Avatar Assessment temperament

**Example**: Filter by `warrior`

**SQL Query**:
```sql
SELECT * FROM mio_knowledge_chunks
WHERE 'warrior' = ANY(temperament_match)
LIMIT 50;
```

**Expected Results**:
- At least 30 protocols (should be ~118 total for warrior)

### Test 5: Time Commitment Filter

**Purpose**: Find quick-win protocols (5-10 min)

**SQL Query**:
```sql
SELECT * FROM mio_knowledge_chunks
WHERE time_commitment_max <= 10
LIMIT 30;
```

**Expected Results**:
- At least 20 protocols
- All have `time_commitment_max` ≤ 10

### Test 6: Emergency Protocols

**Purpose**: Find crisis intervention protocols

**SQL Query**:
```sql
SELECT * FROM mio_knowledge_chunks
WHERE is_emergency_protocol = true
LIMIT 20;
```

**Expected Results**:
- At least 12 protocols (exact count from neural rewiring matrix)

### Test 7: Full-Text Search

**Purpose**: Find protocols mentioning specific keywords

**Example**: "prayer worship"

**SQL Query**:
```sql
SELECT * FROM mio_knowledge_chunks
WHERE to_tsvector('english', chunk_text) @@ to_tsquery('english', 'prayer & worship')
LIMIT 20;
```

**Expected Results**:
- At least 3 protocols
- All contain "prayer" or "worship" in chunk_text

### Test 8: Category Filter

**Purpose**: Filter by protocol source/category

**Example**: `neural-rewiring`

**SQL Query**:
```sql
SELECT * FROM mio_knowledge_chunks
WHERE category = 'neural-rewiring'
LIMIT 50;
```

**Expected Results**:
- At least 40 protocols (60 total neural rewiring protocols)

### Test 9-10: Hybrid Search

**Purpose**: Combine multiple filters for precise matching

**Example 1**: Warrior + Motivation + Under 20 min
```sql
SELECT * FROM mio_knowledge_chunks
WHERE 'warrior' = ANY(temperament_match)
  AND 'motivation_collapse' = ANY(applicable_patterns)
  AND time_commitment_max <= 20
LIMIT 10;
```

**Example 2**: Emergency + Comparison Pattern
```sql
SELECT * FROM mio_knowledge_chunks
WHERE 'comparison_catastrophe' = ANY(applicable_patterns)
  AND is_emergency_protocol = true
LIMIT 10;
```

**Expected Results**:
- Protocols match ALL filter criteria
- Smaller result sets (highly targeted)

## Understanding the Results

### Result Structure

Each protocol returned contains:

```json
{
  "id": "uuid",
  "source_file": "daily_deductible_library.md",
  "chunk_number": 1,
  "chunk_summary": "Prayer and Worship",
  "chunk_text": "Full practice instructions...",
  "category": "traditional-foundation",
  "applicable_patterns": ["past_prison", "success_sabotage"],
  "temperament_match": ["sage", "connector"],
  "time_commitment_min": 5,
  "time_commitment_max": 30,
  "difficulty_level": "advanced",
  "is_emergency_protocol": false,
  "practice_frequency": "daily",
  "state_created": ["hope", "connection", "elevated vibration"],
  "embedding": [0.0234, -0.0156, ...],  // 1536 floats
  "created_at": "2025-11-22T12:00:00Z"
}
```

### Success Criteria

**✅ PASSED** if:
- Result count ≥ expected minimum
- Results contain expected patterns (where applicable)
- All results have required fields (chunk_summary, category, applicable_patterns)

**❌ FAILED** if:
- Insufficient results returned
- Expected patterns missing from all results
- Missing required fields in response

## Validation Results File

After running, check `validation-results.json`:

```json
{
  "total_tests": 10,
  "passed": 10,
  "failed": 0,
  "test_results": [
    {
      "name": "Vector Similarity: Motivation Issue",
      "passed": true,
      "issues": [],
      "result_count": 10
    },
    ...
  ]
}
```

## Troubleshooting

### Issue: "supabase-py package not installed"

**Solution**:
```bash
pip install supabase
```

### Issue: "SUPABASE_SERVICE_KEY environment variable not set"

**Solution**:
Add to `.env` file:
```bash
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

Or export directly:
```bash
export SUPABASE_SERVICE_KEY=your-key
python3 validate_search.py
```

### Issue: "No protocols in database"

**Solution**:
Run Day 6 insertion script first:
```bash
python3 insert_to_supabase.py
```

### Issue: "Could not generate embedding"

**Solution**:
Add OpenAI API key to `.env`:
```bash
OPENAI_API_KEY=sk-proj-your-key-here
```

**Note**: Tests will skip vector similarity search if embedding generation fails, but other tests will still run.

### Issue: "Connection timeout"

**Solution**:
- Check internet connection
- Verify Supabase URL is correct
- Check Supabase project is not paused

### Issue: "Expected patterns missing"

**Possible Causes**:
1. Parsers didn't extract patterns correctly
2. Database insertion modified pattern values
3. Test expectations don't match actual data

**Solution**:
Inspect sample results manually:
```bash
python3 -c "
from supabase import create_client
import os

supabase = create_client(
    'https://hpyodaugrkctagkrfofj.supabase.co',
    os.getenv('SUPABASE_SERVICE_KEY')
)

result = supabase.table('mio_knowledge_chunks').select('*').limit(5).execute()
print(result.data)
"
```

## Production Integration

### Using Search in MIO Chatbot

```python
from supabase import create_client
import openai

# Initialize clients
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
openai.api_key = OPENAI_API_KEY

def find_protocols_for_user(user_message: str, user_temperament: str, max_time: int = 20):
    """
    Find relevant protocols for user based on:
    - Semantic similarity to their message
    - Their Avatar Assessment temperament
    - Time available for practice
    """

    # Generate embedding for user message
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=user_message
    )
    query_embedding = response.data[0].embedding

    # Call hybrid search function
    result = supabase.rpc('search_mio_protocols', {
        'query_embedding': query_embedding,
        'match_threshold': 0.7,
        'match_count': 20
    }).execute()

    protocols = result.data

    # Apply additional filters
    filtered = [
        p for p in protocols
        if user_temperament in p.get('temperament_match', [])
        and p.get('time_commitment_max', 999) <= max_time
    ]

    return filtered[:5]  # Return top 5 matches
```

### Example Usage in Chat

```python
# User: "I'm feeling overwhelmed and stuck"
# Temperament: warrior (from Avatar Assessment)
# Time: 15 min available

protocols = find_protocols_for_user(
    user_message="I'm feeling overwhelmed and stuck",
    user_temperament="warrior",
    max_time=15
)

# MIO Response:
# "Based on your Warrior temperament and current overwhelm, here are 3 protocols:
#
# 1. **The Warrior's Emergency Reset** (5 min)
#    - Interrupts freeze response
#    - Redirects overwhelm into immediate action
#
# 2. **Morning Momentum Protocol** (10 min)
#    - Builds unstoppable daily momentum
#    - Targets motivation collapse
#
# 3. **The Builder's Blueprint** (15 min)
#    - Systems-based approach to execution
#    - Breaks overwhelm into manageable steps
#
# Which one resonates most with where you're at right now?"
```

## Next Steps (Week 3)

After validation passes:

1. **Brain Science Glossary** (Week 3)
   - Simplify clinical neuroscience terms
   - Create user-friendly explanations
   - Update protocol language

2. **MIO Prompt Transformation** (Week 4)
   - Integrate protocol library with MIO chatbot
   - Test protocol recommendations
   - Refine search thresholds

3. **Testing & Optimization** (Week 5)
   - A/B test different search strategies
   - Optimize vector similarity thresholds
   - Test with real user scenarios

4. **Launch Preparation** (Week 6)
   - Performance optimization
   - Edge case handling
   - Production monitoring setup

## Success Metrics

**Week 2 Day 7 Complete When**:
- ✅ All 10 validation tests pass
- ✅ Vector search returns relevant results
- ✅ Pattern/temperament filters work correctly
- ✅ Hybrid search combines filters properly
- ✅ Emergency protocols identified correctly
- ✅ Results have all required fields
- ✅ Documentation complete

**Expected Outcome**: 100% test pass rate, sub-100ms search response time, 205 protocols searchable.
