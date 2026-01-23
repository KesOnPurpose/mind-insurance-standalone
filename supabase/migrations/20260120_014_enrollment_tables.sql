-- ============================================================================
-- FEAT-GH-009-E: Create Enrollment & Progress Tables
-- ============================================================================
-- Purpose: Track user enrollments and progress through programs/phases/lessons
-- ============================================================================

-- ============================================================================
-- PART 1: User Program Enrollments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_user_program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.gh_programs(id) ON DELETE CASCADE,

  -- Enrollment details
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrollment_source TEXT DEFAULT 'manual' CHECK (enrollment_source IN (
    'manual',      -- Admin manually enrolled
    'purchase',    -- Purchased via GHL/Stripe
    'import',      -- Bulk import
    'promo',       -- Promotional/coupon
    'gift',        -- Gifted enrollment
    'scholarship'  -- Scholarship/grant
  )),

  -- Purchase tracking (if source = purchase)
  purchase_id TEXT,  -- GHL/Stripe transaction ID
  purchase_amount_cents INTEGER,
  purchase_currency TEXT DEFAULT 'USD',
  coupon_code TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active',      -- Currently enrolled and learning
    'completed',   -- Finished the program
    'paused',      -- Temporarily paused (manual or auto)
    'cancelled',   -- Cancelled/refunded
    'expired'      -- Access expired
  )),

  -- Progress summary (denormalized for performance)
  progress_percent INTEGER DEFAULT 0,
  completed_phases INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  total_watch_time_seconds INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ,  -- When first lesson started
  completed_at TIMESTAMPTZ,  -- When program completed
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- If time-limited access

  -- Certificate (if issued)
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,

  -- Settings (extensible)
  settings JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_program UNIQUE (user_id, program_id)
);

-- Indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_gh_enrollments_user_id
  ON public.gh_user_program_enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_enrollments_program_id
  ON public.gh_user_program_enrollments(program_id);

