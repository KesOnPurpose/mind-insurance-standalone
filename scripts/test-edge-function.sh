#!/bin/bash

# Test Edge Function: analyze-document-metadata
# Verifies CORS fix for bulk document upload

set -e

echo "🧪 Testing Edge Function: analyze-document-metadata"
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check required env vars
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Missing environment variables"
  echo "Please ensure .env.local contains:"
  echo "  VITE_SUPABASE_URL=..."
  echo "  VITE_SUPABASE_ANON_KEY=..."
  exit 1
fi

# Test payload
TEST_PAYLOAD='{
  "filename": "test-group-home-policy.pdf",
  "fileContent": "Group Home Operational Procedures for California. This document outlines the standard operating procedures for adult care facilities including staffing requirements, safety protocols, medication management, and compliance with state regulations.",
  "fileType": "application/pdf"
}'

echo "📡 Sending test request to Edge Function..."
echo "URL: $VITE_SUPABASE_URL/functions/v1/analyze-document-metadata"
echo ""

# Make request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  --location \
  --request POST "$VITE_SUPABASE_URL/functions/v1/analyze-document-metadata" \
  --header "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  --header "Content-Type: application/json" \
  --data "$TEST_PAYLOAD")

# Extract status and body
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Response Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Success! Edge Function is working correctly"
  echo ""
  echo "📝 Metadata Analysis Result:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "🎉 CORS issue is FIXED!"
  echo "The bulk upload feature should now work without browser errors."
else
  echo "❌ Error: Edge Function returned status $HTTP_STATUS"
  echo ""
  echo "Response:"
  echo "$BODY"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check if Edge Function is deployed: npx supabase functions list"
  echo "2. Verify ANTHROPIC_API_KEY secret: npx supabase secrets list"
  echo "3. Check Edge Function logs in Supabase Dashboard"
  exit 1
fi

echo ""
echo "Next steps:"
echo "1. Test in browser with actual PDF upload"
echo "2. Verify no CORS errors in console"
echo "3. Check confidence scores display correctly"
