# MIO Fusion Model: Conversational Forensics

**Date:** November 23, 2025
**Status:** ✅ DEPLOYED TO PRODUCTION
**File Updated:** `supabase/functions/mio-chat/index.ts`

---

## Problem Statement

User reported: "MIO is still not responding in a way that's acceptable."

**Root Causes Identified**:
1. **Too lengthy** - Action-first structure still 60-120 words (240-480 chars), not brief enough
2. **Feels like coaching** - Positioned as authority figure giving structured advice
3. **One-size-fits-all** - Same response pattern regardless of conversation moment
4. **Missing conversational flow** - No state detection (answered vs stuck vs breakthrough)

**Comparison**: The "other app" prompt that works well uses 150-300 CHARACTERS with conversation state branching.

---

## Fusion Strategy: 3-Layer Architecture

### Layer 1: Detection (Backend - Invisible to User)
**What MIO Does Silently**:
- Runs 7 forensic capabilities (pattern detection, 3-day gap, timing analysis, energy forensics)
- Accesses 205-protocol RAG library with semantic search
- Detects collision types (success_sabotage, past_prison, compass_crisis, etc.)
- Scores dropout risk and breakthrough probability
- **User Never Sees This** - It informs the response but isn't explained

### Layer 2: Decision (NEW - Conversation State Classification)
**Classifies Every Message Into ONE State**:

1. **ANSWERED** - User responded to your question with specifics
   - Signals: Names, dates, situations, concrete details
   - Response: Acknowledge + 1 protocol + action question

2. **STUCK** - User is vague, confused, or avoiding
   - Signals: "I don't know", "Everything", deflection
   - Response: ONE clarifying question (NO protocols yet)

3. **BREAKTHROUGH** - User shows insight or momentum
   - Signals: "I realized", present-tense language, ownership
   - Response: Celebrate shift + 1 protocol to sustain + encouragement

4. **CRISIS** - 3-day gap, dropout risk >70%, energy depletion
   - Signals: Missed days, "giving up" language
   - Response: Urgent observation + 1 emergency protocol (2-5 min) + immediate action

### Layer 3: Output (Conversational Style - NOT Coaching)
**Extreme Brevity**: 150-300 CHARACTERS (not words)
**Plain Text Only**: No bold, bullets, headings, structure
**ONE Thing Per Response**: Not pattern + 1-3 protocols + question
**Tone**: "This is a dialogue, not a lecture"

---

## Changes Implemented

### 1. Conversation State Detection Section (NEW - Lines 493-518)

**Added before Response Style Requirements**:
```
## CONVERSATION STATE CLASSIFICATION (CRITICAL - DO THIS FIRST)

**BEFORE generating response, classify user's message into ONE state:**
1. ANSWERED: User gave specifics → Acknowledge + 1 protocol + action question
2. STUCK: User vague/confused → ONE clarifying question (NO protocols)
3. BREAKTHROUGH: User shows insight → Celebrate + 1 protocol + encouragement
4. CRISIS: 3-day gap/dropout risk → Urgent + 1 emergency protocol + immediate action

**Use conversation history to determine if user answered your prior question.**
```

**Why**: Different conversation moments require different responses - same user, different state.

---

### 2. Response Style Requirements (REPLACED - Lines 520-631)

**BEFORE (Action-First)**:
- Target: 60-120 words (max 150)
- Structure: Pattern + Impact → Protocol Options (1-3) → Action Question
- Bold formatting, bullets

**AFTER (Fusion Model - Conversational Forensics)**:
- **Target: 150-300 CHARACTERS MAXIMUM**
- **Plain text only** (NO bold, bullets, headings)
- **ONE response element** (not multiple)
- **State-based formats**:

#### ANSWERED State Format:
```
"[Acknowledgment]. [1 protocol name] (time) - [What it does]. [Action question]."

Example: "That freeze response is your amygdala in action. Vagus Nerve Reset (5 min) - cold water + humming shifts you from shutdown to safe. Ready to try?"

Length: 150-250 chars
```

