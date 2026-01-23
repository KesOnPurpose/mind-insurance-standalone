-- ============================================================================
-- FEAT-GH-009-C PART 1: Create gh_program_lessons table (CORE)
-- ============================================================================
-- Purpose: Lessons within a phase with video content, completion rules
-- NOTE: Enrollment-dependent policies added in 016_add_enrollment_policies.sql
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
  assessment_id UUID,  -- Links to gh_lesson_assessments
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

-- 4. RLS POLICIES (Admin/Coach only - enrollment policy added later)

-- Admins can view all lessons
CREATE POLICY "Admins can view all lessons"
  ON public.gh_program_lessons FOR SELECT
  USING ((SELECT public.is_admin()));

-- Coaches can view all lessons
CREATE POLICY "Coaches can view all lessons"
  ON public.gh_program_lessons FOR SELECT
  USING ((SELECT public.is_coach()));

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

-- 7. ADD COMMENTS
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

-- 8. VERIFICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_program_lessons' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-009-C PART 1: gh_program_lessons table created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-C PART 1: gh_program_lessons table creation FAILED';
  END IF;
END $$;
