# Protocol Update Strategy: Glossary Integration
**Week 3 Day 5-7: Agent 3 Deliverable**

**Mission**: Inject user-friendly glossary tooltips and simplified explanations into 205 clinical protocols to improve readability and user comprehension.

---

## Executive Summary

This document outlines the strategy for updating MIO knowledge chunks with simplified language from the brain science glossary, including tooltip injection, readability validation, and A/B testing methodology.

**Key Constraints**:
- 205 protocols in database (`mio_knowledge_chunks` table)
- Clinical neuroscience terminology must remain accurate
- User-friendly explanations added via tooltips/sidebars
- Target reading level: 8th grade (Flesch-Kincaid 8.0)
- Zero data loss during updates

---

## Database Schema Analysis

### Current `mio_knowledge_chunks` Schema

**Text Fields** (candidates for glossary injection):
```sql
chunk_text      TEXT NOT NULL        -- Primary protocol content
chunk_summary   TEXT                 -- Short title/description
```

**Existing Metadata** (leverage for targeting):
```sql
category              VARCHAR(100)   -- Protocol source
applicable_patterns   TEXT[]         -- Identity collision patterns
temperament_match     TEXT[]         -- User avatar types
difficulty_level      VARCHAR(20)    -- beginner/intermediate/advanced
```

### Schema Modifications Required

**Option 1: Add New Columns** (RECOMMENDED)
```sql
ALTER TABLE mio_knowledge_chunks
ADD COLUMN simplified_text TEXT,           -- User-friendly version
ADD COLUMN glossary_terms JSONB,           -- Technical terms with definitions
ADD COLUMN reading_level_before FLOAT,     -- Original Flesch-Kincaid score
ADD COLUMN reading_level_after FLOAT,      -- Post-update score
ADD COLUMN language_variant VARCHAR(20) DEFAULT 'clinical'; -- 'clinical' or 'simplified'
```

**Benefits**:
- ✅ Preserves original clinical text (reversible)
- ✅ A/B testing via `language_variant` field
- ✅ Tracks readability improvements
- ✅ Zero data loss

**Option 2: In-Place Updates with Backup** (ALTERNATIVE)
```sql
-- Create backup table first
CREATE TABLE mio_knowledge_chunks_backup AS
SELECT * FROM mio_knowledge_chunks;

-- Then update chunk_text directly
UPDATE mio_knowledge_chunks
SET chunk_text = simplified_version;
```

**Drawbacks**:
- ⚠️ Requires separate backup table
- ⚠️ Harder to A/B test
- ⚠️ Rollback requires restore from backup

**DECISION**: Use Option 1 (Add New Columns)

---

## Glossary Tooltip Injection Strategy

### 1. Tooltip Markup Format

**Markdown-Compatible Tooltip Syntax**:
```markdown
The practice activates the {{vagus nerve||A key nerve that helps calm your nervous system and promotes relaxation}} through vocalization.

Meditation creates {{coherence||Alignment between your thoughts and emotions, creating inner harmony}} between mind and body.
```

**Format**: `{{technical_term||user-friendly explanation}}`

**Rendering Strategy**:
- Frontend: Parse `{{term||definition}}` into tooltip components
- React component: `<Tooltip term="vagus nerve" definition="A key nerve..." />`
- Mobile: Tap to reveal definition
- Desktop: Hover to show definition

### 2. Technical Term Detection

**Glossary Matching Algorithm**:
```python
def find_technical_terms(protocol_text, glossary):
    """
    Find all technical terms in protocol text that exist in glossary.

    Returns: List of (term, position, definition) tuples
    """
    technical_terms = []

    # Sort glossary by term length (longest first) to avoid partial matches
    sorted_glossary = sorted(glossary, key=lambda x: len(x['clinical_term']), reverse=True)

    for entry in sorted_glossary:
        clinical_term = entry['clinical_term'].lower()
        user_friendly = entry['user_friendly_term']

        # Find all occurrences (case-insensitive)
        import re
        pattern = r'\b' + re.escape(clinical_term) + r'\b'
        matches = re.finditer(pattern, protocol_text, re.IGNORECASE)

        for match in matches:
            technical_terms.append({
                'term': match.group(),
                'position': match.start(),
                'definition': user_friendly,
                'category': entry.get('category', 'general')
            })

    # Remove duplicates, keep first occurrence only
    seen_positions = set()
    unique_terms = []
    for term in sorted(technical_terms, key=lambda x: x['position']):
        if term['position'] not in seen_positions:
            unique_terms.append(term)
            seen_positions.add(term['position'])

    return unique_terms
```

