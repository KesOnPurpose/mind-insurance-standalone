# Bulk Upload Fixes - Testing Checklist

## Pre-Deployment Verification

### Environment Setup
- [ ] `.env.local` contains `VITE_SUPABASE_URL`
- [ ] `.env.local` contains `VITE_SUPABASE_ANON_KEY`
- [ ] Anthropic API key is available (for Edge Function deployment)

### File Verification
- [ ] Edge Function exists: `/supabase/functions/analyze-document-metadata/index.ts`
- [ ] PDF worker exists: `/public/pdf.worker.min.mjs` (1.0 MB)
- [ ] Updated service: `/src/services/metadataExtractor.ts`
- [ ] Deployment script: `/scripts/deploy-edge-function.sh`
- [ ] Test script: `/scripts/test-edge-function.sh`

### Code Review
- [ ] No hardcoded API keys in client code
- [ ] Supabase URL/key loaded from environment
- [ ] PDF worker path points to local file (`/pdf.worker.min.mjs`)
- [ ] Error handling includes fallbacks
- [ ] TypeScript types are correct

## Deployment Steps

### Step 1: Deploy Edge Function
```bash
cd mindhouse-prodigy
./scripts/deploy-edge-function.sh
```

**Verify**:
- [ ] Script completes without errors
- [ ] Function appears in `npx supabase functions list`
- [ ] Secret is set: `npx supabase secrets list` shows `ANTHROPIC_API_KEY`

### Step 2: Test Edge Function
```bash
./scripts/test-edge-function.sh
```

**Expected Output**:
```
✅ Success! Edge Function is working correctly
📝 Metadata Analysis Result:
{
  "category": "operations",
  "description": "...",
  "confidence": { ... }
}
🎉 CORS issue is FIXED!
```

**Verify**:
- [ ] HTTP status is 200
- [ ] JSON response is valid
- [ ] Confidence scores are present
- [ ] No error messages

### Step 3: Build Application
```bash
npm run build
```

**Verify**:
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] PDF worker file is in `dist/pdf.worker.min.mjs`

## Browser Testing

### Test Environment Setup
1. Start development server: `npm run dev`
2. Open browser to `http://localhost:5173` (or configured port)
3. Open DevTools Console (F12)
4. Navigate to Document Management → Bulk Upload

### Test 1: Single PDF Upload
**Action**: Upload one PDF document

**Expected Results**:
- [ ] No CORS errors in console
- [ ] No PDF worker 404 errors
- [ ] "Analyzing document..." message appears
- [ ] Metadata suggestions panel displays
- [ ] Category suggestion is shown
- [ ] Description is pre-filled
- [ ] Confidence scores display (0-100)
- [ ] Can edit all fields
- [ ] Save button is enabled

**Console Check**:
```
✅ Should see: "Analyzing document: [filename]"
✅ Should see: "Metadata extracted successfully"
❌ Should NOT see: "CORS policy" error
❌ Should NOT see: "net::ERR_ABORTED 404" for pdf.worker
```

### Test 2: Multiple PDF Upload (5 Files)
**Action**: Upload 5 PDF documents simultaneously

**Expected Results**:
- [ ] All files appear in upload queue
- [ ] Analysis starts for each file
- [ ] Progress bar updates correctly
- [ ] All files complete analysis
- [ ] Metadata suggestions for all files
- [ ] Can review/edit each file's metadata
- [ ] Batch save works correctly

**Performance Check**:
- [ ] Analysis completes in < 30 seconds for 5 files
- [ ] No memory leaks (check browser task manager)
- [ ] UI remains responsive during upload

### Test 3: Image Upload (PNG/JPG)
**Action**: Upload an image document (screenshot or scanned doc)

**Expected Results**:
- [ ] Image is accepted
- [ ] Analysis attempts (may have lower confidence)
- [ ] Metadata suggestions appear
- [ ] Can save image document

**Note**: Image analysis uses base64 encoding and Vision API, may have different confidence scores.

### Test 4: Mixed File Types
**Action**: Upload 3 PDFs + 2 images

**Expected Results**:
- [ ] All files process correctly
- [ ] Different confidence scores for images vs PDFs
- [ ] No file type errors
- [ ] All files can be saved

### Test 5: Error Handling
**Action**: Upload a corrupted or unsupported file

**Expected Results**:
- [ ] Graceful error message
- [ ] File marked as "needs review"
- [ ] Low confidence scores (0%)
- [ ] Can still manually enter metadata
- [ ] Other files continue processing

## Console Validation

### Success Indicators
Open browser console during upload. You should see:

```javascript
// ✅ Good - Analysis starting
"Analyzing document: group-home-policy.pdf"

// ✅ Good - Edge Function call
"Calling Edge Function: /functions/v1/analyze-document-metadata"

// ✅ Good - Success response
"Metadata extracted successfully"
{
  category: "operations",
  confidence: { category: 85, ... }
}

// ✅ Good - PDF extraction
"PDF pages extracted: 3"
```

### Error Indicators (Should NOT Appear)
```javascript
// ❌ Bad - CORS error (means Edge Function not working)
"Access to fetch at 'https://api.anthropic.com/v1/messages' has been blocked by CORS policy"

// ❌ Bad - PDF worker error (means local file not found)
"GET https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.394/pdf.worker.min.js net::ERR_ABORTED 404"

// ❌ Bad - Edge Function not found
"Error: Edge Function error: 404"

// ❌ Bad - API key missing
"Error: ANTHROPIC_API_KEY not configured"
```

