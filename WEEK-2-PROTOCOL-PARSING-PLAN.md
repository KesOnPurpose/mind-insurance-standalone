# Week 2: Protocol Parsing & Structuring - Implementation Plan

## 🎯 Mission Overview

Parse 250+ protocols from 3 source types into the `mio_knowledge_chunks` table for MIO's RAG-powered protocol library.

---

## 📊 Source Inventory (Parallel Analysis Complete)

### Source 1: Daily Deductible Library
- **Files**: 2 identical copies (use either)
  - `/Context/Daily Deductable Agent/📚 Daily Deductible Library_ Complete Practice Collection.md`
  - `/Purpose Waze Company/Context/UFB/📚 Daily Deductible Library_ Complete Practice Collection.md`
- **Size**: 654 lines
- **Protocols**: 45 practices across 6 categories
- **Structure**: Highly consistent 7-part template
- **Parsing Difficulty**: ⭐⭐☆☆☆ (Easy - most structured)

### Source 2: Avatar Assessment Neural Rewiring
- **File**: `/Purpose Waze Company/Context/30 Day Challenge/Identity Collision Avatar Assessment /neural_rewiring_protocols.txt`
- **Size**: 1,241 lines (46 KB)
- **Protocols**: 40 protocols (10 patterns × 4 temperaments)
- **Practices**: 160+ individual practices (4+ per protocol)
- **Structure**: Pattern × Temperament matrix with emergency protocols
- **Parsing Difficulty**: ⭐⭐⭐☆☆ (Medium - multi-level hierarchy)

### Source 3: MIO Knowledge Base (Research Protocols)
- **Location**: `/Purpose Waze Company/Context/30 Day Challenge/MIO-System-PRODUCTION/01-Knowledge-Base/`
- **Files**: 8 markdown files (5,723 lines total)
  - `mio-kb-03-protocol-library.md` (PRIMARY - 876 lines)
  - `mio-kb-07-neural-rewiring-protocols.md` (979 lines)
  - `mio-kb-08-forensic-to-protocol-integration.md` (756 lines - automation logic)
- **Protocols**: 45 practices with dual framing (clinical + user-facing)
- **Structure**: Clinical annotations + temperament variants + prescription logic
- **Parsing Difficulty**: ⭐⭐⭐⭐☆ (Hard - dual framing, IF-THEN rules)

**Total Estimated**: 250+ unique protocol entries after parsing all variants

---

## 🔍 Key Structural Findings

### Daily Deductible Library Pattern

```markdown
#### **[#]. [Practice Title]**

**Time:** [Duration] **The State It Creates:** [States list]

**Instructions:**
1. [Step 1 with sub-bullets]
2. [Step 2 with sub-bullets]
3. [Step 3]

**Why it works:** [Scientific explanation]
```

**Categories** (6 total):
1. Traditional Foundation (Practices 1-8)
2. Faith-Based (9-18)
3. Hybrid (19-20)
4. Monastic (21-28)
5. Philosophical (29-34)
6. Neurological (35-42)
7. Integration (43-45)

### Neural Rewiring Protocol Pattern

```markdown
## [#]. [PATTERN NAME]

### Coverage Package: "[Name]"
**What's Being Rewired**: [Description]

### [PATTERN] + [TEMPERAMENT] TEMPERAMENT

**Your Protocol: "[Protocol Name]"**

#### Practice 1: [Name] ([Duration], [Frequency])
**Why This Rewires the Pattern**: [Explanation]
**How to Do It**: [Steps]
**Expected Outcome**: [Results]

---

#### Emergency Protocol: [Name] ([Duration])
**When to Use**: [Triggers]
**What to Do**: [Crisis steps]
```

**Separation**: Protocols divided by `---` horizontal dividers

### Research Protocol Pattern (Dual Framing)

```markdown
PRACTICE [#]: [NAME]
Time: [range]
Pattern Fit: [patterns addressed]
Temperament: [WARRIOR/SAGE/CONNECTOR/BUILDER or ALL]
State Created: [outcomes]

[Temperament-specific versions]

Protocol:
1. [Steps]

Why It Works:
- Internal (Clinical): [Neuroscience mechanism]
- External (User-facing): [Marketing framing]
```

---

## 🗂️ Database Mapping Strategy

### `mio_knowledge_chunks` Table Columns (23 total)

