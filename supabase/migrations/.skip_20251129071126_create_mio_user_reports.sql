-- MIO Reports Table - Phase 27
CREATE TABLE IF NOT EXISTS mio_user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'weekly_insight', 'pattern_analysis', 'breakthrough_detection',
    'dropout_risk', 'celebration', 'intervention', 'custom'
  )),
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content JSONB NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  source VARCHAR(50) NOT NULL DEFAULT 'n8n' CHECK (source IN ('n8n', 'manual', 'system')),
  source_workflow_id VARCHAR(255),
  source_execution_id VARCHAR(255),
  source_context JSONB,
  display_status VARCHAR(20) DEFAULT 'unread' CHECK (display_status IN ('unread', 'read', 'archived', 'dismissed')),
  pinned BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  user_rating INTEGER CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_user_id ON mio_user_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_type ON mio_user_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_status ON mio_user_reports(display_status);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_priority ON mio_user_reports(priority);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_created ON mio_user_reports(created_at DESC);

-- Enable RLS
ALTER TABLE mio_user_reports ENABLE ROW LEVEL SECURITY;

-- Grant permissions (service role needs access for n8n)
GRANT ALL ON mio_user_reports TO service_role;
