# Analyze Document Metadata - Supabase Edge Function

## Purpose
This Edge Function proxies Claude API calls server-side to avoid CORS issues when analyzing documents for metadata extraction in the bulk upload feature.

## Deployment Instructions

### 1. Set Environment Variable
Before deploying, you must set the `ANTHROPIC_API_KEY` secret:

```bash
# Navigate to project root
cd mindhouse-prodigy

# Set the secret (replace with your actual Anthropic API key)
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 2. Deploy the Function
```bash
# Deploy the Edge Function
npx supabase functions deploy analyze-document-metadata

# Verify deployment
npx supabase functions list
```

### 3. Test the Function
```bash
# Test with a sample document
curl -i --location --request POST 'https://hpyodaugrkctagkrfofj.supabase.co/functions/v1/analyze-document-metadata' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "filename": "test-document.pdf",
    "fileContent": "Sample group home operational procedures...",
    "fileType": "application/pdf"
  }'
```

## Environment Variables Required

### In Edge Function (Supabase Secrets):
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude

### In Client App (.env.local):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Function Details

### Request Format
```typescript
POST /functions/v1/analyze-document-metadata
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json

{
  "filename": "document.pdf",
  "fileContent": "extracted text content...",
  "fileType": "application/pdf",
  "imageData": "base64-encoded-image" // optional, for image files
}
```

### Response Format
```typescript
{
  "category": "operations|marketing|financial|legal|revenue|compliance",
  "description": "1-2 sentence description",
  "applicable_states": ["CA", "TX"] or ["ALL"],
  "ownership_model": ["individual", "llc", "corporation", "partnership", "nonprofit"],
  "applicable_populations": ["adult", "youth", "seniors", "veterans", "special_needs"],
  "difficulty": "beginner"|"intermediate"|"advanced"|null,
  "confidence": {
    "category": 85,
    "description": 90,
    "applicable_states": 75,
    "ownership_model": 80,
    "applicable_populations": 85,
    "difficulty": 70
  },
  "notes": "Brief analysis rationale from Claude"
}
```

### Error Handling
The function returns appropriate HTTP status codes:
- `200` - Success
- `400` - Missing required fields (filename, fileContent)
- `500` - Server error (Anthropic API failure, parsing error, etc.)

## Local Development

### Run Locally
```bash
# Start Supabase local stack (includes Edge Functions)
npx supabase start

# Serve function locally
npx supabase functions serve analyze-document-metadata --env-file .env.local

# Test locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-document-metadata' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"filename": "test.pdf", "fileContent": "test content", "fileType": "application/pdf"}'
```

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"
- Ensure you've set the secret: `npx supabase secrets set ANTHROPIC_API_KEY=your-key`
- Verify secrets: `npx supabase secrets list`

### CORS Errors
- The function already includes CORS headers
- Ensure you're using the correct Supabase project URL in client code

### Rate Limiting
- Claude API has rate limits based on your plan
- The client-side code already implements batch processing with delays
- Consider implementing additional rate limiting if needed

## Costs

### Anthropic API (Claude Haiku)
- Model: `claude-3-haiku-20240307` (cost-efficient)
- ~$0.00025 per document analysis (1K tokens input)
- Estimated cost: $0.25 per 1,000 documents

### Supabase Edge Functions
- First 500K requests/month: Free
- Additional: $2 per 1M requests
- Estimated cost: Negligible for typical usage

## Maintenance

### Updating the Function
1. Modify `index.ts`
2. Test locally: `npx supabase functions serve`
3. Deploy: `npx supabase functions deploy analyze-document-metadata`
4. Verify in production

### Monitoring
- Check Supabase dashboard → Edge Functions → Logs
- Monitor Anthropic API usage in Anthropic Console
- Track error rates and response times

## Security Notes
- API key is stored as Supabase secret (never in client code)
- Function validates all inputs
- CORS headers allow all origins (adjust if needed)
- RLS policies don't apply to Edge Functions (handled by function logic)