```sql
-- Core Identification
id UUID PRIMARY KEY
source_file VARCHAR(255)      -- File path
file_number INTEGER            -- Source type: 1=Daily, 2=Neural, 3=Research
chunk_number INTEGER           -- Practice number within source

-- Content
chunk_text TEXT                -- Full practice markdown
chunk_summary TEXT             -- First sentence or description
category VARCHAR(100)          -- Traditional, Faith-Based, Neurological, etc.
subcategory VARCHAR(100)       -- Pattern name (Comparison, Impostor, etc.)

-- Vector Search
embedding vector(1536)         -- OpenAI text-embedding-3-small
fts tsvector                   -- Generated full-text search column

-- Pattern Matching
applicable_practice_types TEXT[] -- PROTECT practice types it supports
applicable_patterns TEXT[]       -- Identity collision patterns addressed

-- Practice Metadata
time_commitment_min INTEGER
time_commitment_max INTEGER
difficulty_level VARCHAR(20)    -- beginner/intermediate/advanced
temperament_match TEXT[]        -- warrior/sage/connector/builder
state_created TEXT[]            -- Psychological states generated

-- Administrative
tokens_approx INTEGER
priority_level INTEGER          -- 1-10 importance score
version VARCHAR(20)
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

## 🛠️ Parsing Implementation Plan

### Phase 1: File Processing & Normalization (Day 1)

**Goal**: Clean and prepare source files for parsing

```python
# Tasks:
1. Copy all source files to staging directory
2. Normalize encoding (UTF-8, handle emoji in filenames)
3. Deduplicate Daily Deductible Library (use one copy)
4. Standardize whitespace (tabs → spaces)
5. Remove smart quotes, normalize markdown
6. Create backup of original files

# Deliverable:
- `/staging/daily-deductible-normalized.md`
- `/staging/neural-rewiring-normalized.txt`
- `/staging/research-protocols-normalized.md`
```

### Phase 2: Parser Development (Days 2-4)

**Goal**: Build modular parsers for each source type

#### Parser 1: Daily Deductible Parser

```python
class DailyDeductibleParser:
    """
    Parses 45 practices from Daily Deductible Library

    Strategy:
    - Split by heading: #### **[#].**
    - Extract metadata with regex
    - Parse numbered instructions list
    - Infer temperament from category
    """

    def parse_practice(self, section: str) -> dict:
        practice_id = extract_number(section)
        title = extract_title(section)
        time_range = extract_time(section)
        states = extract_states(section)
        instructions = parse_instructions(section)
        why_works = extract_why_works(section)
        category = self.current_category

        return {
            'source_file': 'daily_deductible_library.md',
            'file_number': 1,
            'chunk_number': practice_id,
            'chunk_text': section,
            'chunk_summary': title,
            'category': category,
            'time_commitment_min': time_range[0],
            'time_commitment_max': time_range[1],
            'state_created': states,
            'applicable_patterns': infer_patterns(category),
            'temperament_match': infer_temperament(category, practice_id),
            'difficulty_level': infer_difficulty(category)
        }
```

**Regex Patterns**:
```python
PRACTICE_HEADER = r'^\s*####\s+\*?\*?(\d+)\.\s+\*?\*?(.+?)\*?\*?$'
TIME_EXTRACT = r'\*\*Time:\*\*\s+([^\*]+)'
STATES_EXTRACT = r'\*\*The State It Creates:\*\*\s+([^\*]+)'
INSTRUCTIONS_BLOCK = r'\*\*Instructions:\*\*\n(.*?)(?=\*\*Why it works|\Z)'
WHY_IT_WORKS = r'\*\*Why it works:\*\*\s+(.+?)(?=^---|^##|^####|\Z)'
```

#### Parser 2: Neural Rewiring Parser

```python
class NeuralRewiringParser:
    """
    Parses 160+ practices from neural_rewiring_protocols.txt

    Strategy:
    - Split by "---" dividers
    - Extract pattern + temperament from headers
    - Parse 4+ practices per protocol
    - Extract emergency protocol separately
    """

    def parse_protocol(self, section: str) -> List[dict]:
        pattern = extract_pattern(section)
        temperament = extract_temperament(section)
        protocol_name = extract_protocol_name(section)

        practices = []
        for practice_block in split_practices(section):
            practice = {
                'source_file': 'neural_rewiring_protocols.txt',
                'file_number': 2,
                'category': pattern,
                'subcategory': f'{pattern}_{temperament}',
                'temperament_match': [temperament.lower()],
                'chunk_text': practice_block,
                # ... extract other fields
            }
            practices.append(practice)

        # Add emergency protocol
        emergency = extract_emergency_protocol(section)
        if emergency:
            practices.append(emergency)

        return practices
