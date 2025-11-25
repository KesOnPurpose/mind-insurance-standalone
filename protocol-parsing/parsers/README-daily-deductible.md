# Daily Deductible Parser

## Overview

Parser for extracting 45 Daily Deductible practices from normalized markdown into JSON matching the `mio_knowledge_chunks` database schema.

**Part of**: Week 2 Day 2-4 of 6-week MIO transformation
**Input**: Normalized markdown file with structured practices
**Output**: JSON array ready for database import

## Usage

```bash
python3 parsers/parse_daily_deductible.py
```

## Input/Output Files

**Input (Staging)**:
- `/staging/daily-deductible-normalized.md` - Full 45 practices

**Input (Test)**:
- `/fixtures/test-daily-deductible.md` - Test subset

**Output**:
- `/output/daily-deductible-parsed.json` - Parsed JSON (55KB, 45 practices)

## Structure Parsed

The parser extracts from this markdown structure:
```markdown
### **Category Name**

#### **N\. Practice Title**

**Time:** X-Y minutes **The State It Creates:** state1, state2, ... **Instructions:**

1. **Sub-protocol Name:**
   * Step 1
   * Step 2

**Why it works:** Explanation text...
```

## Output Schema

Each practice is transformed into:
```json
{
  "source_file": "daily_deductible_library.md",
  "file_number": 1,
  "chunk_number": N,
  "chunk_text": "full practice text",
  "chunk_summary": "Practice Title",
  "category": "category-slug",
  "applicable_patterns": ["pattern1", "pattern2"],
  "temperament_match": ["temperament1"],
  "time_commitment_min": 5,
  "time_commitment_max": 30,
  "difficulty_level": "beginner|intermediate|advanced",
  "state_created": ["state1", "state2"],
  "tokens_approx": 196,
  "is_emergency_protocol": false,
  "practice_frequency": "daily"
}
```

## Categories Detected

- `traditional-foundation` (8 practices)
- `faith-based` (10 practices)
- `hybrid-practices` (2 practices)
- `monastic-practices` (8 practices)
- `philosophical-practices` (6 practices)
- `neurological-practices` (8 practices)
- `integration-practices` (3 practices)

**Total**: 45 practices

## Inference Rules

### Category
Extracted from section headers (`### **Section Name**`)

### Applicable Patterns
Based on category:
- Traditional: All 4 patterns (past_prison, success_sabotage, compass_crisis, identity_collision)
- Faith-based: past_prison + compass_crisis
- Neurological: success_sabotage + identity_collision
- etc.

### Temperament Match
Keyword-based inference:
- **sage**: prayer, meditation, journal, wisdom, learning, reading
- **warrior**: movement, workout, exercise, strength, discipline
- **connector**: worship, community, social, blessing, connection
- **creator**: visualization, create, imagine, vision

### Difficulty Level
Time-based inference:
- **beginner**: < 10 minutes
- **intermediate**: 10-20 minutes
- **advanced**: > 20 minutes

### Time Commitment
Parsed from time field:
- "5-30 minutes" → min: 5, max: 30
- "10 minutes" → min: 10, max: 10
- "varies" → min: null, max: null
- "1-4 hours" → min: 60, max: 240

### States Created
Comma-separated list from "The State It Creates:" field

## Key Features

1. **Category Detection**: Tracks section headers to properly categorize all 45 practices
2. **Time Parsing**: Handles ranges, single values, hours, and variable times
3. **State Extraction**: Handles inline format (Time + States on same line)
4. **Escaped Characters**: Properly handles markdown escapes (`1\.` and `\+`)
5. **Nested Instructions**: Preserves numbered lists with sub-bullets
6. **Token Estimation**: Rough approximation (4 chars per token)

## Validation

**Test Results**:
- ✓ 45 practices parsed from test fixture
- ✓ 45 practices parsed from staging file
- ✓ All 7 categories properly detected
- ✓ Valid JSON output (55KB)
- ✓ All schema fields present

## Next Steps

1. Import JSON into `mio_knowledge_chunks` table
2. Generate embeddings using OpenAI API
3. Enable semantic search across Daily Deductible Library
4. Build similar parsers for remaining 205+ protocols

## Notes

- `is_emergency_protocol` and `practice_frequency` fields included in output but not yet in database schema
- Consider adding these fields to migration if needed for filtering
- Parser handles both test fixture and full staging file
- Category inference uses negative lookahead to avoid matching practice headers
