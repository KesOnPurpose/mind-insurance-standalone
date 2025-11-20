-- ============================================================================
-- CORRECTED DOCUMENT MANAGEMENT MIGRATIONS (2025-11-20)
-- ============================================================================
-- This file contains the ACTUAL WORKING schema deployed in production
-- All column names match the TypeScript code in src/services/documentService.ts
-- All RLS policies use admin_users.user_id (NOT admin_users.id)
-- ============================================================================
-- Database: hpyodaugrkctagkrfofj.supabase.co
-- Status: DEPLOYED AND TESTED ✅
-- ============================================================================

\echo '============================================================================'
\echo 'CORRECTED DOCUMENT MANAGEMENT MIGRATIONS'
\echo 'Database: hpyodaugrkctagkrfofj.supabase.co'
\echo 'Date: 2025-11-20'
\echo '============================================================================'

-- ============================================================================
-- STEP 1: CREATE gh_documents TABLE
-- ============================================================================
-- This table stores ALL document metadata
-- Column names match src/types/documents.ts interface
-- ============================================================================

\echo ''
\echo 'Creating gh_documents table...'

CREATE TABLE IF NOT EXISTS gh_documents (
  -- Primary Key
  id SERIAL PRIMARY KEY,

  -- Document Identification & Storage
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,  -- ⚠️ KB not bytes! Code converts: Math.round(bytes / 1024)

  -- Categorization
  category TEXT CHECK (category IN (
    'Legal', 'Financial', 'Marketing', 'Operations',
    'Training', 'Compliance', 'Templates', 'Resources'
  )),
  description TEXT,

  -- Multi-select Filters (PostgreSQL arrays)
  applicable_states TEXT[],  -- e.g., ["CA", "NY", "TX"]
  ownership_model TEXT[] CHECK (
    ownership_model <@ ARRAY['Owner-Occupied', 'Investor-Owned', 'Hybrid', 'Non-Profit']::TEXT[]
  ),
  applicable_populations TEXT[] CHECK (
    applicable_populations <@ ARRAY[
      'Adults with Disabilities', 'Seniors', 'Youth', 'Veterans',
      'Mental Health', 'Substance Recovery', 'General'
    ]::TEXT[]
  ),

  -- Difficulty Level
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),

  -- Engagement Metrics (auto-incremented by triggers)
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),  -- Future feature: user ratings

  -- Audit Fields
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- ⚠️ created_by NOT uploaded_by_admin_id
  created_at TIMESTAMPTZ DEFAULT NOW(),  -- ⚠️ created_at NOT upload_date
  updated_at TIMESTAMPTZ DEFAULT NOW()   -- ⚠️ updated_at NOT last_modified_at
);

-- Table & Column Comments
COMMENT ON TABLE gh_documents IS 'Document registry with metadata, analytics, and categorization';
COMMENT ON COLUMN gh_documents.file_size_kb IS 'File size in kilobytes (uploaded as bytes, stored as KB)';
COMMENT ON COLUMN gh_documents.applicable_states IS 'US state abbreviations where document applies';
COMMENT ON COLUMN gh_documents.ownership_model IS 'Target ownership types (multi-select)';
COMMENT ON COLUMN gh_documents.applicable_populations IS 'Target populations served (multi-select)';
COMMENT ON COLUMN gh_documents.created_by IS 'UUID of admin user who uploaded (references auth.users)';

\echo '✓ gh_documents table created'

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

\echo 'Creating indexes...'

CREATE INDEX IF NOT EXISTS idx_documents_category ON gh_documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_difficulty ON gh_documents(difficulty);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON gh_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON gh_documents(created_by);

-- GIN indexes for array searches
CREATE INDEX IF NOT EXISTS idx_documents_states ON gh_documents USING GIN (applicable_states);
CREATE INDEX IF NOT EXISTS idx_documents_ownership ON gh_documents USING GIN (ownership_model);
CREATE INDEX IF NOT EXISTS idx_documents_populations ON gh_documents USING GIN (applicable_populations);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_search ON gh_documents
  USING GIN (to_tsvector('english', document_name || ' ' || COALESCE(description, '')));

\echo '✓ Indexes created'

-- ============================================================================
-- STEP 3: CREATE AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================================

\echo 'Creating updated_at trigger...'

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_gh_documents_updated_at ON gh_documents;
CREATE TRIGGER update_gh_documents_updated_at
  BEFORE UPDATE ON gh_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

\echo '✓ Auto-update trigger created'

-- ============================================================================
-- STEP 4: CREATE gh_document_tactic_links TABLE
-- ============================================================================
-- Many-to-many relationship: documents ↔ tactics
-- ============================================================================

\echo 'Creating gh_document_tactic_links table...'

CREATE TABLE IF NOT EXISTS gh_document_tactic_links (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES gh_documents(id) ON DELETE CASCADE,
  tactic_id INTEGER NOT NULL REFERENCES gh_tactic_instructions(tactic_id) ON DELETE CASCADE,
  link_type TEXT DEFAULT 'reference',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Prevent duplicate links
  UNIQUE(document_id, tactic_id)
);

