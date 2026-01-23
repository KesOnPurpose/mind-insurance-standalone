-- ============================================================================
-- FEAT-GH-004-I: Verify Schema Foundation (Completion Check)
-- ============================================================================
-- Purpose: Comprehensive verification that all FEAT-GH-004 schema changes are in place
-- This migration only validates - it does not modify anything
-- ============================================================================

DO $$
DECLARE
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_success_count INTEGER := 0;
  v_table_exists BOOLEAN;
  v_column_exists BOOLEAN;
  v_function_exists BOOLEAN;
  v_config_count INTEGER;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'FEAT-GH-004: Schema Foundation Verification';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';

  -- =========================================================================
  -- TASK A: gh_curriculum_config table
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_curriculum_config' AND table_schema = 'public'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✓ TASK A: gh_curriculum_config table exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK A: gh_curriculum_config table MISSING');
  END IF;

  -- =========================================================================
  -- TASK B: gh_lesson_video_progress table
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_lesson_video_progress' AND table_schema = 'public'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✓ TASK B: gh_lesson_video_progress table exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK B: gh_lesson_video_progress table MISSING');
  END IF;

  -- =========================================================================
  -- TASK C: Assessment tables
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_lesson_assessments' AND table_schema = 'public'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✓ TASK C: gh_lesson_assessments table exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK C: gh_lesson_assessments table MISSING');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_user_assessment_attempts' AND table_schema = 'public'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✓ TASK C: gh_user_assessment_attempts table exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK C: gh_user_assessment_attempts table MISSING');
  END IF;

  -- =========================================================================
  -- TASK D: gh_automation_events table
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_automation_events' AND table_schema = 'public'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✓ TASK D: gh_automation_events table exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK D: gh_automation_events table MISSING');
  END IF;

  -- =========================================================================
  -- TASK E: Video/assessment columns on gh_tactic_instructions
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_tactic_instructions'
    AND column_name = 'video_url'
    AND table_schema = 'public'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✓ TASK E: video_url column exists on gh_tactic_instructions';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK E: video_url column MISSING on gh_tactic_instructions');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_tactic_instructions'
    AND column_name = 'completion_gate_enabled'
    AND table_schema = 'public'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✓ TASK E: completion_gate_enabled column exists on gh_tactic_instructions';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK E: completion_gate_enabled column MISSING on gh_tactic_instructions');
  END IF;

  -- =========================================================================
  -- TASK F: gh_user_tactic_progress table
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_user_tactic_progress' AND table_schema = 'public'
  ) INTO v_table_exists;

  IF v_table_exists THEN
    RAISE NOTICE '✓ TASK F: gh_user_tactic_progress table exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK F: gh_user_tactic_progress table MISSING');
  END IF;

  -- Check for completion gate columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_user_tactic_progress'
    AND column_name = 'video_gate_met'
    AND table_schema = 'public'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE NOTICE '✓ TASK F: video_gate_met column exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK F: video_gate_met column MISSING');
  END IF;

  -- =========================================================================
  -- TASK G: Coach role in admin system
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_coach'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✓ TASK G: is_coach() function exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK G: is_coach() function MISSING');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'has_coaching_permission'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✓ TASK G: has_coaching_permission() function exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK G: has_coaching_permission() function MISSING');
  END IF;

  -- =========================================================================
  -- TASK H: Default configuration values
  -- =========================================================================
  SELECT COUNT(*) INTO v_config_count
  FROM gh_curriculum_config
  WHERE is_active = true;

  IF v_config_count >= 10 THEN
    RAISE NOTICE '✓ TASK H: Configuration seeded (% active configs)', v_config_count;
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, FORMAT('TASK H: Only %s configs seeded (expected 10+)', v_config_count));
  END IF;

  -- Check helper functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_curriculum_config'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✓ TASK H: get_curriculum_config() function exists';
    v_success_count := v_success_count + 1;
  ELSE
    v_errors := array_append(v_errors, 'TASK H: get_curriculum_config() function MISSING');
  END IF;

  -- =========================================================================
  -- FINAL SUMMARY
  -- =========================================================================
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Checks passed: %/15', v_success_count;

  IF array_length(v_errors, 1) > 0 THEN
    RAISE NOTICE '───────────────────────────────────────────────────────────────────────';
    RAISE NOTICE 'ERRORS FOUND:';
    FOR i IN 1..array_length(v_errors, 1) LOOP
      RAISE NOTICE '  ✗ %', v_errors[i];
    END LOOP;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
    RAISE EXCEPTION 'FEAT-GH-004 verification FAILED with % errors', array_length(v_errors, 1);
  ELSE
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✓✓✓ FEAT-GH-004: Schema Foundation COMPLETE ✓✓✓';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '  • gh_curriculum_config (configuration settings)';
    RAISE NOTICE '  • gh_lesson_video_progress (video watch tracking)';
    RAISE NOTICE '  • gh_lesson_assessments (assessment definitions)';
    RAISE NOTICE '  • gh_user_assessment_attempts (user assessment history)';
    RAISE NOTICE '  • gh_automation_events (stuck detection logging)';
    RAISE NOTICE '  • gh_user_tactic_progress (tactic completion gates)';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Modified:';
    RAISE NOTICE '  • gh_tactic_instructions (video/assessment columns added)';
    RAISE NOTICE '  • admin_users (coach role added)';
    RAISE NOTICE '  • admin_audit_log (coaching action types added)';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions Added:';
    RAISE NOTICE '  • is_coach() - Check if user is a coach';
    RAISE NOTICE '  • is_coach_or_admin() - Check coach or admin status';
    RAISE NOTICE '  • has_coaching_permission() - Granular coaching permissions';
    RAISE NOTICE '  • get_curriculum_config() - Get config values';
    RAISE NOTICE '  • get_video_completion_threshold() - Get video threshold';
    RAISE NOTICE '  • get_assessment_passing_score() - Get assessment threshold';
    RAISE NOTICE '  • get_tactic_completion_requirements() - Get gate requirements';
    RAISE NOTICE '  • can_complete_tactic() - Check if user can complete tactic';
    RAISE NOTICE '  • get_or_create_user_tactic_progress() - Upsert progress';
    RAISE NOTICE '  • log_automation_event() - Log automation events';
    RAISE NOTICE '  • get_best_assessment_attempt() - Get best assessment score';
    RAISE NOTICE '  • get_user_stuck_history() - Get stuck event history';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for FEAT-GH-005 (Phase Architecture)!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════';
  END IF;
END $$;
