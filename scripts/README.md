# RAG Knowledge Base Scripts

## Overview

These scripts generate embeddings for the three-agent RAG system (Nette AI, MIO AI, ME AI).

## Scripts

### `generate-rag-embeddings.ts`

**Purpose**: Parse all training materials and generate embeddings for Nette and ME AI agents.

**Files Processed**:
- `GROUP-HOME-TACTICS-LIBRARY.md` - 403 tactics → Nette AI
- `Group_Home_for_newbies_Q_A_5_20_25.md` - Q&A session → Nette AI
- `Group_home_for_Newbies_Q_A_7_4_25.md` - Q&A session → Nette AI
- `Group_Home_Webinar_recording_8_13_25.md` - Training webinar → Nette AI
- `Group_home_webinar_recording_9_11_25.md` - Training webinar → Nette AI
- `Goup_home_Newbies_training_7_22_25.md` - Training session → Nette AI
- `The_Lynette_Story_7_19_2024.md` - Success story → Nette AI
- Financing content extracted from above → ME AI

**Output**:
- ~403 tactic chunks (Nette AI)
- ~400-600 Q&A chunks (Nette AI)
- ~300-400 webinar chunks (Nette AI)
- ~100-200 story chunks (Nette AI)
- ~200-300 financing chunks (ME AI)
- **Total: ~1,400-1,900 chunks**

### `generate-embeddings.ts` (Legacy)

**Purpose**: Generate embeddings for MIO AI (PROTECT methodology).

**Note**: This script is kept for MIO AI's existing knowledge base (`mio_knowledge_chunks`).

## Setup

### Prerequisites

1. **Environment Variables**:
   ```bash
   SUPABASE_SERVICE_KEY=your_service_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

2. **Files Location**:
   - All training files must be in `user-uploads/` directory
   - Files must match exact names in script

3. **Database Tables**:
   - Run the Phase 1 migration first to create:
     - `nette_knowledge_chunks`
     - `me_knowledge_chunks`
     - Updated `user_profiles` with tier_level and current_week

### Installation

```bash
# Install dependencies
npm install tsx @supabase/supabase-js

# Or with bun
bun install tsx @supabase/supabase-js
```

## Usage

### Generate All RAG Embeddings

```bash
# Run the RAG embeddings script
npx tsx scripts/generate-rag-embeddings.ts

# Or with bun
bun run scripts/generate-rag-embeddings.ts
```

### Expected Console Output

```
🚀 STARTING RAG KNOWLEDGE BASE GENERATION

══════════════════════════════════════════════════════════════════════

📚 STEP 1: PARSING ALL TRAINING MATERIALS

1️⃣  Parsing Tactics Library...
   ✅ Parsed 403 tactics

2️⃣  Parsing Q&A Sessions...
   ✅ Parsed 234 Q&A chunks from Group_Home_for_newbies_Q_A_5_20_25.md
   ✅ Parsed 189 Q&A chunks from Group_home_for_Newbies_Q_A_7_4_25.md

3️⃣  Parsing Webinar Trainings...
   ✅ Parsed 156 webinar chunks from Group_Home_Webinar_recording_8_13_25.md
   ✅ Parsed 142 webinar chunks from Group_home_webinar_recording_9_11_25.md
   ✅ Parsed 167 webinar chunks from Goup_home_Newbies_training_7_22_25.md

4️⃣  Parsing The Lynette Story...
   ✅ Parsed 128 story chunks

5️⃣  Extracting Financing Content for ME AI...
   ✅ Extracted 287 financing chunks for ME AI

📊 PARSING SUMMARY:
   • Nette AI: 1,419 chunks
   • ME AI: 287 chunks
   • Total: 1,706 chunks

══════════════════════════════════════════════════════════════════════

🧠 STEP 2: GENERATING EMBEDDINGS & INSERTING TO DATABASE

🔵 Processing Nette AI chunks...
   ✅ 50/1419 Nette chunks processed
   ✅ 100/1419 Nette chunks processed
   ... [continues]

💰 Processing ME AI chunks...
   ✅ 20/287 ME chunks processed
   ✅ 40/287 ME chunks processed
   ... [continues]

══════════════════════════════════════════════════════════════════════

✅ RAG KNOWLEDGE BASE GENERATION COMPLETE!

📊 FINAL STATISTICS:
   • Nette AI: 1,419/1,419 chunks inserted
   • ME AI: 287/287 chunks inserted
   • Total Successful: 1,706
   • Errors: 0

🎉 All agents are now RAG-powered!
══════════════════════════════════════════════════════════════════════
```

## Chunking Strategy

### Tactics Library (1 chunk per tactic)
- **Format**: `T###: Description`
- **Metadata**: week_number, tactic_category, tactic_id
- **Priority**: 1 (highest)

### Q&A Sessions (Semantic chunking)
- **Size**: 400-500 tokens per chunk
- **Breaks**: Natural question boundaries
- **Overlap**: 10 lines context
- **Priority**: 2

### Webinars (Section-based chunking)
- **Size**: 450-500 tokens per chunk
- **Breaks**: Speaker changes, topic shifts
- **Overlap**: 8 lines context
- **Priority**: 2

### Lynette Story (Narrative chunking)
- **Size**: 400-500 tokens per chunk
- **Breaks**: Story arcs
- **Overlap**: 8 lines context
- **Priority**: 3

### Financing Content (Extracted)
- **Source**: All above files
- **Filter**: Financing keywords (20+ keywords)
- **Metadata**: financing_type, capital_range
- **Priority**: 2

## Performance

### Rate Limiting
- **OpenAI API**: 350ms delay between requests (3 req/sec)
- **Total time**: ~10-15 minutes for 1,700 chunks

### Cost Estimate
- **OpenAI Embeddings**: 1,700 chunks × $0.00002 = **$0.034**
- **One-time cost**: Less than $0.05

## Verification

After running the script, verify in Supabase:

```sql
-- Check Nette AI chunks
SELECT 
  category, 
  COUNT(*) as count,
  AVG(tokens_approx) as avg_tokens
FROM nette_knowledge_chunks
GROUP BY category;

-- Check ME AI chunks
SELECT 
  financing_type,
  COUNT(*) as count
FROM me_knowledge_chunks
GROUP BY financing_type;

-- Check embeddings exist
SELECT COUNT(*) FROM nette_knowledge_chunks WHERE embedding IS NOT NULL;
SELECT COUNT(*) FROM me_knowledge_chunks WHERE embedding IS NOT NULL;
```

## Troubleshooting

### "File not found" errors
- Ensure all files are in `user-uploads/` directory
- Check file names match exactly (case-sensitive)

### "Rate limit exceeded" errors
- Increase sleep delay in script (line: `await sleep(350)`)
- Reduce to 500ms for OpenAI Tier 1 limits

### "Embedding is null" errors
- Check OPENAI_API_KEY is set correctly
- Verify API key has credits remaining
- Check network connectivity

### Database insertion errors
- Verify migration ran successfully
- Check SUPABASE_SERVICE_KEY permissions
- Ensure tables exist: `nette_knowledge_chunks`, `me_knowledge_chunks`

## Next Steps

After running this script:

1. ✅ Knowledge base populated (~1,700 chunks)
2. ⏭️ Create shared RAG utilities (Phase 2)
3. ⏭️ Build Nette AI edge function (Phase 3)
4. ⏭️ Upgrade MIO AI with RAG (Phase 4)
5. ⏭️ Create ME AI edge function (Phase 5)
6. ⏭️ Integrate Upstash Redis caching (Phase 6)
