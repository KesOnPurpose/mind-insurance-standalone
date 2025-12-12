-- ============================================================================
-- PROTOCOL ADVANCEMENT WITH AUTO-SKIP
-- ============================================================================
-- Phase 30: Enhanced protocol day advancement that auto-skips missed days
--
-- This migration adds:
-- 1. advance_protocol_days_with_skip() - New function that calculates actual day
--    based on assigned_week_start and auto-skips any missed days
-- 2. Updates trigger_protocol_advancement() to use the new function
--
-- User requirements:
-- - Missed days should be auto-marked as "skipped" for tracking
-- - When protocol expires (day > 7), skip remaining incomplete days first
-- - Frontend-driven timezone (uses calculateCurrentProtocolDay logic)
-- ============================================================================

-- =============================================
-- Section 1: New Advance Function with Auto-Skip
-- =============================================

CREATE OR REPLACE FUNCTION advance_protocol_days_with_skip()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_protocol RECORD;
  v_actual_day INT;
  v_day INT;
  v_protocols_advanced INT := 0;
  v_protocols_expired INT := 0;
  v_days_skipped INT := 0;
BEGIN
  -- Process each active protocol
  FOR v_protocol IN
    SELECT id, user_id, current_day, assigned_week_start, created_at
    FROM mio_weekly_protocols
    WHERE status = 'active'
  LOOP
    -- Calculate actual day based on assigned_week_start (matches frontend calculateCurrentProtocolDay)
    -- Formula: days since assigned_week_start + 1, capped at 8 to trigger expiration
    -- Note: In PostgreSQL, date - date returns an integer (days), not an interval
    v_actual_day := LEAST(
      GREATEST(
        (NOW()::date - v_protocol.assigned_week_start::date) + 1,
        1
      ),
      8  -- Allow 8 to trigger expiration logic
    );

    -- If actual day > current day, we need to skip some days
    IF v_actual_day > v_protocol.current_day AND v_actual_day <= 7 THEN
      -- Skip all days from current_day to actual_day - 1
      FOR v_day IN v_protocol.current_day..(v_actual_day - 1) LOOP
        -- Insert skipped completion record (only if not already exists)
        INSERT INTO mio_protocol_completions (
          protocol_id,
          user_id,
          day_number,
          was_skipped,
          auto_skipped,
          skip_reason,
          completed_at
        )
        SELECT
          v_protocol.id,
          v_protocol.user_id,
          v_day,
          TRUE,
          TRUE,
          'Auto-skipped by daily advancement job',
          NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND day_number = v_day
        );

        -- Only count if we actually inserted (not already existed)
        IF FOUND THEN
          v_days_skipped := v_days_skipped + 1;
        END IF;
      END LOOP;

      -- Update current_day and days_skipped counter
      UPDATE mio_weekly_protocols
      SET
        current_day = v_actual_day,
        days_skipped = (
          SELECT COUNT(*)
          FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND was_skipped = TRUE
        ),
        updated_at = NOW()
      WHERE id = v_protocol.id;

      v_protocols_advanced := v_protocols_advanced + 1;
    END IF;

    -- Handle protocol expiration (past day 7)
    IF v_actual_day > 7 THEN
      -- Auto-skip any remaining incomplete days (up to day 7)
      FOR v_day IN v_protocol.current_day..7 LOOP
        INSERT INTO mio_protocol_completions (
          protocol_id,
          user_id,
          day_number,
          was_skipped,
          auto_skipped,
          skip_reason,
          completed_at
        )
        SELECT
          v_protocol.id,
          v_protocol.user_id,
          v_day,
          TRUE,
          TRUE,
          'Auto-skipped: protocol expired after 7 days',
          NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND day_number = v_day
        );

        IF FOUND THEN
          v_days_skipped := v_days_skipped + 1;
        END IF;
      END LOOP;

      -- Update final counts before expiring
      UPDATE mio_weekly_protocols
      SET
        current_day = 7,
        days_skipped = (
          SELECT COUNT(*)
          FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND was_skipped = TRUE
        ),
        days_completed = (
          SELECT COUNT(*)
          FROM mio_protocol_completions
          WHERE protocol_id = v_protocol.id AND was_skipped = FALSE
        ),
        status = 'expired',
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = v_protocol.id;

      v_protocols_expired := v_protocols_expired + 1;
    END IF;
  END LOOP;

  -- Return summary
  RETURN jsonb_build_object(
    'success', TRUE,
    'timestamp', NOW(),
    'protocols_advanced', v_protocols_advanced,
    'protocols_expired', v_protocols_expired,
    'days_skipped', v_days_skipped
  );
END;
$$;

-- =============================================
-- Section 2: Update Trigger Function
-- =============================================

-- Update trigger_protocol_advancement to use the new function
CREATE OR REPLACE FUNCTION trigger_protocol_advancement()
RETURNS JSONB AS $$
BEGIN
  -- Call the new function with auto-skip logic
  RETURN advance_protocol_days_with_skip();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Section 3: Grants
-- =============================================

GRANT EXECUTE ON FUNCTION advance_protocol_days_with_skip() TO service_role;

-- =============================================
-- Section 4: Comments
-- =============================================

COMMENT ON FUNCTION advance_protocol_days_with_skip() IS
'Enhanced daily advancement function that:
1. Calculates actual day from assigned_week_start (frontend-compatible)
2. Auto-skips any missed days between current_day and actual_day
3. Expires protocols past day 7, skipping remaining incomplete days first
Called via n8n workflow daily at midnight EST (5 AM UTC, cron: 0 5 * * *)';

COMMENT ON FUNCTION trigger_protocol_advancement() IS
'Wrapper function for n8n webhook. Now calls advance_protocol_days_with_skip()
which includes auto-skip logic for missed days.';
