-- ============================================================================
-- FIX: Add missing columns to gh_programs table
-- ============================================================================
-- Purpose: Add total_phases, total_lessons, estimated_duration_hours columns
-- that the usePrograms hook expects but don't exist in the table
-- ============================================================================

-- 1. Add missing columns (idempotent - use IF NOT EXISTS pattern)

DO $$
BEGIN
  -- Add total_phases column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_programs'
    AND column_name = 'total_phases'
  ) THEN
    ALTER TABLE public.gh_programs ADD COLUMN total_phases INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added total_phases column';
  ELSE
    RAISE NOTICE '  total_phases column already exists';
  END IF;

  -- Add total_lessons column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_programs'
    AND column_name = 'total_lessons'
  ) THEN
    ALTER TABLE public.gh_programs ADD COLUMN total_lessons INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added total_lessons column';
  ELSE
    RAISE NOTICE '  total_lessons column already exists';
  END IF;

  -- Add total_tactics column (for completeness)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_programs'
    AND column_name = 'total_tactics'
  ) THEN
    ALTER TABLE public.gh_programs ADD COLUMN total_tactics INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added total_tactics column';
  ELSE
    RAISE NOTICE '  total_tactics column already exists';
  END IF;

  -- Add estimated_duration_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_programs'
    AND column_name = 'estimated_duration_hours'
  ) THEN
    ALTER TABLE public.gh_programs ADD COLUMN estimated_duration_hours INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added estimated_duration_hours column';
  ELSE
    RAISE NOTICE '  estimated_duration_hours column already exists';
  END IF;
END $$;

-- 2. Add comments
COMMENT ON COLUMN public.gh_programs.total_phases IS
  'Denormalized count of phases in this program (updated by trigger)';

COMMENT ON COLUMN public.gh_programs.total_lessons IS
  'Denormalized count of lessons across all phases (updated by trigger)';

COMMENT ON COLUMN public.gh_programs.total_tactics IS
  'Denormalized count of tactics across all lessons (updated by trigger)';

COMMENT ON COLUMN public.gh_programs.estimated_duration_hours IS
  'Total estimated duration in hours (for display purposes)';

-- 3. Create function to update program totals when phases/lessons change
CREATE OR REPLACE FUNCTION update_program_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_program_id UUID;
  v_total_phases INTEGER;
  v_total_lessons INTEGER;
  v_total_tactics INTEGER;
  v_total_duration_minutes INTEGER;
BEGIN
  -- Determine which program to update
  IF TG_TABLE_NAME = 'gh_program_phases' THEN
    v_program_id := COALESCE(NEW.program_id, OLD.program_id);
  ELSIF TG_TABLE_NAME = 'gh_program_lessons' THEN
    -- Get program_id via phase
    SELECT p.program_id INTO v_program_id
    FROM public.gh_program_phases p
    WHERE p.id = COALESCE(NEW.phase_id, OLD.phase_id);
  ELSIF TG_TABLE_NAME = 'gh_lesson_tactics' THEN
    -- Get program_id via lesson -> phase
    SELECT p.program_id INTO v_program_id
    FROM public.gh_program_phases p
    JOIN public.gh_program_lessons l ON l.phase_id = p.id
    WHERE l.id = COALESCE(NEW.lesson_id, OLD.lesson_id);
  END IF;

  -- Calculate totals
  IF v_program_id IS NOT NULL THEN
    -- Count phases
    SELECT COUNT(*) INTO v_total_phases
    FROM public.gh_program_phases
    WHERE program_id = v_program_id AND status = 'published';

    -- Count lessons
    SELECT COUNT(*) INTO v_total_lessons
    FROM public.gh_program_lessons l
    JOIN public.gh_program_phases p ON l.phase_id = p.id
    WHERE p.program_id = v_program_id AND l.status = 'published';

    -- Count tactics
    SELECT COUNT(*) INTO v_total_tactics
    FROM public.gh_lesson_tactics t
    JOIN public.gh_program_lessons l ON t.lesson_id = l.id
    JOIN public.gh_program_phases p ON l.phase_id = p.id
    WHERE p.program_id = v_program_id;

    -- Sum duration
    SELECT COALESCE(SUM(l.estimated_duration_minutes), 0) INTO v_total_duration_minutes
    FROM public.gh_program_lessons l
    JOIN public.gh_program_phases p ON l.phase_id = p.id
    WHERE p.program_id = v_program_id AND l.status = 'published';

    -- Update program
    UPDATE public.gh_programs
    SET
      total_phases = v_total_phases,
      total_lessons = v_total_lessons,
      total_tactics = v_total_tactics,
      estimated_duration_hours = CEIL(v_total_duration_minutes::NUMERIC / 60)::INTEGER,
      updated_at = NOW()
    WHERE id = v_program_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers to update totals (idempotent)
