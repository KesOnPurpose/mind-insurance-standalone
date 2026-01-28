-- ============================================================================
-- FEAT-GH-009-F: Completion Logic Functions
-- ============================================================================
-- Purpose: Core functions for checking and updating completion status
-- This is THE DIFFERENTIATOR - strict completion gates
-- ============================================================================

-- ============================================================================
-- FUNCTION: Check if lesson completion gates are met
-- ============================================================================
CREATE OR REPLACE FUNCTION check_lesson_completion_gates(p_lesson_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lesson RECORD;
  v_progress RECORD;
  v_tactic_progress JSONB;
  v_video_gate BOOLEAN;
  v_tactics_gate BOOLEAN;
  v_assessment_gate BOOLEAN;
  v_all_gates BOOLEAN;
BEGIN
  -- Get lesson requirements
  SELECT * INTO v_lesson
  FROM public.gh_program_lessons
  WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lesson not found');
  END IF;

  -- Get user progress
  SELECT * INTO v_progress
  FROM public.gh_user_lesson_progress
  WHERE lesson_id = p_lesson_id AND user_id = p_user_id;

  -- Get tactic progress
  v_tactic_progress := get_lesson_tactic_progress(p_lesson_id, p_user_id);

  -- Check video gate
  IF v_lesson.video_url IS NOT NULL AND v_lesson.required_watch_percent > 0 THEN
    v_video_gate := COALESCE(v_progress.video_watched_percent, 0) >= v_lesson.required_watch_percent;
  ELSE
    v_video_gate := true;  -- No video requirement
  END IF;

  -- Check tactics gate (THE KEY DIFFERENTIATOR!)
  IF v_lesson.requires_tactics_complete THEN
    v_tactics_gate := COALESCE((v_tactic_progress->>'all_required_complete')::BOOLEAN, false);
  ELSE
    v_tactics_gate := true;  -- No tactics requirement
  END IF;

  -- Check assessment gate
  IF v_lesson.requires_assessment_pass AND v_lesson.has_assessment THEN
    v_assessment_gate := v_progress.assessment_status = 'passed';
  ELSE
    v_assessment_gate := true;  -- No assessment requirement
  END IF;

  -- All gates must pass
  v_all_gates := v_video_gate AND v_tactics_gate AND v_assessment_gate;

  RETURN jsonb_build_object(
    'video_gate', jsonb_build_object(
      'required', v_lesson.video_url IS NOT NULL AND v_lesson.required_watch_percent > 0,
      'threshold', v_lesson.required_watch_percent,
      'current', COALESCE(v_progress.video_watched_percent, 0),
      'met', v_video_gate
    ),
    'tactics_gate', jsonb_build_object(
      'required', v_lesson.requires_tactics_complete,
      'total', (v_tactic_progress->>'required_tactics')::INTEGER,
      'completed', (v_tactic_progress->>'required_completed')::INTEGER,
      'met', v_tactics_gate
    ),
    'assessment_gate', jsonb_build_object(
      'required', v_lesson.requires_assessment_pass AND v_lesson.has_assessment,
      'passing_score', v_lesson.assessment_passing_score,
      'best_score', v_progress.assessment_best_score,
      'met', v_assessment_gate
    ),
    'all_gates_met', v_all_gates,
    'can_complete', v_all_gates
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Update lesson progress gates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_lesson_progress_gates(p_lesson_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_gates JSONB;
  v_updated BOOLEAN;
BEGIN
  -- Get current gate status
  v_gates := check_lesson_completion_gates(p_lesson_id, p_user_id);

  -- Update progress record
  UPDATE public.gh_user_lesson_progress
  SET
    video_gate_met = (v_gates->'video_gate'->>'met')::BOOLEAN,
    tactics_gate_met = (v_gates->'tactics_gate'->>'met')::BOOLEAN,
    assessment_gate_met = (v_gates->'assessment_gate'->>'met')::BOOLEAN,
    all_gates_met = (v_gates->>'all_gates_met')::BOOLEAN,
    updated_at = NOW()
  WHERE lesson_id = p_lesson_id AND user_id = p_user_id;

  RETURN v_gates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Mark lesson as complete (with gate validation)
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_lesson(p_lesson_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_gates JSONB;
  v_lesson RECORD;
  v_phase_id UUID;
BEGIN
  -- Check gates first
  v_gates := check_lesson_completion_gates(p_lesson_id, p_user_id);

  IF NOT (v_gates->>'all_gates_met')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not all completion requirements are met',
      'gates', v_gates
    );
  END IF;

  -- Get lesson for phase_id
  SELECT *, phase_id INTO v_lesson, v_phase_id
  FROM public.gh_program_lessons
  WHERE id = p_lesson_id;

  -- Update lesson progress
  UPDATE public.gh_user_lesson_progress
  SET
    status = 'completed',
    completed_at = NOW(),
    video_gate_met = true,
    tactics_gate_met = true,
    assessment_gate_met = (v_gates->'assessment_gate'->>'required')::BOOLEAN,
    all_gates_met = true
  WHERE lesson_id = p_lesson_id AND user_id = p_user_id;

  -- Update phase progress
  PERFORM update_phase_progress(v_phase_id, p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'lesson_id', p_lesson_id,
    'completed_at', NOW(),
    'gates', v_gates
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Update phase progress based on completed lessons
-- ============================================================================
CREATE OR REPLACE FUNCTION update_phase_progress(p_phase_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_required INTEGER;
  v_completed INTEGER;
  v_progress_percent INTEGER;
  v_phase_complete BOOLEAN;
  v_phase RECORD;
  v_program_id UUID;
BEGIN
  -- Get phase details
  SELECT *, program_id INTO v_phase, v_program_id
  FROM public.gh_program_phases
  WHERE id = p_phase_id;

  -- Count required lessons
  SELECT COUNT(*) INTO v_total_required
  FROM public.gh_program_lessons
  WHERE phase_id = p_phase_id
  AND is_required = true
  AND status = 'published';

  -- Count completed required lessons
  SELECT COUNT(*) INTO v_completed
  FROM public.gh_user_lesson_progress ulp
  JOIN public.gh_program_lessons l ON l.id = ulp.lesson_id
  WHERE l.phase_id = p_phase_id
  AND l.is_required = true
  AND ulp.user_id = p_user_id
  AND ulp.status = 'completed';

  -- Calculate progress
  IF v_total_required > 0 THEN
    v_progress_percent := ROUND((v_completed::NUMERIC / v_total_required) * 100);
  ELSE
    v_progress_percent := 100;
  END IF;

  -- Check if phase is complete
  v_phase_complete := v_completed >= v_total_required;

  -- Upsert phase progress
  INSERT INTO public.gh_user_phase_progress (
    user_id, phase_id, status, completed_lessons,
    total_required_lessons, progress_percent, completed_at
  )
  VALUES (
    p_user_id, p_phase_id,
    CASE WHEN v_phase_complete THEN 'completed' ELSE 'in_progress' END,
    v_completed, v_total_required, v_progress_percent,
    CASE WHEN v_phase_complete THEN NOW() ELSE NULL END
  )
  ON CONFLICT (user_id, phase_id) DO UPDATE SET
    status = CASE WHEN v_phase_complete THEN 'completed' ELSE 'in_progress' END,
    completed_lessons = v_completed,
    total_required_lessons = v_total_required,
    progress_percent = v_progress_percent,
    completed_at = CASE WHEN v_phase_complete AND gh_user_phase_progress.completed_at IS NULL THEN NOW() ELSE gh_user_phase_progress.completed_at END,
    updated_at = NOW();

  -- Update program enrollment progress
  PERFORM update_enrollment_progress(v_program_id, p_user_id);

  RETURN jsonb_build_object(
    'phase_id', p_phase_id,
    'completed_lessons', v_completed,
    'total_required', v_total_required,
    'progress_percent', v_progress_percent,
    'is_complete', v_phase_complete
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Update enrollment progress based on completed phases
-- ============================================================================
CREATE OR REPLACE FUNCTION update_enrollment_progress(p_program_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_phases INTEGER;
  v_completed_phases INTEGER;
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress_percent INTEGER;
  v_program_complete BOOLEAN;
BEGIN
  -- Count total phases
  SELECT COUNT(*) INTO v_total_phases
  FROM public.gh_program_phases
  WHERE program_id = p_program_id
  AND is_required = true
  AND status = 'published';

  -- Count completed phases
  SELECT COUNT(*) INTO v_completed_phases
  FROM public.gh_user_phase_progress upp
  JOIN public.gh_program_phases ph ON ph.id = upp.phase_id
  WHERE ph.program_id = p_program_id
  AND ph.is_required = true
  AND upp.user_id = p_user_id
  AND upp.status = 'completed';

  -- Count total required lessons across all phases
  SELECT COUNT(*) INTO v_total_lessons
  FROM public.gh_program_lessons l
  JOIN public.gh_program_phases ph ON ph.id = l.phase_id
  WHERE ph.program_id = p_program_id
  AND l.is_required = true
  AND l.status = 'published';

  -- Count completed lessons
  SELECT COUNT(*) INTO v_completed_lessons
  FROM public.gh_user_lesson_progress ulp
  JOIN public.gh_program_lessons l ON l.id = ulp.lesson_id
  JOIN public.gh_program_phases ph ON ph.id = l.phase_id
  WHERE ph.program_id = p_program_id
  AND l.is_required = true
  AND ulp.user_id = p_user_id
  AND ulp.status = 'completed';

  -- Calculate overall progress
  IF v_total_lessons > 0 THEN
    v_progress_percent := ROUND((v_completed_lessons::NUMERIC / v_total_lessons) * 100);
  ELSE
    v_progress_percent := 100;
  END IF;

  -- Check if program is complete
  v_program_complete := v_completed_phases >= v_total_phases;

  -- Update enrollment
  UPDATE public.gh_user_program_enrollments
  SET
    progress_percent = v_progress_percent,
    completed_phases = v_completed_phases,
    completed_lessons = v_completed_lessons,
    status = CASE WHEN v_program_complete THEN 'completed' ELSE status END,
    completed_at = CASE WHEN v_program_complete AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE program_id = p_program_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'program_id', p_program_id,
    'completed_phases', v_completed_phases,
    'total_phases', v_total_phases,
    'completed_lessons', v_completed_lessons,
    'total_lessons', v_total_lessons,
    'progress_percent', v_progress_percent,
    'is_complete', v_program_complete
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Toggle tactic completion
-- ============================================================================
CREATE OR REPLACE FUNCTION toggle_tactic_completion(
  p_tactic_id UUID,
  p_user_id UUID,
  p_response_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
  v_tactic RECORD;
  v_lesson_id UUID;
  v_is_completed BOOLEAN;
BEGIN
  -- Get tactic details
  SELECT *, lesson_id INTO v_tactic, v_lesson_id
  FROM public.gh_lesson_tactics
  WHERE id = p_tactic_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tactic not found');
  END IF;

  -- Check if already completed
  SELECT * INTO v_existing
  FROM public.gh_user_tactic_completions
  WHERE tactic_id = p_tactic_id AND user_id = p_user_id;

  IF FOUND THEN
    -- Uncomplete (delete)
    DELETE FROM public.gh_user_tactic_completions
    WHERE tactic_id = p_tactic_id AND user_id = p_user_id;
    v_is_completed := false;
  ELSE
    -- Complete (insert)
    INSERT INTO public.gh_user_tactic_completions (tactic_id, user_id, response_data)
    VALUES (p_tactic_id, p_user_id, COALESCE(p_response_data, '{}'::JSONB));
    v_is_completed := true;
  END IF;

  -- Update lesson progress tactics count
  UPDATE public.gh_user_lesson_progress
  SET
    tactics_completed_count = (
      SELECT COUNT(*) FROM public.gh_user_tactic_completions c
      JOIN public.gh_lesson_tactics t ON t.id = c.tactic_id
      WHERE t.lesson_id = v_lesson_id AND c.user_id = p_user_id
    ),
    tactics_completion_percent = (
      SELECT CASE WHEN required > 0 THEN ROUND((completed::NUMERIC / required) * 100) ELSE 100 END
      FROM (
        SELECT
          COUNT(*) FILTER (WHERE t.is_required) as required,
          COUNT(*) FILTER (WHERE t.is_required AND c.id IS NOT NULL) as completed
        FROM public.gh_lesson_tactics t
        LEFT JOIN public.gh_user_tactic_completions c ON c.tactic_id = t.id AND c.user_id = p_user_id
        WHERE t.lesson_id = v_lesson_id
      ) sub
    )
  WHERE lesson_id = v_lesson_id AND user_id = p_user_id;

  -- Update completion gates
  PERFORM update_lesson_progress_gates(v_lesson_id, p_user_id);

  RETURN jsonb_build_object(
    'tactic_id', p_tactic_id,
    'is_completed', v_is_completed,
    'lesson_id', v_lesson_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get or create lesson progress record
-- ============================================================================
CREATE OR REPLACE FUNCTION get_or_create_lesson_progress(p_lesson_id UUID, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
  v_lesson RECORD;
  v_total_required_tactics INTEGER;
BEGIN
  -- Check if exists
  SELECT id INTO v_progress_id
  FROM public.gh_user_lesson_progress
  WHERE lesson_id = p_lesson_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN v_progress_id;
  END IF;

  -- Get lesson details
  SELECT * INTO v_lesson
  FROM public.gh_program_lessons
  WHERE id = p_lesson_id;

  -- Count required tactics
  SELECT COUNT(*) INTO v_total_required_tactics
  FROM public.gh_lesson_tactics
  WHERE lesson_id = p_lesson_id AND is_required = true;

  -- Create new progress record
  INSERT INTO public.gh_user_lesson_progress (
    user_id, lesson_id, status, tactics_required_count
  )
  VALUES (
    p_user_id, p_lesson_id, 'not_started', v_total_required_tactics
  )
  RETURNING id INTO v_progress_id;

  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION check_lesson_completion_gates(UUID, UUID) IS
  'Check if all completion gates (video, tactics, assessment) are met for a lesson';

COMMENT ON FUNCTION complete_lesson(UUID, UUID) IS
  'Mark a lesson as complete if all gates are met. Returns error if gates not passed.';

COMMENT ON FUNCTION toggle_tactic_completion(UUID, UUID, JSONB) IS
  'Toggle a tactic completion status and update lesson progress automatically';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_lesson_completion_gates')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_lesson')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'toggle_tactic_completion')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_phase_progress')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_enrollment_progress')
  THEN
    RAISE NOTICE '✓ FEAT-GH-009-F: Completion logic functions created successfully';
    RAISE NOTICE '  → check_lesson_completion_gates(): Check gate status';
    RAISE NOTICE '  → complete_lesson(): Mark lesson complete with validation';
    RAISE NOTICE '  → toggle_tactic_completion(): Toggle tactic with auto-update';
    RAISE NOTICE '  → update_phase_progress(): Recalculate phase progress';
    RAISE NOTICE '  → update_enrollment_progress(): Recalculate program progress';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-F: One or more functions FAILED to create';
  END IF;
END $$;
