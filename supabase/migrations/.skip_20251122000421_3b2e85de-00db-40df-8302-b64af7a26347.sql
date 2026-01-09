-- Add full-text search support to mio_knowledge_chunks table

-- Step 1: Add FTS column
ALTER TABLE mio_knowledge_chunks 
ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(chunk_text, '') || ' ' || 
    coalesce(chunk_summary, '') || ' ' ||
    coalesce(category, '') || ' ' ||
    coalesce(subcategory, '')
  )
) STORED;

-- Step 2: Create GIN index for fast FTS queries
CREATE INDEX IF NOT EXISTS mio_knowledge_chunks_fts_idx 
ON mio_knowledge_chunks USING GIN (fts);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN mio_knowledge_chunks.fts IS 
'Full-text search vector combining chunk_text, chunk_summary, category, and subcategory for hybrid RAG search';