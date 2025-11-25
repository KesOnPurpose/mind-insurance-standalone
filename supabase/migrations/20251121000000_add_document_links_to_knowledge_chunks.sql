-- Migration: Add document linking capability to knowledge chunks
-- Purpose: Allow knowledge chunks to reference source documents for "View Full Document" functionality
-- Created: 2025-11-21

-- Add source_document_id column to nette_knowledge_chunks table
ALTER TABLE public.nette_knowledge_chunks
ADD COLUMN IF NOT EXISTS source_document_id INTEGER REFERENCES public.gh_documents(id) ON DELETE SET NULL;

-- Create index for performance when querying chunks by document
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document
ON public.nette_knowledge_chunks(source_document_id);

-- Create index for querying chunks by tactic (improves getTacticKnowledgeChunks performance)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_tactic
ON public.nette_knowledge_chunks(tactic_id);

-- Add comment explaining the new column
COMMENT ON COLUMN public.nette_knowledge_chunks.source_document_id IS
'References the full document in gh_documents table. Allows users to access complete source material from extracted knowledge chunks.';

-- Create helper table to map markdown source files to actual documents
CREATE TABLE IF NOT EXISTS public.gh_knowledge_source_documents (
  id SERIAL PRIMARY KEY,
  source_file VARCHAR(255) NOT NULL UNIQUE,
  document_id INTEGER NOT NULL REFERENCES public.gh_documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for quick lookups by source file
CREATE INDEX IF NOT EXISTS idx_knowledge_source_documents_file
ON public.gh_knowledge_source_documents(source_file);

-- Add comment explaining the mapping table
COMMENT ON TABLE public.gh_knowledge_source_documents IS
'Maps markdown source files (like GROUP-HOME-TACTICS-LIBRARY.md) to actual documents in gh_documents table. Used to provide document links for knowledge chunks.';

-- Update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_gh_knowledge_source_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_gh_knowledge_source_documents_timestamp ON public.gh_knowledge_source_documents;
CREATE TRIGGER update_gh_knowledge_source_documents_timestamp
  BEFORE UPDATE ON public.gh_knowledge_source_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gh_knowledge_source_documents_updated_at();
