-- ============================================================================
-- FEAT-GH-009-D PART 1: Create gh_lesson_tactics table (CORE)
-- ============================================================================
-- Purpose: Tactics (action items) within a lesson - OUR KEY DIFFERENTIATOR!
-- NOTE: Enrollment-dependent policies added in 016_add_enrollment_policies.sql
-- ============================================================================

-- 1. CREATE LESSON TACTICS TABLE
CREATE TABLE IF NOT EXISTS public.gh_lesson_tactics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent relationship
  lesson_id UUID NOT NULL REFERENCES public.gh_program_lessons(id) ON DELETE CASCADE,

  -- Tactic identification
  label TEXT NOT NULL,  -- The action item text
  description TEXT,  -- Detailed instructions/guidance
  short_description TEXT,  -- For list display

  -- Ordering
  order_index INTEGER NOT NULL,

  -- Required for lesson completion?
  is_required BOOLEAN DEFAULT true,

  -- Tactic type (for different UI/validation)
  tactic_type TEXT DEFAULT 'checkbox' CHECK (tactic_type IN (
    'checkbox',      -- Simple check off (default)
    'text_input',    -- Requires text response
    'file_upload',   -- Requires file attachment
    'link_submit',   -- Requires URL submission
    'reflection'     -- Guided reflection prompt
  )),

  -- For text_input/reflection types
  prompt_text TEXT,  -- The question/prompt
  min_characters INTEGER,  -- Minimum response length (if text)
  max_characters INTEGER,  -- Maximum response length (if text)

  -- Reference/help
  reference_url TEXT,  -- Link to resource/template
  reference_label TEXT,  -- Display text for link
  help_text TEXT,  -- Tooltip/help content

  -- Visual elements
  icon_name TEXT,  -- Lucide icon name

  -- Nette AI integration (THE $100M FEATURE)
  ai_help_enabled BOOLEAN DEFAULT true,  -- Show "Help me" button?
  ai_context TEXT,  -- Additional context for Nette AI to help with this tactic

  -- Estimated time
  estimated_minutes INTEGER,

  -- Settings (extensible)
  settings JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_min_chars CHECK (min_characters IS NULL OR min_characters >= 0),
  CONSTRAINT valid_max_chars CHECK (max_characters IS NULL OR max_characters > COALESCE(min_characters, 0)),
  CONSTRAINT unique_tactic_order UNIQUE (lesson_id, order_index)
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_gh_lesson_tactics_lesson_id
  ON public.gh_lesson_tactics(lesson_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_tactics_order
  ON public.gh_lesson_tactics(lesson_id, order_index);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_tactics_required
  ON public.gh_lesson_tactics(lesson_id, is_required)
  WHERE is_required = true;

CREATE INDEX IF NOT EXISTS idx_gh_lesson_tactics_type
  ON public.gh_lesson_tactics(tactic_type);

-- Full-text search on label and description
CREATE INDEX IF NOT EXISTS idx_gh_lesson_tactics_search
  ON public.gh_lesson_tactics USING GIN(
    to_tsvector('english', COALESCE(label, '') || ' ' || COALESCE(description, ''))
  );

-- 3. ENABLE RLS
ALTER TABLE public.gh_lesson_tactics ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (Admin/Coach only - enrollment policy added later)

-- Admins can view all tactics
CREATE POLICY "Admins can view all tactics"
  ON public.gh_lesson_tactics FOR SELECT
  USING ((SELECT public.is_admin()));

-- Coaches can view all tactics
CREATE POLICY "Coaches can view all tactics"
  ON public.gh_lesson_tactics FOR SELECT
  USING ((SELECT public.is_coach()));

-- Admins can create tactics
CREATE POLICY "Admins can insert tactics"
  ON public.gh_lesson_tactics FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- Coaches can create tactics
CREATE POLICY "Coaches can insert tactics"
  ON public.gh_lesson_tactics FOR INSERT
  WITH CHECK ((SELECT public.is_coach()));

-- Admins can update tactics
CREATE POLICY "Admins can update tactics"
  ON public.gh_lesson_tactics FOR UPDATE
  USING ((SELECT public.is_admin()));

-- Coaches can update tactics
CREATE POLICY "Coaches can update tactics"
  ON public.gh_lesson_tactics FOR UPDATE
  USING ((SELECT public.is_coach()));

-- Only super admins can delete tactics
CREATE POLICY "Super admins can delete tactics"
  ON public.gh_lesson_tactics FOR DELETE
  USING ((SELECT public.is_super_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_lesson_tactics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_lesson_tactics_updated_at
  ON public.gh_lesson_tactics;

CREATE TRIGGER trigger_update_gh_lesson_tactics_updated_at
  BEFORE UPDATE ON public.gh_lesson_tactics
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_lesson_tactics_updated_at();

-- 6. ADD COMMENTS
COMMENT ON TABLE public.gh_lesson_tactics IS
  'Tactics (action items) within a lesson - OUR KEY DIFFERENTIATOR! Learners must complete these to progress.';

COMMENT ON COLUMN public.gh_lesson_tactics.label IS
  'The action item text that the learner needs to complete';

COMMENT ON COLUMN public.gh_lesson_tactics.is_required IS
  'If true, this tactic must be completed for lesson completion';

COMMENT ON COLUMN public.gh_lesson_tactics.tactic_type IS
  'Type of tactic: checkbox (simple), text_input (requires response), file_upload, link_submit, reflection';

COMMENT ON COLUMN public.gh_lesson_tactics.ai_help_enabled IS
  'If true, shows "Help me with this" button that connects to Nette AI';

COMMENT ON COLUMN public.gh_lesson_tactics.ai_context IS
  'Additional context provided to Nette AI when helping with this specific tactic';

-- 7. VERIFICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_lesson_tactics' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-009-D PART 1: gh_lesson_tactics table created successfully';
    RAISE NOTICE '  → This is OUR KEY DIFFERENTIATOR: Action items that must be completed!';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-D PART 1: gh_lesson_tactics table creation FAILED';
  END IF;
END $$;
