-- ============================================================================
-- FIX PROTOCOL DAY CALCULATION
-- ============================================================================
-- Phase 32: Use created_at instead of assigned_week_start for day calculations
--
-- PROBLEM:
-- - assigned_week_start was set to Monday of the week protocol was created
-- - Users joining mid-week would skip to that calendar day
-- - Example: Protocol created Wed Dec 4 → assigned_week_start = Mon Dec 2
--   → Day calculation: (Dec 4 - Dec 2) + 1 = Day 3 (not Day 1!)
--
-- FIX:
-- - Use created_at (actual protocol creation timestamp) for day calculations
-- - Every user starts at Day 1 on their actual creation date
-- - Days advance naturally from that point
-- ============================================================================

-- ============================================================================
-- MAIN FUNCTION: advance_protocol_days_with_skip (FIXED)
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
    SELECT id, user_id, current_day, created_at, title
    FROM mio_weekly_protocols
    WHERE status = 'active'
      AND muted_by_coach = false
  LOOP
    v_protocols_processed := v_protocols_processed + 1;

    -- FIX: Calculate actual day based on created_at (not assigned_week_start)
    -- Day 1 = creation date, Day 2 = creation date + 1 day, etc.
    -- Note: (date - date) returns integer in PostgreSQL, not interval
    v_actual_day := GREATEST(
      1,
      (CURRENT_DATE - v_protocol.created_at::date)::INT + 1
    );

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
      'created_at', v_protocol.created_at,
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
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION advance_protocol_days_with_skip IS
'Enhanced daily protocol advancement function. Calculates actual day from created_at (fixed from assigned_week_start),
auto-skips missed days, and expires protocols after day 7.
Pass dry_run=true to preview changes without applying them.
Called by n8n workflow daily at 5 AM UTC (midnight EST). Cron: 0 5 * * *';
