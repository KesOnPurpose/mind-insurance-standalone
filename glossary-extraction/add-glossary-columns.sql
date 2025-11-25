-- Week 4 Agent 2: Add glossary and readability columns to mio_knowledge_chunks
-- This migration adds columns for storing simplified text, glossary terms, and reading levels

-- Add simplified_text column (stores user-friendly version with tooltips)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS simplified_text TEXT;

-- Add glossary_terms column (stores technical terms and definitions as JSONB)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS glossary_terms JSONB DEFAULT '{}'::jsonb;

-- Add reading_level_before column (Flesch-Kincaid grade of original text)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS reading_level_before FLOAT;

-- Add reading_level_after column (Flesch-Kincaid grade of simplified text)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS reading_level_after FLOAT;

-- Add language_variant column (clinical or simplified)
ALTER TABLE mio_knowledge_chunks
ADD COLUMN IF NOT EXISTS language_variant VARCHAR(20) DEFAULT 'clinical';

-- Create index on language_variant for faster filtering
CREATE INDEX IF NOT EXISTS idx_mio_chunks_language_variant
ON mio_knowledge_chunks (language_variant)
WHERE is_active = true;

-- Create GIN index on glossary_terms for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_mio_chunks_glossary_terms
ON mio_knowledge_chunks USING GIN (glossary_terms);

-- Add comment to table
COMMENT ON COLUMN mio_knowledge_chunks.simplified_text IS 'User-friendly version of chunk_text with glossary tooltips injected';
COMMENT ON COLUMN mio_knowledge_chunks.glossary_terms IS 'JSONB object mapping technical terms to user-friendly definitions';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_before IS 'Flesch-Kincaid grade level of original chunk_text';
COMMENT ON COLUMN mio_knowledge_chunks.reading_level_after IS 'Flesch-Kincaid grade level of simplified_text';
COMMENT ON COLUMN mio_knowledge_chunks.language_variant IS 'Language variant: clinical (original) or simplified (user-friendly)';