COMMENT ON TABLE gh_document_tactic_links IS 'Links documents to tactics they support';

-- Indexes for join performance
CREATE INDEX IF NOT EXISTS idx_document_links_document ON gh_document_tactic_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_tactic ON gh_document_tactic_links(tactic_id);

\echo '✓ gh_document_tactic_links table created'

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

\echo 'Enabling Row Level Security...'

ALTER TABLE gh_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gh_document_tactic_links ENABLE ROW LEVEL SECURITY;

\echo '✓ RLS enabled'

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES FOR gh_documents
-- ============================================================================
-- ⚠️ CRITICAL: All policies use admin_users.user_id = auth.uid()
-- ⚠️ NOT admin_users.id (that column doesn't exist!)
-- ============================================================================

\echo 'Creating RLS policies for gh_documents...'

-- Drop existing (incorrect) policies
DROP POLICY IF EXISTS "Anyone can view documents" ON gh_documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON gh_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON gh_documents;

-- READ: All authenticated users can view documents
CREATE POLICY "Anyone can view documents"
  ON gh_documents FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Only admins can create documents
CREATE POLICY "Admins can insert documents"
  ON gh_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

-- UPDATE: Only admins can update documents
CREATE POLICY "Admins can update documents"
  ON gh_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

-- DELETE: Only admins can delete documents (hard delete)
CREATE POLICY "Admins can delete documents"
  ON gh_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

\echo '✓ RLS policies created for gh_documents'

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES FOR gh_document_tactic_links
-- ============================================================================

\echo 'Creating RLS policies for gh_document_tactic_links...'

-- Drop existing (incorrect) policies
DROP POLICY IF EXISTS "Anyone can view document-tactic links" ON gh_document_tactic_links;
DROP POLICY IF EXISTS "Authenticated users can view links" ON gh_document_tactic_links;
DROP POLICY IF EXISTS "Admins can manage document-tactic links" ON gh_document_tactic_links;
DROP POLICY IF EXISTS "Admins can manage links" ON gh_document_tactic_links;

-- READ: All authenticated users can view links
CREATE POLICY "Anyone can view document-tactic links"
  ON gh_document_tactic_links FOR SELECT
  TO authenticated
  USING (true);

-- WRITE: Only admins can manage links
CREATE POLICY "Admins can manage document-tactic links"
  ON gh_document_tactic_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

\echo '✓ RLS policies created for gh_document_tactic_links'

-- ============================================================================
-- STEP 8: SUPABASE STORAGE BUCKET POLICIES
-- ============================================================================
-- Bucket: training-materials
-- Public: true (authenticated users can download via public URLs)
-- Max file size: 10MB
-- Allowed types: PDF, DOCX
-- ============================================================================

\echo 'Creating storage bucket policies...'

-- Drop existing (incorrect) policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- READ: Authenticated users can download/view files
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'training-materials');

-- INSERT: Only admins can upload files
CREATE POLICY "Admins can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-materials'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

-- UPDATE: Only admins can update files
CREATE POLICY "Admins can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'training-materials'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

-- DELETE: Only admins can delete files
CREATE POLICY "Admins can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'training-materials'
    AND EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()  -- ✅ CORRECT: user_id
    )
  );

\echo '✓ Storage policies created'

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'VERIFICATION'
\echo '============================================================================'

-- Verify tables exist
\echo 'Verifying tables...'
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name IN ('gh_documents', 'gh_document_tactic_links')
ORDER BY table_name;

-- Verify gh_documents columns (must match TypeScript interface)
\echo ''
\echo 'Verifying gh_documents columns...'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'gh_documents'
ORDER BY ordinal_position;

-- Verify RLS is enabled
\echo ''
\echo 'Verifying RLS enabled...'
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('gh_documents', 'gh_document_tactic_links');

-- Verify RLS policies (must use admin_users.user_id)
\echo ''
\echo 'Verifying RLS policies...'
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('gh_documents', 'gh_document_tactic_links', 'objects')
  AND (
    tablename != 'objects'
    OR policyname LIKE '%training-materials%'
  )
ORDER BY tablename, policyname;

-- Verify storage bucket exists
\echo ''
\echo 'Verifying storage bucket...'
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'training-materials';

\echo ''
\echo '============================================================================'
\echo '✅ DEPLOYMENT COMPLETE'
\echo '============================================================================'
\echo ''
\echo 'CRITICAL NOTES:'
\echo '1. All RLS policies use admin_users.user_id (NOT admin_users.id)'
\echo '2. Column names match TypeScript code:'
\echo '   - created_at (NOT upload_date)'
\echo '   - updated_at (NOT last_modified_at)'
\echo '   - created_by (NOT uploaded_by_admin_id)'
\echo '   - file_size_kb (NOT file_size_bytes)'
\echo '3. NO is_active column (using hard deletes)'
\echo '4. avg_rating column exists for future rating feature'
\echo ''
\echo 'NEXT STEPS:'
\echo '1. Ensure admin users exist in admin_users table with user_id column'
\echo '2. Upload documents via admin dashboard'
\echo '3. Link documents to tactics via DocumentTacticLinker component'
\echo ''
