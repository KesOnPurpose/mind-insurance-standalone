# BILLION DOLLAR RAG IMPLEMENTATION PLAN
## Mind Insurance - Relational Pillar
### Status: CODE COMPLETE (Pending DB Migration + Content Generation)
### Last Updated: 2026-02-08

---

## EXECUTIVE SUMMARY

Transform the current v0.5 RAG (406 chunks, stateless, keyword triage) into a world-class system that "reads the user's mind" through 7 tiers of improvement across content, retrieval, personalization, emotional intelligence, cross-pillar integration, outcome tracking, and cultural mastery.

**Current State**: 406 chunks, single-pass vector search, keyword triage, no personalization
**Target State**: 50,000+ chunks, multi-hop retrieval, deep user profiles, emotional intelligence, cross-pillar awareness, outcome learning, cultural fluency

---

## IMPLEMENTATION PHASES

### PHASE 1: Foundation (Tiers 3A + 2A + Schema)
**Priority**: HIGHEST | **Effort**: Medium | **Impact**: Massive
**Status**: [x] COMPLETE

#### 1.1 User Relational Profile Table & Service
- [ ] Create `mio_relational_profiles` table in Supabase
  - attachment_style (enum: secure, anxious_preoccupied, dismissive_avoidant, fearful_avoidant, unassessed)
  - partner_attachment_style (same enum + unknown)
  - primary_pattern (enum: pursuer_withdrawer, withdrawer_withdrawer, pursuer_pursuer, volatile, validating, avoidant, unassessed)
  - relationship_season (FK to seasons or string)
  - life_stage (reuse existing enum)
  - key_issues (text[] - detected issue types)
  - contraindications (text[] - active contraindications)
  - cultural_context (text[] - cultural flags)
  - frameworks_that_resonate (text[] - frameworks user engages with)
  - frameworks_that_dont (text[] - frameworks user dismisses)
  - triggers (text[] - known emotional triggers)
  - strengths (text[] - relationship strengths)
  - growth_edges (text[] - areas for development)
  - emotional_baseline (jsonb - typical affect patterns)
  - readiness_stage (enum: precontemplation, contemplation, preparation, action, maintenance)
  - partner_joined (boolean)
  - partner_profile_id (self-FK, nullable)
  - vertex_score_current (numeric)
  - vertex_score_trend (enum: improving, stable, declining)
  - sessions_completed (integer)
  - last_session_at (timestamptz)
  - profile_completeness (numeric 0-1)
  - created_at, updated_at
- [ ] RLS policies (user can read/write own profile only)
- [ ] Create `relational-profile-service.ts`
  - getOrCreateProfile(userId)
  - updateProfile(userId, partial)
  - enrichProfileFromMessage(userId, message, triageResult) - auto-detect and accumulate
  - getProfileForRAG(userId) - returns search-optimized profile
- [ ] Integrate profile into `searchRelational()` pipeline
  - Auto-load profile at step 1
  - Use profile data to pre-populate TriageContext
  - Weight framework recommendations by user's resonance history

#### 1.2 HyDE (Hypothetical Document Embeddings)
- [ ] Create `hyde-service.ts`
  - generateHypotheticalAnswer(userMessage, userProfile?) → string
  - Uses Claude/OpenAI to generate ideal answer BEFORE embedding
  - Falls back to direct embedding if generation fails
- [ ] Integrate into `searchRelational()` pipeline
  - After triage, before embedding
  - Embed the hypothetical answer instead of raw user message
  - Keep original message for triage/keyword matching
- [ ] A/B comparison: measure retrieval quality with/without HyDE