DROP TRIGGER IF EXISTS trigger_update_program_totals_on_phase ON public.gh_program_phases;
CREATE TRIGGER trigger_update_program_totals_on_phase
  AFTER INSERT OR UPDATE OR DELETE ON public.gh_program_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_program_totals();

DROP TRIGGER IF EXISTS trigger_update_program_totals_on_lesson ON public.gh_program_lessons;
CREATE TRIGGER trigger_update_program_totals_on_lesson
  AFTER INSERT OR UPDATE OR DELETE ON public.gh_program_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_program_totals();

DROP TRIGGER IF EXISTS trigger_update_program_totals_on_tactic ON public.gh_lesson_tactics;
CREATE TRIGGER trigger_update_program_totals_on_tactic
  AFTER INSERT OR UPDATE OR DELETE ON public.gh_lesson_tactics
  FOR EACH ROW
  EXECUTE FUNCTION update_program_totals();

-- 5. Initialize totals for existing programs
DO $$
DECLARE
  r RECORD;
  v_total_phases INTEGER;
  v_total_lessons INTEGER;
  v_total_tactics INTEGER;
  v_total_duration_minutes INTEGER;
BEGIN
  FOR r IN SELECT id FROM public.gh_programs LOOP
    -- Count phases
    SELECT COUNT(*) INTO v_total_phases
    FROM public.gh_program_phases
    WHERE program_id = r.id AND status = 'published';

    -- Count lessons
    SELECT COUNT(*) INTO v_total_lessons
    FROM public.gh_program_lessons l
    JOIN public.gh_program_phases p ON l.phase_id = p.id
    WHERE p.program_id = r.id AND l.status = 'published';

    -- Count tactics
    SELECT COUNT(*) INTO v_total_tactics
    FROM public.gh_lesson_tactics t
    JOIN public.gh_program_lessons l ON t.lesson_id = l.id
    JOIN public.gh_program_phases p ON l.phase_id = p.id
    WHERE p.program_id = r.id;

    -- Sum duration
    SELECT COALESCE(SUM(l.estimated_duration_minutes), 0) INTO v_total_duration_minutes
    FROM public.gh_program_lessons l
    JOIN public.gh_program_phases p ON l.phase_id = p.id
    WHERE p.program_id = r.id AND l.status = 'published';

    -- Update
    UPDATE public.gh_programs
    SET
      total_phases = v_total_phases,
      total_lessons = v_total_lessons,
      total_tactics = v_total_tactics,
      estimated_duration_hours = CEIL(v_total_duration_minutes::NUMERIC / 60)::INTEGER
    WHERE id = r.id;

    RAISE NOTICE 'Updated program %: % phases, % lessons, % tactics',
      r.id, v_total_phases, v_total_lessons, v_total_tactics;
  END LOOP;
END $$;

-- 6. Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'gh_programs'
    AND column_name IN ('total_phases', 'total_lessons', 'estimated_duration_hours')
  ) THEN
    RAISE NOTICE '✓ SUCCESS: Missing columns added to gh_programs table';
    RAISE NOTICE '  → total_phases, total_lessons, total_tactics, estimated_duration_hours';
    RAISE NOTICE '  → Triggers created to keep totals updated';
  ELSE
    RAISE EXCEPTION '✗ FAILED: Columns not added properly';
  END IF;
END $$;
