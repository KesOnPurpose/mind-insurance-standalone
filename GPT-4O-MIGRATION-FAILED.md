# GPT-4o Migration Test - FAILED with 400 Error

**Date:** November 23, 2025
**Test:** GPT-4o model via Lovable AI Gateway
**Result:** ❌ HTTP 400 Error (same as Claude)
**Status:** Investigation needed - Lovable Gateway may only support Gemini

---

## What We Tested

### Configuration Change
**File:** `/supabase/functions/mio-chat/index.ts` Line 1189
```typescript
// Changed from:
model: 'google/gemini-2.5-flash',

// To:
model: 'gpt-4o',
```

### Test Request
```bash
curl -X POST "https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/mio-chat" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d '{"user_id":"...","message":"i feel stuck","current_agent":"mio"}'
```

### Error Response
```json
{"error":"AI API error: 400"}
```

---

## Models Tested So Far (All Failed Except Gemini)

| Model Identifier | Result | Error |
|-----------------|--------|-------|
| `google/gemini-2.5-flash` | ✅ **WORKS** | N/A |
| `anthropic/claude-3-5-haiku-20241022` | ❌ FAILED | 400 |
| `anthropic/claude-haiku` | ❌ FAILED | 400 |
| `claude-3-5-haiku` | ❌ FAILED | 400 |
| `gpt-4o` | ❌ FAILED | 400 |

---

## Critical Finding: Lovable Gateway Likely Only Supports Gemini

### Evidence
1. **Only Gemini works** - Every other model identifier returns 400
2. **Research contradiction** - Docs claim OpenAI support, but testing proves otherwise
3. **No error details** - Gateway returns generic 400, not "model not found" or specific error

### Hypothesis
Lovable AI Gateway may be:
- **Gemini-only gateway** (despite documentation claims)
- **Requires account-level model enablement** (not automatic)
- **Beta access required** for non-Gemini models
- **Documentation outdated** (OpenAI support removed or not yet launched)

---

## Next Actions Required

### Option A: Contact Lovable Support IMMEDIATELY
**Why:** We've exhausted all model identifiers - need official clarification

**Questions to Ask:**
1. Does `ai.gateway.lovable.dev` currently support GPT-4o and Claude models?
2. If yes, what are the EXACT model identifiers that work?
3. Do we need to enable multi-model access in account settings?
4. Is there a way to query available models via API?

### Option B: Migrate to OpenRouter (Confirmed Working)
**Why:** Can't wait for Lovable support response

**Implementation:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Model: `anthropic/claude-3.5-haiku` (verified working)
- Effort: 1-2 days
- Cost: $320/month (vs $105 Gemini)

### Option C: Stay on Gemini, Accept Limitations
**Why:** Only confirmed working option

**Trade-offs:**
- Keep current $105/month cost ✅
- Accept context loss issue ❌
- Focus on other product improvements

---

## Recommendation

**IMMEDIATE:** Restore Gemini and create support ticket to Lovable
**PARALLEL:** Begin OpenRouter migration prep (while waiting for Lovable response)
**DECISION POINT:** 48 hours - if no Lovable response, deploy OpenRouter

---

**Status:** Awaiting user decision on next steps