CREATE INDEX IF NOT EXISTS idx_gh_enrollments_status
  ON public.gh_user_program_enrollments(status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_gh_enrollments_purchase_id
  ON public.gh_user_program_enrollments(purchase_id)
  WHERE purchase_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gh_enrollments_last_activity
  ON public.gh_user_program_enrollments(last_activity_at DESC);

-- RLS for enrollments
ALTER TABLE public.gh_user_program_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
  ON public.gh_user_program_enrollments FOR SELECT
  USING (user_id = auth.uid());

-- Admins/coaches can view all enrollments
CREATE POLICY "Admins can view all enrollments"
  ON public.gh_user_program_enrollments FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- Admins can create enrollments
CREATE POLICY "Admins can insert enrollments"
  ON public.gh_user_program_enrollments FOR INSERT
  WITH CHECK ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- Admins can update enrollments
CREATE POLICY "Admins can update enrollments"
  ON public.gh_user_program_enrollments FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- Users can update their own enrollment (limited fields via RPC)
CREATE POLICY "Users can update own enrollment activity"
  ON public.gh_user_program_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 2: User Phase Progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_user_phase_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.gh_program_phases(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'locked' CHECK (status IN (
    'locked',       -- Not yet accessible (drip not met)
    'not_started',  -- Unlocked but not started
    'in_progress',  -- Started but not complete
    'completed'     -- All required lessons complete
  )),

  -- Progress summary (denormalized)
  completed_lessons INTEGER DEFAULT 0,
  total_required_lessons INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,

  -- Timestamps
  unlocked_at TIMESTAMPTZ,  -- When phase became accessible
  started_at TIMESTAMPTZ,   -- When first lesson started
  completed_at TIMESTAMPTZ, -- When phase completed
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_phase UNIQUE (user_id, phase_id)
);

-- Indexes for phase progress
CREATE INDEX IF NOT EXISTS idx_gh_phase_progress_user_id
  ON public.gh_user_phase_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_phase_progress_phase_id
  ON public.gh_user_phase_progress(phase_id);

CREATE INDEX IF NOT EXISTS idx_gh_phase_progress_status
  ON public.gh_user_phase_progress(status);

CREATE INDEX IF NOT EXISTS idx_gh_phase_progress_user_status
  ON public.gh_user_phase_progress(user_id, status);

-- RLS for phase progress
ALTER TABLE public.gh_user_phase_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own phase progress
CREATE POLICY "Users can view own phase progress"
  ON public.gh_user_phase_progress FOR SELECT
  USING (user_id = auth.uid());

-- Admins/coaches can view all phase progress
CREATE POLICY "Admins can view all phase progress"
  ON public.gh_user_phase_progress FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- System can insert phase progress (via triggers/functions)
CREATE POLICY "System can insert phase progress"
  ON public.gh_user_phase_progress FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- System can update phase progress
CREATE POLICY "System can update phase progress"
  ON public.gh_user_phase_progress FOR UPDATE
  USING (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- ============================================================================
-- PART 3: User Lesson Progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.gh_program_lessons(id) ON DELETE CASCADE,

  -- Status
  status TEXT DEFAULT 'locked' CHECK (status IN (
    'locked',       -- Not yet accessible
    'not_started',  -- Unlocked but not started
    'in_progress',  -- Started but not complete
    'completed',    -- All requirements met
    'stuck'         -- Flagged by stuck detection system
  )),

  -- Video progress (THE VIDEO GAUGE!)
  video_watched_percent INTEGER DEFAULT 0,
  video_last_position_ms INTEGER DEFAULT 0,
  video_completed_at TIMESTAMPTZ,
  video_watch_sessions INTEGER DEFAULT 0,
  video_total_watch_seconds INTEGER DEFAULT 0,

  -- Tactics progress (THE TACTICS GAUGE!)
  tactics_completed_count INTEGER DEFAULT 0,
  tactics_required_count INTEGER DEFAULT 0,
  tactics_completion_percent INTEGER DEFAULT 0,

  -- Assessment progress
  assessment_status TEXT CHECK (assessment_status IN (
    'not_started',  -- Haven't attempted
    'in_progress',  -- Started but not submitted
    'passed',       -- Passed with minimum score
    'failed'        -- Failed (can retry)
  )),
  assessment_score INTEGER,
  assessment_attempts INTEGER DEFAULT 0,
  assessment_best_score INTEGER,
  assessment_last_attempt_at TIMESTAMPTZ,

  -- Completion gates status (THE DIFFERENTIATOR!)
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

  -- Nette AI interactions (THE $100M FEATURE!)
  nette_help_count INTEGER DEFAULT 0,
  nette_last_interaction_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_lesson UNIQUE (user_id, lesson_id),
  CONSTRAINT valid_video_percent CHECK (video_watched_percent BETWEEN 0 AND 100),
  CONSTRAINT valid_tactics_percent CHECK (tactics_completion_percent BETWEEN 0 AND 100)
);

-- Indexes for lesson progress
CREATE INDEX IF NOT EXISTS idx_gh_lesson_progress_user_id
  ON public.gh_user_lesson_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_progress_lesson_id
  ON public.gh_user_lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_progress_status
  ON public.gh_user_lesson_progress(status);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_progress_user_status
  ON public.gh_user_lesson_progress(user_id, status);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_progress_stuck
  ON public.gh_user_lesson_progress(status, stuck_detected_at)
  WHERE status = 'stuck';

CREATE INDEX IF NOT EXISTS idx_gh_lesson_progress_last_activity
  ON public.gh_user_lesson_progress(last_activity_at DESC);

-- RLS for lesson progress
ALTER TABLE public.gh_user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own lesson progress
CREATE POLICY "Users can view own lesson progress"
  ON public.gh_user_lesson_progress FOR SELECT
  USING (user_id = auth.uid());

-- Admins/coaches can view all lesson progress
CREATE POLICY "Admins can view all lesson progress"
  ON public.gh_user_lesson_progress FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- System can insert lesson progress
CREATE POLICY "System can insert lesson progress"
  ON public.gh_user_lesson_progress FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- System can update lesson progress
CREATE POLICY "System can update lesson progress"
  ON public.gh_user_lesson_progress FOR UPDATE
  USING (user_id = auth.uid() OR (SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- ============================================================================
-- PART 4: User Tactic Completions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_user_tactic_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id UUID NOT NULL REFERENCES public.gh_lesson_tactics(id) ON DELETE CASCADE,

  -- Completion details
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Response data (for text_input, file_upload, link_submit types)
  response_data JSONB DEFAULT '{}'::JSONB,  -- {text, file_url, link_url, etc.}

  -- Nette AI assistance
  nette_helped BOOLEAN DEFAULT false,
  nette_conversation_id UUID,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_tactic UNIQUE (user_id, tactic_id)
);

-- Indexes for tactic completions
CREATE INDEX IF NOT EXISTS idx_gh_tactic_completions_user_id
  ON public.gh_user_tactic_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_tactic_completions_tactic_id
  ON public.gh_user_tactic_completions(tactic_id);

CREATE INDEX IF NOT EXISTS idx_gh_tactic_completions_completed_at
  ON public.gh_user_tactic_completions(completed_at DESC);

-- RLS for tactic completions
ALTER TABLE public.gh_user_tactic_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own tactic completions
CREATE POLICY "Users can view own tactic completions"
  ON public.gh_user_tactic_completions FOR SELECT
  USING (user_id = auth.uid());

-- Admins/coaches can view all tactic completions
CREATE POLICY "Admins can view all tactic completions"
  ON public.gh_user_tactic_completions FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- Users can insert their own tactic completions
CREATE POLICY "Users can insert own tactic completions"
  ON public.gh_user_tactic_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own tactic completions (uncheck)
CREATE POLICY "Users can delete own tactic completions"
  ON public.gh_user_tactic_completions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 5: Update Triggers
-- ============================================================================

-- Update enrollment timestamp
CREATE OR REPLACE FUNCTION update_gh_enrollment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_enrollment_updated_at
  ON public.gh_user_program_enrollments;

CREATE TRIGGER trigger_update_gh_enrollment_updated_at
  BEFORE UPDATE ON public.gh_user_program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_enrollment_updated_at();

-- Update phase progress timestamp
CREATE OR REPLACE FUNCTION update_gh_phase_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_phase_progress_updated_at
  ON public.gh_user_phase_progress;

CREATE TRIGGER trigger_update_gh_phase_progress_updated_at
  BEFORE UPDATE ON public.gh_user_phase_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_phase_progress_updated_at();

-- Update lesson progress timestamp
CREATE OR REPLACE FUNCTION update_gh_lesson_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_lesson_progress_updated_at
  ON public.gh_user_lesson_progress;

CREATE TRIGGER trigger_update_gh_lesson_progress_updated_at
  BEFORE UPDATE ON public.gh_user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_lesson_progress_updated_at();

-- ============================================================================
-- PART 6: Comments
-- ============================================================================

COMMENT ON TABLE public.gh_user_program_enrollments IS
  'Tracks user enrollments in programs. Each enrollment represents one user in one program.';

COMMENT ON TABLE public.gh_user_phase_progress IS
  'Tracks user progress through phases. One record per user per phase.';

COMMENT ON TABLE public.gh_user_lesson_progress IS
  'Tracks user progress through lessons with two progress gauges: video % and tactics %.';

COMMENT ON TABLE public.gh_user_tactic_completions IS
  'Records individual tactic completions with optional response data.';

COMMENT ON COLUMN public.gh_user_lesson_progress.video_gate_met IS
  'True when user has watched required percentage of video';

COMMENT ON COLUMN public.gh_user_lesson_progress.tactics_gate_met IS
  'True when user has completed all required tactics (OUR DIFFERENTIATOR!)';

COMMENT ON COLUMN public.gh_user_lesson_progress.all_gates_met IS
  'True when all completion requirements are satisfied';

-- ============================================================================
-- PART 7: Verification
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_program_enrollments' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_phase_progress' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_lesson_progress' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_tactic_completions' AND table_schema = 'public')
  THEN
    RAISE NOTICE '✓ FEAT-GH-009-E: All enrollment & progress tables created successfully';
    RAISE NOTICE '  → gh_user_program_enrollments: Enrollment tracking';
    RAISE NOTICE '  → gh_user_phase_progress: Phase-level progress';
    RAISE NOTICE '  → gh_user_lesson_progress: Lesson-level progress with TWO GAUGES';
    RAISE NOTICE '  → gh_user_tactic_completions: Individual tactic completion';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-E: One or more tables FAILED to create';
  END IF;
END $$;