```

**Regex Patterns**:
```python
PATTERN_HEADER = r'^##\s+(\d+)\.\s+(.+?)$'
TEMPERAMENT_SECTION = r'^###\s+(.+?)\s+\+\s+(WARRIOR|SAGE|CONNECTOR|BUILDER)'
PROTOCOL_NAME = r'\*\*Your Protocol:\s+"(.+?)"'
PRACTICE_HEADER = r'####\s+Practice\s+(\d+):\s+(.+?)\s+\((.+?),\s+(.+?)\)'
EMERGENCY_PROTOCOL = r'####\s+Emergency Protocol:\s+(.+?)\s+\((.+?)\)'
```

#### Parser 3: Research Protocol Parser

```python
class ResearchProtocolParser:
    """
    Parses 45 practices from MIO Knowledge Base files

    Strategy:
    - Extract dual framing (clinical + user-facing)
    - Parse temperament variants (4 per practice)
    - Extract prescription logic from forensic file
    - Store clinical mechanism separately
    """

    def parse_practice(self, section: str) -> List[dict]:
        practice_id = extract_practice_id(section)
        base_data = extract_base_metadata(section)

        # Parse 4 temperament variants
        variants = []
        for temperament in ['WARRIOR', 'SAGE', 'CONNECTOR', 'BUILDER']:
            variant = extract_temperament_variant(section, temperament)
            variant_data = {
                **base_data,
                'temperament_match': [temperament.lower()],
                'chunk_text': variant['instructions'],
                'subcategory': f'{base_data["category"]}_{temperament}',
                'clinical_framing': variant['internal'],
                'user_framing': variant['external']
            }
            variants.append(variant_data)

        return variants
```

### Phase 3: Vector Embedding Generation (Day 5)

**Goal**: Generate OpenAI embeddings for all parsed protocols

```python
import openai
from typing import List