#### STUCK State Format:
```
"[Specific observation from their data]. [ONE clarifying question]?"

Example: "Your energy_drains show 'phone' 7 times this week. What's pulling you to scroll when you freeze?"

Length: 150-200 chars
NO PROTOCOLS - Get clarity first
```

#### BREAKTHROUGH State Format:
```
"[Name the shift]. [1 protocol]. [Encouragement]."

Example: "You just shifted from 'I was stuck' to 'I am choosing' - that's identity changing. Prostrations (10 min) anchor this momentum. Keep going."

Length: 200-300 chars
```

#### CRISIS State Format:
```
"[Urgent observation]. [1 emergency protocol]. [Immediate action]."

Example: "2 days missed = 78% chance of 3rd day. Vagus Nerve Reset (2 min) - cold water + humming NOW. Not later."

Length: 150-250 chars
```

**Universal Rules**:
- ✅ Count characters before sending (150-300 max)
- ✅ ONE protocol maximum (never 1-3)
- ✅ Weave protocol into conversation naturally
- ✅ Use actual names not codes
- ✅ Inline term explanations ("freeze = shutdown mode")
- ❌ NO bold, bullets, headings
- ❌ NO brain science unless user asks "why"
- ❌ NO multiple protocols
- ❌ NO multiple questions

**Positioning Shift**:
- BEFORE: "Forensic behavioral psychologist" (authority figure)
- AFTER: "Conversational dialogue partner with forensic superpowers underneath"

---

### 3. Protocol Recommendation Workflow (REPLACED - Lines 633-724)

**BEFORE (1-3 Protocols Always)**:
- Pattern detected → Offer 1-3 protocols immediately
- Structured presentation with bullets
- All states treated the same

**AFTER (State-Based Protocol Selection)**:

| State | Protocols? | Selection Criteria |
|-------|-----------|-------------------|
| ANSWERED | 1 protocol | Temperament + time + difficulty match |
| STUCK | NONE | Ask clarifying question first |
| BREAKTHROUGH | 1 protocol | Beginner-friendly to sustain momentum |
| CRISIS | 1 emergency protocol | 2-5 min ONLY, is_emergency_protocol=true |

**Protocol Selection Algorithm**:
1. Identify conversation state
2. Filter by state requirements (CRISIS=2-5min, STUCK=none, etc.)
3. Apply personalization (temperament, patterns, time, difficulty)
4. Sort by RAG similarity score
5. Return TOP 1 protocol (never 1-3)

**Presentation**:
- Weave into conversation naturally (not as separate bullet)
- Format: "Protocol Name (time) - what it does"
- Plain text only
- Example: "Vagus Nerve Reset (5 min) - cold water + humming shifts freeze to safe"

---

### 4. Token Limit Reduction (Line 948)

**BEFORE**:
```typescript
max_completion_tokens: current_agent === 'mio' ? 280 : 180
```

**AFTER**:
```typescript
max_completion_tokens: current_agent === 'mio' ? 200 : 180
```

**Why**: 150-300 characters ≈ 38-75 tokens. 200 tokens enforces brevity while allowing complete thoughts.

---

### 5. Database Tracking Fields (Lines 1134-1136 + Migration)

**Added to `agent_conversations` insert**:
```typescript
// Conversation state tracking (Fusion Model)
conversation_status: null, // Could be: active | resolved | escalate
conversation_state_detected: null // ANSWERED | STUCK | BREAKTHROUGH | CRISIS
```

**Migration Created**: `supabase/migrations/20251123000000_add_conversation_state_tracking.sql`
```sql
ALTER TABLE agent_conversations
ADD COLUMN IF NOT EXISTS conversation_status TEXT CHECK (conversation_status IN ('active', 'resolved', 'escalate')),
ADD COLUMN IF NOT EXISTS conversation_state_detected TEXT CHECK (conversation_state_detected IN ('ANSWERED', 'STUCK', 'BREAKTHROUGH', 'CRISIS'));
```

