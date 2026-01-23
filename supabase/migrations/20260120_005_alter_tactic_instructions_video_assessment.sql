-- ============================================================================
-- FEAT-GH-004-E: Add video and assessment columns to gh_tactic_instructions
-- ============================================================================
-- Purpose: Enable completion gates by adding video and assessment metadata
-- These columns determine what completion requirements exist for each tactic
-- ============================================================================

-- 1. ADD VIDEO-RELATED COLUMNS
-- Video URL for the lesson content
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Video provider for player selection
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS video_provider TEXT;

-- Add check constraint for video_provider (do this separately to handle IF NOT EXISTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_video_provider'
  ) THEN
    ALTER TABLE public.gh_tactic_instructions
    ADD CONSTRAINT check_video_provider CHECK (
      video_provider IS NULL OR video_provider IN ('vimeo', 'youtube', 'wistia', 'custom')
    );
  END IF;
END $$;

-- Video duration in seconds
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER;

-- Add check constraint for duration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_video_duration'
  ) THEN
    ALTER TABLE public.gh_tactic_instructions
    ADD CONSTRAINT check_video_duration CHECK (
      video_duration_seconds IS NULL OR video_duration_seconds > 0
    );
  END IF;
END $$;

-- Completion threshold percentage (default 90%)
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS video_completion_threshold DECIMAL(5,2) DEFAULT 90;

-- Video thumbnail URL for UI display
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- 2. ADD ASSESSMENT-RELATED COLUMNS
-- Whether this tactic has an associated assessment
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS has_assessment BOOLEAN DEFAULT FALSE;

-- Whether assessment must be passed for tactic completion
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS assessment_required_for_completion BOOLEAN DEFAULT FALSE;

-- Assessment ID reference (links to gh_lesson_assessments.assessment_id)
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS primary_assessment_id TEXT;

-- 3. ADD COMPLETION GATE COLUMNS
-- Master switch for completion gates on this tactic
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS completion_gate_enabled BOOLEAN DEFAULT FALSE;

-- Completion gate configuration (flexible JSON)
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS completion_gate_config JSONB DEFAULT '{
  "require_video": false,
  "require_assessment": false,
  "video_threshold": 90,
  "assessment_threshold": 70,
  "allow_skip_with_note": false,
  "max_assessment_attempts": null
}'::jsonb;

-- 4. ADD DISPLAY/UX COLUMNS
-- Display order within a lesson/phase
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Whether to show estimated completion time prominently
ALTER TABLE public.gh_tactic_instructions
ADD COLUMN IF NOT EXISTS show_estimated_time BOOLEAN DEFAULT TRUE;

-- 5. CREATE INDEXES FOR NEW COLUMNS
CREATE INDEX IF NOT EXISTS idx_gh_tactic_instructions_video
  ON public.gh_tactic_instructions(video_url)
  WHERE video_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gh_tactic_instructions_assessment
  ON public.gh_tactic_instructions(has_assessment)
  WHERE has_assessment = true;

CREATE INDEX IF NOT EXISTS idx_gh_tactic_instructions_completion_gate
  ON public.gh_tactic_instructions(completion_gate_enabled)
  WHERE completion_gate_enabled = true;

CREATE INDEX IF NOT EXISTS idx_gh_tactic_instructions_display_order
  ON public.gh_tactic_instructions(week_assignment, display_order);

-- 6. ADD COMMENTS
COMMENT ON COLUMN public.gh_tactic_instructions.video_url IS
  'URL to the lesson video (Vimeo, YouTube, Wistia, or custom)';

COMMENT ON COLUMN public.gh_tactic_instructions.video_provider IS
  'Video platform: vimeo, youtube, wistia, or custom';

COMMENT ON COLUMN public.gh_tactic_instructions.video_duration_seconds IS
  'Video length in seconds (for progress calculations)';

COMMENT ON COLUMN public.gh_tactic_instructions.video_completion_threshold IS
  'Percentage of video that must be watched (default 90%)';

COMMENT ON COLUMN public.gh_tactic_instructions.has_assessment IS
  'Whether this tactic has an associated assessment quiz';

COMMENT ON COLUMN public.gh_tactic_instructions.assessment_required_for_completion IS
  'Whether passing the assessment is required to mark tactic complete';

COMMENT ON COLUMN public.gh_tactic_instructions.primary_assessment_id IS
  'References gh_lesson_assessments.assessment_id for the main assessment';

COMMENT ON COLUMN public.gh_tactic_instructions.completion_gate_enabled IS
  'Master switch to enable/disable completion gates for this tactic';

COMMENT ON COLUMN public.gh_tactic_instructions.completion_gate_config IS
  'JSON config for gate settings: video threshold, assessment requirements, skip rules';

COMMENT ON COLUMN public.gh_tactic_instructions.display_order IS
  'Order within a lesson/phase for display purposes';

-- 7. CREATE HELPER FUNCTION: Get completion gate requirements
CREATE OR REPLACE FUNCTION public.get_tactic_completion_requirements(
  p_tactic_id TEXT
)
RETURNS TABLE (
  tactic_id TEXT,
  requires_video BOOLEAN,
  video_threshold DECIMAL(5,2),
  requires_assessment BOOLEAN,
  assessment_threshold DECIMAL(5,2),
  can_skip BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tactic_id,
    COALESCE((t.completion_gate_config->>'require_video')::BOOLEAN, FALSE) AS requires_video,
    COALESCE(t.video_completion_threshold, 90) AS video_threshold,
    COALESCE((t.completion_gate_config->>'require_assessment')::BOOLEAN, FALSE) AS requires_assessment,
    COALESCE((t.completion_gate_config->>'assessment_threshold')::DECIMAL, 70) AS assessment_threshold,
    COALESCE((t.completion_gate_config->>'allow_skip_with_note')::BOOLEAN, FALSE) AS can_skip
  FROM gh_tactic_instructions t
  WHERE t.tactic_id = p_tactic_id
    AND t.completion_gate_enabled = true;
END;
$$;

-- 8. VERIFICATION QUERY
DO $$
DECLARE
  v_video_url_exists BOOLEAN;
  v_completion_gate_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_tactic_instructions'
    AND column_name = 'video_url'
    AND table_schema = 'public'
  ) INTO v_video_url_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gh_tactic_instructions'
    AND column_name = 'completion_gate_enabled'
    AND table_schema = 'public'
  ) INTO v_completion_gate_exists;

  IF v_video_url_exists AND v_completion_gate_exists THEN
    RAISE NOTICE '✓ FEAT-GH-004-E: Video and assessment columns added to gh_tactic_instructions';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-E: Column addition FAILED';
  END IF;
END $$;