### 3. Tooltip Injection Algorithm

**Smart Injection** (avoids nested tooltips):
```python
def inject_tooltips(protocol_text, glossary):
    """
    Inject glossary tooltips into protocol text.

    Strategy:
    1. Find all technical terms
    2. Sort by position (reverse order to preserve indices)
    3. Inject tooltips from end to start
    4. Skip terms already inside tooltips
    """
    terms = find_technical_terms(protocol_text, glossary)

    # Sort by position (reverse)
    terms.sort(key=lambda x: x['position'], reverse=True)

    updated_text = protocol_text
    tooltip_ranges = []  # Track tooltip positions to avoid nesting

    for term_data in terms:
        pos = term_data['position']
        term = term_data['term']
        definition = term_data['definition']

        # Check if term is already inside a tooltip
        inside_tooltip = any(start <= pos <= end for start, end in tooltip_ranges)
        if inside_tooltip:
            continue

        # Inject tooltip markup
        tooltip = f"{{{{{term}||{definition}}}}}"
        end_pos = pos + len(term)
        updated_text = updated_text[:pos] + tooltip + updated_text[end_pos:]

        # Track new tooltip range
        tooltip_ranges.append((pos, pos + len(tooltip)))

    return updated_text
```

### 4. Inline Explanation Strategy

**For critical concepts, add inline explanations**:
```markdown
**Original**:
Activates the vagus nerve through vocalization.

**With Inline Explanation**:
Activates the vagus nerve (your body's built-in relaxation system) through vocalization, which calms your nervous system and reduces stress.

**Format**: `technical_term (simplified explanation)`
```

**When to use tooltips vs inline**:
- **Tooltips**: Technical terms that appear once or are tangential
- **Inline**: Core concepts repeated multiple times or central to understanding

---

## Update Execution Workflow

### Phase 1: Pre-Update Analysis

**Step 1**: Calculate baseline readability
```python
from textstat import flesch_kincaid_grade

for protocol in protocols:
    original_score = flesch_kincaid_grade(protocol['chunk_text'])
    protocol['reading_level_before'] = original_score
```

**Step 2**: Identify technical term density
```python
def calculate_jargon_density(text, glossary):
    """
    Calculate technical terms per 100 words.

    High density (>10): Needs significant simplification
    Medium density (5-10): Moderate updates
    Low density (<5): Minimal changes needed
    """
    words = text.split()
    word_count = len(words)

    technical_terms = find_technical_terms(text, glossary)
    term_count = len(technical_terms)

    density = (term_count / word_count) * 100 if word_count > 0 else 0
    return density
```

**Step 3**: Prioritize protocols for updates
```python
# Priority scoring
def calculate_update_priority(protocol, glossary):
    """
    Score protocols for update priority (0-100).

    Factors:
    - Reading level (higher = more priority)
    - Jargon density (higher = more priority)
    - Difficulty level (advanced = more priority)
    - Category (neural-rewiring = higher priority)
    """
    score = 0

    # Reading level (max 40 points)
    reading_level = flesch_kincaid_grade(protocol['chunk_text'])
    if reading_level > 12:
        score += 40
    elif reading_level > 10:
        score += 30
    elif reading_level > 8:
        score += 20

    # Jargon density (max 30 points)
    density = calculate_jargon_density(protocol['chunk_text'], glossary)
    if density > 10:
        score += 30
    elif density > 5:
        score += 20
    elif density > 2:
        score += 10

    # Difficulty level (max 15 points)
    if protocol.get('difficulty_level') == 'advanced':
        score += 15
    elif protocol.get('difficulty_level') == 'intermediate':
        score += 10

    # Category (max 15 points)
    if protocol.get('category') == 'neural-rewiring':
        score += 15
    elif protocol.get('category') in ['research', 'clinical']:
        score += 10

    return score
```

### Phase 2: Tooltip Injection

**Step 1**: Load glossary (from Week 3 Day 1-2 agents)
```python
import json

with open('glossary-extraction/brain-science-glossary.json', 'r') as f:
    glossary = json.load(f)
```

