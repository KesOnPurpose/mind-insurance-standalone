-- ============================================================================
-- FIX BINDER_SHARE_LINKS TABLE SCHEMA
-- ============================================================================
-- This migration fixes the binder_share_links table to include all required
-- columns for the share functionality.
--
-- Run this in the Supabase Dashboard SQL Editor.
-- ============================================================================

-- Option A: ALTER existing table (if it exists but is missing columns)
-- ============================================================================

-- Add missing columns if they don't exist
ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS recipient_email TEXT;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"view_sections": true, "view_documents": true, "view_notes": true, "download_documents": false, "add_comments": false}'::jsonb;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS share_token TEXT;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.binder_share_links
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint on share_token if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'binder_share_links_share_token_key'
  ) THEN
    ALTER TABLE public.binder_share_links
    ADD CONSTRAINT binder_share_links_share_token_key UNIQUE (share_token);
  END IF;
END $$;

-- ============================================================================
-- Option B: CREATE TABLE (if table doesn't exist at all)
-- ============================================================================
-- If the above fails because the table doesn't exist, run this instead:

/*
CREATE TABLE IF NOT EXISTS public.binder_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES public.compliance_binders(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '{"view_sections": true, "view_documents": true, "view_notes": true, "download_documents": false, "add_comments": false}'::jsonb,
  expires_at TIMESTAMPTZ,
  recipient_email TEXT,
  recipient_name TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_binder_share_links_binder_id
ON public.binder_share_links(binder_id);

CREATE INDEX IF NOT EXISTS idx_binder_share_links_token
ON public.binder_share_links(share_token);

CREATE INDEX IF NOT EXISTS idx_binder_share_links_expires_at
ON public.binder_share_links(expires_at)
WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.binder_share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Owners can manage their share links
CREATE POLICY "Users can view share links for their own binders"
ON public.binder_share_links FOR SELECT TO authenticated
USING (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

CREATE POLICY "Users can create share links for their own binders"
ON public.binder_share_links FOR INSERT TO authenticated
WITH CHECK (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

CREATE POLICY "Users can update share links for their own binders"
ON public.binder_share_links FOR UPDATE TO authenticated
USING (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete share links for their own binders"
ON public.binder_share_links FOR DELETE TO authenticated
USING (binder_id IN (SELECT id FROM public.compliance_binders WHERE user_id = auth.uid()));

-- Public access policy - Anyone with a valid token can read (for the share page)
CREATE POLICY "Anyone can view active share links by token"
ON public.binder_share_links FOR SELECT TO anon
USING (is_active = true AND share_token IS NOT NULL);

COMMENT ON TABLE public.binder_share_links IS
'Stores shareable links for compliance binders. Allows users to share their binder with attorneys, consultants, etc.';
*/

-- ============================================================================
-- IMPORTANT: After running this migration, reload the schema cache by running:
-- NOTIFY pgrst, 'reload schema';
-- ============================================================================

NOTIFY pgrst, 'reload schema';
