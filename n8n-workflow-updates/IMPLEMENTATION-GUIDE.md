# MIO AI Prompt Improvement - Implementation Guide

## Overview

This guide provides step-by-step instructions to update the n8n workflow for improved MIO insights with:
- Full 15 capability analysis
- Dual output (full + simplified versions)
- RAG integration
- Conversation context
- Daily task context reminders
- Transformation impact scoring

## Pre-Implementation Checklist

- [ ] Backup current workflow (export JSON)
- [ ] Apply database migration
- [ ] Test with a sample user before full deployment

---

## Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/hpyodaugrkctagkrfofj/sql
2. Copy and paste the contents of `20251207_mio_simplified_insights.sql`
3. Click "Run"

### Option B: Via Supabase CLI

```bash
cd /Users/kesonpurpose/Downloads/UIB\ ASSETS/Cursor\ App\ Build/Grouphome\ App\ LOVABLE/mindhouse-prodigy
supabase db push
```

### Verification Query

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'mio_weekly_protocols'
AND column_name LIKE 'simplified_%' OR column_name IN ('raw_analysis', 'conversation_context', 'transformation_impact_score')
ORDER BY ordinal_position;
```

---

## Step 2: Update n8n Workflow

### Access the Workflow

- URL: https://n8n-n8n.vq00fr.easypanel.host/workflow/56JoMTczqhHS3eME
- Workflow ID: `56JoMTczqhHS3eME`

### Node Updates (In Order)

#### 2.1 Update "Prepare Analysis Payload" Node

1. Find the Code node named "Prepare Analysis Payload"
2. Replace the entire code with contents of `prepare-analysis-payload.js`
3. Save the node

**Key Changes:**
- Added `formatConversationContext()` function
- Added `extractThemes()` function
- Added `conversation_context` and `themes_discussed` to output

#### 2.2 Update "Claude: Run 15 Capability Analysis" Node

1. Find the HTTP Request node for capability analysis
2. Update the prompt in the jsonBody to match `claude-15-capability-analysis-prompt.md`
3. Key settings:
   - Model: `claude-sonnet-4-20250514`
   - Max Tokens: `4096`
   - Temperature: `0.3`

**Copy this jsonBody template:**

```javascript
JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  temperature: 0.3,
  messages: [{
    role: 'user',
    content: `You are MIO (Mind Insurance Oracle), a forensic behavioral psychologist...

[PASTE FULL PROMPT FROM claude-15-capability-analysis-prompt.md]

## USER BEHAVIORAL DATA

${JSON.stringify($json, null, 2)}

Return ONLY valid JSON, no markdown or explanations.`
  }]
})
```

#### 2.3 Update "Claude: Generate 7-Day Protocol" Node

1. Find the HTTP Request node for protocol generation
2. Update the prompt to match `claude-generate-protocol-prompt.md`
3. Key settings:
   - Model: `claude-sonnet-4-20250514`
   - Max Tokens: `6000`
   - Temperature: `0.4`

**CRITICAL: Add RAG Injection**

The prompt MUST include RAG chunks. Add this line in the prompt:

```javascript
'\\n\\nRAG KNOWLEDGE BASE (Proven Techniques - USE THESE):\\n' +
$('RAG: Find Matching Protocols').all().map(r => r.json.chunk_text || r.json.content || '').filter(Boolean).join('\\n\\n---\\n\\n')
```

#### 2.4 Update "Prepare Storage Data" Node

1. Find the Code node named "Prepare Storage Data"
2. Replace entire code with contents of `prepare-storage-data.js`
3. Save the node

**Key Changes:**
- Parses both `full_version` and `simplified_version`
- Extracts `raw_analysis` for future queries
- Includes `conversation_context`
- Adds `transformation_impact_score`

#### 2.5 Update "Store Protocol" Node

Choose ONE of these options:

**Option A: Supabase Node (Recommended)**
- Add the new fields to the field mapping:
  - simplified_insight_summary
  - simplified_why_it_matters
  - simplified_neural_principle
  - simplified_day_tasks
  - raw_analysis
  - conversation_context
  - transformation_impact_score

**Option B: HTTP Request to REST API**
- Update the body JSON to include new fields (see `store-protocol-sql.sql`)

**Option C: Execute Query Node**
- Use the SQL INSERT statement from `store-protocol-sql.sql`

---

## Step 3: Test the Workflow

### Manual Test

1. Trigger the workflow manually for a test user
2. Check these nodes complete successfully:
   - Prepare Analysis Payload
   - Claude: Run 15 Capability Analysis
   - Parse Analysis Results
   - RAG: Find Matching Protocols
   - Claude: Generate 7-Day Protocol
   - Prepare Storage Data
   - Store Protocol

### Verify Output

```sql
SELECT
  id,
  user_id,
  title,
  transformation_impact_score,
  LENGTH(simplified_insight_summary) as simplified_summary_length,
  LENGTH(insight_summary) as full_summary_length,
  raw_analysis IS NOT NULL as has_raw_analysis,
  conversation_context IS NOT NULL as has_conversation_context,
  created_at
