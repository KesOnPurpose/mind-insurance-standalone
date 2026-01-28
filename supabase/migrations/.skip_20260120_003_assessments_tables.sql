-- ============================================================================
-- FEAT-GH-004-C: Create gh_lesson_assessments and gh_user_assessment_attempts tables
-- ============================================================================
-- Purpose: Assessment definitions and user attempt tracking for completion gates
-- Assessments can be multiple-choice, short answer, or comprehension checks
-- ============================================================================

-- 1. CREATE LESSON ASSESSMENTS TABLE (Assessment Definitions)
CREATE TABLE IF NOT EXISTS public.gh_lesson_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Assessment identification
  assessment_id TEXT NOT NULL UNIQUE,  -- e.g., 'ASM-T001-01'
  tactic_id TEXT NOT NULL,             -- References gh_tactic_instructions.tactic_id

  -- Assessment content
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Assessment type and structure
  assessment_type TEXT NOT NULL CHECK (assessment_type IN (
    'multiple_choice',     -- Standard quiz with options
    'true_false',          -- True/False questions
    'short_answer',        -- Free-form short response
    'comprehension_check', -- Simple "I understand" confirmation
    'action_verification'  -- Verify they completed an action
  )),

  -- Questions stored as JSON array
  -- Each question: { question_text, options: [], correct_answer, explanation, points }
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Passing criteria
  passing_score DECIMAL(5,2) NOT NULL DEFAULT 70,  -- Percentage required to pass
  max_attempts INTEGER DEFAULT NULL,  -- NULL = unlimited attempts
  time_limit_minutes INTEGER DEFAULT NULL,  -- NULL = no time limit

  -- Display settings
  randomize_questions BOOLEAN DEFAULT FALSE,
  randomize_options BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,  -- After submission
  show_explanation BOOLEAN DEFAULT TRUE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_required_for_completion BOOLEAN DEFAULT TRUE,  -- Part of completion gate

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. CREATE USER ASSESSMENT ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.gh_user_assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL REFERENCES gh_lesson_assessments(assessment_id) ON DELETE CASCADE,

  -- Attempt tracking
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number > 0),

  -- Answers and scoring
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,  -- User's submitted answers
  score DECIMAL(5,2),                          -- Percentage score (0-100)
  points_earned INTEGER DEFAULT 0,
  points_possible INTEGER DEFAULT 0,

  -- Result
  passed BOOLEAN DEFAULT FALSE,
  meets_completion_threshold BOOLEAN DEFAULT FALSE,  -- For completion gate

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',   -- Currently taking
    'submitted',     -- Completed and submitted
    'abandoned',     -- Started but not finished
    'invalidated'    -- Marked as invalid by admin
  )),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one attempt per user per assessment per attempt number
  CONSTRAINT gh_user_assessment_attempts_unique UNIQUE(user_id, assessment_id, attempt_number)
);