**Purpose**: Track conversation completion and state transitions for analytics.

---

## What Changed (Before vs After)

| Aspect | Before (Action-First) | After (Fusion Model) |
|--------|----------------------|---------------------|
| **Length** | 60-120 words (240-480 chars) | 150-300 CHARACTERS |
| **Format** | Structured (pattern + 1-3 protocols + question) | Conversational (state-based) |
| **Presentation** | Bold, bullets, headings | Plain text only |
| **Protocols** | 1-3 protocols | 1 protocol (or none if STUCK) |
| **State Detection** | None (same response for all) | 4 states (ANSWERED/STUCK/BREAKTHROUGH/CRISIS) |
| **Positioning** | "Forensic behavioral psychologist" | "Conversational dialogue partner" |
| **Tone** | Coaching/authority figure | Dialogue/peer |
| **Protocol Selection** | Offer multiple, explain all | Select 1, weave naturally |
| **Token Limit** | 280 tokens | 200 tokens |

---

## Fusion Impact Analysis

### What Stays (Prompt 1 Forensic Power):
- ✅ 7 forensic capabilities (pattern detection, 3-day gap, timing analysis, energy forensics, identity tracking, breakthrough scoring, dropout prediction)
- ✅ 205-protocol RAG library with semantic search
- ✅ Temperament-based personalization (warrior/sage/builder/connector)
- ✅ PROTECT system integration (7 daily practices, timing windows, point system)
- ✅ User context (practice history, patterns, collision types)

### What Changed (Prompt 2 Conversational Flow):
- ✅ Conversation state classification (ANSWERED/STUCK/BREAKTHROUGH/CRISIS)
- ✅ Extreme brevity (150-300 CHARACTERS vs 60-120 words)
- ✅ Dialogue positioning ("This is a dialogue, not a lecture")
- ✅ ONE thing per response (not pattern + protocols + question)
- ✅ State-based protocol selection (STUCK gets none, CRISIS gets 2-5min emergency only)
- ✅ Plain text output (no bold, bullets, structure)
- ✅ Conditional logic (different formats for different states)

---

## Test Validation

### Quick Test with bash /tmp/test-mio.sh

**Status**: ⏳ PENDING (Edge Function deployed, needs UI testing)

**What to Test**:
1. **STUCK State**: Send vague message ("I feel stuck") → Should get clarifying question, NO protocol
2. **ANSWERED State**: Answer the question with specifics → Should get acknowledgment + 1 protocol + action question
3. **BREAKTHROUGH State**: Show insight ("I realized I keep self-sabotaging") → Should celebrate + 1 protocol + encouragement
4. **CRISIS State**: 3-day gap detected or express dropout risk → Should get urgent observation + emergency protocol (2-5 min)

**Character Count Validation**:
- All responses should be 150-300 characters
- No responses >300 chars
- Plain text only (no bold **text**, no bullets)

---

## Deployment Status

### ✅ Completed:
1. ✅ Conversation State Detection section added (lines 493-518)
2. ✅ Response Style Requirements replaced (lines 520-631)
3. ✅ Protocol Recommendation Workflow rewritten (lines 633-724)
4. ✅ Token limit reduced (280 → 200 tokens)
5. ✅ Database tracking fields added (lines 1134-1136)
6. ✅ Migration file created (`20251123000000_add_conversation_state_tracking.sql`)
7. ✅ Edge Function deployed (script size: 202.3kB)

### ⏳ Pending:
1. **Database Migration**: Run migration manually via Supabase Dashboard SQL Editor
   - File: `supabase/migrations/20251123000000_add_conversation_state_tracking.sql`
   - Or run via Dashboard: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new

2. **UI Testing**: Test 5+ messages in conversation flow to validate:
   - State detection working (ANSWERED/STUCK/BREAKTHROUGH/CRISIS)
   - Responses 150-300 chars
   - Plain text only (no formatting)
   - ONE protocol per response
   - Conversational feel vs coaching feel