class EmbeddingGenerator:
    """
    Generates vector embeddings using OpenAI API
    """

    def __init__(self, api_key: str):
        openai.api_key = api_key

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for single text chunk
        Uses: text-embedding-3-small (1536 dimensions)
        """
        response = await openai.Embedding.acreate(
            model="text-embedding-3-small",
            input=text
        )
        return response['data'][0]['embedding']

    async def batch_generate(self, texts: List[str], batch_size: int = 100):
        """
        Generate embeddings in batches to optimize API calls
        """
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_embeddings = await asyncio.gather(*[
                self.generate_embedding(text) for text in batch
            ])
            embeddings.extend(batch_embeddings)
        return embeddings
```

**Embedding Strategy**:
- Combine title + summary + first 500 chars of instructions
- Batch process in groups of 100 to optimize API costs
- Estimate: 250 protocols × $0.00002/1K tokens ≈ $0.50-$1.00 total

### Phase 4: Database Insertion (Day 6)

**Goal**: Insert all parsed + embedded protocols into `mio_knowledge_chunks`

```python
from supabase import create_client
import asyncpg

class ProtocolInserter:
    """
    Inserts parsed protocols into mio_knowledge_chunks table
    """

    def __init__(self, supabase_url: str, service_key: str):
        self.client = create_client(supabase_url, service_key)

    async def insert_protocol(self, protocol: dict):
        """
        Insert single protocol with conflict resolution
        """
        try:
            result = self.client.table('mio_knowledge_chunks').insert({
                'source_file': protocol['source_file'],
                'file_number': protocol['file_number'],
                'chunk_number': protocol['chunk_number'],
                'chunk_text': protocol['chunk_text'],
                'chunk_summary': protocol['chunk_summary'],
                'category': protocol['category'],
                'subcategory': protocol.get('subcategory'),
                'embedding': protocol['embedding'],
                'applicable_patterns': protocol.get('applicable_patterns', []),
                'temperament_match': protocol.get('temperament_match', []),
                'state_created': protocol.get('state_created', []),
                'time_commitment_min': protocol.get('time_commitment_min'),
                'time_commitment_max': protocol.get('time_commitment_max'),
                'difficulty_level': protocol.get('difficulty_level'),
                'tokens_approx': len(protocol['chunk_text'].split()),
                'is_active': True
            }).execute()
            return result
        except Exception as e:
            print(f"Error inserting protocol {protocol['chunk_number']}: {e}")
            raise

    async def batch_insert(self, protocols: List[dict], batch_size: int = 50):
        """
        Insert protocols in batches with error handling
        """
        for i in range(0, len(protocols), batch_size):
            batch = protocols[i:i+batch_size]
            try:
                await asyncio.gather(*[
                    self.insert_protocol(p) for p in batch
                ])
                print(f"Inserted batch {i//batch_size + 1} ({len(batch)} protocols)")
            except Exception as e:
                print(f"Batch {i//batch_size + 1} failed, inserting one-by-one")
                for protocol in batch:
                    try:
                        await self.insert_protocol(protocol)
                    except Exception as pe:
                        print(f"Failed to insert: {protocol['chunk_summary']}: {pe}")
```

### Phase 5: Validation & Testing (Day 7)

**Goal**: Verify data integrity and search functionality

```sql
-- Validation Query 1: Count by source
SELECT
  source_file,
  category,
  COUNT(*) as protocol_count
FROM mio_knowledge_chunks
GROUP BY source_file, category
ORDER BY source_file, category;

-- Expected Results:
-- daily_deductible_library.md | Traditional Foundation | 8
-- daily_deductible_library.md | Faith-Based            | 10
-- ...
-- neural_rewiring_protocols.txt | Comparison + Warrior | 5
-- ...
-- Total: ~250 rows

-- Validation Query 2: Check embeddings
SELECT COUNT(*) as missing_embeddings
FROM mio_knowledge_chunks
WHERE embedding IS NULL;

-- Expected: 0

-- Validation Query 3: Test vector search
SELECT
  chunk_summary,
  category,
  1 - (embedding <=> '[test_embedding_vector]') as similarity
FROM mio_knowledge_chunks
WHERE is_active = true
ORDER BY embedding <=> '[test_embedding_vector]'
LIMIT 10;

-- Should return relevant protocols ranked by similarity
```

---

## 📋 Success Metrics

**Completeness**:
- ✅ 45 Daily Deductible practices parsed
- ✅ 160+ Neural Rewiring practices parsed
- ✅ 45+ Research protocols parsed (with temperament variants)
- ✅ Total: 250+ database entries

**Data Quality**:
- ✅ 100% have embeddings (no NULL values)
- ✅ 100% have time_commitment (min/max or variable)
- ✅ 95%+ have temperament_match populated
- ✅ 100% have applicable_patterns array
- ✅ All text properly normalized (no encoding errors)

**Search Performance**:
- ✅ Vector search returns results in <100ms
- ✅ Full-text search works for keyword queries
- ✅ Pattern filtering returns correct protocols
- ✅ Temperament filtering returns correct variants

---

## 🚀 Week 2 Daily Schedule

### Day 1 (Monday): File Processing
- [ ] Copy all source files to staging
- [ ] Normalize encoding and whitespace
- [ ] Deduplicate Daily Deductible copies
- [ ] Create test fixtures (5 protocols per source)

### Day 2 (Tuesday): Daily Deductible Parser
- [ ] Build DailyDeductibleParser class
- [ ] Test on 5 practice fixtures
- [ ] Parse all 45 practices
- [ ] Validate extracted metadata

### Day 3 (Wednesday): Neural Rewiring Parser
- [ ] Build NeuralRewiringParser class
- [ ] Test protocol boundary detection
- [ ] Parse all 40 protocols (160+ practices)
- [ ] Extract emergency protocols

### Day 4 (Thursday): Research Protocol Parser
- [ ] Build ResearchProtocolParser class
- [ ] Parse dual framing (clinical + user)
- [ ] Extract temperament variants
- [ ] Parse all 45 practices

### Day 5 (Friday): Embedding Generation
- [ ] Set up OpenAI API client
- [ ] Generate embeddings for all protocols
- [ ] Validate embedding dimensions (1536)
- [ ] Save embeddings to parsed data

### Day 6 (Saturday): Database Insertion
- [ ] Test insertion with 10 sample protocols
- [ ] Batch insert all Daily Deductible
- [ ] Batch insert all Neural Rewiring
- [ ] Batch insert all Research protocols
- [ ] Run integrity checks

### Day 7 (Sunday): Validation & Documentation
- [ ] Run all validation queries
- [ ] Test vector search functionality
- [ ] Test full-text search
- [ ] Document any manual fixes needed
- [ ] Create Week 2 completion report

---

## 🎯 Next Steps After Week 2

Once all 250+ protocols are in the database:

**Week 3: Embedding Optimization**
- Test search quality with real queries
- Fine-tune similarity thresholds
- Add metadata boosting (pattern matching bonus)

**Week 4: Brain Science Glossary**
- Extract neurological terms from protocols
- Build glossary definitions
- Link glossary to protocols

**Week 5: MIO Prompt Transformation**
- Integrate protocol library into MIO system prompt
- Add RAG retrieval logic
- Test protocol recommendations

**Week 6: Production Launch**
- User testing with real conversations
- Performance optimization
- Deploy to production

---

## 📁 File Structure

```
/Week-2-Protocol-Parsing/
├── parsers/
│   ├── daily_deductible_parser.py
│   ├── neural_rewiring_parser.py
│   └── research_protocol_parser.py
├── embeddings/
│   └── embedding_generator.py
├── database/
│   └── protocol_inserter.py
├── staging/
│   ├── daily-deductible-normalized.md
│   ├── neural-rewiring-normalized.txt
│   └── research-protocols-normalized.md
├── output/
│   ├── daily_deductible_parsed.json
│   ├── neural_rewiring_parsed.json
│   └── research_protocols_parsed.json
└── tests/
    ├── test_parsers.py
    └── test_database_insertion.py
```

---

## ✅ Week 1 Complete | 🚀 Week 2 Ready to Launch!

Database foundation is solid with 23 columns, vector search enabled, and RLS configured. Ready to populate with 250+ protocols!
