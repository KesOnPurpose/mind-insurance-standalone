-- ============================================================================
-- FIX BINDER_DOCUMENTS TABLE SCHEMA
-- ============================================================================
-- This migration fixes the schema mismatch in the binder_documents table.
-- Run this in the Supabase Dashboard SQL Editor.
--
-- Issue: Table exists but is missing columns: file_url, storage_path, created_at
-- ============================================================================

-- Option A: ALTER existing table (preserves any existing data)
-- Uncomment and run this section if you have data to preserve

-- Add missing columns
ALTER TABLE public.binder_documents
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE public.binder_documents
ADD COLUMN IF NOT EXISTS storage_path TEXT;

ALTER TABLE public.binder_documents
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Make file_url NOT NULL if you want (after adding default data)
-- UPDATE public.binder_documents SET file_url = file_path WHERE file_url IS NULL;
-- ALTER TABLE public.binder_documents ALTER COLUMN file_url SET NOT NULL;

-- Make storage_path NOT NULL if you want
-- UPDATE public.binder_documents SET storage_path = file_path WHERE storage_path IS NULL;
-- ALTER TABLE public.binder_documents ALTER COLUMN storage_path SET NOT NULL;

-- ============================================================================
-- Option B: DROP and RECREATE (cleanest - use if no important data exists)
-- ============================================================================
-- If you prefer a clean slate, uncomment this section and comment out Option A above:

/*
DROP TABLE IF EXISTS public.binder_documents CASCADE;

CREATE TABLE public.binder_documents (
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_binder_documents_binder_id
ON public.binder_documents(binder_id);

CREATE INDEX IF NOT EXISTS idx_binder_documents_type
ON public.binder_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_binder_documents_expires_at
ON public.binder_documents(expires_at)
WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.binder_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view documents from their own binders"
ON public.binder_documents FOR SELECT TO authenticated
USING (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert documents into their own binders"
ON public.binder_documents FOR INSERT TO authenticated
WITH CHECK (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

CREATE POLICY "Users can update documents in their own binders"
ON public.binder_documents FOR UPDATE TO authenticated
USING (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete documents from their own binders"
ON public.binder_documents FOR DELETE TO authenticated
USING (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

COMMENT ON TABLE public.binder_documents IS
'Stores metadata for documents uploaded to compliance binders.
Files are stored in Supabase Storage (compliance-documents bucket).';
*/

-- ============================================================================
-- IMPORTANT: After running this migration, reload the Supabase schema cache
-- by going to Settings > API > Click "Reload" next to "Schema"
-- or restart your Supabase project.
-- ============================================================================
