-- ============================================================================
-- FEAT-GH-009-F: Add Enrollment-Dependent RLS Policies & Functions
-- ============================================================================
-- Purpose: Add policies that depend on gh_user_program_enrollments table
-- MUST RUN AFTER: 010a, 011a, 012a, 013a, 014 (enrollment tables)
-- ============================================================================

-- ============================================================================
-- PART 1: Programs - Enrolled Users Policy
-- ============================================================================

-- Add policy for enrolled users to view their programs
CREATE POLICY "Enrolled users can view their programs"
  ON public.gh_programs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gh_user_program_enrollments e
      WHERE e.program_id = gh_programs.id
      AND e.user_id = auth.uid()
      AND e.status IN ('active', 'completed')
    )
  );

-- ============================================================================
-- PART 2: Phases - Users Can View Accessible Phases
-- ============================================================================

-- Add policy for users to view phases of accessible programs
CREATE POLICY "Users can view phases of accessible programs"
  ON public.gh_program_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gh_programs p
      WHERE p.id = gh_program_phases.program_id
      AND (
        -- Program is public and published
        (p.status = 'published' AND p.is_public = true)
        -- OR user is enrolled
        OR EXISTS (
          SELECT 1 FROM public.gh_user_program_enrollments e
          WHERE e.program_id = p.id
          AND e.user_id = auth.uid()
          AND e.status IN ('active', 'completed')
        )
      )
    )
  );

-- Helper function: Check if phase is unlocked for user
CREATE OR REPLACE FUNCTION is_phase_unlocked(p_phase_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_phase RECORD;
  v_enrollment RECORD;
  v_effective_drip TEXT;
  v_prereq_complete BOOLEAN;
BEGIN
  -- Get phase details
  SELECT * INTO v_phase
  FROM public.gh_program_phases
  WHERE id = p_phase_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get enrollment
  SELECT * INTO v_enrollment
  FROM public.gh_user_program_enrollments
  WHERE program_id = v_phase.program_id
  AND user_id = p_user_id
  AND status IN ('active', 'completed');

  IF NOT FOUND THEN
    RETURN false;  -- Not enrolled
  END IF;

  -- Get effective drip model
  v_effective_drip := get_phase_effective_drip_model(p_phase_id);

  -- Check based on drip model
  CASE v_effective_drip
    WHEN 'immediate' THEN
      RETURN true;

    WHEN 'calendar' THEN
      RETURN v_phase.unlock_at IS NULL OR v_phase.unlock_at <= NOW();

    WHEN 'relative' THEN
      RETURN v_enrollment.enrolled_at + (COALESCE(v_phase.unlock_offset_days, 0) || ' days')::INTERVAL
             + (COALESCE(v_phase.unlock_offset_hours, 0) || ' hours')::INTERVAL <= NOW();

    WHEN 'progress' THEN
      -- First phase is always unlocked (order_index = 1)
      IF v_phase.order_index <= 1 OR v_phase.prerequisite_phase_id IS NULL THEN
        RETURN true;
      END IF;

      -- Check if prerequisite phase is complete
      SELECT EXISTS (
        SELECT 1 FROM public.gh_user_phase_progress
        WHERE user_id = p_user_id
        AND phase_id = v_phase.prerequisite_phase_id
        AND status = 'completed'
      ) INTO v_prereq_complete;

      RETURN v_prereq_complete;

    ELSE
      RETURN true;  -- Default to unlocked
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_phase_unlocked(UUID, UUID) IS
  'Check if a phase is unlocked for a specific user based on drip configuration and progress';

-- ============================================================================
-- PART 3: Lessons - Users Can View Accessible Lessons
-- ============================================================================

-- Add policy for users to view lessons of accessible phases
CREATE POLICY "Users can view lessons of accessible phases"
  ON public.gh_program_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gh_program_phases ph
      JOIN public.gh_programs p ON p.id = ph.program_id
      WHERE ph.id = gh_program_lessons.phase_id
      AND (
        -- Program is public and published
        (p.status = 'published' AND p.is_public = true)
        -- OR user is enrolled
        OR EXISTS (
          SELECT 1 FROM public.gh_user_program_enrollments e
          WHERE e.program_id = p.id
          AND e.user_id = auth.uid()
          AND e.status IN ('active', 'completed')
        )
      )
    )
  );

