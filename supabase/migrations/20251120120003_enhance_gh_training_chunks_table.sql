-- Enhance gh_training_chunks table with document relationship and metadata
-- Links training chunks to unified document system for better context and filtering

-- Add new metadata columns to existing table
ALTER TABLE gh_training_chunks
ADD COLUMN IF NOT EXISTS document_id BIGINT REFERENCES gh_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ownership_model TEXT[],
ADD COLUMN IF NOT EXISTS applicable_populations TEXT[],
ADD COLUMN IF NOT EXISTS difficulty TEXT;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_training_chunks_document ON gh_training_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_training_chunks_ownership ON gh_training_chunks USING GIN(ownership_model);
CREATE INDEX IF NOT EXISTS idx_training_chunks_populations ON gh_training_chunks USING GIN(applicable_populations);
CREATE INDEX IF NOT EXISTS idx_training_chunks_difficulty ON gh_training_chunks(difficulty);

-- Add comments for documentation
COMMENT ON COLUMN gh_training_chunks.document_id IS 'Links chunk to source document in gh_documents table for unified document management';
COMMENT ON COLUMN gh_training_chunks.ownership_model IS 'Array of applicable ownership models inherited from document';
COMMENT ON COLUMN gh_training_chunks.applicable_populations IS 'Array of target populations inherited from document';
COMMENT ON COLUMN gh_training_chunks.difficulty IS 'Difficulty level inherited from document: Beginner, Intermediate, Advanced';

-- Create function to sync metadata from document to chunks
CREATE OR REPLACE FUNCTION sync_chunk_metadata_from_document()
RETURNS TRIGGER AS $$
BEGIN
  -- When document_id is set or updated, sync metadata from gh_documents
  IF NEW.document_id IS NOT NULL THEN
    UPDATE gh_training_chunks
    SET
      ownership_model = (SELECT ownership_model FROM gh_documents WHERE id = NEW.document_id),
      applicable_populations = (SELECT applicable_populations FROM gh_documents WHERE id = NEW.document_id),
      difficulty = (SELECT difficulty FROM gh_documents WHERE id = NEW.document_id)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync metadata when document_id is set
CREATE TRIGGER sync_chunk_metadata_on_document_link
  AFTER INSERT OR UPDATE OF document_id ON gh_training_chunks
  FOR EACH ROW
  WHEN (NEW.document_id IS NOT NULL)
  EXECUTE FUNCTION sync_chunk_metadata_from_document();

-- Create function to propagate document metadata updates to chunks
CREATE OR REPLACE FUNCTION propagate_document_metadata_to_chunks()
RETURNS TRIGGER AS $$
BEGIN
  -- When document metadata changes, update all linked chunks
  UPDATE gh_training_chunks
  SET
    ownership_model = NEW.ownership_model,
    applicable_populations = NEW.applicable_populations,
    difficulty = NEW.difficulty
  WHERE document_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on gh_documents to propagate metadata changes
CREATE TRIGGER propagate_metadata_to_chunks_on_document_update
  AFTER UPDATE OF ownership_model, applicable_populations, difficulty ON gh_documents
  FOR EACH ROW
  EXECUTE FUNCTION propagate_document_metadata_to_chunks();
