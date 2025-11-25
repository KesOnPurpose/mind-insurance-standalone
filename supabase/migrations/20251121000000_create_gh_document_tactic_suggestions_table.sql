-- Create table for AI-powered document-to-tactic suggestions
-- This stores the AI-generated match scores from review-queue.csv

CREATE TABLE IF NOT EXISTS gh_document_tactic_suggestions (
  id BIGSERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES gh_documents(id) ON DELETE CASCADE,
  tactic_id TEXT NOT NULL,
  tactic_name TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  suggested_link_type TEXT NOT NULL CHECK (suggested_link_type IN ('required', 'recommended', 'supplemental')),
  match_reasons TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique suggestions per document-tactic pair
  UNIQUE(document_id, tactic_id)
);

-- Add indexes for performance
CREATE INDEX idx_document_tactic_suggestions_doc_id ON gh_document_tactic_suggestions(document_id);
CREATE INDEX idx_document_tactic_suggestions_confidence ON gh_document_tactic_suggestions(confidence DESC);
CREATE INDEX idx_document_tactic_suggestions_tactic_id ON gh_document_tactic_suggestions(tactic_id);

-- Add RLS policies
ALTER TABLE gh_document_tactic_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can read all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON gh_document_tactic_suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert suggestions (for CSV import)
CREATE POLICY "Admins can insert suggestions"
  ON gh_document_tactic_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update suggestions
CREATE POLICY "Admins can update suggestions"
  ON gh_document_tactic_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
  ON gh_document_tactic_suggestions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add helpful comment
COMMENT ON TABLE gh_document_tactic_suggestions IS 'AI-generated suggestions for linking documents to tactics, based on content analysis and matching algorithms. Confidence scores range from 40-100%.';
