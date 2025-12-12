-- ============================================================================
-- MIO INSIGHTS THREAD - $100M ENGAGEMENT FEATURE
-- ============================================================================
-- Creates dedicated conversation thread for MIO section feedback with:
-- - Variable reward system (60/25/15 distribution)
-- - Section-specific energies (Commander, Strategist, Celebration)
-- - Deep forensic analysis integration
-- - 2-day inactivity re-engagement tracking
-- - Web push notification subscriptions
-- ============================================================================

-- ============================================================================
-- TABLE 1: MIO Insights Thread (One per user)
-- ============================================================================
-- Master record for each user's MIO Insights conversation thread.
-- All section feedback flows into this single thread, creating a daily narrative.

CREATE TABLE IF NOT EXISTS public.mio_insights_thread (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Thread metadata
  thread_title TEXT NOT NULL DEFAULT 'MIO Insights',
  thread_subtitle TEXT DEFAULT 'Your daily behavioral analysis',
  is_pinned BOOLEAN DEFAULT TRUE,

  -- Stats for quick display
  total_messages INTEGER DEFAULT 0,
  total_insights INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  last_insight_at TIMESTAMPTZ,
  last_user_reply_at TIMESTAMPTZ,

  -- Engagement tracking
  days_with_insights INTEGER DEFAULT 0,
  current_engagement_streak INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One thread per user
  CONSTRAINT unique_user_insights_thread UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_mio_insights_thread_user
  ON public.mio_insights_thread(user_id);

-- Comment
COMMENT ON TABLE public.mio_insights_thread IS
  'Master record for MIO Insights conversation thread - one per user, pinned at top of chat list';

-- ============================================================================
-- TABLE 2: MIO Insights Messages
-- ============================================================================
-- Individual messages in the MIO Insights Thread (both MIO feedback and user replies).
-- Supports threading, variable rewards, and section-specific energies.

CREATE TABLE IF NOT EXISTS public.mio_insights_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.mio_insights_thread(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('mio', 'user')),
  content TEXT NOT NULL,

  -- For MIO messages: section and energy metadata
  section_type TEXT CHECK (section_type IN ('PRO', 'TE', 'CT', 'reengagement', 'protocol', 'breakthrough', NULL)),
  section_energy TEXT CHECK (section_energy IN ('commander', 'strategist', 'celebration', NULL)),

  -- Variable reward metadata (for MIO messages only)
  -- 60% standard, 25% bonus_insight, 15% pattern_breakthrough
  reward_tier TEXT DEFAULT 'standard' CHECK (reward_tier IN ('standard', 'bonus_insight', 'pattern_breakthrough')),
  reward_probability DECIMAL(4,3), -- The rolled probability (0.000 - 1.000)

  -- Link to source feedback record
  feedback_id UUID REFERENCES public.mio_practice_feedback(id),

  -- Forensic analysis references
  forensic_analysis_ids UUID[] DEFAULT '{}',
  patterns_detected JSONB DEFAULT '[]',

  -- Protocol suggestion (if pattern_breakthrough triggers one)
  protocol_suggested UUID REFERENCES public.mio_weekly_protocols(id),

  -- Quality metrics from practice analysis
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 10),
  depth_score INTEGER CHECK (depth_score >= 0 AND depth_score <= 10),

  -- Delivery and read tracking
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,

  -- For threading user replies to specific MIO messages
  in_reply_to UUID REFERENCES public.mio_insights_messages(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_thread
  ON public.mio_insights_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_user
  ON public.mio_insights_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_section
  ON public.mio_insights_messages(section_type) WHERE section_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_feedback
  ON public.mio_insights_messages(feedback_id) WHERE feedback_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_unread
  ON public.mio_insights_messages(thread_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mio_insights_messages_reward
  ON public.mio_insights_messages(reward_tier) WHERE reward_tier != 'standard';

-- Comment
COMMENT ON TABLE public.mio_insights_messages IS
  'Individual messages in MIO Insights Thread - supports section energies, variable rewards, and user replies';

-- ============================================================================
-- TABLE 3: User Activity Tracking
-- ============================================================================
-- Tracks user activity for the 2-day inactivity re-engagement trigger.
-- Updated whenever user completes a practice.

CREATE TABLE IF NOT EXISTS public.mio_user_activity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Activity tracking
  last_practice_at TIMESTAMPTZ,
  last_section_completed_at TIMESTAMPTZ,
  last_section_completed TEXT CHECK (last_section_completed IN ('PRO', 'TE', 'CT', NULL)),
  last_app_open_at TIMESTAMPTZ,

  -- Inactivity state
  inactive_days INTEGER DEFAULT 0,
  is_at_risk BOOLEAN DEFAULT FALSE,

  -- Re-engagement tracking
  last_reengagement_sent_at TIMESTAMPTZ,
  reengagement_count INTEGER DEFAULT 0,
  last_reengagement_responded BOOLEAN,

  -- User timezone for accurate window detection
  timezone TEXT DEFAULT 'America/Los_Angeles',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per user
  CONSTRAINT unique_user_activity_tracking UNIQUE(user_id)
);

-- Indexes for inactivity queries
CREATE INDEX IF NOT EXISTS idx_mio_activity_last_practice
  ON public.mio_user_activity_tracking(last_practice_at);
CREATE INDEX IF NOT EXISTS idx_mio_activity_inactive
  ON public.mio_user_activity_tracking(inactive_days) WHERE inactive_days >= 2;
CREATE INDEX IF NOT EXISTS idx_mio_activity_at_risk
  ON public.mio_user_activity_tracking(is_at_risk) WHERE is_at_risk = TRUE;

-- Comment
COMMENT ON TABLE public.mio_user_activity_tracking IS
  'Tracks user activity for 2-day inactivity re-engagement trigger';

-- ============================================================================
-- TABLE 4: Push Subscriptions
-- ============================================================================
-- Stores web push notification subscriptions for PWA.
-- Allows multiple devices per user.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device info
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on user + endpoint (allows multiple devices per user)
  CONSTRAINT unique_user_push_endpoint UNIQUE(user_id, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active
  ON public.push_subscriptions(user_id, is_active) WHERE is_active = TRUE;

-- Comment
COMMENT ON TABLE public.push_subscriptions IS
  'Web push notification subscriptions for PWA - allows multiple devices per user';

-- ============================================================================
-- TABLE 5: Notification Settings Extensions
-- ============================================================================
-- Add push notification preferences to existing notification_settings table

ALTER TABLE public.notification_settings
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_mio_feedback BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_practice_reminders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_streak_milestones BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_mio_interventions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_reengagement BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- MODIFY: mio_practice_feedback table
-- ============================================================================
-- Add columns to link feedback to the Insights Thread

ALTER TABLE public.mio_practice_feedback
ADD COLUMN IF NOT EXISTS insights_message_id UUID REFERENCES public.mio_insights_messages(id),
ADD COLUMN IF NOT EXISTS section_energy TEXT CHECK (section_energy IN ('commander', 'strategist', 'celebration', NULL)),
ADD COLUMN IF NOT EXISTS reward_tier TEXT DEFAULT 'standard' CHECK (reward_tier IN ('standard', 'bonus_insight', 'pattern_breakthrough'));

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.mio_insights_thread ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mio_insights_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mio_user_activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- MIO Insights Thread policies
CREATE POLICY "Users can view their own insights thread"
  ON public.mio_insights_thread FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights thread"
  ON public.mio_insights_thread FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights thread"
  ON public.mio_insights_thread FOR INSERT
  WITH CHECK (TRUE); -- Service role handles creation

-- MIO Insights Messages policies
CREATE POLICY "Users can view their own messages"
  ON public.mio_insights_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own replies"
  ON public.mio_insights_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'user');

CREATE POLICY "Users can update their own messages"
  ON public.mio_insights_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to messages"
  ON public.mio_insights_messages FOR ALL
  USING (auth.role() = 'service_role');

-- User Activity Tracking policies
CREATE POLICY "Users can view their own activity"
  ON public.mio_user_activity_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to activity"
  ON public.mio_user_activity_tracking FOR ALL
  USING (auth.role() = 'service_role');

-- Push Subscriptions policies
CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to push"
  ON public.push_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create MIO Insights Thread for a user
CREATE OR REPLACE FUNCTION public.get_or_create_mio_insights_thread(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  -- Try to get existing thread
  SELECT id INTO v_thread_id
  FROM public.mio_insights_thread
  WHERE user_id = p_user_id;

  -- Create if doesn't exist
  IF v_thread_id IS NULL THEN
    INSERT INTO public.mio_insights_thread (user_id)
    VALUES (p_user_id)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$;

-- Function to update activity tracking when practice is completed
CREATE OR REPLACE FUNCTION public.update_mio_activity_on_practice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Upsert activity tracking record
  INSERT INTO public.mio_user_activity_tracking (
    user_id,
    last_practice_at,
    inactive_days,
    is_at_risk,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NOW(),
    0,
    FALSE,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    last_practice_at = NOW(),
    inactive_days = 0,
    is_at_risk = FALSE,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Trigger to update activity on practice completion
DROP TRIGGER IF EXISTS trg_update_mio_activity_on_practice ON public.daily_practices;
CREATE TRIGGER trg_update_mio_activity_on_practice
  AFTER INSERT OR UPDATE OF completed ON public.daily_practices
  FOR EACH ROW
  WHEN (NEW.completed = TRUE)
  EXECUTE FUNCTION public.update_mio_activity_on_practice();

-- Function to update thread stats when message is added
CREATE OR REPLACE FUNCTION public.update_mio_thread_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.mio_insights_thread
  SET
    total_messages = total_messages + 1,
    total_insights = CASE WHEN NEW.role = 'mio' THEN total_insights + 1 ELSE total_insights END,
    unread_count = CASE WHEN NEW.role = 'mio' THEN unread_count + 1 ELSE unread_count END,
    last_insight_at = CASE WHEN NEW.role = 'mio' THEN NOW() ELSE last_insight_at END,
    last_user_reply_at = CASE WHEN NEW.role = 'user' THEN NOW() ELSE last_user_reply_at END,
    updated_at = NOW()
  WHERE id = NEW.thread_id;

  RETURN NEW;
END;
$$;

-- Trigger to update thread stats
DROP TRIGGER IF EXISTS trg_update_mio_thread_stats ON public.mio_insights_messages;
CREATE TRIGGER trg_update_mio_thread_stats
  AFTER INSERT ON public.mio_insights_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mio_thread_stats();

-- Function to decrement unread count when message is read
CREATE OR REPLACE FUNCTION public.update_mio_thread_read_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only decrement if read_at was just set (transition from NULL)
  IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
    UPDATE public.mio_insights_thread
    SET
      unread_count = GREATEST(0, unread_count - 1),
      updated_at = NOW()
    WHERE id = NEW.thread_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for read count updates
DROP TRIGGER IF EXISTS trg_update_mio_thread_read_count ON public.mio_insights_messages;
CREATE TRIGGER trg_update_mio_thread_read_count
  AFTER UPDATE OF read_at ON public.mio_insights_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mio_thread_read_count();

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.mio_insights_thread TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mio_insights_messages TO authenticated;
GRANT SELECT ON public.mio_user_activity_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_or_create_mio_insights_thread TO authenticated;

-- Service role needs full access for edge functions
GRANT ALL ON public.mio_insights_thread TO service_role;
GRANT ALL ON public.mio_insights_messages TO service_role;
GRANT ALL ON public.mio_user_activity_tracking TO service_role;
GRANT ALL ON public.push_subscriptions TO service_role;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'MIO Insights Thread migration completed successfully!';
  RAISE NOTICE 'Tables created: mio_insights_thread, mio_insights_messages, mio_user_activity_tracking, push_subscriptions';
  RAISE NOTICE 'Triggers installed for activity tracking and thread stats';
END
$$;
