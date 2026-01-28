-- =============================================================================
-- ADMIN NOTIFICATION BROADCAST SYSTEM
-- Enables admins/coaches to send rich media notifications to users/groups
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Custom User Groups for Targeting
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notification_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,

  -- Dynamic vs static membership
  is_dynamic BOOLEAN DEFAULT false,
  dynamic_filter JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Static group membership
CREATE TABLE IF NOT EXISTS user_notification_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES user_notification_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

-- -----------------------------------------------------------------------------
-- Main Broadcast Notifications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('text', 'image', 'video', 'link', 'rich')),
  media_url TEXT,
  media_metadata JSONB DEFAULT '{}',
  action_url TEXT,
  action_label TEXT,

  -- Targeting
  target_type TEXT NOT NULL CHECK (target_type IN ('global', 'group', 'tier', 'individual')),
  target_group_id UUID REFERENCES user_notification_groups(id),
  target_tier TEXT,
  target_user_ids UUID[],

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Display settings
  display_mode TEXT DEFAULT 'popup' CHECK (display_mode IN ('popup', 'banner', 'toast')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  dismissible BOOLEAN DEFAULT true,
  require_acknowledgment BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'sending', 'sent', 'cancelled')),

  -- Idempotency & tracking
  idempotency_key TEXT UNIQUE NOT NULL,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Delivery Tracking (one row per recipient)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_broadcast_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES notification_broadcasts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Delivery status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'read', 'dismissed', 'failed')),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(broadcast_id, user_id)
);

-- -----------------------------------------------------------------------------
-- User Consent & Preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,

  -- Consent
  broadcast_consent BOOLEAN DEFAULT true,
  consent_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'America/New_York',

  -- Channel preferences
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_digest_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Audit Log for Compliance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_broadcast_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES notification_broadcasts(id),
  actor_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for Performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON notification_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled ON notification_broadcasts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_by ON notification_broadcasts(created_by);
CREATE INDEX IF NOT EXISTS idx_deliveries_user ON notification_broadcast_deliveries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_broadcast ON notification_broadcast_deliveries(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON user_notification_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON user_notification_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_audit_broadcast ON notification_broadcast_audit_log(broadcast_id);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE notification_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_broadcast_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_broadcast_audit_log ENABLE ROW LEVEL SECURITY;

-- Broadcasts: Admins can manage all, coaches can see own
CREATE POLICY "Admins can manage broadcasts" ON notification_broadcasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Coaches can manage own broadcasts" ON notification_broadcasts
  FOR ALL USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier = 'coach'
      AND is_active = true
    )
  );

-- Deliveries: Users can only see their own
CREATE POLICY "Users can view own deliveries" ON notification_broadcast_deliveries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage deliveries" ON notification_broadcast_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

-- Groups: Admins can manage, coaches can see/use
CREATE POLICY "Admins can manage groups" ON user_notification_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Coaches can view groups" ON user_notification_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('coach', 'admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

-- Group members: Same as groups
CREATE POLICY "Admins can manage group members" ON user_notification_group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "Coaches can view group members" ON user_notification_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('coach', 'admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

-- User preferences: Users can manage their own
CREATE POLICY "Users can manage own preferences" ON user_notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view preferences" ON user_notification_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

-- Audit log: Admins only
CREATE POLICY "Admins can view audit log" ON notification_broadcast_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gh_approved_users
      WHERE user_id = auth.uid()
      AND tier IN ('admin', 'super_admin', 'owner')
      AND is_active = true
    )
  );

CREATE POLICY "System can insert audit log" ON notification_broadcast_audit_log
  FOR INSERT WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- RPC Functions
-- -----------------------------------------------------------------------------

-- Get pending broadcasts for current user
CREATE OR REPLACE FUNCTION get_pending_broadcasts_for_user()
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  media_type TEXT,
  media_url TEXT,
  media_metadata JSONB,
  action_url TEXT,
  action_label TEXT,
  display_mode TEXT,
  priority TEXT,
  dismissible BOOLEAN,
  require_acknowledgment BOOLEAN,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nb.id,
    nb.title,
    nb.message,
    nb.media_type,
    nb.media_url,
    nb.media_metadata,
    nb.action_url,
    nb.action_label,
    nb.display_mode,
    nb.priority,
    nb.dismissible,
    nb.require_acknowledgment,
    nb.created_at
  FROM notification_broadcasts nb
  JOIN notification_broadcast_deliveries nbd ON nb.id = nbd.broadcast_id
  WHERE nbd.user_id = auth.uid()
    AND nbd.status = 'delivered'
    AND nbd.dismissed_at IS NULL
    AND nbd.acknowledged_at IS NULL
    AND (nb.expires_at IS NULL OR nb.expires_at > NOW())
  ORDER BY
    CASE nb.priority
      WHEN 'urgent' THEN 0
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 3
    END,
    nb.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Mark broadcast as read/dismissed/acknowledged
CREATE OR REPLACE FUNCTION mark_broadcast_interaction(
  p_broadcast_id UUID,
  p_action TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected BOOLEAN := false;
BEGIN
  -- Validate action
  IF p_action NOT IN ('read', 'dismissed', 'acknowledged') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  UPDATE notification_broadcast_deliveries
  SET
    status = CASE
      WHEN p_action = 'dismissed' THEN 'dismissed'
      WHEN p_action = 'acknowledged' THEN 'read'
      ELSE 'read'
    END,
    read_at = CASE
      WHEN p_action IN ('read', 'acknowledged') THEN COALESCE(read_at, NOW())
      ELSE read_at
    END,
    dismissed_at = CASE
      WHEN p_action = 'dismissed' THEN NOW()
      ELSE dismissed_at
    END,
    acknowledged_at = CASE
      WHEN p_action = 'acknowledged' THEN NOW()
      ELSE acknowledged_at
    END
  WHERE broadcast_id = p_broadcast_id
    AND user_id = auth.uid();

  v_affected := FOUND;

  -- Update read count on broadcast if action is read or acknowledged
  IF v_affected AND p_action IN ('read', 'acknowledged') THEN
    UPDATE notification_broadcasts
    SET read_count = read_count + 1
    WHERE id = p_broadcast_id;
  END IF;

  RETURN v_affected;
END;
$$ LANGUAGE plpgsql;

-- Get unread broadcast count for current user
CREATE OR REPLACE FUNCTION get_unread_broadcast_count()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM notification_broadcasts nb
  JOIN notification_broadcast_deliveries nbd ON nb.id = nbd.broadcast_id
  WHERE nbd.user_id = auth.uid()
    AND nbd.status = 'delivered'
    AND nbd.dismissed_at IS NULL
    AND nbd.acknowledged_at IS NULL
    AND (nb.expires_at IS NULL OR nb.expires_at > NOW());

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Rate limiting check
CREATE OR REPLACE FUNCTION check_broadcast_rate_limit(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM notification_broadcasts
  WHERE created_by = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  -- Max 5 broadcasts per hour per user
  RETURN recent_count < 5;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Updated_at Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_broadcasts_updated_at
  BEFORE UPDATE ON notification_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_groups_updated_at
  BEFORE UPDATE ON user_notification_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_pending_broadcasts_for_user() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_broadcast_interaction(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_broadcast_count() TO authenticated;
GRANT EXECUTE ON FUNCTION check_broadcast_rate_limit(UUID) TO authenticated;
