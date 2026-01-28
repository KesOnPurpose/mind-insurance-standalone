-- ============================================================================
-- FEAT-GH-009-E STEP 3: Create Progress Tracking Tables
-- ============================================================================
-- Purpose: Create phase, lesson, and tactic progress tables (run AFTER STEP 2)
-- ============================================================================

-- ============================================================================
-- PART 1: User Phase Progress
-- ============================================================================

DROP TABLE IF EXISTS public.gh_user_phase_progress CASCADE;

CREATE TABLE public.gh_user_phase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.gh_program_phases(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'locked' CHECK (status IN (
    'locked', 'not_started', 'in_progress', 'completed'
  )),

  completed_lessons INTEGER DEFAULT 0,
  total_required_lessons INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,

  unlocked_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_phase UNIQUE (user_id, phase_id)
);

CREATE INDEX idx_gh_phase_progress_user_id ON public.gh_user_phase_progress(user_id);
CREATE INDEX idx_gh_phase_progress_phase_id ON public.gh_user_phase_progress(phase_id);
CREATE INDEX idx_gh_phase_progress_status ON public.gh_user_phase_progress(status);
CREATE INDEX idx_gh_phase_progress_user_status ON public.gh_user_phase_progress(user_id, status);

ALTER TABLE public.gh_user_phase_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own phase progress" ON public.gh_user_phase_progress;
DROP POLICY IF EXISTS "Admins can view all phase progress" ON public.gh_user_phase_progress;
DROP POLICY IF EXISTS "System can insert phase progress" ON public.gh_user_phase_progress;
DROP POLICY IF EXISTS "System can update phase progress" ON public.gh_user_phase_progress;

CREATE POLICY "Users can view own phase progress"
  ON public.gh_user_phase_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all phase progress"
  ON public.gh_user_phase_progress FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "System can insert phase progress"
  ON public.gh_user_phase_progress FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "System can update phase progress"
  ON public.gh_user_phase_progress FOR UPDATE
  USING (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- ============================================================================
-- PART 2: User Lesson Progress
-- ============================================================================

DROP TABLE IF EXISTS public.gh_user_lesson_progress CASCADE;

CREATE TABLE public.gh_user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.gh_program_lessons(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'locked' CHECK (status IN (
    'locked', 'not_started', 'in_progress', 'completed', 'stuck'
  )),

  -- Video progress
  video_watched_percent INTEGER DEFAULT 0,
  video_last_position_ms INTEGER DEFAULT 0,
  video_completed_at TIMESTAMPTZ,
  video_watch_sessions INTEGER DEFAULT 0,
  video_total_watch_seconds INTEGER DEFAULT 0,

  -- Tactics progress
  tactics_completed_count INTEGER DEFAULT 0,
  tactics_required_count INTEGER DEFAULT 0,
  tactics_completion_percent INTEGER DEFAULT 0,

  -- Assessment progress
  assessment_status TEXT CHECK (assessment_status IN (
    'not_started', 'in_progress', 'passed', 'failed'
  )),
  assessment_score INTEGER,
  assessment_attempts INTEGER DEFAULT 0,
  assessment_best_score INTEGER,
  assessment_last_attempt_at TIMESTAMPTZ,

  -- Completion gates
  video_gate_met BOOLEAN DEFAULT false,
  tactics_gate_met BOOLEAN DEFAULT false,
  assessment_gate_met BOOLEAN DEFAULT false,
  all_gates_met BOOLEAN DEFAULT false,

  -- Stuck detection
  stuck_detected_at TIMESTAMPTZ,
  stuck_reason TEXT,
  stuck_nudge_count INTEGER DEFAULT 0,
  stuck_last_nudge_at TIMESTAMPTZ,

  -- Timestamps
  unlocked_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Nette AI
  nette_help_count INTEGER DEFAULT 0,
  nette_last_interaction_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id),
  CONSTRAINT valid_video_percent CHECK (video_watched_percent BETWEEN 0 AND 100),
  CONSTRAINT valid_tactics_percent CHECK (tactics_completion_percent BETWEEN 0 AND 100)
);

CREATE INDEX idx_gh_lesson_progress_user_id ON public.gh_user_lesson_progress(user_id);
CREATE INDEX idx_gh_lesson_progress_lesson_id ON public.gh_user_lesson_progress(lesson_id);
CREATE INDEX idx_gh_lesson_progress_status ON public.gh_user_lesson_progress(status);
CREATE INDEX idx_gh_lesson_progress_user_status ON public.gh_user_lesson_progress(user_id, status);
CREATE INDEX idx_gh_lesson_progress_stuck ON public.gh_user_lesson_progress(status, stuck_detected_at) WHERE status = 'stuck';
CREATE INDEX idx_gh_lesson_progress_last_activity ON public.gh_user_lesson_progress(last_activity_at DESC);