-- 3. CREATE INDEXES FOR LESSON ASSESSMENTS
CREATE INDEX IF NOT EXISTS idx_gh_lesson_assessments_tactic
  ON public.gh_lesson_assessments(tactic_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_assessments_active
  ON public.gh_lesson_assessments(is_active, tactic_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gh_lesson_assessments_required
  ON public.gh_lesson_assessments(tactic_id)
  WHERE is_active = true AND is_required_for_completion = true;

-- 4. CREATE INDEXES FOR ASSESSMENT ATTEMPTS
CREATE INDEX IF NOT EXISTS idx_gh_user_assessment_attempts_user
  ON public.gh_user_assessment_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_user_assessment_attempts_assessment
  ON public.gh_user_assessment_attempts(assessment_id);

CREATE INDEX IF NOT EXISTS idx_gh_user_assessment_attempts_user_assessment
  ON public.gh_user_assessment_attempts(user_id, assessment_id);

CREATE INDEX IF NOT EXISTS idx_gh_user_assessment_attempts_passed
  ON public.gh_user_assessment_attempts(user_id, assessment_id, passed)
  WHERE passed = true;

CREATE INDEX IF NOT EXISTS idx_gh_user_assessment_attempts_recent
  ON public.gh_user_assessment_attempts(user_id, created_at DESC);

-- 5. ENABLE RLS
ALTER TABLE public.gh_lesson_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gh_user_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR LESSON ASSESSMENTS
-- Anyone authenticated can view active assessments
CREATE POLICY "Authenticated users can view active assessments"
  ON public.gh_lesson_assessments FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
  ON public.gh_lesson_assessments FOR SELECT
  USING ((SELECT public.is_admin()));

-- Super admins can manage assessments
CREATE POLICY "Super admins can insert assessments"
  ON public.gh_lesson_assessments FOR INSERT
  WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Super admins can update assessments"
  ON public.gh_lesson_assessments FOR UPDATE
  USING ((SELECT public.is_super_admin()));

CREATE POLICY "Super admins can delete assessments"
  ON public.gh_lesson_assessments FOR DELETE
  USING ((SELECT public.is_super_admin()));

-- 7. RLS POLICIES FOR ASSESSMENT ATTEMPTS
-- Users can view their own attempts
CREATE POLICY "Users can view own assessment attempts"
  ON public.gh_user_assessment_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own attempts
CREATE POLICY "Users can insert own assessment attempts"
  ON public.gh_user_assessment_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempts
CREATE POLICY "Users can update own assessment attempts"
  ON public.gh_user_assessment_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all attempts (for analytics)
CREATE POLICY "Admins can view all assessment attempts"
  ON public.gh_user_assessment_attempts FOR SELECT
  USING ((SELECT public.is_admin()));

-- 8. CREATE UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_gh_lesson_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_lesson_assessments
  ON public.gh_lesson_assessments;

CREATE TRIGGER trigger_update_gh_lesson_assessments
  BEFORE UPDATE ON public.gh_lesson_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_lesson_assessments_updated_at();

-- Update trigger for attempts
CREATE OR REPLACE FUNCTION update_gh_user_assessment_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Calculate time taken when submitted
  IF NEW.status = 'submitted' AND OLD.status = 'in_progress' THEN
    NEW.submitted_at = NOW();
    NEW.time_taken_seconds = EXTRACT(EPOCH FROM (NOW() - NEW.started_at))::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_user_assessment_attempts
  ON public.gh_user_assessment_attempts;

CREATE TRIGGER trigger_update_gh_user_assessment_attempts
  BEFORE UPDATE ON public.gh_user_assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_user_assessment_attempts_updated_at();

-- 9. HELPER FUNCTION: Get best attempt for user/assessment
CREATE OR REPLACE FUNCTION public.get_best_assessment_attempt(
  p_user_id UUID,
  p_assessment_id TEXT
)
RETURNS TABLE (
  attempt_id UUID,
  score DECIMAL(5,2),
  passed BOOLEAN,
  attempt_number INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.score,
    a.passed,
    a.attempt_number
  FROM gh_user_assessment_attempts a
  WHERE a.user_id = p_user_id
    AND a.assessment_id = p_assessment_id
    AND a.status = 'submitted'
  ORDER BY a.score DESC NULLS LAST, a.attempt_number DESC
  LIMIT 1;
END;
$$;

-- 10. ADD COMMENTS
COMMENT ON TABLE public.gh_lesson_assessments IS
  'Assessment definitions for lesson completion gates. Supports multiple question types and configurable passing criteria.';

COMMENT ON TABLE public.gh_user_assessment_attempts IS
  'User assessment attempt history. Tracks answers, scores, and completion status.';

COMMENT ON COLUMN public.gh_lesson_assessments.questions IS
  'JSON array of questions. Each: { question_text, options: [], correct_answer, explanation, points }';

COMMENT ON COLUMN public.gh_user_assessment_attempts.meets_completion_threshold IS
  'True when this attempt satisfies the completion gate requirement.';

-- 11. VERIFICATION QUERY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_lesson_assessments' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_assessment_attempts' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-004-C: Assessment tables created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-C: Assessment tables creation FAILED';
  END IF;
END $$;
