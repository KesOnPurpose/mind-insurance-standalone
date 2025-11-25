#!/bin/bash

# Deploy Edge Function for Document Metadata Analysis
# Fixes CORS issues with bulk document upload

set -e  # Exit on error

echo "🚀 Deploying Edge Function: analyze-document-metadata"
echo ""

# Check if ANTHROPIC_API_KEY is provided
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY not found in environment"
  echo "Please provide your Anthropic API key:"
  read -sp "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
  echo ""
fi

# Set the secret
echo "📝 Setting Anthropic API key as Supabase secret..."
npx supabase secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"

# Deploy the function
echo "📦 Deploying Edge Function..."
npx supabase functions deploy analyze-document-metadata

# Verify deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Verifying deployment..."
npx supabase functions list

echo ""
echo "🎉 Edge Function deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Test the function with: npm run test:edge-function"
echo "2. Test bulk upload in the UI"
echo "3. Monitor logs in Supabase Dashboard → Edge Functions"
echo ""
echo "Cost estimate: ~$0.00025 per document analysis"
