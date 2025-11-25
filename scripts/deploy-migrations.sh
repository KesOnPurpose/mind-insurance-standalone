#!/bin/bash

# ============================================================================
# Deploy Document Management System Migrations
# ============================================================================

set -e  # Exit on error

# Database connection parameters
DB_HOST="db.hpyodaugrkctagkrfofj.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.hpyodaugrkctagkrfofj"
DB_PASS="Nette@2025!"

# Connection string with password embedded
CONN_STRING="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "============================================================================"
echo "Deploying Document Management System Migrations"
echo "Database: ${DB_HOST}"
echo "============================================================================"
echo ""

# Migration 1: gh_documents table
echo "→ Applying migration 1/4: gh_documents table..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -f supabase/migrations/20251120120000_create_gh_documents_table.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration 1/4 applied successfully"
else
  echo "✗ Migration 1/4 failed"
  exit 1
fi

echo ""

# Migration 2: gh_document_tactic_links table
echo "→ Applying migration 2/4: gh_document_tactic_links table..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -f supabase/migrations/20251120120001_create_gh_document_tactic_links_table.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration 2/4 applied successfully"
else
  echo "✗ Migration 2/4 failed"
  exit 1
fi

echo ""

# Migration 3: gh_user_document_activity table
echo "→ Applying migration 3/4: gh_user_document_activity table..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -f supabase/migrations/20251120120002_create_gh_user_document_activity_table.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration 3/4 applied successfully"
else
  echo "✗ Migration 3/4 failed"
  exit 1
fi

echo ""

# Migration 4: gh_training_chunks enhancements
echo "→ Applying migration 4/4: gh_training_chunks enhancements..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  -f supabase/migrations/20251120120003_enhance_gh_training_chunks_table.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration 4/4 applied successfully"
else
  echo "✗ Migration 4/4 failed"
  exit 1
fi

echo ""
echo "============================================================================"
echo "✓✓✓ ALL MIGRATIONS DEPLOYED SUCCESSFULLY ✓✓✓"
echo "============================================================================"
echo ""
echo "Verification queries:"
echo ""

# Verify tables exist
echo "→ Checking tables..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size('public.' || table_name)) AS table_size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('gh_documents', 'gh_document_tactic_links', 'gh_user_document_activity')
ORDER BY table_name;
"

echo ""
echo "→ Checking gh_training_chunks new columns..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gh_training_chunks'
  AND column_name IN ('document_id', 'ownership_model', 'applicable_populations', 'difficulty')
ORDER BY column_name;
"

echo ""
echo "→ Checking RLS policies..."
PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('gh_documents', 'gh_document_tactic_links', 'gh_user_document_activity')
ORDER BY tablename, policyname;
"

echo ""
echo "============================================================================"
echo "Next Steps:"
echo "1. Upload 38 PDF documents to Supabase Storage: training-materials bucket"
echo "2. Seed gh_documents table with document metadata"
echo "3. Create document-tactic links for high-priority tactics"
echo "============================================================================"
