-- ============================================================================
-- FEAT-GH-009-B: Create gh_program_phases table
-- ============================================================================
-- Purpose: Phases (modules) within a program with drip configuration
-- Phases group related lessons and can have their own unlock rules
-- ============================================================================

-- 1. CREATE PHASES TABLE
CREATE TABLE IF NOT EXISTS public.gh_program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  program_id UUID NOT NULL REFERENCES public.gh_programs(id) ON DELETE CASCADE,

  -- Phase identification
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,  -- For roadmap display

  -- Ordering
  order_index INTEGER NOT NULL,

  -- Visual elements
  icon_name TEXT,  -- Lucide icon name (e.g., 'BookOpen', 'Target')
  color_class TEXT,  -- Tailwind color class (e.g., 'bg-blue-500')
  thumbnail_url TEXT,

  -- Drip configuration (overrides program default)
  drip_model TEXT DEFAULT 'inherit' CHECK (drip_model IN (
    'inherit',   -- Use program's default_drip_model
    'immediate', -- Available immediately
    'calendar',  -- Unlock on specific date
    'relative',  -- Unlock X days after enrollment
    'progress'   -- Unlock when prerequisite phase complete
  )),

  -- Calendar-based drip
  unlock_at TIMESTAMPTZ,  -- Specific date/time to unlock

  -- Relative drip
  unlock_offset_days INTEGER,  -- Days after enrollment to unlock
  unlock_offset_hours INTEGER DEFAULT 0,  -- Hours offset (for fine-tuning)

  -- Progress-based drip
  prerequisite_phase_id UUID REFERENCES public.gh_program_phases(id),

  -- Requirements
  is_required BOOLEAN DEFAULT true,  -- Required for program completion?
  minimum_completion_percent INTEGER DEFAULT 100,  -- % of lessons needed (100 = all)

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),

  -- Metadata
  estimated_duration_minutes INTEGER,

  -- Settings (extensible)
  settings JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_unlock_offset CHECK (unlock_offset_days IS NULL OR unlock_offset_days >= 0),
  CONSTRAINT valid_completion_percent CHECK (minimum_completion_percent BETWEEN 0 AND 100),
  CONSTRAINT unique_phase_order UNIQUE (program_id, order_index)
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_gh_program_phases_program_id
  ON public.gh_program_phases(program_id);

CREATE INDEX IF NOT EXISTS idx_gh_program_phases_order
  ON public.gh_program_phases(program_id, order_index);

CREATE INDEX IF NOT EXISTS idx_gh_program_phases_status
  ON public.gh_program_phases(status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_gh_program_phases_prerequisite
  ON public.gh_program_phases(prerequisite_phase_id)
  WHERE prerequisite_phase_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gh_program_phases_drip
  ON public.gh_program_phases(drip_model, unlock_at)
  WHERE drip_model = 'calendar';

-- 3. ENABLE RLS
ALTER TABLE public.gh_program_phases ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- Users can view phases of programs they have access to
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
        -- OR user is admin/coach
        OR (SELECT public.is_admin())
        OR (SELECT public.is_coach())
      )
    )
  );

-- Admins can create phases
CREATE POLICY "Admins can insert phases"
  ON public.gh_program_phases FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- Coaches can create phases
CREATE POLICY "Coaches can insert phases"
  ON public.gh_program_phases FOR INSERT
  WITH CHECK ((SELECT public.is_coach()));

-- Admins can update phases
CREATE POLICY "Admins can update phases"
  ON public.gh_program_phases FOR UPDATE
  USING ((SELECT public.is_admin()));

-- Coaches can update phases
CREATE POLICY "Coaches can update phases"
  ON public.gh_program_phases FOR UPDATE
  USING ((SELECT public.is_coach()));

-- Only super admins can delete phases
CREATE POLICY "Super admins can delete phases"
  ON public.gh_program_phases FOR DELETE
  USING ((SELECT public.is_super_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_program_phases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_program_phases_updated_at
  ON public.gh_program_phases;

CREATE TRIGGER trigger_update_gh_program_phases_updated_at
  BEFORE UPDATE ON public.gh_program_phases
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_program_phases_updated_at();

-- 6. HELPER FUNCTION: Get effective drip model for phase
CREATE OR REPLACE FUNCTION get_phase_effective_drip_model(phase_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_drip_model TEXT;
  v_program_drip TEXT;
BEGIN
  SELECT
    ph.drip_model,
    p.default_drip_model
  INTO v_drip_model, v_program_drip
  FROM public.gh_program_phases ph
  JOIN public.gh_programs p ON p.id = ph.program_id
  WHERE ph.id = phase_id;

  IF v_drip_model = 'inherit' OR v_drip_model IS NULL THEN
    RETURN COALESCE(v_program_drip, 'progress');
  END IF;

  RETURN v_drip_model;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. HELPER FUNCTION: Check if phase is unlocked for user
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

-- 8. ADD COMMENTS
COMMENT ON TABLE public.gh_program_phases IS
  'Phases (modules) within a program. Phases group related lessons and can have their own unlock rules.';

COMMENT ON COLUMN public.gh_program_phases.drip_model IS
  'inherit = use program default, immediate = always available, calendar = specific date, relative = days after enrollment, progress = when prereq complete';

COMMENT ON COLUMN public.gh_program_phases.order_index IS
  'Display order within the program (1-based recommended)';

COMMENT ON COLUMN public.gh_program_phases.prerequisite_phase_id IS
  'For progress-based drip: which phase must be completed first';

COMMENT ON COLUMN public.gh_program_phases.minimum_completion_percent IS
  'Percentage of required lessons that must be completed for phase completion (100 = all lessons)';

COMMENT ON FUNCTION is_phase_unlocked(UUID, UUID) IS
  'Check if a phase is unlocked for a specific user based on drip configuration and progress';

-- 9. VERIFICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_program_phases' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-009-B: gh_program_phases table created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-B: gh_program_phases table creation FAILED';
  END IF;
END $$;