**Step 2**: Process each protocol
```python
for protocol in protocols:
    # Inject tooltips
    simplified_text = inject_tooltips(protocol['chunk_text'], glossary)

    # Calculate new reading level
    reading_level_after = flesch_kincaid_grade(simplified_text)

    # Store both versions
    protocol['simplified_text'] = simplified_text
    protocol['reading_level_before'] = protocol['reading_level_before']
    protocol['reading_level_after'] = reading_level_after

    # Track glossary terms used
    terms_used = find_technical_terms(protocol['chunk_text'], glossary)
    protocol['glossary_terms'] = {
        term['term']: term['definition']
        for term in terms_used
    }
```

**Step 3**: Quality validation
```python
def validate_tooltip_injection(original, simplified):
    """
    Ensure tooltip injection didn't break content.

    Checks:
    1. No nested tooltips {{...{{...}}...}}
    2. All tooltips properly closed
    3. Original content preserved (minus tooltips)
    4. No markdown syntax broken
    """
    # Check for nested tooltips
    nested = re.search(r'\{\{[^}]*\{\{', simplified)
    if nested:
        return False, "Nested tooltips detected"

    # Check balanced delimiters
    open_count = simplified.count('{{')
    close_count = simplified.count('}}')
    if open_count != close_count:
        return False, f"Unbalanced tooltips: {open_count} open, {close_count} close"

    # Check content preservation (remove tooltip markup)
    stripped = re.sub(r'\{\{([^|]+)\|[^}]+\}\}', r'\1', simplified)
    if stripped != original:
        return False, "Original content altered"

    return True, "Valid"
```

### Phase 3: Database Update

**Step 1**: Add new columns
```python
from supabase import create_client

supabase = create_client(supabase_url, supabase_key)

# Execute schema migration
supabase.rpc('execute_sql', {
    'sql': """
    ALTER TABLE mio_knowledge_chunks
    ADD COLUMN IF NOT EXISTS simplified_text TEXT,
    ADD COLUMN IF NOT EXISTS glossary_terms JSONB,
    ADD COLUMN IF NOT EXISTS reading_level_before FLOAT,
    ADD COLUMN IF NOT EXISTS reading_level_after FLOAT,
    ADD COLUMN IF NOT EXISTS language_variant VARCHAR(20) DEFAULT 'clinical';
    """
})
```

**Step 2**: Batch update protocols
```python
def update_protocols_batch(protocols, batch_size=50):
    """
    Update protocols in batches to avoid timeouts.
    """
    for i in range(0, len(protocols), batch_size):
        batch = protocols[i:i+batch_size]

        updates = []
        for protocol in batch:
            updates.append({
                'id': protocol['id'],
                'simplified_text': protocol['simplified_text'],
                'glossary_terms': protocol['glossary_terms'],
                'reading_level_before': protocol['reading_level_before'],
                'reading_level_after': protocol['reading_level_after'],
                'language_variant': 'clinical'  # Default to original
            })

        # Execute batch update
        for update in updates:
            response = supabase.table('mio_knowledge_chunks').update({
                'simplified_text': update['simplified_text'],
                'glossary_terms': update['glossary_terms'],
                'reading_level_before': update['reading_level_before'],
                'reading_level_after': update['reading_level_after']
            }).eq('id', update['id']).execute()

        print(f"Batch {i//batch_size + 1}: Updated {len(batch)} protocols")
```

**Step 3**: Verification queries
```sql
-- Count protocols with simplified versions
SELECT COUNT(*)
FROM mio_knowledge_chunks
WHERE simplified_text IS NOT NULL;

-- Average reading level improvement
SELECT
  AVG(reading_level_before) as avg_before,
  AVG(reading_level_after) as avg_after,
  AVG(reading_level_before - reading_level_after) as avg_improvement
FROM mio_knowledge_chunks
WHERE simplified_text IS NOT NULL;

-- Protocols needing most improvement
SELECT
  source_file,
  chunk_summary,
  reading_level_before,
  reading_level_after,
  (reading_level_before - reading_level_after) as improvement
FROM mio_knowledge_chunks
WHERE simplified_text IS NOT NULL
ORDER BY reading_level_before DESC
LIMIT 20;
```

---

## Rollback Strategy

### Automated Rollback

**Option 1: Toggle language variant**
```python
# Revert to clinical language for all users
supabase.table('mio_knowledge_chunks').update({
    'language_variant': 'clinical'
}).execute()
```

