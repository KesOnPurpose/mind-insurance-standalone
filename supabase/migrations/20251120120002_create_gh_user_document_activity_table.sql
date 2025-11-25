-- Create gh_user_document_activity table for analytics tracking
-- Tracks user interactions with documents for analytics and personalization

CREATE TABLE gh_user_document_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id BIGINT REFERENCES gh_documents(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('view', 'download', 'bookmark')),
  tactic_id TEXT,
  referrer TEXT CHECK (referrer IN ('nette_ai', 'resource_library', 'tactic_page')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for query performance
CREATE INDEX idx_user_doc_activity_user ON gh_user_document_activity(user_id, created_at DESC);
CREATE INDEX idx_user_doc_activity_doc ON gh_user_document_activity(document_id, created_at DESC);
CREATE INDEX idx_user_doc_activity_type ON gh_user_document_activity(activity_type);
CREATE INDEX idx_user_doc_activity_tactic ON gh_user_document_activity(tactic_id) WHERE tactic_id IS NOT NULL;
CREATE INDEX idx_user_doc_activity_referrer ON gh_user_document_activity(referrer);

-- Add comments for documentation
COMMENT ON TABLE gh_user_document_activity IS 'Tracks all user interactions with documents for analytics and personalization';
COMMENT ON COLUMN gh_user_document_activity.activity_type IS 'Type of activity: view (opened), download (saved), bookmark (marked for later)';
COMMENT ON COLUMN gh_user_document_activity.tactic_id IS 'Tactic context if accessed from tactic page (optional)';
COMMENT ON COLUMN gh_user_document_activity.referrer IS 'Source of document access: nette_ai (AI assistant), resource_library (main library), tactic_page (tactic detail)';

-- Enable Row Level Security
ALTER TABLE gh_user_document_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own activity
CREATE POLICY "Users can view own activity"
  ON gh_user_document_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own activity
CREATE POLICY "Users can insert own activity"
  ON gh_user_document_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can view all activity
CREATE POLICY "Admins can view all activity"
  ON gh_user_document_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Create function to update document view/download counts
CREATE OR REPLACE FUNCTION update_document_activity_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update view count
  IF NEW.activity_type = 'view' THEN
    UPDATE gh_documents
    SET view_count = view_count + 1
    WHERE id = NEW.document_id;
  END IF;

  -- Update download count
  IF NEW.activity_type = 'download' THEN
    UPDATE gh_documents
    SET download_count = download_count + 1
    WHERE id = NEW.document_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update document counts
CREATE TRIGGER update_document_counts_on_activity
  AFTER INSERT ON gh_user_document_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_document_activity_counts();
