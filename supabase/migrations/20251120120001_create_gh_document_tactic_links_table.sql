-- Create gh_document_tactic_links table for many-to-many relationship
-- Links documents to tactics with relationship metadata

CREATE TABLE gh_document_tactic_links (
  id BIGSERIAL PRIMARY KEY,
  document_id BIGINT REFERENCES gh_documents(id) ON DELETE CASCADE,
  tactic_id TEXT REFERENCES gh_tactic_instructions(tactic_id) ON DELETE CASCADE,
  link_type TEXT CHECK (link_type IN ('required', 'recommended', 'supplemental')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, tactic_id)
);

-- Create indexes for query performance
CREATE INDEX idx_doc_tactic_links_tactic ON gh_document_tactic_links(tactic_id);
CREATE INDEX idx_doc_tactic_links_doc ON gh_document_tactic_links(document_id);
CREATE INDEX idx_doc_tactic_links_type ON gh_document_tactic_links(link_type);
CREATE INDEX idx_doc_tactic_links_order ON gh_document_tactic_links(tactic_id, display_order);

-- Add comments for documentation
COMMENT ON TABLE gh_document_tactic_links IS 'Many-to-many relationship linking documents to tactics with metadata';
COMMENT ON COLUMN gh_document_tactic_links.link_type IS 'Relationship type: required (must have), recommended (should have), supplemental (nice to have)';
COMMENT ON COLUMN gh_document_tactic_links.display_order IS 'Order in which document should appear in tactic page (lower numbers first)';

-- Enable Row Level Security
ALTER TABLE gh_document_tactic_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view all links
CREATE POLICY "Authenticated users can view links"
  ON gh_document_tactic_links FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only admins can manage links
CREATE POLICY "Admins can manage links"
  ON gh_document_tactic_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );
