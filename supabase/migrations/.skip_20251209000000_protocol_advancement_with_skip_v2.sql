-- ============================================================================
-- PROTOCOL ADVANCEMENT WITH AUTO-SKIP
-- ============================================================================
-- Phase 31: Enhanced protocol day advancement with automatic skipping
--
-- This function:
-- 1. Calculates the "actual day" based on assigned_week_start
-- 2. Auto-skips missed days (creates completion records with was_skipped=true)
-- 3. Updates current_day to match actual day
-- 4. Expires protocols after day 7 (with remaining days marked as skipped)
--
-- Trigger: N8n workflow daily at 5 AM UTC (midnight EST)
-- ============================================================================

-- ============================================================================
-- MAIN FUNCTION: advance_protocol_days_with_skip
-- ============================================================================

CREATE OR REPLACE FUNCTION advance_protocol_days_with_skip(
  p_dry_run BOOLEAN DEFAULT false
)
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
  v_protocols_processed INT := 0;
  v_details JSONB := '[]'::JSONB;
BEGIN
  -- Process each active protocol
  FOR v_protocol IN
    SELECT id, user_id, current_day, assigned_week_start, title
    FROM mio_weekly_protocols
    WHERE status = 'active'
      AND muted_by_coach = false
  LOOP
    v_protocols_processed := v_protocols_processed + 1;

    -- Calculate actual day based on assigned_week_start
    -- Day 1 = assigned_week_start, Day 2 = assigned_week_start + 1, etc.
    v_actual_day := GREATEST(
      1,
      EXTRACT(DAY FROM (CURRENT_DATE - v_protocol.assigned_week_start::date)) + 1
    )::INT;

    -- Cap at 8 to handle expiration logic
    IF v_actual_day > 8 THEN
      v_actual_day := 8;
    END IF;

    -- Log what we're processing
    v_details := v_details || jsonb_build_object(
      'protocol_id', v_protocol.id,
      'title', v_protocol.title,
      'current_day', v_protocol.current_day,
      'actual_day', v_actual_day,
      'action', CASE
        WHEN v_actual_day > 7 THEN 'expire'
        WHEN v_actual_day > v_protocol.current_day THEN 'advance'
        ELSE 'no_change'
      END
    );

    -- Only make changes if not dry run
    IF NOT p_dry_run THEN

      -- CASE 1: Protocol should be expired (past day 7)
      IF v_actual_day > 7 THEN
        -- First, auto-skip any remaining incomplete days
        FOR v_day IN v_protocol.current_day..7 LOOP
          -- Only insert if completion doesn't already exist
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
            true,
            true,
            'Auto-skipped: Protocol expired after day 7',
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM mio_protocol_completions
            WHERE protocol_id = v_protocol.id AND day_number = v_day
          );

          IF FOUND THEN
            v_days_skipped := v_days_skipped + 1;
          END IF;
        END LOOP;

        -- Mark protocol as expired
        UPDATE mio_weekly_protocols
        SET
          status = 'expired',
          completed_at = NOW(),
          updated_at = NOW(),
          days_skipped = (
            SELECT COUNT(*) FROM mio_protocol_completions
            WHERE protocol_id = v_protocol.id AND was_skipped = true
          )
        WHERE id = v_protocol.id;

        v_protocols_expired := v_protocols_expired + 1;

      -- CASE 2: Protocol needs to advance (actual > current, but still within 7 days)
      ELSIF v_actual_day > v_protocol.current_day THEN
        -- Auto-skip missed days
        FOR v_day IN v_protocol.current_day..(v_actual_day - 1) LOOP
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
            true,
            true,
            'Auto-skipped: Day advanced by daily job on ' || CURRENT_DATE::text,
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM mio_protocol_completions
            WHERE protocol_id = v_protocol.id AND day_number = v_day
          );

          IF FOUND THEN
            v_days_skipped := v_days_skipped + 1;
          END IF;
        END LOOP;

        -- Update current_day
        UPDATE mio_weekly_protocols
        SET
          current_day = LEAST(v_actual_day, 7),
          updated_at = NOW(),
          days_skipped = (
            SELECT COUNT(*) FROM mio_protocol_completions
            WHERE protocol_id = v_protocol.id AND was_skipped = true
          )
        WHERE id = v_protocol.id;

        v_protocols_advanced := v_protocols_advanced + 1;
      END IF;

    END IF; -- end if not dry_run

  END LOOP;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'dry_run', p_dry_run,
    'timestamp', NOW(),
    'run_date', CURRENT_DATE,
    'protocols_processed', v_protocols_processed,
    'protocols_advanced', v_protocols_advanced,
    'protocols_expired', v_protocols_expired,
    'days_skipped', v_days_skipped,
    'details', v_details
  );
END;
$$;

-- ============================================================================
-- WRAPPER FUNCTION FOR EDGE FUNCTION
-- ============================================================================

-- Update the existing trigger_protocol_advancement to use new function
CREATE OR REPLACE FUNCTION trigger_protocol_advancement()
RETURNS JSONB AS $$
BEGIN
  RETURN advance_protocol_days_with_skip(false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION advance_protocol_days_with_skip(BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION trigger_protocol_advancement() TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION advance_protocol_days_with_skip IS
'Enhanced daily protocol advancement function. Calculates actual day from assigned_week_start,
auto-skips missed days, and expires protocols after day 7.
Pass dry_run=true to preview changes without applying them.
Called by n8n workflow daily at 5 AM UTC (midnight EST). Cron: 0 5 * * *';

COMMENT ON FUNCTION trigger_protocol_advancement IS
'Wrapper function for n8n/edge function to trigger daily advancement. Calls advance_protocol_days_with_skip(false).';
