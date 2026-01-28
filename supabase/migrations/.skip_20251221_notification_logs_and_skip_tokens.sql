-- ============================================================================
-- NOTIFICATION LOGS & SKIP TOKENS MIGRATION
-- ============================================================================
-- Phase: MIO Protocol Notifications & Day-by-Day Unlocking
-- Created: 2025-12-21
--
-- This migration adds:
-- 1. notification_time column to user_profiles (user preference for reminder time)
-- 2. skip_tokens column to user_profiles (skip token system for missed days)
-- 3. notification_logs table (track notification delivery)
-- ============================================================================

-- ============================================================================
-- 1. ADD NOTIFICATION TIME TO USER PROFILES
-- ============================================================================

-- Add notification_time column (user's preferred reminder time, default 7:30 AM)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notification_time TIME DEFAULT '07:30:00';

-- Add skip_tokens column (earned tokens for skipping missed days)
-- Start with 1 free token, earn 1 per completed protocol, max 3
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS skip_tokens INTEGER DEFAULT 1 CHECK (skip_tokens >= 0 AND skip_tokens <= 3);

-- ============================================================================
-- 2. CREATE NOTIFICATION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES mio_weekly_protocols(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('push', 'sms', 'email')),
  trigger TEXT NOT NULL CHECK (trigger IN ('daily_reminder', 'missed_2_days', 'day7_final', 'welcome')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_protocol_id ON notification_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_trigger ON notification_logs(trigger);

-- ============================================================================
-- 3. RLS POLICIES FOR NOTIFICATION LOGS
-- ============================================================================

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
ON notification_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role can insert/update notification logs (for edge functions)
CREATE POLICY "Service role can manage notification logs"
ON notification_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view all notification logs (using is_admin() helper function)
CREATE POLICY "Admins can view all notification logs"
ON notification_logs FOR SELECT
TO authenticated
USING (
  (SELECT public.is_admin())
);

-- ============================================================================
-- 4. ADD WAS_SKIPPED COLUMN TO MIO_PROTOCOL_COMPLETIONS (if not exists)
-- ============================================================================

-- Ensure was_skipped column exists for skip token tracking
ALTER TABLE mio_protocol_completions
ADD COLUMN IF NOT EXISTS was_skipped BOOLEAN DEFAULT false;

-- ============================================================================
-- 5. FUNCTION: USE SKIP TOKEN AND MARK DAY SKIPPED
-- ============================================================================

CREATE OR REPLACE FUNCTION use_skip_token_and_mark_skipped(
  p_user_id UUID,
  p_protocol_id UUID,
  p_day_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_tokens INTEGER;
  v_result JSONB;
BEGIN
  -- Check current skip tokens
  SELECT skip_tokens INTO v_current_tokens
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_current_tokens IS NULL OR v_current_tokens < 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No skip tokens available',
      'tokens_remaining', COALESCE(v_current_tokens, 0)
    );
  END IF;

  -- Decrement skip token
  UPDATE user_profiles
  SET skip_tokens = skip_tokens - 1,
      updated_at = now()
  WHERE id = p_user_id;

  -- Insert or update the skipped day completion record
  INSERT INTO mio_protocol_completions (
    protocol_id,
    day_number,
    was_skipped,
    completed_at
  ) VALUES (
    p_protocol_id,
    p_day_number,
    true,
    now()
  )
  ON CONFLICT (protocol_id, day_number)
  DO UPDATE SET
    was_skipped = true,
    completed_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'day_skipped', p_day_number,
    'tokens_remaining', v_current_tokens - 1
  );
END;
$$;

-- ============================================================================
-- 6. FUNCTION: AWARD SKIP TOKEN ON PROTOCOL COMPLETION
-- ============================================================================

CREATE OR REPLACE FUNCTION award_skip_token_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a protocol is marked as completed, award a skip token (max 3)
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE user_profiles
    SET skip_tokens = LEAST(skip_tokens + 1, 3),
        updated_at = now()
    WHERE id = NEW.user_id;

    -- Log the token award
    INSERT INTO notification_logs (
      user_id,
      protocol_id,
      notification_type,
      trigger,
      delivered,
      metadata
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'push',
      'welcome',
      true,
      jsonb_build_object('type', 'skip_token_awarded', 'reason', 'protocol_completed')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for awarding skip tokens
DROP TRIGGER IF EXISTS trigger_award_skip_token ON mio_weekly_protocols;
CREATE TRIGGER trigger_award_skip_token
  AFTER UPDATE ON mio_weekly_protocols
  FOR EACH ROW
  EXECUTE FUNCTION award_skip_token_on_completion();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON notification_logs TO authenticated;
GRANT ALL ON notification_logs TO service_role;

-- ============================================================================
-- DONE
-- ============================================================================
