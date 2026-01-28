-- ============================================================================
-- FEAT-GH-009-C: Create gh_program_lessons table
-- ============================================================================
-- Purpose: Lessons within a phase with video content, completion rules, and drip overrides
-- Lessons are the core learning units that learners complete
-- ============================================================================

-- 1. CREATE LESSONS TABLE
CREATE TABLE IF NOT EXISTS public.gh_program_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  phase_id UUID NOT NULL REFERENCES public.gh_program_phases(id) ON DELETE CASCADE,

  -- Lesson identification
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,  -- For list display

  -- Ordering
  order_index INTEGER NOT NULL,

  -- Lesson type
  lesson_type TEXT DEFAULT 'video' CHECK (lesson_type IN (
    'video',      -- Video content with optional transcript
    'text',       -- Rich text/article content
    'audio',      -- Audio content (podcast style)
    'assessment', -- Quiz/assessment only
    'resource',   -- Document/resource download
    'mixed'       -- Combination of content types
  )),

  -- Required for phase completion?
  is_required BOOLEAN DEFAULT true,

  -- Video content (if lesson_type includes video)
  video_url TEXT,
  video_provider TEXT CHECK (video_provider IN ('vimeo', 'youtube', 'wistia', 'bunny', 'custom')),
  video_duration_seconds INTEGER,
  video_thumbnail_url TEXT,
  video_transcript TEXT,  -- Full transcript for search/accessibility

  -- Rich text content (if lesson_type includes text)
  content_html TEXT,

  -- Audio content (if lesson_type includes audio)
  audio_url TEXT,
  audio_duration_seconds INTEGER,

  -- Completion rules (THE DIFFERENTIATOR!)
  completion_gate_enabled BOOLEAN DEFAULT true,
  required_watch_percent INTEGER DEFAULT 90,  -- Video must be X% watched
  requires_tactics_complete BOOLEAN DEFAULT true,  -- All required tactics must be checked
  requires_assessment_pass BOOLEAN DEFAULT false,  -- Assessment must be passed

  -- Assessment link (if has assessment)
  has_assessment BOOLEAN DEFAULT false,
  assessment_id UUID,  -- Links to gh_lesson_assessments (created in FEAT-GH-004)
  assessment_passing_score INTEGER DEFAULT 70,  -- Minimum % to pass

  -- Drip override (if different from phase)
  drip_override JSONB,  -- {model, unlock_at, offset_days, prerequisite_lesson_id}

  -- Resources/attachments
  resources JSONB DEFAULT '[]'::JSONB,  -- [{title, url, type, size_bytes}]

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),

  -- Metadata
  estimated_duration_minutes INTEGER,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],

  -- Settings (extensible)
  settings JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_watch_percent CHECK (required_watch_percent BETWEEN 0 AND 100),
  CONSTRAINT valid_assessment_score CHECK (assessment_passing_score BETWEEN 0 AND 100),
  CONSTRAINT unique_lesson_order UNIQUE (phase_id, order_index)
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_phase_id
  ON public.gh_program_lessons(phase_id);

CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_order
  ON public.gh_program_lessons(phase_id, order_index);

CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_status
  ON public.gh_program_lessons(status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_type
  ON public.gh_program_lessons(lesson_type);

CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_assessment
  ON public.gh_program_lessons(assessment_id)
  WHERE has_assessment = true;

CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_tags
  ON public.gh_program_lessons USING GIN(tags);

-- Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_gh_program_lessons_search
  ON public.gh_program_lessons USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
  );

-- 3. ENABLE RLS
ALTER TABLE public.gh_program_lessons ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- Users can view lessons of phases they have access to
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
        -- OR user is admin/coach
        OR (SELECT public.is_admin())
        OR (SELECT public.is_coach())
      )
    )
  );

-- Admins can create lessons
CREATE POLICY "Admins can insert lessons"
  ON public.gh_program_lessons FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- Coaches can create lessons
CREATE POLICY "Coaches can insert lessons"
  ON public.gh_program_lessons FOR INSERT
  WITH CHECK ((SELECT public.is_coach()));

-- Admins can update lessons
CREATE POLICY "Admins can update lessons"
  ON public.gh_program_lessons FOR UPDATE
  USING ((SELECT public.is_admin()));

-- Coaches can update lessons
CREATE POLICY "Coaches can update lessons"
  ON public.gh_program_lessons FOR UPDATE
  USING ((SELECT public.is_coach()));

-- Only super admins can delete lessons
CREATE POLICY "Super admins can delete lessons"
  ON public.gh_program_lessons FOR DELETE
  USING ((SELECT public.is_super_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_program_lessons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_program_lessons_updated_at
  ON public.gh_program_lessons;

CREATE TRIGGER trigger_update_gh_program_lessons_updated_at
  BEFORE UPDATE ON public.gh_program_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_program_lessons_updated_at();

-- 6. AUTO-CALCULATE DURATION TRIGGER
CREATE OR REPLACE FUNCTION calculate_lesson_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate estimated duration from video/audio if not set
  IF NEW.estimated_duration_minutes IS NULL THEN
    IF NEW.video_duration_seconds IS NOT NULL THEN
      NEW.estimated_duration_minutes := CEIL(NEW.video_duration_seconds / 60.0);
    ELSIF NEW.audio_duration_seconds IS NOT NULL THEN
      NEW.estimated_duration_minutes := CEIL(NEW.audio_duration_seconds / 60.0);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_lesson_duration
  ON public.gh_program_lessons;

CREATE TRIGGER trigger_calculate_lesson_duration
  BEFORE INSERT OR UPDATE ON public.gh_program_lessons
  FOR EACH ROW
  EXECUTE FUNCTION calculate_lesson_duration();

-- 7. HELPER FUNCTION: Get lesson completion requirements
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

-- 8. HELPER FUNCTION: Check if lesson is unlocked for user
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
      -- Add more drip override cases as needed
    END CASE;
  END IF;

  -- Default: If phase is unlocked, first lesson is unlocked
  -- Subsequent lessons require previous lesson completion (if not immediate drip)
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

-- 9. ADD COMMENTS
COMMENT ON TABLE public.gh_program_lessons IS
  'Lessons within a phase. The core learning units that learners complete.';

COMMENT ON COLUMN public.gh_program_lessons.lesson_type IS
  'Type of content: video, text, audio, assessment, resource, or mixed';

COMMENT ON COLUMN public.gh_program_lessons.completion_gate_enabled IS
  'If true, learner must meet all completion requirements before marking complete';

COMMENT ON COLUMN public.gh_program_lessons.required_watch_percent IS
  'Percentage of video that must be watched (0-100, default 90)';

COMMENT ON COLUMN public.gh_program_lessons.requires_tactics_complete IS
  'If true, all required tactics must be checked before completion (OUR DIFFERENTIATOR!)';

COMMENT ON COLUMN public.gh_program_lessons.drip_override IS
  'JSON override for lesson-specific drip rules: {model, unlock_at, offset_days, prerequisite_lesson_id}';

COMMENT ON COLUMN public.gh_program_lessons.resources IS
  'JSON array of downloadable resources: [{title, url, type, size_bytes}]';

COMMENT ON FUNCTION get_lesson_completion_requirements(UUID) IS
  'Get all completion requirements for a lesson including video, tactics, and assessment rules';

COMMENT ON FUNCTION is_lesson_unlocked(UUID, UUID) IS
  'Check if a lesson is unlocked for a specific user based on phase drip and lesson-specific overrides';

-- 10. VERIFICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_program_lessons' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-009-C: gh_program_lessons table created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-C: gh_program_lessons table creation FAILED';
  END IF;
END $$;
