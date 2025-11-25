-- Create gh_documents table for unified document management system
-- This table serves as the central registry for all documents in the system

CREATE TABLE gh_documents (
  id BIGSERIAL PRIMARY KEY,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  category TEXT,
  description TEXT,
  applicable_states TEXT[],
  ownership_model TEXT[],
  applicable_populations TEXT[],
  difficulty TEXT,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX idx_documents_category ON gh_documents(category);
CREATE INDEX idx_documents_states ON gh_documents USING GIN(applicable_states);
CREATE INDEX idx_documents_ownership ON gh_documents USING GIN(ownership_model);
CREATE INDEX idx_documents_populations ON gh_documents USING GIN(applicable_populations);
CREATE INDEX idx_documents_search ON gh_documents USING GIN(to_tsvector('english', document_name || ' ' || COALESCE(description, '')));

-- Add comments for documentation
COMMENT ON TABLE gh_documents IS 'Central registry for all documents in the system with metadata and analytics';
COMMENT ON COLUMN gh_documents.applicable_states IS 'Array of state codes where document is applicable (e.g., ["CA", "TX", "FL"])';
COMMENT ON COLUMN gh_documents.ownership_model IS 'Array of applicable ownership models (e.g., ["Individual", "LLC", "Corporation"])';
COMMENT ON COLUMN gh_documents.applicable_populations IS 'Array of target populations (e.g., ["Adult", "Youth", "Seniors"])';
COMMENT ON COLUMN gh_documents.difficulty IS 'Difficulty level: Beginner, Intermediate, Advanced';

-- Enable Row Level Security
ALTER TABLE gh_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view all documents
CREATE POLICY "Authenticated users can view documents"
  ON gh_documents FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can insert documents
CREATE POLICY "Admins can insert documents"
  ON gh_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- RLS Policy: Only admins can update documents
CREATE POLICY "Admins can update documents"
  ON gh_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- RLS Policy: Only admins can delete documents
CREATE POLICY "Admins can delete documents"
  ON gh_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gh_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_gh_documents_updated_at
  BEFORE UPDATE ON gh_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_documents_updated_at();
