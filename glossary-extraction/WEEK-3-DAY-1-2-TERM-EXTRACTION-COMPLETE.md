# Week 3 Day 1-2: Term Extraction Complete

## Mission Accomplished

**Agent 1 of 3** has successfully extracted all technical neuroscience and psychology terms from the 205 protocols.

## Database Query Results

- **Total Chunks Analyzed**: 205
- **Unique Protocols**: 10
- **Database**: hpyodaugrkctagkrfofj.supabase.co
- **Table**: mio_knowledge_chunks

## Extraction Statistics

### Overall Results
- **Total Unique Technical Terms**: 62
- **Total Term Occurrences**: 554
- **Average Terms per Protocol**: 55.40

### Terms by Category

- **BRAIN STRUCTURES**: 6 unique terms
- **NEUROCHEMICALS**: 3 unique terms
- **NEURAL PROCESSES**: 4 unique terms
- **PSYCHOLOGICAL CONCEPTS**: 20 unique terms
- **CLINICAL TECHNIQUES**: 9 unique terms
- **BEHAVIORAL PATTERNS**: 8 unique terms
- **EMOTIONAL STATES**: 6 unique terms
- **TRAUMA RELATED**: 7 unique terms

### Top 20 Most Frequent Terms

1. **trigger** - 67 occurrences
2. **rumination** - 49 occurrences
3. **avoidance** - 43 occurrences
4. **anxiety** - 28 occurrences
5. **impostor syndrome** - 26 occurrences
6. **procrastination** - 23 occurrences
7. **visualization** - 22 occurrences
8. **overwhelm** - 20 occurrences
9. **amygdala** - 18 occurrences
10. **trauma** - 16 occurrences
11. **dopamine** - 14 occurrences
12. **identity collision** - 13 occurrences
13. **prefrontal cortex** - 13 occurrences
14. **cognitive restructuring** - 12 occurrences
15. **guilt** - 11 occurrences
16. **act** - 11 occurrences
17. **neural rewiring** - 11 occurrences
18. **reinforcement** - 9 occurrences
19. **neural pathway** - 9 occurrences
20. **self-compassion** - 8 occurrences

### Top Terms by Category


#### BRAIN STRUCTURES
1. amygdala (18)
2. prefrontal cortex (13)
3. limbic system (5)
4. hippocampus (3)
5. anterior cingulate cortex (3)


#### NEUROCHEMICALS
1. dopamine (14)
2. adrenaline (1)
3. cortisol (1)


#### NEURAL PROCESSES
1. neural rewiring (11)
2. neural pathway (9)
3. neuroplasticity (8)
4. habituation (2)


#### PSYCHOLOGICAL CONCEPTS
1. rumination (49)
2. impostor syndrome (26)
3. identity collision (13)
4. self-compassion (8)
5. self-sabotage (7)


#### CLINICAL TECHNIQUES
1. visualization (22)
2. act (11)
3. cognitive restructuring (6)
4. cbt (6)
5. emdr (6)


#### BEHAVIORAL PATTERNS
1. trigger (67)
2. avoidance (43)
3. procrastination (23)
4. reinforcement (9)
5. engagement (7)


#### EMOTIONAL STATES
1. anxiety (28)
2. overwhelm (20)
3. guilt (11)
4. dissociation (3)
5. panic (2)


#### TRAUMA RELATED
1. trauma (16)
2. parasympathetic nervous system (5)
3. ptsd (3)
4. autonomic nervous system (2)
5. survival mode (1)


### Protocols with Highest Technical Density

Top 10 protocols with most technical terms:

1. **mio-kb-07-neural-rewiring-protocols.md** - 181 terms (40 unique)
2. **mio-kb-08-forensic-to-protocol-integration.md** - 83 terms (23 unique)
3. **mio-kb-06-data-coaching.md** - 73 terms (21 unique)
4. **mio-kb-03-protocol-library.md** - 61 terms (26 unique)
5. **daily_deductible_library.md** - 42 terms (22 unique)
6. **mio-kb-05-emergency-tools.md** - 39 terms (15 unique)
7. **mio-kb-04-communication-frameworks.md** - 26 terms (15 unique)
8. **mio-kb-01-core-framework.md** - 24 terms (10 unique)
9. **neural_rewiring_protocols.txt** - 14 terms (7 unique)
10. **mio-kb-02-avatar-index.md** - 11 terms (7 unique)

### Most Technical Chunks

Top 5 chunks with highest term density:

1. Chunk 8 (mio-kb-07-neural-rewiring-protocols.md) - "References (Clinical Evidence Base - For Mio Knowledge Only)" - 19 terms, density: 1.55 per 100 chars
2. Chunk 28 (mio-kb-03-protocol-library.md) - "Motivation Collapse - Comparison" - 7 terms, density: 1.17 per 100 chars
3. Chunk 30 (daily_deductible_library.md) - "Negative Visualization (Premeditatio Malorum)" - 6 terms, density: 1.06 per 100 chars
4. Chunk 38 (mio-kb-03-protocol-library.md) - "Motivation Collapse - Execution Breakdown" - 5 terms, density: 0.84 per 100 chars
5. Chunk 41 (daily_deductible_library.md) - "Cognitive Load Management" - 4 terms, density: 0.77 per 100 chars

## Output Files Created

1. **`glossary-extraction/technical-terms-raw.json`**
   - All unique technical terms organized by category
   - Ready for Agent 2 to create user-friendly definitions

2. **`glossary-extraction/term-frequency-analysis.json`**
   - Complete frequency analysis
   - Top terms by category
   - Protocol density rankings
   - Chunk density analysis

3. **`glossary-extraction/full-extraction-data.json`**
   - Complete raw extraction data
   - All terms by category, protocol, and chunk
   - Reference for detailed analysis

## Success Criteria Met

- ✅ All 205 protocols scanned
- ✅ 62 unique technical terms extracted (target: 50-100)
- ✅ Terms categorized by 8 domains
- ✅ JSON output files created
- ✅ Frequency analysis complete

## Next Steps for Agent 2

Agent 2 should now:
1. Read `glossary-extraction/technical-terms-raw.json`
2. Prioritize top 50 most frequent terms from `term-frequency-analysis.json`
3. Generate user-friendly definitions using Claude API
4. Create glossary entries in database

## Agent 1 Status: COMPLETE ✓

Generated: 2025-11-22T19:49:17.985Z
Location: /Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy
