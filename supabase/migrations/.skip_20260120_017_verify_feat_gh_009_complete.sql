-- ============================================================================
-- FEAT-GH-009: VERIFICATION - Program & Enrollment Schema Complete
-- ============================================================================
-- Purpose: Verify all FEAT-GH-009 tables, functions, and RLS policies
-- This migration runs checks and reports status
-- ============================================================================

-- ============================================================================
-- PART 1: Verify All Tables Exist
-- ============================================================================

DO $$
DECLARE
  v_tables_required TEXT[] := ARRAY[
    'gh_programs',
    'gh_program_phases',
    'gh_program_lessons',
    'gh_lesson_tactics',
    'gh_user_program_enrollments',
    'gh_user_phase_progress',
    'gh_user_lesson_progress',
    'gh_user_tactic_completions',
    'gh_nette_conversations',
    'gh_nette_messages',
    'gh_user_insights',
    'gh_support_escalations',
    'gh_nette_proactive_triggers',
    'gh_nette_usage'
  ];
  v_table TEXT;
  v_missing TEXT[] := '{}';
  v_found INTEGER := 0;
BEGIN
  FOREACH v_table IN ARRAY v_tables_required
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = v_table
      AND table_schema = 'public'
    ) THEN
      v_found := v_found + 1;
    ELSE
      v_missing := array_append(v_missing, v_table);
    END IF;
  END LOOP;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'FEAT-GH-009 TABLE VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Tables found: % of %', v_found, array_length(v_tables_required, 1);

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION '✗ MISSING TABLES: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE '✓ All required tables exist';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Verify All Functions Exist
-- ============================================================================

DO $$
DECLARE
  v_functions_required TEXT[] := ARRAY[
    -- From phases table (011)
    'get_phase_effective_drip_model',
    'is_phase_unlocked',
    -- From lessons table (012)
    'get_lesson_completion_requirements',
    'is_lesson_unlocked',
    -- From tactics table (013)
    'get_lesson_tactics_with_status',
    'get_lesson_tactic_progress',
    -- From completion logic (015)
    'check_lesson_completion_gates',
    'update_lesson_progress_gates',
    'complete_lesson',
    'update_phase_progress',
    'update_enrollment_progress',
    'toggle_tactic_completion',
    'get_or_create_lesson_progress',
    -- From Nette AI (016)
    'get_nette_conversation_context',
    'start_nette_conversation',
    'add_nette_message',
    'capture_user_insight',
    'create_support_escalation',
    'check_nette_rate_limit',
    'log_proactive_trigger'
  ];
  v_function TEXT;
  v_missing TEXT[] := '{}';
  v_found INTEGER := 0;
BEGIN
  FOREACH v_function IN ARRAY v_functions_required
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = v_function
    ) THEN
      v_found := v_found + 1;
    ELSE
      v_missing := array_append(v_missing, v_function);
    END IF;
  END LOOP;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'FEAT-GH-009 FUNCTION VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Functions found: % of %', v_found, array_length(v_functions_required, 1);

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION '✗ MISSING FUNCTIONS: %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE '✓ All required functions exist';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Verify RLS is Enabled on All Tables
-- ============================================================================

DO $$
DECLARE
  v_tables_requiring_rls TEXT[] := ARRAY[
    'gh_programs',
    'gh_program_phases',
    'gh_program_lessons',
    'gh_lesson_tactics',
    'gh_user_program_enrollments',
    'gh_user_phase_progress',
    'gh_user_lesson_progress',
    'gh_user_tactic_completions',
    'gh_nette_conversations',
    'gh_nette_messages',
    'gh_user_insights',
    'gh_support_escalations',
    'gh_nette_proactive_triggers',
    'gh_nette_usage'
  ];
  v_table TEXT;
  v_missing_rls TEXT[] := '{}';
  v_rls_enabled INTEGER := 0;
BEGIN
  FOREACH v_table IN ARRAY v_tables_requiring_rls
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE tablename = v_table
      AND schemaname = 'public'
      AND rowsecurity = true
    ) THEN
      v_rls_enabled := v_rls_enabled + 1;
    ELSE
      v_missing_rls := array_append(v_missing_rls, v_table);
    END IF;
  END LOOP;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'FEAT-GH-009 RLS VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Tables with RLS enabled: % of %', v_rls_enabled, array_length(v_tables_requiring_rls, 1);

  IF array_length(v_missing_rls, 1) > 0 THEN
    RAISE EXCEPTION '✗ TABLES MISSING RLS: %', array_to_string(v_missing_rls, ', ');
  ELSE
    RAISE NOTICE '✓ RLS enabled on all required tables';
  END IF;
END $$;

-- ============================================================================
-- PART 4: Verify Key Indexes Exist
-- ============================================================================

DO $$
DECLARE
  v_critical_indexes TEXT[] := ARRAY[
    'idx_gh_programs_status',
    'idx_gh_programs_slug',
    'idx_gh_program_phases_program_id',
    'idx_gh_program_lessons_phase_id',
    'idx_gh_lesson_tactics_lesson_id',
    'idx_gh_enrollments_user_id',
    'idx_gh_enrollments_program_id',
    'idx_gh_lesson_progress_user_id',
    'idx_gh_tactic_completions_user_id',
    'idx_gh_nette_conversations_user_id',
    'idx_gh_nette_messages_conversation_id'
  ];
  v_index TEXT;
  v_missing TEXT[] := '{}';
  v_found INTEGER := 0;