-- Helper function: Get lesson completion requirements
CREATE OR REPLACE FUNCTION get_lesson_completion_requirements(lesson_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lesson RECORD;
  v_tactic_count INTEGER;
  v_required_tactic_count INTEGER;
BEGIN
  SELECT * INTO v_lesson
  FROM public.gh_program_lessons
  WHERE id = lesson_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Count tactics for this lesson
  SELECT
    COUNT(*) FILTER (WHERE true),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_tactic_count, v_required_tactic_count
  FROM public.gh_lesson_tactics
  WHERE gh_lesson_tactics.lesson_id = get_lesson_completion_requirements.lesson_id;

  RETURN jsonb_build_object(
    'completion_gate_enabled', v_lesson.completion_gate_enabled,
    'video_required', v_lesson.video_url IS NOT NULL AND v_lesson.required_watch_percent > 0,
    'required_watch_percent', v_lesson.required_watch_percent,
    'tactics_required', v_lesson.requires_tactics_complete AND v_required_tactic_count > 0,
    'total_tactics', v_tactic_count,
    'required_tactics', v_required_tactic_count,
    'assessment_required', v_lesson.requires_assessment_pass AND v_lesson.has_assessment,
    'assessment_passing_score', v_lesson.assessment_passing_score
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function: Check if lesson is unlocked for user
CREATE OR REPLACE FUNCTION is_lesson_unlocked(p_lesson_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_lesson RECORD;
  v_phase_id UUID;
  v_phase_unlocked BOOLEAN;
  v_drip_override JSONB;
  v_prev_lesson_complete BOOLEAN;
BEGIN
  -- Get lesson details
  SELECT * INTO v_lesson
  FROM public.gh_program_lessons
  WHERE id = p_lesson_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_phase_id := v_lesson.phase_id;

  -- First check if phase is unlocked
  v_phase_unlocked := is_phase_unlocked(v_phase_id, p_user_id);
  IF NOT v_phase_unlocked THEN
    RETURN false;
  END IF;

  -- Check lesson-specific drip override
  v_drip_override := v_lesson.drip_override;
  IF v_drip_override IS NOT NULL AND v_drip_override->>'model' IS NOT NULL THEN
    -- Has lesson-specific drip rules
    CASE v_drip_override->>'model'
      WHEN 'immediate' THEN
        RETURN true;
      WHEN 'progress' THEN
        -- Check if prerequisite lesson is complete
        IF v_drip_override->>'prerequisite_lesson_id' IS NOT NULL THEN
          SELECT EXISTS (
            SELECT 1 FROM public.gh_user_lesson_progress
            WHERE user_id = p_user_id
            AND lesson_id = (v_drip_override->>'prerequisite_lesson_id')::UUID
            AND status = 'completed'
          ) INTO v_prev_lesson_complete;
          RETURN v_prev_lesson_complete;
        END IF;
    END CASE;
  END IF;

  -- Default: If phase is unlocked, first lesson is unlocked
  IF v_lesson.order_index <= 1 THEN
    RETURN true;
  END IF;

  -- Check if previous lesson in phase is complete
  SELECT EXISTS (
    SELECT 1 FROM public.gh_user_lesson_progress ulp
    JOIN public.gh_program_lessons pl ON pl.id = ulp.lesson_id
    WHERE ulp.user_id = p_user_id
    AND pl.phase_id = v_phase_id
    AND pl.order_index = v_lesson.order_index - 1
    AND ulp.status = 'completed'
  ) INTO v_prev_lesson_complete;

  RETURN v_prev_lesson_complete;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_lesson_completion_requirements(UUID) IS
  'Get all completion requirements for a lesson including video, tactics, and assessment rules';

COMMENT ON FUNCTION is_lesson_unlocked(UUID, UUID) IS
  'Check if a lesson is unlocked for a specific user based on phase drip and lesson-specific overrides';

-- ============================================================================
-- PART 4: Tactics - Users Can View Accessible Tactics
-- ============================================================================

-- Add policy for users to view tactics of accessible lessons
CREATE POLICY "Users can view tactics of accessible lessons"
  ON public.gh_lesson_tactics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gh_program_lessons l
      JOIN public.gh_program_phases ph ON ph.id = l.phase_id
      JOIN public.gh_programs p ON p.id = ph.program_id
      WHERE l.id = gh_lesson_tactics.lesson_id
      AND (
        -- Program is public and published
        (p.status = 'published' AND p.is_public = true)
        -- OR user is enrolled
        OR EXISTS (
          SELECT 1 FROM public.gh_user_program_enrollments e
          WHERE e.program_id = p.id
          AND e.user_id = auth.uid()
          AND e.status IN ('active', 'completed')
        )
      )
    )
  );

-- Helper function: Get tactics for a lesson with completion status
CREATE OR REPLACE FUNCTION get_lesson_tactics_with_status(p_lesson_id UUID, p_user_id UUID)
RETURNS TABLE (
  tactic_id UUID,
  label TEXT,
  description TEXT,
  order_index INTEGER,
  is_required BOOLEAN,
  tactic_type TEXT,
  is_completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  response_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS tactic_id,
    t.label,
    t.description,
    t.order_index,
    t.is_required,
    t.tactic_type,
    (c.id IS NOT NULL) AS is_completed,
    c.completed_at,
    c.response_data
  FROM public.gh_lesson_tactics t
  LEFT JOIN public.gh_user_tactic_completions c
    ON c.tactic_id = t.id AND c.user_id = p_user_id
  WHERE t.lesson_id = p_lesson_id
  ORDER BY t.order_index;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function: Count required vs completed tactics
CREATE OR REPLACE FUNCTION get_lesson_tactic_progress(p_lesson_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_required INTEGER;
  v_completed INTEGER;
  v_required_completed INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true),
    COUNT(*) FILTER (WHERE c.id IS NOT NULL),
    COUNT(*) FILTER (WHERE is_required = true AND c.id IS NOT NULL)
  INTO v_total, v_required, v_completed, v_required_completed
  FROM public.gh_lesson_tactics t
  LEFT JOIN public.gh_user_tactic_completions c
    ON c.tactic_id = t.id AND c.user_id = p_user_id
  WHERE t.lesson_id = p_lesson_id;

  RETURN jsonb_build_object(
    'total_tactics', v_total,
    'required_tactics', v_required,
    'completed_tactics', v_completed,
    'required_completed', v_required_completed,
    'all_required_complete', v_required_completed >= v_required,
    'completion_percent', CASE WHEN v_required > 0 THEN ROUND((v_required_completed::NUMERIC / v_required) * 100) ELSE 100 END
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_lesson_tactics_with_status(UUID, UUID) IS
  'Get all tactics for a lesson with user completion status';

COMMENT ON FUNCTION get_lesson_tactic_progress(UUID, UUID) IS
  'Get tactic completion counts for progress gauges (required vs completed)';

-- ============================================================================
-- PART 5: Verification
-- ============================================================================

DO $$
BEGIN
  -- Check that all policies were created
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gh_programs'
    AND policyname = 'Enrolled users can view their programs'
  ) AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gh_program_phases'
    AND policyname = 'Users can view phases of accessible programs'
  ) AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gh_program_lessons'
    AND policyname = 'Users can view lessons of accessible phases'
  ) AND EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gh_lesson_tactics'
    AND policyname = 'Users can view tactics of accessible lessons'
  ) THEN
    RAISE NOTICE '✓ FEAT-GH-009-F: All enrollment-dependent policies created successfully';
    RAISE NOTICE '  → gh_programs: Enrolled users can view their programs';
    RAISE NOTICE '  → gh_program_phases: Users can view phases of accessible programs';
    RAISE NOTICE '  → gh_program_lessons: Users can view lessons of accessible phases';
    RAISE NOTICE '  → gh_lesson_tactics: Users can view tactics of accessible lessons';
    RAISE NOTICE '  → Helper functions: is_phase_unlocked, is_lesson_unlocked, etc.';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-F: One or more policies FAILED to create';
  END IF;
END $$;