#### 1.3 Multi-Granularity Chunk Schema
- [ ] Add columns to `mio_knowledge_chunks`:
  - `granularity` (enum: summary, concept, deep_dive, micro_intervention, case_study, real_talk)
  - `parent_chunk_id` (self-FK - links summary → concept → deep_dive)
  - `effectiveness_score` (numeric, default 0.5 - for Tier 6)
  - `times_retrieved` (integer, default 0)
  - `times_helpful` (integer, default 0)
  - `voice` (enum: clinical, keston, conversational, script)
  - `target_readiness` (enum: flooded, processing, ready, motivated)
  - `time_commitment_category` (enum: micro_2min, short_15min, medium_30min, deep_60min)
  - `cross_pillar_tags` (text[] - physical, mental, spiritual, financial)
  - `cultural_contexts` (text[] - specific cultural applicability)
  - `age_range` (text - e.g., "25-35", "all")
  - `relationship_type` (text[] - married, dating, separated, coparenting, etc.)
- [ ] Migration script (additive, no data loss)
- [ ] Update `search_mio_relational()` RPC to support new filters

---

### PHASE 2: Content Expansion (Tiers 1B + 1C + 1E)
**Priority**: HIGH | **Effort**: High | **Impact**: High
**Status**: [x] SCRIPTS COMPLETE (Pending API key execution + Phase 2.4 source content)

#### 2.1 Micro-Intervention Library (~5,000 chunks)
- [ ] Create intervention content generation pipeline
  - For each of the 15 frameworks, generate:
    - 5 beginner scripts (exact words to say)
    - 5 intermediate exercises (structured activities)
    - 5 advanced vulnerability practices
    - 3 emergency de-escalation scripts
    - 3 repair attempt scripts
  - Each intervention tagged with:
    - time_commitment (2min, 15min, 30min, 60min)
    - difficulty_level (1-5)
    - target_pattern (pursuer-withdrawer, etc.)
    - target_issue (communication, intimacy, etc.)
    - readiness_required (processing, ready, motivated)
- [ ] Generate via Claude API with quality review
- [ ] Chunk, embed, and insert with proper metadata

#### 2.2 Case Study Library (~10,000 chunks)
- [ ] Create case study generation framework
  - Template: Situation → Pattern Identified → Framework Applied → Intervention → Outcome
  - Demographics matrix:
    - 10 age brackets × 6 relationship types × 10 issue types × 5 cultural contexts = 3,000 combinations
    - Generate 3-4 case studies per high-priority combination
  - Each case study tagged with all applicable metadata
- [ ] Quality review: ensure clinical accuracy, cultural sensitivity, no harmful stereotypes
- [ ] Chunk at concept level (one case = 2-3 chunks: setup, intervention, outcome)
- [ ] Embed and insert

#### 2.3 "Real Talk" Content in Keston's Voice (~5,000 chunks)
- [ ] Map every clinical concept to Keston-voice equivalent
  - Use existing voice profiles from `/Context/Marketing-Assets/VOICE-COURSE-CREATION.md`
  - Template: Clinical concept → Keston's analogy/metaphor → Real-world example → Action step
  - Style: Direct, warm, uses personal stories, "look..." openers, definition-first
- [ ] Generate using Claude with Keston voice profile as system prompt
- [ ] Tag with `voice: 'keston'` for retrieval filtering
- [ ] Review for authenticity against existing Keston content

#### 2.4 Primary Source Integration (~15,000 chunks)
- [ ] For each of the 25+ referenced books, create:
  - Chapter-level summaries (1 chunk per chapter)
  - Key concept extractions (3-5 chunks per chapter)
  - Technique deep-dives with examples (2-3 per technique)
  - Contraindication notes (when NOT to use this)
- [ ] Properly attribute all content
- [ ] Tag evidence_tier based on source quality
- [ ] Cross-reference with existing 332 chunks to avoid duplication

---

### PHASE 3: Emotional Intelligence (Tier 4)
**Priority**: HIGH | **Effort**: Medium | **Impact**: High
**Status**: [x] COMPLETE