BEGIN
  FOREACH v_index IN ARRAY v_critical_indexes
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE indexname = v_index
    ) THEN
      v_found := v_found + 1;
    ELSE
      v_missing := array_append(v_missing, v_index);
    END IF;
  END LOOP;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'FEAT-GH-009 INDEX VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Critical indexes found: % of %', v_found, array_length(v_critical_indexes, 1);

  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING '⚠ MISSING INDEXES (non-critical): %', array_to_string(v_missing, ', ');
  ELSE
    RAISE NOTICE '✓ All critical indexes exist';
  END IF;
END $$;

-- ============================================================================
-- PART 5: Schema Integrity Summary
-- ============================================================================

DO $$
DECLARE
  v_program_count INTEGER;
  v_phase_count INTEGER;
  v_lesson_count INTEGER;
  v_tactic_count INTEGER;
  v_enrollment_count INTEGER;
  v_conversation_count INTEGER;
BEGIN
  -- Get counts (will be 0 for fresh install, that's OK)
  SELECT COUNT(*) INTO v_program_count FROM public.gh_programs;
  SELECT COUNT(*) INTO v_phase_count FROM public.gh_program_phases;
  SELECT COUNT(*) INTO v_lesson_count FROM public.gh_program_lessons;
  SELECT COUNT(*) INTO v_tactic_count FROM public.gh_lesson_tactics;
  SELECT COUNT(*) INTO v_enrollment_count FROM public.gh_user_program_enrollments;
  SELECT COUNT(*) INTO v_conversation_count FROM public.gh_nette_conversations;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'FEAT-GH-009 SCHEMA SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '  CONTENT TABLES:';
  RAISE NOTICE '    ├── gh_programs ................ % records', v_program_count;
  RAISE NOTICE '    ├── gh_program_phases .......... % records', v_phase_count;
  RAISE NOTICE '    ├── gh_program_lessons ......... % records', v_lesson_count;
  RAISE NOTICE '    └── gh_lesson_tactics .......... % records', v_tactic_count;
  RAISE NOTICE '';
  RAISE NOTICE '  PROGRESS TABLES:';
  RAISE NOTICE '    ├── gh_user_program_enrollments  % records', v_enrollment_count;
  RAISE NOTICE '    ├── gh_user_phase_progress';
  RAISE NOTICE '    ├── gh_user_lesson_progress';
  RAISE NOTICE '    └── gh_user_tactic_completions';
  RAISE NOTICE '';
  RAISE NOTICE '  NETTE AI TABLES ($100M FEATURE):';
  RAISE NOTICE '    ├── gh_nette_conversations ..... % records', v_conversation_count;
  RAISE NOTICE '    ├── gh_nette_messages';
  RAISE NOTICE '    ├── gh_user_insights';
  RAISE NOTICE '    ├── gh_support_escalations';
  RAISE NOTICE '    ├── gh_nette_proactive_triggers';
  RAISE NOTICE '    └── gh_nette_usage';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ FEAT-GH-009: Program & Enrollment Schema COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '  KEY DIFFERENTIATORS IMPLEMENTED:';
  RAISE NOTICE '    ✓ Tactics per lesson (not just video → done)';
  RAISE NOTICE '    ✓ Two progress gauges (video % + tactics %)';
  RAISE NOTICE '    ✓ Strict completion gates';
  RAISE NOTICE '    ✓ Drip models (calendar, relative, progress, hybrid)';
  RAISE NOTICE '    ✓ Nette AI Learning Companion tables';
  RAISE NOTICE '';
  RAISE NOTICE '  NEXT STEPS:';
  RAISE NOTICE '    → FEAT-GH-010: Learner Programs Hub';
  RAISE NOTICE '    → FEAT-GH-011: Program Dashboard & Phase Roadmap';
  RAISE NOTICE '    → FEAT-GH-012: Phase View & Lesson List';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- PART 6: Create Helper View for Admin Dashboard
-- ============================================================================

-- Summary view for quick program stats
CREATE OR REPLACE VIEW public.vw_program_stats AS
SELECT
  p.id,
  p.title,
  p.status,
  p.is_public,
  (SELECT COUNT(*) FROM public.gh_program_phases WHERE program_id = p.id) AS phase_count,
  (SELECT COUNT(*) FROM public.gh_program_lessons l
   JOIN public.gh_program_phases ph ON ph.id = l.phase_id
   WHERE ph.program_id = p.id) AS lesson_count,
  (SELECT COUNT(*) FROM public.gh_lesson_tactics t
   JOIN public.gh_program_lessons l ON l.id = t.lesson_id
   JOIN public.gh_program_phases ph ON ph.id = l.phase_id
   WHERE ph.program_id = p.id) AS tactic_count,
  (SELECT COUNT(*) FROM public.gh_user_program_enrollments WHERE program_id = p.id) AS enrollment_count,
  (SELECT COUNT(*) FROM public.gh_user_program_enrollments
   WHERE program_id = p.id AND status = 'completed') AS completion_count,
  p.created_at,
  p.updated_at
FROM public.gh_programs p;

COMMENT ON VIEW public.vw_program_stats IS
  'Summary statistics for each program - used in admin dashboard';

-- Grant access to the view
GRANT SELECT ON public.vw_program_stats TO authenticated;

RAISE NOTICE '✓ Created vw_program_stats view for admin dashboard';