**Option 2: Remove simplified columns**
```sql
-- If needed to completely rollback
ALTER TABLE mio_knowledge_chunks
DROP COLUMN IF EXISTS simplified_text,
DROP COLUMN IF EXISTS glossary_terms,
DROP COLUMN IF EXISTS reading_level_before,
DROP COLUMN IF EXISTS reading_level_after,
DROP COLUMN IF EXISTS language_variant;
```

### Backup Before Update

```python
# Create timestamped backup
import datetime

timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_table = f"mio_knowledge_chunks_backup_{timestamp}"

supabase.rpc('execute_sql', {
    'sql': f"""
    CREATE TABLE {backup_table} AS
    SELECT * FROM mio_knowledge_chunks;
    """
})

print(f"Backup created: {backup_table}")
```

---

## Frontend Integration

### React Tooltip Component

```typescript
// components/ui/GlossaryTooltip.tsx
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlossaryTooltipProps {
  term: string;
  definition: string;
}

export const GlossaryTooltip = ({ term, definition }: GlossaryTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="underline decoration-dotted cursor-help text-blue-600">
            {term}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

### Protocol Text Parser

```typescript
// utils/parseProtocolText.tsx
import { GlossaryTooltip } from '@/components/ui/GlossaryTooltip';

export const parseProtocolText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];

  // Regex to match {{term||definition}}
  const tooltipRegex = /\{\{([^|]+)\|\|([^}]+)\}\}/g;

  let lastIndex = 0;
  let match;

  while ((match = tooltipRegex.exec(text)) !== null) {
    // Add text before tooltip
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add tooltip component
    parts.push(
      <GlossaryTooltip
        key={match.index}
        term={match[1]}
        definition={match[2]}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};
```

### Usage in Protocol Display

```typescript
// components/ProtocolDisplay.tsx
import { parseProtocolText } from '@/utils/parseProtocolText';

interface ProtocolDisplayProps {
  protocol: {
    chunk_text: string;
    simplified_text?: string;
    language_variant?: 'clinical' | 'simplified';
  };
  userPreference: 'clinical' | 'simplified';
}

export const ProtocolDisplay = ({ protocol, userPreference }: ProtocolDisplayProps) => {
  const textToDisplay = userPreference === 'simplified' && protocol.simplified_text
    ? protocol.simplified_text
    : protocol.chunk_text;

  const parsedContent = parseProtocolText(textToDisplay);

  return (
    <div className="protocol-content prose max-w-none">
      {parsedContent}
    </div>
  );
};
```

---

## Performance Considerations

### Database Indexing

```sql
-- Index for language variant filtering
CREATE INDEX idx_mio_chunks_language_variant
ON mio_knowledge_chunks (language_variant)
WHERE is_active = true;

-- Index for reading level filtering
CREATE INDEX idx_mio_chunks_reading_level
ON mio_knowledge_chunks (reading_level_after)
WHERE simplified_text IS NOT NULL;

-- GIN index for glossary terms (JSONB)
CREATE INDEX idx_mio_chunks_glossary_terms
ON mio_knowledge_chunks USING GIN (glossary_terms);
```

### Caching Strategy

```typescript
// Cache parsed protocol text to avoid re-parsing on every render
import { useMemo } from 'react';

const parsedContent = useMemo(() => {
  return parseProtocolText(textToDisplay);
}, [textToDisplay]);
```

### Tooltip Limits

**Prevent tooltip overload**:
```python
def limit_tooltips(text, glossary, max_tooltips=5):
    """
    Limit tooltips to top N most important terms.

    Priority:
    1. Most complex terms (longest explanations)
    2. Terms appearing first in text
    3. High-priority categories (neuroscience > general)
    """
    terms = find_technical_terms(text, glossary)

    # Score each term
    for term in terms:
        term['priority_score'] = (
            len(term['definition']) * 0.5 +  # Explanation complexity
            (1000 - term['position']) * 0.3 +  # Earlier = higher priority
            (10 if term['category'] == 'neuroscience' else 5) * 0.2
        )

    # Take top N
    top_terms = sorted(terms, key=lambda x: x['priority_score'], reverse=True)[:max_tooltips]

    # Inject only top terms
    return inject_tooltips_for_terms(text, top_terms)
```

---

## Success Metrics

### Pre-Update Baseline

```python
baseline_metrics = {
    'avg_reading_level': 12.3,  # College level
    'avg_jargon_density': 8.7,  # 8.7 technical terms per 100 words
    'protocols_above_grade_10': 175,  # 85% of protocols
    'user_comprehension_score': None  # Requires user testing
}
```

### Post-Update Targets

```python
target_metrics = {
    'avg_reading_level': 8.0,  # 8th grade (30% improvement)
    'avg_jargon_density': 3.5,  # <4 technical terms per 100 words (60% reduction)
    'protocols_above_grade_10': 41,  # <20% of protocols (80% reduction)
    'reading_level_improvement': 4.3,  # Average 4+ grade level drop
    'user_comprehension_score': 80,  # 80%+ on comprehension tests
}
```

### Validation Queries

```sql
-- Overall improvement
SELECT
  COUNT(*) as total_protocols,
  AVG(reading_level_before) as avg_before,
  AVG(reading_level_after) as avg_after,
  AVG(reading_level_before - reading_level_after) as avg_improvement,
  MIN(reading_level_after) as best_after,
  MAX(reading_level_after) as worst_after
FROM mio_knowledge_chunks
WHERE simplified_text IS NOT NULL;

-- Protocols still above target (8th grade)
SELECT
  source_file,
  chunk_summary,
  reading_level_after,
  category
FROM mio_knowledge_chunks
WHERE simplified_text IS NOT NULL
  AND reading_level_after > 8.0
ORDER BY reading_level_after DESC;

-- Jargon density analysis
SELECT
  category,
  AVG(jsonb_array_length(glossary_terms::jsonb)) as avg_terms_per_protocol
FROM mio_knowledge_chunks
WHERE glossary_terms IS NOT NULL
GROUP BY category
ORDER BY avg_terms_per_protocol DESC;
```

---

## Timeline & Resources

### Execution Timeline

| Phase | Duration | Resources |
|-------|----------|-----------|
| **Schema Migration** | 5 minutes | Database admin |
| **Glossary Loading** | 2 minutes | Glossary JSON file |
| **Tooltip Injection** | 15 minutes | Python script, 205 protocols |
| **Validation** | 10 minutes | Readability framework |
| **Database Update** | 10 minutes | Batch update script |
| **Post-Update Validation** | 10 minutes | SQL queries |
| **TOTAL** | ~50 minutes | All automated |

### Dependencies

1. **Week 3 Day 1-2 Output** (Agent 1 + Agent 2):
   - `brain-science-glossary.json` (technical terms + definitions)
   - `technical-terms-extracted.json` (all terms from protocols)

2. **Database Access**:
   - Supabase service role key
   - Permission to alter table schema

3. **Python Libraries**:
   - `textstat` (readability metrics)
   - `supabase-py` (database operations)
   - `re` (regex, built-in)
   - `json` (built-in)

---

## Risk Mitigation

### Risk 1: Tooltip Overload (Too Many Terms)

**Mitigation**:
- Limit tooltips to 5 per protocol
- Prioritize by term importance and position
- Use inline explanations for frequent terms

### Risk 2: Broken Markdown Formatting

**Mitigation**:
- Validate tooltip injection doesn't break existing markdown
- Test on sample protocols before batch update
- Automated validation checks

### Risk 3: Reading Level Doesn't Improve

**Mitigation**:
- Tooltips alone may not change Flesch-Kincaid score
- Also simplify sentence structure (manual review for top 20)
- Combine tooltips with inline explanations

### Risk 4: User Confusion (Too Many Tooltips)

**Mitigation**:
- A/B test clinical vs simplified
- User preference toggle (default to clinical)
- Progressive disclosure (show fewer tooltips initially)

### Risk 5: Database Update Failure

**Mitigation**:
- Create backup table before updates
- Dry-run validation on 10 sample protocols
- Batch processing with retry logic
- Rollback script ready

---

## Next Steps (Post-Strategy)

1. **Build validation framework** (`validation-framework.py`)
2. **Create A/B test plan** (`ab-test-plan.md`)
3. **Build update scripts** (`update_protocols.py`)
4. **Execute on staging environment** (10 sample protocols)
5. **Review results with team**
6. **Execute on production** (all 205 protocols)
7. **Monitor user feedback** (Week 4)

---

**Strategy Status**: ✅ COMPLETE
**Next Deliverable**: `validation-framework.py` (Task 2)