#### 3.1 Affect Detection Layer
- [ ] Create `affect-detection-service.ts`
  - detectAffect(message, conversationHistory?) → AffectProfile
  - Returns:
    - emotional_intensity (1-10)
    - primary_emotion (anger, sadness, fear, shame, confusion, hope, joy, frustration, grief, relief)
    - secondary_emotion (often the real one)
    - energy_level (high_arousal, moderate, low_energy, shutdown)
    - readiness_for_change (precontemplation → maintenance)
    - linguistic_markers: {
        minimizing: boolean, ("I guess it's fine")
        overgeneralizing: boolean, ("He ALWAYS does this")
        helplessness: boolean, ("I don't even know why I try")
        breakthrough_signal: boolean, ("We actually talked")
        emotional_flooding: boolean, (all caps, multiple exclamation marks, run-on sentences)
        humor_as_defense: boolean, ("lol it's whatever")
        intellectualizing: boolean, (clinical language to avoid feeling)
      }
- [ ] Use Claude API for affect classification (lightweight prompt, fast)
- [ ] Cache affect results per message to avoid re-computation

#### 3.2 Readiness-Matched Retrieval
- [ ] Modify `searchRelational()` to include affect analysis
- [ ] Create readiness-to-content mapping:
  - flooded → validation chunks only (no frameworks, no homework)
  - processing → psychoeducation chunks (explain what's happening)
  - ready → framework chunks (teach concepts)
  - motivated → action chunks (specific interventions, scripts, exercises)
- [ ] Add `target_readiness` filter to `search_mio_relational()` RPC
- [ ] Create validation-only content chunks (~500):
  - "What you're feeling right now makes complete sense"
  - "This is one of the hardest things a person can go through"
  - Pattern-specific validation: "When you're the one always reaching out..."

#### 3.3 Escalation Modeling
- [ ] Create `escalation-detector-service.ts`
  - trackEscalation(conversationMessages) → EscalationProfile
  - Detects:
    - Rising intensity across messages
    - Shift from green → yellow → orange themes
    - Linguistic escalation (calm → frustrated → desperate)
    - Session-over-session escalation trends
  - Returns urgency_level and recommended_intervention_type
- [ ] Integrate with triage pipeline (can override keyword-only triage)

---

### PHASE 4: Conversation Memory (Tier 3B)
**Priority**: HIGH | **Effort**: High | **Impact**: Massive
**Status**: [x] COMPLETE

#### 4.1 Conversation Memory Table
- [ ] Create `mio_conversation_memories` table
  - id (uuid)
  - user_id (FK to user_profiles)
  - session_id (uuid - groups memories by session)
  - memory_type (enum: insight, breakthrough, setback, technique_tried, pattern_detected, goal_set, trigger_identified, strength_observed)
  - memory_text (text - concise summary)
  - memory_embedding (vector(1536))
  - source_message (text - the user message that generated this)
  - frameworks_referenced (text[])
  - issues_referenced (text[])
  - emotional_context (jsonb - affect at time of memory)
  - importance_score (numeric 0-1)
  - is_active (boolean - can be superseded by newer memories)
  - created_at (timestamptz)
- [ ] RLS: user can read own memories only
- [ ] Index on user_id + created_at for efficient retrieval

#### 4.2 Memory Extraction Service
- [ ] Create `memory-extraction-service.ts`
  - extractMemories(userId, userMessage, assistantResponse, affectProfile) → Memory[]
  - Uses Claude to identify memorable elements:
    - New information about user's situation
    - Breakthroughs or setbacks reported
    - Techniques tried and outcomes
    - Patterns the user is becoming aware of
    - Goals or commitments made
    - Triggers identified
  - Rate importance (0-1) based on novelty and clinical significance
  - Generate embedding for each memory

#### 4.3 Memory Retrieval Integration
- [ ] Create `memory-retrieval-service.ts`
  - getRelevantMemories(userId, currentMessage, embedding, limit?) → Memory[]
  - Hybrid retrieval: recent memories (last 3 sessions) + semantically similar memories
  - Weight by recency × importance × similarity
- [ ] Integrate into `searchRelational()` pipeline
  - After knowledge chunk retrieval, also retrieve relevant memories
  - Format memories into context block: "From your previous sessions..."
  - Include in system prompt augmentation

#### 4.4 Session Threading
- [ ] Create `mio_session_summaries` table
  - id (uuid)
  - user_id (FK)
  - session_id (uuid)
  - session_number (integer)
  - summary_text (text)
  - key_topics (text[])
  - techniques_discussed (text[])
  - homework_assigned (text[])
  - homework_completed (text[] - filled in next session)
  - affect_trajectory (jsonb - start/middle/end emotions)
  - triage_colors_seen (text[])
  - breakthrough_moment (text, nullable)
  - created_at (timestamptz)
- [ ] Auto-generate session summary at end of conversation
- [ ] "Last time we talked..." opener capability

---

### PHASE 5: Advanced Retrieval (Tiers 2B + 2C + 2D)
**Priority**: MEDIUM | **Effort**: Medium | **Impact**: Medium-High
**Status**: [x] COMPLETE

#### 5.1 Query Decomposition
- [ ] Create `query-decomposition-service.ts`
  - decomposeQuery(userMessage, profile?) → SubQuery[]
  - Uses Claude to break complex messages into 2-4 focused sub-queries
  - Each sub-query targets a specific domain/framework
  - Example: "We fight about money and he shuts down" →
    1. "financial conflict in relationships" (financial_mens)
    2. "stonewalling withdrawal pattern" (communication_conflict)
    3. "pursuer-withdrawer dynamic" (foundation_attachment)
- [ ] Run parallel vector searches for each sub-query
- [ ] Merge and deduplicate results

#### 5.2 Cross-Encoder Re-Ranking
- [ ] Evaluate re-ranking options:
  - Cohere Rerank API (simplest, ~$1/1000 queries)
  - Claude-based re-ranking (use existing API, score each chunk)
  - Local cross-encoder model (cheapest long-term, needs hosting)
- [ ] Implement chosen re-ranker
  - Input: original query + top 20 vector search results
  - Output: re-scored and re-ordered top 10
- [ ] Integrate as post-processing step in `callSearchRPC()`

#### 5.3 Agentic Retrieval (Follow-Up Queries)
- [ ] Create `agentic-retrieval-service.ts`
  - assessRetrievalCompleteness(query, chunks, profile) → GapAnalysis
  - Uses Claude to evaluate: "Do these chunks adequately answer the user's question?"
  - If gaps found, generates follow-up queries
  - Runs additional search passes (max 2 follow-ups)
  - Merges all results
- [ ] Integrate as optional step (enable for complex queries, skip for simple ones)

#### 5.4 Conversation-Aware Embedding
- [ ] Modify embedding generation to include context
  - Prepend last 2-3 messages to current message before embedding
  - Include user profile summary in embedding context
  - Use sliding window: [profile_summary] + [msg_n-2] + [msg_n-1] + [current_msg]
- [ ] Compare retrieval quality: context-aware vs. single-message

---

### PHASE 6: Cross-Pillar Integration (Tier 5)
**Priority**: MEDIUM | **Effort**: Medium | **Impact**: High
**Status**: [x] COMPLETE

#### 6.1 Cross-Pillar Detection Service
- [ ] Create `cross-pillar-detection-service.ts`
  - detectCrossPillarFactors(message, profile, affect) → CrossPillarSignals
  - Detection rules:
    - Physical: sleep mentions, fatigue, health, pain, medication, exhaustion
    - Financial: money, debt, job, work stress, bills, afford, provider
    - Mental: depression, anxiety, medication, diagnosis, therapy, overwhelm
    - Spiritual: purpose, meaning, faith, why, existential, stuck, lost
  - Returns:
    - detected_pillars: string[]
    - primary_pillar: string (may not be relational!)
    - root_cause_hypothesis: string
    - cross_pillar_chunks_needed: boolean

#### 6.2 Cross-Pillar Trigger Map
- [ ] Create `mio_cross_pillar_triggers` table
  - trigger_event (e.g., "job_loss", "new_baby", "health_diagnosis")
  - affected_pillars (text[])
  - cascade_pattern (jsonb - describes how it cascades)
  - common_presenting_symptom (text - what user says)
  - actual_root_cause (text - what's really going on)
  - recommended_domains (text[])
  - recommended_chunks_filter (jsonb)
- [ ] Seed with 50+ common triggers
- [ ] Integrate into search pipeline

#### 6.3 Cross-Pillar Knowledge Chunks
- [ ] Generate ~2,000 cross-pillar content chunks:
  - "When financial stress is causing your 'communication problem'"
  - "Sleep deprivation and emotional regulation: why you fight more when tired"
  - "When depression looks like 'he doesn't care'"
  - "The job loss cascade: how losing work affects every relationship"
- [ ] Tag with `cross_pillar_tags` for filtered retrieval

---

### PHASE 7: Cultural Mastery (Tier 7)
**Priority**: MEDIUM | **Effort**: High | **Impact**: High
**Status**: [x] COMPLETE

#### 7.1 Cultural Context Content Modules
- [ ] Create content for 12 priority cultural contexts:
  1. African American relationships (historical trauma, code-switching, strong Black woman)
  2. Latino/Hispanic (familismo, machismo, marianismo, respeto)
  3. South Asian (arranged marriage evolution, family honor, intergenerational homes)
  4. East Asian (face culture, filial piety, emotional restraint norms)
  5. Military/Veteran (deployment, reintegration, moral injury, hypervigilance)
  6. LGBTQ+ (minority stress, coming out, chosen family, internalized stigma)
  7. Faith-Based Christian (covenant, headship debates, church pressure, purity culture effects)
  8. Faith-Based Muslim (Islamic marriage framework, family roles, cultural vs. religious)
  9. Immigrant/Bicultural (acculturation gap, language barriers, identity straddling)
  10. Blended/Step-Family (loyalty conflicts, authority dynamics, ex-partner co-parenting)
  11. Neurodivergent couples (ADHD, autism, sensory needs, executive function impact)
  12. Age-Gap relationships (power dynamics, life stage mismatch, social stigma)
- [ ] ~200 chunks per context = ~2,400 chunks total
- [ ] Each chunk includes: adapted framework application, culturally specific examples, potential pitfalls
- [ ] Review by cultural consultants (or flag as AI-generated pending review)

#### 7.2 Language-Adaptive Detection
- [ ] Create `cultural-language-detector.ts`
  - Detect culturally-specific expressions and code-switching
  - Map colloquial expressions to clinical concepts
  - Adjust retrieval language to match user's frame
- [ ] Integrate with profile (auto-detect and store cultural context)

---

### PHASE 8: Outcome Intelligence (Tier 6)
**Priority**: LOWER (needs scale) | **Effort**: High | **Impact**: Massive (long-term)
**Status**: [x] COMPLETE

#### 8.1 Technique Effectiveness Tracking
- [ ] Create `mio_technique_outcomes` table
  - user_id, technique_name, framework_name
  - assigned_at, attempted_at, reported_outcome_at
  - did_attempt (boolean)
  - self_reported_helpfulness (1-5)
  - behavioral_change_detected (boolean)
  - follow_up_notes (text)
- [ ] Auto-detect technique assignments in responses
- [ ] Follow-up prompts: "Last time I suggested X. How did it go?"

#### 8.2 Chunk Effectiveness Scoring
- [ ] Track per-chunk metrics:
  - times_retrieved (increment on every search result)
  - times_in_positive_session (session ended with improved affect)
  - times_in_negative_session (session ended with worsened affect)
  - user_engagement_signals (user asked follow-up, tried technique, etc.)
- [ ] Calculate rolling effectiveness_score
- [ ] Use as boost factor in retrieval ranking

#### 8.3 Population-Level Insights
- [ ] Aggregate anonymized outcome data:
  - "For anxious-avoidant couples, EFT techniques have 73% positive outcome rate"
  - "For financial conflict, the money date exercise has highest engagement"
- [ ] Use to inform default framework recommendations
- [ ] Surface as credibility signals: "Couples in similar situations often find..."

---

## DATABASE SCHEMA ADDITIONS (COMPLETE LIST)

### New Tables
1. `mio_relational_profiles` (Phase 1.1)
2. `mio_conversation_memories` (Phase 4.1)
3. `mio_session_summaries` (Phase 4.4)
4. `mio_cross_pillar_triggers` (Phase 6.2)
5. `mio_technique_outcomes` (Phase 8.1)

### Column Additions to `mio_knowledge_chunks`
- `granularity` (Phase 1.3)
- `parent_chunk_id` (Phase 1.3)
- `effectiveness_score` (Phase 1.3)
- `times_retrieved` (Phase 1.3)
- `times_helpful` (Phase 1.3)
- `voice` (Phase 1.3)
- `target_readiness` (Phase 1.3)
- `time_commitment_category` (Phase 1.3)
- `cross_pillar_tags` (Phase 1.3)
- `cultural_contexts` (Phase 1.3)
- `age_range` (Phase 1.3)
- `relationship_type` (Phase 1.3)

### New/Modified RPC Functions
- `search_mio_relational()` - add granularity, readiness, cross-pillar filters
- `search_user_memories()` - new function for memory retrieval
- `get_technique_outcomes()` - new function for outcome tracking

---

## NEW SERVICE FILES (COMPLETE LIST)

### Phase 1
1. `src/services/relational-profile-service.ts`
2. `src/services/hyde-service.ts`

### Phase 3
3. `src/services/affect-detection-service.ts`
4. `src/services/escalation-detector-service.ts`

### Phase 4
5. `src/services/memory-extraction-service.ts`
6. `src/services/memory-retrieval-service.ts`

### Phase 5
7. `src/services/query-decomposition-service.ts`
8. `src/services/reranking-service.ts`
9. `src/services/agentic-retrieval-service.ts`

### Phase 6
10. `src/services/cross-pillar-detection-service.ts`

### Phase 7
11. `src/services/cultural-language-detector.ts` [CREATED]

### Phase 8
12. `src/services/technique-outcome-service.ts` [CREATED]

### Modified Services
- `src/services/relational-rag-service.ts` (REWRITTEN - unified 13-step pipeline, ~1150 lines)
- `src/services/relational-triage-service.ts` (moderate - affect-aware triage)

### Edge Functions Created
- `supabase/functions/generate-hyde/index.ts` [CREATED]
- `supabase/functions/detect-affect/index.ts` [CREATED]
- `supabase/functions/decompose-query/index.ts` [CREATED]

### Scripts Created
- `scripts/generate-rag-content.ts` [CREATED] - 7-type content generation pipeline
- `scripts/apply-phase1-migration.ts` [CREATED] - Migration diagnostic/seeder

---

## CONTENT GENERATION PIPELINE

### Total New Content Target: ~40,000+ chunks

| Content Type | Count | Source | Phase |
|-------------|-------|--------|-------|
| Micro-Interventions | ~5,000 | Claude generation + review | 2.1 |
| Case Studies | ~10,000 | Claude generation + review | 2.2 |
| Real Talk (Keston voice) | ~5,000 | Claude + voice profile | 2.3 |
| Primary Source Summaries | ~15,000 | Book analysis + Claude | 2.4 |
| Validation Chunks | ~500 | Claude generation | 3.2 |
| Cross-Pillar Content | ~2,000 | Claude generation | 6.3 |
| Cultural Context Modules | ~2,400 | Claude + cultural review | 7.1 |
| **TOTAL** | **~40,000** | | |

### Content Generation Approach
- Use Claude API for bulk generation with quality prompts
- Each content type has a specific generation template
- All content passes through clinical accuracy review
- Metadata auto-tagged during generation
- Embeddings generated in batch via OpenAI API
- Inserted via Supabase REST API in batches of 50

---

## EXECUTION TRACKER

### Phase 1: Foundation
| Task | Status | Notes |
|------|--------|-------|
| 1.1 Relational Profile table | [x] DONE | Migration SQL created, table in migration file |
| 1.1 Profile service | [x] DONE | `relational-profile-service.ts` (349 lines) |
| 1.1 Pipeline integration | [x] DONE | Integrated in unified pipeline Step 0 |
| 1.2 HyDE service | [x] DONE | `hyde-service.ts` (156 lines) + Edge Function |
| 1.2 Pipeline integration | [x] DONE | Integrated in unified pipeline Step 5-6 |
| 1.3 Schema additions migration | [x] DONE | `20260207100000_billion_dollar_rag_phase1.sql` (567 lines) |
| 1.3 Updated RPC function | [x] DONE | Enhanced `search_mio_relational()` + `search_user_memories()` |

### Phase 2: Content Expansion
| Task | Status | Notes |
|------|--------|-------|
| 2.1 Micro-Intervention generation | [x] DONE | Script ready in `generate-rag-content.ts` - needs API keys to run |
| 2.2 Case Study generation | [x] DONE | Script ready - 5 demographics × 3 domains |
| 2.3 Real Talk content | [x] DONE | Script ready - 5 domains × 5 concepts |
| 2.4 Primary Source summaries | [ ] PENDING | Requires book source texts (manual content) |

### Phase 3: Emotional Intelligence
| Task | Status | Notes |
|------|--------|-------|
| 3.1 Affect Detection service | [x] DONE | `affect-detection-service.ts` + Edge Function |
| 3.2 Readiness-Matched Retrieval | [x] DONE | `getReadinessFilters()` in RAG pipeline Step 7 |
| 3.3 Escalation Modeling | [x] DONE | `detectEscalation()` in affect-detection-service.ts |

### Phase 4: Conversation Memory
| Task | Status | Notes |
|------|--------|-------|
| 4.1 Memory table | [x] DONE | In migration SQL (mio_conversation_memories + mio_session_summaries) |
| 4.2 Memory Extraction service | [x] DONE | `memory-service.ts` - extractMemoriesFromMessage() |
| 4.3 Memory Retrieval integration | [x] DONE | Integrated in pipeline Step 10 + postResponseMemoryHook |
| 4.4 Session Threading | [x] DONE | `createSessionSummary()` in memory-service.ts |

### Phase 5: Advanced Retrieval
| Task | Status | Notes |
|------|--------|-------|
| 5.1 Query Decomposition | [x] DONE | `query-decomposition-service.ts` + Edge Function |
| 5.2 Cross-Encoder Re-Ranking | [x] DONE | `reranking-service.ts` - heuristic + Claude re-ranking |
| 5.3 Agentic Retrieval | [x] DONE | `agentic-retrieval-service.ts` - 4-check gap analysis |
| 5.4 Conversation-Aware Embedding | [x] DONE | HyDE-enhanced embedding in pipeline Step 6 |

### Phase 6: Cross-Pillar
| Task | Status | Notes |
|------|--------|-------|
| 6.1 Detection service | [x] DONE | `cross-pillar-detection-service.ts` (273 lines) |
| 6.2 Trigger Map table + seed | [x] DONE | In migration SQL (20 seed triggers) |
| 6.3 Cross-Pillar content | [x] DONE | Script ready - 4 pillars × 5 scenarios |

### Phase 7: Cultural Mastery
| Task | Status | Notes |
|------|--------|-------|
| 7.1 12 Cultural Context modules | [x] DONE | All 12 cultures in generate-rag-content.ts |
| 7.2 Language-Adaptive Detection | [x] DONE | `cultural-language-detector.ts` - 12 signal maps + colloquial mappings |

### Phase 8: Outcome Intelligence
| Task | Status | Notes |
|------|--------|-------|
| 8.1 Technique Outcomes table | [x] DONE | In migration SQL (mio_technique_outcomes) |
| 8.2 Chunk Effectiveness scoring | [x] DONE | `technique-outcome-service.ts` - Bayesian scoring |
| 8.3 Population-Level insights | [x] DONE | `getFrameworkEffectiveness()` + `getUserTechniqueHistory()` |

---

## DEPLOYMENT BLOCKERS

### 1. Database Migration (CRITICAL)
The SQL migration `20260207100000_billion_dollar_rag_phase1.sql` must be applied via Supabase SQL Editor:
- Creates 5 new tables
- Adds 12 new columns to mio_knowledge_chunks
- Creates enhanced search RPCs
- Seeds cross-pillar triggers
- `supabase db push` failed; must run SQL manually

### 2. Edge Functions Deployment
Three Edge Functions need deployment:
```bash
supabase functions deploy generate-hyde
supabase functions deploy detect-affect
supabase functions deploy decompose-query
```
Requires `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` as Edge Function secrets.

### 3. Content Generation
Run the content generation script with API keys:
```bash
ANTHROPIC_API_KEY=sk-... OPENAI_API_KEY=sk-... npx tsx scripts/generate-rag-content.ts --type=all --batch-size=50
```
Individual types can be generated separately:
```bash
--type=micro_interventions|case_studies|real_talk|validation|cross_pillar|cultural|tag_existing
```

### 4. Primary Source Content (Phase 2.4)
Requires manual book content for ~15,000 chunks. Not automatable without source texts.

---

## SERVICE FILE INVENTORY (ALL CREATED)

| # | File | Lines | Phase | Purpose |
|---|------|-------|-------|---------|
| 1 | `relational-profile-service.ts` | 349 | 1.1 | User profiles, auto-enrichment |
| 2 | `hyde-service.ts` | 156 | 1.2 | Hypothetical Document Embeddings |
| 3 | `affect-detection-service.ts` | ~300 | 3.1 | 2-layer affect detection + escalation |
| 4 | `memory-service.ts` | 418 | 4.1-4.4 | Memory extraction, storage, retrieval, sessions |
| 5 | `query-decomposition-service.ts` | 243 | 5.1 | Multi-domain query splitting |
| 6 | `reranking-service.ts` | ~250 | 5.2 | Multi-signal heuristic + Claude re-ranking |
| 7 | `agentic-retrieval-service.ts` | ~200 | 5.3 | Gap analysis + follow-up queries |
| 8 | `cross-pillar-detection-service.ts` | 273 | 6.1 | Hidden root cause detection |
| 9 | `cultural-language-detector.ts` | ~400 | 7.2 | 12-culture signal detection + colloquial mapping |
| 10 | `technique-outcome-service.ts` | ~350 | 8.1-8.3 | Outcome tracking + effectiveness scoring |
| 11 | `relational-rag-service.ts` | ~1150 | ALL | Unified 13-step pipeline (centerpiece) |
| 12 | `relational-intersectionality-engine.ts` | 706 | Pre-existing | Framework intersectionality |
| 13 | `relational-triage-service.ts` | Pre-existing | Pre-existing | Safety + clinical routing |

### Edge Functions Created
| Function | Purpose |
|----------|---------|
| `generate-hyde` | HyDE generation (Anthropic/OpenAI) |
| `detect-affect` | LLM-based affect detection |
| `decompose-query` | Query decomposition into sub-queries |

### Scripts Created
| Script | Purpose |
|--------|---------|
| `scripts/generate-rag-content.ts` | Bulk content generation (7 types, 12 cultures) |
| `scripts/apply-phase1-migration.ts` | Migration diagnostic/seeder |