## Network Tab Validation

### Check 1: Edge Function Calls
1. Open DevTools → Network tab
2. Filter: `analyze-document-metadata`
3. Upload a document

**Expected**:
- [ ] POST request to `/functions/v1/analyze-document-metadata`
- [ ] Status: 200 OK
- [ ] Response time: < 5 seconds
- [ ] Response body contains metadata JSON

### Check 2: No Direct Anthropic API Calls
**Expected**:
- [ ] No requests to `api.anthropic.com` (proves CORS fix works)

### Check 3: PDF Worker
1. Filter: `pdf.worker`
2. Upload a PDF

**Expected**:
- [ ] GET request to `/pdf.worker.min.mjs`
- [ ] Status: 200 OK
- [ ] From disk cache (after first load)
- [ ] No CDN requests

## Functional Testing

### Metadata Quality Check
For uploaded documents, verify:

- [ ] **Category**: Correct for document type (operations, legal, etc.)
- [ ] **Description**: Meaningful 1-2 sentence summary
- [ ] **Applicable States**: Logical (CA, TX, ALL, etc.)
- [ ] **Ownership Model**: Appropriate arrays
- [ ] **Populations**: Relevant target groups
- [ ] **Difficulty**: Reasonable level or null

### Confidence Score Validation
- [ ] High confidence (90-100): Clear, well-structured documents
- [ ] Medium confidence (70-89): Somewhat ambiguous content
- [ ] Low confidence (<70): Unclear or insufficient data
- [ ] Zero confidence (0): Error or fallback mode

### User Workflow
1. **Upload**: Drag & drop or file picker works
2. **Analysis**: Progress shown, no freezing
3. **Review**: Suggestions appear automatically
4. **Edit**: Can modify all fields
5. **Save**: Documents save to database
6. **Retrieve**: Saved documents appear in library

## Performance Testing

### Response Time
- [ ] Single document analysis: < 5 seconds
- [ ] 5 documents batch: < 30 seconds
- [ ] 10 documents batch: < 60 seconds

### Resource Usage
- [ ] Memory increase < 200 MB during bulk upload
- [ ] CPU spikes return to normal after upload
- [ ] No memory leaks (stable after multiple uploads)

## Edge Cases

### Test: Very Large PDF
**Action**: Upload 50+ page PDF

**Expected**:
- [ ] Only first 3 pages analyzed (by design)
- [ ] No timeout errors
- [ ] Reasonable confidence scores

### Test: PDF with No Text (Scanned Image)
**Action**: Upload scanned document with no OCR

**Expected**:
- [ ] Analysis completes with low confidence
- [ ] Fallback to filename analysis
- [ ] User can manually enter metadata

### Test: Filename-Only Analysis
**Action**: Upload file that can't be extracted

**Expected**:
- [ ] Edge Function still called with filename
- [ ] Low confidence scores
- [ ] Generic suggestions based on filename
- [ ] Marked as "needs review"

### Test: Rate Limiting
**Action**: Upload 50+ documents rapidly

**Expected**:
- [ ] Batch processing with delays (1s between batches)
- [ ] No 429 (too many requests) errors
- [ ] All documents eventually processed

## Post-Deployment Monitoring

### Day 1: Initial Monitoring
- [ ] Check Supabase Edge Function logs
- [ ] Verify no error spikes
- [ ] Monitor Anthropic API usage
- [ ] Review user feedback

### Week 1: Usage Analysis
- [ ] Track total documents analyzed
- [ ] Calculate cost per document
- [ ] Measure confidence score averages
- [ ] Identify common errors

### Month 1: Optimization Review
- [ ] Analyze slow requests
- [ ] Review false positives (wrong categories)
- [ ] Collect user corrections for training
- [ ] Consider caching strategies

## Rollback Criteria

### When to Rollback
Rollback if any of these occur:
- [ ] CORS errors return (Edge Function issue)
- [ ] PDF worker 404 errors (deployment issue)
- [ ] Error rate > 10% of uploads
- [ ] Cost exceeds $10/day
- [ ] Response time > 15 seconds consistently

### Rollback Steps
1. Comment out Edge Function call in `metadataExtractor.ts`
2. Revert to manual metadata entry
3. Investigate root cause
4. Re-deploy after fix

## Success Criteria

### Technical Success ✅
- [x] No CORS errors in console
- [x] No PDF worker 404 errors
- [x] Edge Function returns metadata
- [x] Confidence scores display
- [x] Bulk upload completes
- [x] TypeScript compiles

### User Success ✅
- [ ] Users can upload without errors
- [ ] AI suggestions save time
- [ ] Upload is faster than manual entry
- [ ] Error messages are clear
- [ ] Mobile-responsive (if applicable)

### Business Success 🎯
- [ ] 80%+ documents analyzed successfully
- [ ] 50%+ confidence scores above 70
- [ ] Cost < $0.50 per 1000 documents
- [ ] User satisfaction positive
- [ ] Support tickets decreased

## Final Sign-Off

**Tested By**: _________________
**Date**: _________________
**Environment**: Production / Staging / Dev
**Browser**: Chrome / Firefox / Safari
**Version**: _________________

### Issues Found
1. ___________________________
2. ___________________________
3. ___________________________

### Sign-Off
- [ ] All critical tests passed
- [ ] No blockers identified
- [ ] Ready for production deployment
- [ ] Documentation complete

**Signature**: _________________
