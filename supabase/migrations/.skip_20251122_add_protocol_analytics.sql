-- Create protocol_analytics_events table for tracking user interactions with protocols
CREATE TABLE IF NOT EXISTS protocol_analytics_events (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User and session tracking
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  session_duration_ms INTEGER,

  -- Event details
  event_name VARCHAR(100) NOT NULL,
  event_properties JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Device and browser information
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  screen_width INTEGER,
  screen_height INTEGER,
  device_pixel_ratio NUMERIC(3,2),
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser VARCHAR(50),
  platform VARCHAR(100),

  -- Page context
  url TEXT,
  referrer TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_event_name CHECK (
    event_name IN (
      'protocol_viewed',
      'language_variant_changed',
      'tooltip_hovered',
      'tooltip_clicked',
      'protocol_completed',
      'protocol_abandoned',
      'glossary_term_viewed'
    )
  )
);

-- Create indexes for efficient querying
CREATE INDEX idx_analytics_user_id ON protocol_analytics_events(user_id);
CREATE INDEX idx_analytics_event_name ON protocol_analytics_events(event_name);
CREATE INDEX idx_analytics_timestamp ON protocol_analytics_events(timestamp);
CREATE INDEX idx_analytics_session_id ON protocol_analytics_events(session_id);
CREATE INDEX idx_analytics_created_at ON protocol_analytics_events(created_at);

-- Create composite index for user activity queries
CREATE INDEX idx_analytics_user_timestamp ON protocol_analytics_events(user_id, timestamp DESC);

-- Create index for protocol-specific queries (using JSONB properties)
CREATE INDEX idx_analytics_protocol_id ON protocol_analytics_events((event_properties->>'protocol_id'));

-- Create index for language variant analysis
CREATE INDEX idx_analytics_language_variant ON protocol_analytics_events((event_properties->>'language_variant'));

-- Add comment to table
COMMENT ON TABLE protocol_analytics_events IS 'Tracks user interactions with protocol library including views, language changes, tooltip usage, and completion rates';

-- Add comments to columns
COMMENT ON COLUMN protocol_analytics_events.event_name IS 'Type of event tracked (protocol_viewed, tooltip_clicked, etc.)';
COMMENT ON COLUMN protocol_analytics_events.event_properties IS 'JSON object containing event-specific properties like protocol_id, term, definition, etc.';
COMMENT ON COLUMN protocol_analytics_events.session_id IS 'Unique session identifier for grouping events within a user session';
COMMENT ON COLUMN protocol_analytics_events.device_type IS 'Device category based on viewport width (mobile < 768px, tablet < 1024px, desktop >= 1024px)';

-- Create a view for common analytics queries
CREATE OR REPLACE VIEW protocol_analytics_summary AS
SELECT
  user_id,
  DATE(timestamp) as date,
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(session_duration_ms) as avg_session_duration_ms,
  COUNT(DISTINCT (event_properties->>'protocol_id')) as unique_protocols,
  JSONB_AGG(DISTINCT (event_properties->>'language_variant')) FILTER (WHERE event_properties->>'language_variant' IS NOT NULL) as language_variants_used,
  COUNT(*) FILTER (WHERE event_name = 'protocol_completed') as completions,
  COUNT(*) FILTER (WHERE event_name = 'protocol_abandoned') as abandonments,
  COUNT(*) FILTER (WHERE event_name IN ('tooltip_clicked', 'tooltip_hovered')) as tooltip_interactions
FROM protocol_analytics_events
GROUP BY user_id, DATE(timestamp), event_name;

-- Create a materialized view for protocol performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS protocol_performance_metrics AS
SELECT
  (event_properties->>'protocol_id')::UUID as protocol_id,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE event_name = 'protocol_viewed') as view_count,
  COUNT(*) FILTER (WHERE event_name = 'protocol_completed') as completion_count,
  COUNT(*) FILTER (WHERE event_name = 'protocol_abandoned') as abandonment_count,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'protocol_completed')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE event_name IN ('protocol_viewed')), 0) * 100,
    2
  ) as completion_rate,
  AVG((event_properties->>'time_spent_seconds')::INTEGER) FILTER (WHERE event_properties->>'time_spent_seconds' IS NOT NULL) as avg_time_spent_seconds,
  COUNT(*) FILTER (WHERE event_name IN ('tooltip_clicked', 'tooltip_hovered')) as tooltip_interaction_count,
  JSONB_AGG(DISTINCT (event_properties->>'language_variant')) FILTER (WHERE event_properties->>'language_variant' IS NOT NULL) as variants_used,
  MIN(timestamp) as first_viewed,
  MAX(timestamp) as last_viewed
FROM protocol_analytics_events
WHERE event_properties->>'protocol_id' IS NOT NULL
GROUP BY (event_properties->>'protocol_id')::UUID;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_protocol_performance_protocol_id ON protocol_performance_metrics(protocol_id);

-- Create function to refresh materialized view (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_protocol_performance_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY protocol_performance_metrics;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your RLS policies)
GRANT SELECT ON protocol_analytics_events TO authenticated;
GRANT INSERT ON protocol_analytics_events TO authenticated;
GRANT SELECT ON protocol_analytics_summary TO authenticated;
GRANT SELECT ON protocol_performance_metrics TO authenticated;

-- Add RLS policies
ALTER TABLE protocol_analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics events
CREATE POLICY "Users can insert their own analytics events"
  ON protocol_analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own analytics events
CREATE POLICY "Users can view their own analytics events"
  ON protocol_analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all analytics (adjust role as needed)
CREATE POLICY "Admins can view all analytics"
  ON protocol_analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );