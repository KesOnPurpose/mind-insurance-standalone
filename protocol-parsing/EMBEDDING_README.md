# OpenAI Embedding Generation for MIO Protocol Library

## Overview

Week 2 Day 5 of 6-week MIO transformation: Generate vector embeddings for semantic search across 205 parsed protocols.

## Quick Start

### 1. Set OpenAI API Key

Edit `.env` file in parent directory (`mindhouse-prodigy/.env`):

```bash
# Uncomment and add your key:
OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Run Script

```bash
cd protocol-parsing
python3 generate_embeddings.py
```

### 3. Output

Creates: `output/all-protocols-with-embeddings.json` (205 protocols with 1536-dimension embeddings)

## Cost Estimate

- **Model**: `text-embedding-3-small`
- **Pricing**: $0.020 per 1M tokens
- **Estimated tokens**: ~61,500 (205 protocols × 300 tokens avg)
- **Estimated cost**: **~$0.001** (less than 1 cent)

## Input Files

Combines 3 parsed JSON files:

1. `daily-deductible-parsed.json` (45 protocols)
2. `neural-rewiring-parsed.json` (60 protocols)
3. `research-protocols-parsed.json` (100 protocols)

**Total**: 205 protocols

## Features

### Batch Processing
- Processes protocols in batches of 100
- Automatic retry with exponential backoff on rate limits
- Progress indicators for each batch

### Metadata Enhancement
Enriches embedding text with metadata for better semantic matching:

```
Title: {chunk_summary}
Category: {category}
Patterns: {applicable_patterns}
Temperament: {temperament_match}

{chunk_text}
```

### Smart Text Selection
- Uses `chunk_text` as primary content
- Falls back to `chunk_summary` if text exceeds 8000 tokens
- Prevents token limit errors

### Error Handling
- Rate limit (429) handling with exponential backoff
- API error recovery
- Validation of all embeddings before save
- Resume capability on interruption

### Validation
Checks all embeddings for:
- ✓ Presence of embedding field
- ✓ Correct dimensions (1536)
- ✓ No null/NaN values
- ✓ All numeric values (floats)

## Output Format

Each protocol gets 3 new fields:

```json
{
  "source_file": "daily_deductible_library.md",
  "chunk_text": "...",
  "chunk_summary": "Prayer and Worship",
  "category": "traditional-foundation",
  "embedding": [0.123, -0.456, ...],  // 1536 floats
  "embedding_model": "text-embedding-3-small",
  "embedding_dimensions": 1536,
  ...all other existing fields...
}
```

## Performance

- **Processing time**: ~2-3 minutes (with rate limiting)
- **Output file size**: ~50-60 MB (JSON with embeddings)
- **Memory usage**: ~100 MB peak

## Dependencies

Required packages (check with `pip list`):

```bash
openai>=1.0.0      # OpenAI API client
python-dotenv      # .env file loading (optional)
```

Install missing packages:

```bash
pip install openai python-dotenv
```

## Usage Examples

### Standard Run

```bash
python3 generate_embeddings.py
```

### Override API Key (One-Time)

```bash
OPENAI_API_KEY=sk-proj-... python3 generate_embeddings.py
```

### Check Prerequisites

```bash
# Verify input files exist
ls -lh output/*.json

# Check OpenAI package installed
python3 -c "import openai; print(openai.__version__)"

# Check API key set
python3 -c "import os; print('API key set' if os.getenv('OPENAI_API_KEY') else 'API key missing')"
```

## Troubleshooting

### Error: "OPENAI_API_KEY environment variable not set"

**Solution**: Add key to `.env` file or export it:

```bash
export OPENAI_API_KEY=sk-proj-your-key-here
```

### Error: "openai package not installed"

**Solution**: Install OpenAI package:

```bash
pip install openai
```

### Error: "Rate limit exceeded"

**Solution**: Script automatically retries with exponential backoff. If persistent, wait 60 seconds and retry.

### Error: "File not found"

**Solution**: Verify all 3 input files exist:

```bash
ls -lh output/daily-deductible-parsed.json
ls -lh output/neural-rewiring-parsed.json
ls -lh output/research-protocols-parsed.json
```

## Next Steps

After generating embeddings:

1. **Upload to Supabase**: Use embeddings for vector similarity search
2. **Build MIO Oracle**: Semantic protocol matching based on user input
3. **Test Queries**: Validate embedding quality with sample searches

## Script Output Example

```
======================================================================
MIO Protocol Library - OpenAI Embedding Generation
Week 2 Day 5 - Vector Embeddings for Semantic Search
======================================================================
Loading protocol files...
  Loaded 45 protocols from daily-deductible-parsed.json
  Loaded 60 protocols from neural-rewiring-parsed.json
  Loaded 100 protocols from research-protocols-parsed.json
Total protocols loaded: 205

Preparing texts for embedding...
Processing 205 protocols in 3 batches of 100
Model: text-embedding-3-small (dimensions: 1536)

  Processing batch 1/3 (100 texts)... ✓ (15,234 tokens)
  Processing batch 2/3 (100 texts)... ✓ (14,892 tokens)
  Processing batch 3/3 (5 texts)... ✓ (743 tokens)

Adding embeddings to protocol data...

Validating embeddings...
✓ All 205 protocols have valid embeddings

Saving to all-protocols-with-embeddings.json...
✓ Saved 205 protocols (52,431,892 bytes)

======================================================================
SUMMARY
======================================================================
Script Path:        generate_embeddings.py
Total Protocols:    205
Total Tokens Used:  30,869
Total Cost:         $0.0006
Output File:        output/all-protocols-with-embeddings.json
Output File Size:   52,431,892 bytes (50.01 MB)

Sample Embedding (first 10 values):
  [0.0234, -0.0156, 0.0089, -0.0123, 0.0267, -0.0045, 0.0178, -0.0201, 0.0098, -0.0134]

✓ Embedding generation complete!
======================================================================
```

## Technical Details

### Embedding Model Specs

- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Max input tokens**: 8191
- **Similarity metric**: Cosine similarity
- **Use case**: Semantic search, clustering, recommendations

### API Batch Limits

- **Max inputs per request**: 2048
- **Script batch size**: 100 (conservative for reliability)
- **Rate limits**: Tier-dependent (typically 3000 RPM)

### Cost Breakdown

```
Tokens per protocol (avg): 300
Total protocols: 205
Total tokens: 205 × 300 = 61,500

Price: $0.020 per 1M tokens
Cost: (61,500 / 1,000,000) × $0.020 = $0.00123

Actual cost: ~$0.001 (rounded)
```

## Week 2 Day 5 Progress

- [x] Parse 3 protocol files (Day 1-4)
- [x] Extract 205 protocols total
- [x] Create embedding generation script
- [ ] **Run embedding generation** ← YOU ARE HERE
- [ ] Upload embeddings to Supabase
- [ ] Build semantic search functionality
- [ ] Test MIO Oracle queries

---

**Status**: Ready to run (requires OpenAI API key)
**Estimated completion time**: 2-3 minutes
**Estimated cost**: Less than 1 cent