ALTER TABLE public.gh_user_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lesson progress" ON public.gh_user_lesson_progress;
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.gh_user_lesson_progress;
DROP POLICY IF EXISTS "System can insert lesson progress" ON public.gh_user_lesson_progress;
DROP POLICY IF EXISTS "System can update lesson progress" ON public.gh_user_lesson_progress;

CREATE POLICY "Users can view own lesson progress"
  ON public.gh_user_lesson_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all lesson progress"
  ON public.gh_user_lesson_progress FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "System can insert lesson progress"
  ON public.gh_user_lesson_progress FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "System can update lesson progress"
  ON public.gh_user_lesson_progress FOR UPDATE
  USING (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- ============================================================================
-- PART 3: User Tactic Completions
-- ============================================================================

DROP TABLE IF EXISTS public.gh_user_tactic_completions CASCADE;

CREATE TABLE public.gh_user_tactic_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id UUID NOT NULL REFERENCES public.gh_lesson_tactics(id) ON DELETE CASCADE,

  completed_at TIMESTAMPTZ DEFAULT NOW(),
  response_data JSONB DEFAULT '{}'::JSONB,

  nette_helped BOOLEAN DEFAULT false,
  nette_conversation_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_tactic UNIQUE (user_id, tactic_id)
);

CREATE INDEX idx_gh_tactic_completions_user_id ON public.gh_user_tactic_completions(user_id);
CREATE INDEX idx_gh_tactic_completions_tactic_id ON public.gh_user_tactic_completions(tactic_id);
CREATE INDEX idx_gh_tactic_completions_completed_at ON public.gh_user_tactic_completions(completed_at DESC);

ALTER TABLE public.gh_user_tactic_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tactic completions" ON public.gh_user_tactic_completions;
DROP POLICY IF EXISTS "Admins can view all tactic completions" ON public.gh_user_tactic_completions;
DROP POLICY IF EXISTS "Users can insert own tactic completions" ON public.gh_user_tactic_completions;
DROP POLICY IF EXISTS "Users can delete own tactic completions" ON public.gh_user_tactic_completions;

CREATE POLICY "Users can view own tactic completions"
  ON public.gh_user_tactic_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tactic completions"
  ON public.gh_user_tactic_completions FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

CREATE POLICY "Users can insert own tactic completions"
  ON public.gh_user_tactic_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tactic completions"
  ON public.gh_user_tactic_completions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 4: Update Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_gh_phase_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_phase_progress_updated_at ON public.gh_user_phase_progress;
CREATE TRIGGER trigger_update_gh_phase_progress_updated_at
  BEFORE UPDATE ON public.gh_user_phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_phase_progress_updated_at();

CREATE OR REPLACE FUNCTION update_gh_lesson_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_lesson_progress_updated_at ON public.gh_user_lesson_progress;
CREATE TRIGGER trigger_update_gh_lesson_progress_updated_at
  BEFORE UPDATE ON public.gh_user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_lesson_progress_updated_at();

-- ============================================================================
-- PART 5: Comments
-- ============================================================================

COMMENT ON TABLE public.gh_user_phase_progress IS
  'Tracks user progress through phases. One record per user per phase.';

COMMENT ON TABLE public.gh_user_lesson_progress IS
  'Tracks user progress through lessons with two progress gauges: video % and tactics %.';

COMMENT ON TABLE public.gh_user_tactic_completions IS
  'Records individual tactic completions with optional response data.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_program_enrollments' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_phase_progress' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_lesson_progress' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_tactic_completions' AND table_schema = 'public')
  THEN
    RAISE NOTICE '✓ STEP 3 SUCCESS: All enrollment & progress tables created!';
    RAISE NOTICE '  → gh_user_program_enrollments: ✓';
    RAISE NOTICE '  → gh_user_phase_progress: ✓';
    RAISE NOTICE '  → gh_user_lesson_progress: ✓';
    RAISE NOTICE '  → gh_user_tactic_completions: ✓';
    RAISE NOTICE '';
    RAISE NOTICE '  NOW RUN: 20260120_016_add_enrollment_dependent_policies.sql';
  ELSE
    RAISE EXCEPTION '✗ STEP 3 FAILED: One or more tables NOT created';
  END IF;
END $$;
