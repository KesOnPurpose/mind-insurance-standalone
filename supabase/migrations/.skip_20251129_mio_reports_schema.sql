-- MIO Reports Schema for Mind Insurance
-- Phase 27: MIO AI-Generated Reports from n8n Workflows

-- =============================================
-- Section 1: MIO Reports Table
-- =============================================

-- Table: mio_user_reports
-- Stores AI-generated behavioral reports from n8n workflows
CREATE TABLE IF NOT EXISTS mio_user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Report metadata
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
    'weekly_insight',
    'pattern_analysis',
    'breakthrough_detection',
    'dropout_risk',
    'celebration',
    'intervention',
    'custom'
  )),
  title VARCHAR(255) NOT NULL,
  summary TEXT,

  -- Report content (JSONB for flexibility)
  -- Structure varies by report_type but includes:
  -- {
  --   "sections": [{ "title": "...", "content": "...", "type": "insight|warning|celebration" }],
  --   "metrics": { "streak": 5, "completion_rate": 0.85, ... },
  --   "recommendations": ["...", "..."],
  --   "action_items": [{ "title": "...", "priority": "high|medium|low" }]
  -- }
  content JSONB NOT NULL,

  -- Scoring/Priority
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Source tracking
  source VARCHAR(50) NOT NULL DEFAULT 'n8n' CHECK (source IN ('n8n', 'manual', 'system')),
  source_workflow_id VARCHAR(255), -- n8n workflow ID
  source_execution_id VARCHAR(255), -- n8n execution ID
  source_context JSONB, -- Additional context from the source

  -- Display settings
  display_status VARCHAR(20) DEFAULT 'unread' CHECK (display_status IN ('unread', 'read', 'archived', 'dismissed')),
  pinned BOOLEAN DEFAULT false,

  -- Time-based relevance
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL means no expiry

  -- User interaction
  user_rating INTEGER CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Section 2: Admin Protocol API Keys (for n8n)
-- =============================================

-- Table: admin_api_keys
-- Stores API keys for secure webhook access from n8n
CREATE TABLE IF NOT EXISTS admin_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of the actual key
  key_prefix VARCHAR(8) NOT NULL, -- First 8 chars for identification

  -- Permissions
  permissions JSONB DEFAULT '["write_reports"]', -- Array of permission strings

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Unique prefix constraint
  UNIQUE(key_prefix)
);

-- =============================================
-- Section 3: Indexes for Performance
-- =============================================

-- MIO Reports indexes
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_user_id ON mio_user_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_type ON mio_user_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_status ON mio_user_reports(display_status);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_priority ON mio_user_reports(priority);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_created ON mio_user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_user_unread ON mio_user_reports(user_id, display_status) WHERE display_status = 'unread';
CREATE INDEX IF NOT EXISTS idx_mio_user_reports_validity ON mio_user_reports(valid_from, valid_until);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS idx_admin_api_keys_prefix ON admin_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_admin_api_keys_active ON admin_api_keys(is_active);

-- =============================================
-- Section 4: Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE mio_user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;

-- MIO Reports: Users can only see their own reports
CREATE POLICY "Users can view their own MIO reports"
  ON mio_user_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own MIO reports display status"
  ON mio_user_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for n8n webhook via service key)
CREATE POLICY "Service role has full access to MIO reports"
  ON mio_user_reports FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin API Keys: Only admins can manage
CREATE POLICY "Admins can view API keys"
  ON admin_api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON admin_api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- =============================================
-- Section 5: Updated_at Trigger
-- =============================================

-- Add trigger to mio_user_reports
CREATE TRIGGER update_mio_user_reports_updated_at
  BEFORE UPDATE ON mio_user_reports
  FOR EACH ROW EXECUTE FUNCTION update_weekly_insights_updated_at();

-- =============================================
-- Section 6: Helper Functions
-- =============================================

-- Function to get user's unread report count
CREATE OR REPLACE FUNCTION get_user_unread_report_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM mio_user_reports
  WHERE user_id = p_user_id
    AND display_status = 'unread'
    AND (valid_until IS NULL OR valid_until > NOW());
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to mark report as read
CREATE OR REPLACE FUNCTION mark_report_as_read(p_report_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE mio_user_reports
  SET display_status = 'read', read_at = NOW()
  WHERE id = p_report_id
    AND user_id = auth.uid()
    AND display_status = 'unread';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 7: Grants for service role access
-- =============================================

-- Grant permissions for the service role (used by Edge Functions)
GRANT ALL ON mio_user_reports TO service_role;
GRANT ALL ON admin_api_keys TO service_role;
GRANT EXECUTE ON FUNCTION get_user_unread_report_count TO authenticated;
GRANT EXECUTE ON FUNCTION mark_report_as_read TO authenticated;