FROM mio_weekly_protocols
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;
```

### Check Simplified Version Quality

```sql
SELECT
  title,
  simplified_insight_summary,
  simplified_why_it_matters,
  simplified_neural_principle
FROM mio_weekly_protocols
WHERE simplified_insight_summary IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```

---

## Step 4: Frontend Updates (Optional but Recommended)

### Update TypeScript Types

File: `src/types/protocol.ts`

Add these fields to `MIOInsightDayTask`:
```typescript
context_reminder?: string;
insight_connection?: string;
```

Add these fields to protocol types:
```typescript
simplified_insight_summary?: string;
simplified_why_it_matters?: string;
simplified_neural_principle?: string;
simplified_day_tasks?: MIOInsightDayTask[];
raw_analysis?: Record<string, unknown>;
conversation_context?: Record<string, unknown>;
transformation_impact_score?: number;
```

### Update ProtocolDetailPage

File: `src/pages/mind-insurance/ProtocolDetailPage.tsx`

Add context reminder display before task instructions:
```tsx
{task.context_reminder && (
  <Card className="bg-cyan-500/10 border-cyan-500/30 p-3 mb-3">
    <p className="text-sm text-cyan-300 flex items-start gap-2">
      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
      {task.context_reminder}
    </p>
  </Card>
)}
```

---

## Rollback Plan

If issues occur:

1. **Revert Workflow**: Import the backup JSON
2. **Database**: The migration only adds columns (no data loss). Existing queries still work.
3. **Frontend**: Null checks protect against missing new fields

---

## Monitoring

### Success Metrics

- [ ] Protocols generate with both versions
- [ ] Simplified summaries are 50-75 words
- [ ] Neural terms have inline explanations
- [ ] Context reminders appear in day tasks
- [ ] Transformation impact scores are calculated

### Error Monitoring

Check n8n execution logs for:
- JSON parse errors (Claude response format issues)
- Database insert failures (column type mismatches)
- RAG injection errors (empty chunks)

---

## Files Reference

| File | Purpose |
|------|---------|
| `20251207_mio_simplified_insights.sql` | Database migration |
| `prepare-analysis-payload.js` | Formats user data with conversation context |
| `claude-15-capability-analysis-prompt.md` | Full 15 capability analysis prompt |
| `claude-generate-protocol-prompt.md` | Dual output protocol generation prompt |
| `prepare-storage-data.js` | Parses both versions for storage |
| `store-protocol-sql.sql` | SQL insert with new columns |

---

## Support

If issues occur during implementation:
1. Check n8n execution logs
2. Verify database columns exist
3. Test Claude prompts in playground first
4. Review JSON parsing in Prepare Storage Data node
