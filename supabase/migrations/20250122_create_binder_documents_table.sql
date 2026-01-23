-- ============================================================================
-- CREATE BINDER_DOCUMENTS TABLE
-- ============================================================================
-- This migration creates the database table for storing compliance binder
-- document metadata. Run this in the Supabase Dashboard SQL Editor.
--
-- PREREQUISITE: Run 20250122_create_compliance_documents_bucket.sql first
-- to create the storage bucket.
-- ============================================================================

-- 1. Create the binder_documents table
CREATE TABLE IF NOT EXISTS public.binder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES public.compliance_binders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create index for faster binder document lookups
CREATE INDEX IF NOT EXISTS idx_binder_documents_binder_id
ON public.binder_documents(binder_id);

-- 3. Create index for document type queries
CREATE INDEX IF NOT EXISTS idx_binder_documents_type
ON public.binder_documents(document_type);

-- 4. Create index for expiration date queries
CREATE INDEX IF NOT EXISTS idx_binder_documents_expires_at
ON public.binder_documents(expires_at)
WHERE expires_at IS NOT NULL;

-- 5. Enable Row Level Security
ALTER TABLE public.binder_documents ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy: Users can view their own documents
-- (Documents belong to binders, which belong to users)
CREATE POLICY "Users can view documents from their own binders"
ON public.binder_documents
FOR SELECT
TO authenticated
USING (
  binder_id IN (
    SELECT id FROM public.compliance_binders
    WHERE user_id = auth.uid()
  )
);

-- 7. RLS Policy: Users can insert documents into their own binders
CREATE POLICY "Users can insert documents into their own binders"
ON public.binder_documents
FOR INSERT
TO authenticated
WITH CHECK (
  binder_id IN (
    SELECT id FROM public.compliance_binders
    WHERE user_id = auth.uid()
  )
);

-- 8. RLS Policy: Users can update their own documents
CREATE POLICY "Users can update documents in their own binders"
ON public.binder_documents
FOR UPDATE
TO authenticated
USING (
  binder_id IN (
    SELECT id FROM public.compliance_binders
    WHERE user_id = auth.uid()
  )
);

-- 9. RLS Policy: Users can delete their own documents
CREATE POLICY "Users can delete documents from their own binders"
ON public.binder_documents
FOR DELETE
TO authenticated
USING (
  binder_id IN (
    SELECT id FROM public.compliance_binders
    WHERE user_id = auth.uid()
  )
);

-- 10. Add comment for documentation
COMMENT ON TABLE public.binder_documents IS
'Stores metadata for documents uploaded to compliance binders.
Files are stored in Supabase Storage (compliance-documents bucket).';