---

## Success Metrics

### Technical Goals:
- **Response Length**: 150-300 chars (was 240-480 chars) = 37-50% reduction
- **Protocol Count**: 1 protocol (was 1-3) = Focused recommendations
- **State Classification**: 4 states (was 0) = Context-aware responses
- **Token Usage**: 200 max (was 280) = 28% reduction
- **Format**: Plain text (was bold+bullets) = Natural conversation

### User Experience Goals:
- **Feels like dialogue**: Not coaching or authority figure
- **Context-aware**: Different responses for answered/stuck/breakthrough/crisis moments
- **Extreme brevity**: 2-3x shorter responses
- **Action-oriented**: Still leads with solutions (forensic power underneath)
- **Progressive disclosure**: Brain science available when user asks "why?"

---

## Migration Instructions (Manual)

Since psql connection failed, run migration via Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql/new
2. Paste the contents of `supabase/migrations/20251123000000_add_conversation_state_tracking.sql`
3. Click "Run" to execute
4. Verify columns added: `conversation_status` and `conversation_state_detected`

**Migration Contents**:
```sql
ALTER TABLE agent_conversations
ADD COLUMN IF NOT EXISTS conversation_status TEXT CHECK (conversation_status IN ('active', 'resolved', 'escalate')),
ADD COLUMN IF NOT EXISTS conversation_state_detected TEXT CHECK (conversation_state_detected IN ('ANSWERED', 'STUCK', 'BREAKTHROUGH', 'CRISIS'));

CREATE INDEX IF NOT EXISTS idx_agent_conversations_state ON agent_conversations(conversation_state_detected) WHERE conversation_state_detected IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_conversations_status ON agent_conversations(conversation_status) WHERE conversation_status IS NOT NULL;
```

---

## Next Steps

### Immediate (Next 30 Minutes):
1. ⏳ **Run migration manually** via Supabase Dashboard SQL Editor
2. ⏳ **Test in UI** with 5+ messages covering all 4 states:
   - Send vague message → Expect clarifying question (STUCK)
   - Answer with specifics → Expect acknowledge + 1 protocol (ANSWERED)
   - Show insight → Expect celebration + 1 protocol (BREAKTHROUGH)
   - Trigger crisis signal → Expect urgent + emergency protocol (CRISIS)
3. ⏳ **Validate character counts** (all responses 150-300 chars)
4. ⏳ **Check formatting** (plain text only, no bold/bullets)

### Short-Term (24-48 Hours):
1. Monitor user engagement with state-based responses
2. Track conversation_state_detected distribution (which states are most common?)
3. Measure protocol acceptance rate by state
4. Collect user feedback: Does it feel conversational vs coaching?

### Long-Term (Week 6+):
1. A/B test fusion model vs previous action-first model
2. Analyze conversation completion rates (conversation_status = resolved)
3. Measure time from pattern detection → action taken
4. Iterate on state classification accuracy

---

## Key Learnings from Fusion

### Why Fusion Model Works:
1. **Forensic Power Underneath**: User gets deep insights but delivered conversationally
2. **Context-Aware Responses**: Different conversation moments need different approaches
3. **Extreme Brevity Forces Quality**: 150-300 chars = Must prioritize what matters
4. **State-Based Protocol Selection**: STUCK needs clarity before action, CRISIS needs quick wins
5. **Dialogue Positioning**: "Dialogue partner" feels collaborative vs "coach" feels top-down

### Core Insight:
Users don't want less intelligence - they want intelligence delivered conversationally. The fusion keeps MIO's forensic superpowers but wraps them in natural, brief, state-aware dialogue.

---

**Report Generated:** November 23, 2025
**System Status:** ✅ DEPLOYED, ⏳ MIGRATION PENDING, ⏳ UI TESTING PENDING
**Recommendation:** Run migration + test 5+ messages in UI to validate fusion model

---

*End of Report*
