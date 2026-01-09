-- Protocol Daily Increment Migration
-- Phase 29: Auto-increment protocol current_day and expire after 7 days
--
-- This creates a function to advance protocol days daily, which can be
-- triggered by pg_cron (Supabase scheduled functions) or n8n workflow

-- =============================================
-- Section 1: Daily Advance Function
-- =============================================

-- Function: advance_protocol_days
-- Called daily to increment current_day for active protocols
-- Also expires protocols that have passed day 7
CREATE OR REPLACE FUNCTION advance_protocol_days()
RETURNS jsonb AS $$
DECLARE
  v_advanced_count INTEGER := 0;
  v_expired_count INTEGER := 0;
BEGIN
  -- Advance current_day for active protocols (up to day 7)
  WITH advanced AS (
    UPDATE mio_weekly_protocols
    SET
      current_day = LEAST(current_day + 1, 7),
      updated_at = NOW()
    WHERE status = 'active'
      AND current_day < 7
    RETURNING id
  )
  SELECT COUNT(*) INTO v_advanced_count FROM advanced;

  -- Expire protocols that have reached day 7 or more
  -- (they get one day at day 7, then expire)
  WITH expired AS (
    UPDATE mio_weekly_protocols
    SET
      status = 'expired',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE status = 'active'
      AND current_day >= 7
      AND created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'timestamp', NOW(),
    'protocols_advanced', v_advanced_count,
    'protocols_expired', v_expired_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 2: Manual Advance Function (for testing)
-- =============================================

-- Function: advance_single_protocol_day
-- Manually advance a single protocol's day (for testing or admin use)
CREATE OR REPLACE FUNCTION advance_single_protocol_day(p_protocol_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_protocol mio_weekly_protocols%ROWTYPE;
BEGIN
  -- Get current protocol state
  SELECT * INTO v_protocol
  FROM mio_weekly_protocols
  WHERE id = p_protocol_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol not found');
  END IF;

  IF v_protocol.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Protocol is not active');
  END IF;

  IF v_protocol.current_day >= 7 THEN
    -- Expire the protocol
    UPDATE mio_weekly_protocols
    SET
      status = 'expired',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_protocol_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'expired',
      'message', 'Protocol expired after day 7'
    );
  ELSE
    -- Advance to next day
    UPDATE mio_weekly_protocols
    SET
      current_day = current_day + 1,
      updated_at = NOW()
    WHERE id = p_protocol_id;

    RETURN jsonb_build_object(
      'success', true,
      'action', 'advanced',
      'new_day', v_protocol.current_day + 1
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 3: Scheduled Job Setup
-- =============================================

-- Note: pg_cron extension must be enabled by Supabase team
-- For now, we'll create the cron entry that can be enabled via Dashboard
-- or we can trigger this via n8n on a daily schedule

-- The following would work if pg_cron is enabled:
-- SELECT cron.schedule(
--   'advance-protocol-days',  -- Job name
--   '0 5 * * *',              -- Daily at midnight EST (5:00 AM UTC)
--   'SELECT advance_protocol_days()'
-- );

-- Alternative: Create a wrapper function for n8n webhook
CREATE OR REPLACE FUNCTION trigger_protocol_advancement()
RETURNS jsonb AS $$
BEGIN
  -- Simply call the advance function
  RETURN advance_protocol_days();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 4: Get Protocol Status Summary
-- =============================================

-- Function to get summary of protocols by status (for monitoring)
CREATE OR REPLACE FUNCTION get_protocol_status_summary()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_protocols', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'muted', COUNT(*) FILTER (WHERE muted_by_coach = true),
    'by_current_day', jsonb_object_agg(
      COALESCE('day_' || current_day::text, 'unknown'),
      day_count
    )
  )
  INTO v_result
  FROM (
    SELECT
      status,
      current_day,
      muted_by_coach,
      COUNT(*) as day_count
    FROM mio_weekly_protocols
    WHERE status = 'active'
    GROUP BY status, current_day, muted_by_coach
  ) sub;

  RETURN COALESCE(v_result, '{"total_protocols": 0}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 5: Grants
-- =============================================

GRANT EXECUTE ON FUNCTION advance_protocol_days() TO service_role;
GRANT EXECUTE ON FUNCTION advance_single_protocol_day(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION trigger_protocol_advancement() TO service_role;
GRANT EXECUTE ON FUNCTION get_protocol_status_summary() TO service_role;

-- =============================================
-- Section 6: Comments
-- =============================================

COMMENT ON FUNCTION advance_protocol_days() IS
'Daily scheduled function to advance all active protocol days by 1. Expires protocols after day 7. Call via pg_cron or n8n daily at midnight EST (5 AM UTC, cron: 0 5 * * *)';

COMMENT ON FUNCTION advance_single_protocol_day(UUID) IS
'Manually advance a single protocol day (for testing/admin). Use with caution.';

COMMENT ON FUNCTION trigger_protocol_advancement() IS
'Wrapper function for n8n webhook to trigger daily protocol advancement. Returns summary of actions taken.';

COMMENT ON FUNCTION get_protocol_status_summary() IS
'Returns monitoring data about protocol statuses and day distribution.';
