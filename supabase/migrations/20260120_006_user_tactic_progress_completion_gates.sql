-- ============================================================================
-- FEAT-GH-004-F: Create gh_user_tactic_progress table with completion gate columns
-- ============================================================================
-- Purpose: Track user's overall progress on tactics and completion gate status
-- This is TACTIC-level progress (vs gh_user_tactic_step_progress which is step-level)
-- Tracks video watched, assessment passed, and overall completion status
-- ============================================================================

-- 1. CREATE USER TACTIC PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.gh_user_tactic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identifiers
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id TEXT NOT NULL,  -- References gh_tactic_instructions.tactic_id

  -- Overall status
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',    -- Haven't engaged with tactic yet
    'in_progress',    -- Started but not completed
    'gates_pending',  -- Content done, waiting for gates to clear
    'completed',      -- Fully completed (all gates passed)
    'skipped'         -- Skipped with note (if allowed)
  )),

  -- Video completion gate
  video_watched BOOLEAN DEFAULT FALSE,
  video_watch_percentage DECIMAL(5,2) DEFAULT 0,
  video_gate_met BOOLEAN DEFAULT FALSE,
  video_gate_met_at TIMESTAMP WITH TIME ZONE,

  -- Assessment completion gate
  assessment_attempted BOOLEAN DEFAULT FALSE,
  assessment_passed BOOLEAN DEFAULT FALSE,
  assessment_best_score DECIMAL(5,2),
  assessment_attempts_count INTEGER DEFAULT 0,
  assessment_gate_met BOOLEAN DEFAULT FALSE,
  assessment_gate_met_at TIMESTAMP WITH TIME ZONE,

  -- Overall completion gate status
  all_gates_met BOOLEAN DEFAULT FALSE,
  gates_met_at TIMESTAMP WITH TIME ZONE,

  -- Skip tracking (if allowed by config)
  was_skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  skipped_at TIMESTAMP WITH TIME ZONE,
  skipped_by UUID REFERENCES auth.users(id),  -- Could be coach override

  -- Progress details
  progress_percentage DECIMAL(5,2) DEFAULT 0,  -- Overall progress 0-100
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,

  -- Time tracking
  time_spent_seconds INTEGER DEFAULT 0,
  first_accessed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Notes and feedback
  user_notes TEXT,
  coach_notes TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one progress record per user per tactic
  CONSTRAINT gh_user_tactic_progress_unique UNIQUE(user_id, tactic_id)
);

-- 2. CREATE INDEXES
-- User-based queries
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_user
  ON public.gh_user_tactic_progress(user_id);

-- Tactic-based queries
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_tactic
  ON public.gh_user_tactic_progress(tactic_id);

-- User + tactic combined
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_user_tactic
  ON public.gh_user_tactic_progress(user_id, tactic_id);

-- Status queries
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_status
  ON public.gh_user_tactic_progress(user_id, status);

-- Incomplete tactics (for stuck detection)
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_incomplete
  ON public.gh_user_tactic_progress(user_id, tactic_id, last_accessed_at)
  WHERE status IN ('in_progress', 'gates_pending');

-- Completed tactics
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_completed
  ON public.gh_user_tactic_progress(user_id, completed_at DESC)
  WHERE status = 'completed';

-- Gates pending (for nudge targeting)
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_gates_pending
  ON public.gh_user_tactic_progress(user_id, tactic_id)
  WHERE status = 'gates_pending' AND all_gates_met = false;

-- Video gate not met
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_video_pending
  ON public.gh_user_tactic_progress(user_id, tactic_id)
  WHERE video_gate_met = false;

-- Assessment gate not met
CREATE INDEX IF NOT EXISTS idx_gh_user_tactic_progress_assessment_pending
  ON public.gh_user_tactic_progress(user_id, tactic_id)
  WHERE assessment_gate_met = false AND assessment_attempted = true;

-- 3. ENABLE RLS
ALTER TABLE public.gh_user_tactic_progress ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Users can view their own progress
CREATE POLICY "Users can view own tactic progress"
  ON public.gh_user_tactic_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own tactic progress"
  ON public.gh_user_tactic_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own tactic progress"
  ON public.gh_user_tactic_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all progress
CREATE POLICY "Admins can view all tactic progress"
  ON public.gh_user_tactic_progress FOR SELECT
  USING ((SELECT public.is_admin()));

-- Admins can update progress (for coach overrides)
CREATE POLICY "Admins can update tactic progress"
  ON public.gh_user_tactic_progress FOR UPDATE
  USING ((SELECT public.is_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_user_tactic_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set first_accessed_at
  IF OLD.first_accessed_at IS NULL AND NEW.last_accessed_at IS NOT NULL THEN
    NEW.first_accessed_at = NEW.last_accessed_at;
  END IF;

  -- Auto-set started_at when status changes from not_started
  IF OLD.status = 'not_started' AND NEW.status != 'not_started' THEN
    NEW.started_at = NOW();
  END IF;

  -- Auto-set video_gate_met_at
  IF NEW.video_gate_met = true AND OLD.video_gate_met = false THEN
    NEW.video_gate_met_at = NOW();
  END IF;

  -- Auto-set assessment_gate_met_at
  IF NEW.assessment_gate_met = true AND OLD.assessment_gate_met = false THEN
    NEW.assessment_gate_met_at = NOW();
  END IF;

  -- Check if all gates are now met
  IF NEW.video_gate_met = true AND NEW.assessment_gate_met = true AND OLD.all_gates_met = false THEN
    NEW.all_gates_met = true;
    NEW.gates_met_at = NOW();
  END IF;

  -- Auto-set completed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
    NEW.all_gates_met = true;
    IF NEW.gates_met_at IS NULL THEN
      NEW.gates_met_at = NOW();
    END IF;
  END IF;

  -- Auto-set skipped_at
  IF NEW.was_skipped = true AND OLD.was_skipped = false THEN
    NEW.skipped_at = NOW();
    NEW.status = 'skipped';
  END IF;

  -- Calculate progress percentage based on gates
  DECLARE
    v_gates_required INTEGER := 0;
    v_gates_met INTEGER := 0;
    v_tactic_config RECORD;
  BEGIN
    -- Get tactic config to know which gates are required
    SELECT completion_gate_config INTO v_tactic_config
    FROM gh_tactic_instructions
    WHERE tactic_id = NEW.tactic_id;

    IF v_tactic_config IS NOT NULL THEN
      IF (v_tactic_config.completion_gate_config->>'require_video')::BOOLEAN = true THEN
        v_gates_required := v_gates_required + 1;
        IF NEW.video_gate_met THEN
          v_gates_met := v_gates_met + 1;
        END IF;
      END IF;

      IF (v_tactic_config.completion_gate_config->>'require_assessment')::BOOLEAN = true THEN
        v_gates_required := v_gates_required + 1;
        IF NEW.assessment_gate_met THEN
          v_gates_met := v_gates_met + 1;
        END IF;
      END IF;

      IF v_gates_required > 0 THEN
        NEW.progress_percentage := (v_gates_met::DECIMAL / v_gates_required) * 100;
      ELSE
        -- No gates required, use step progress if available
        IF NEW.total_steps > 0 THEN
          NEW.progress_percentage := (NEW.steps_completed::DECIMAL / NEW.total_steps) * 100;
        END IF;
      END IF;
    END IF;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_user_tactic_progress
  ON public.gh_user_tactic_progress;

CREATE TRIGGER trigger_update_gh_user_tactic_progress
  BEFORE UPDATE ON public.gh_user_tactic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_user_tactic_progress_updated_at();

-- 6. HELPER FUNCTION: Get or create user tactic progress
CREATE OR REPLACE FUNCTION public.get_or_create_user_tactic_progress(
  p_user_id UUID,
  p_tactic_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress_id UUID;
  v_total_steps INTEGER;
BEGIN
  -- Try to get existing progress
  SELECT id INTO v_progress_id
  FROM gh_user_tactic_progress
  WHERE user_id = p_user_id AND tactic_id = p_tactic_id;

  -- If not found, create new progress record
  IF v_progress_id IS NULL THEN
    -- Get total steps from tactic
    SELECT jsonb_array_length(COALESCE(step_by_step, '[]'::jsonb))
    INTO v_total_steps
    FROM gh_tactic_instructions
    WHERE tactic_id = p_tactic_id;

    INSERT INTO gh_user_tactic_progress (
      user_id, tactic_id, total_steps, first_accessed_at, last_accessed_at
    ) VALUES (
      p_user_id, p_tactic_id, COALESCE(v_total_steps, 0), NOW(), NOW()
    )
    RETURNING id INTO v_progress_id;
  ELSE
    -- Update last accessed
    UPDATE gh_user_tactic_progress
    SET last_accessed_at = NOW()
    WHERE id = v_progress_id;
  END IF;

  RETURN v_progress_id;
END;
$$;

-- 7. HELPER FUNCTION: Check if user can mark tactic complete
CREATE OR REPLACE FUNCTION public.can_complete_tactic(
  p_user_id UUID,
  p_tactic_id TEXT
)
RETURNS TABLE (
  can_complete BOOLEAN,
  video_gate_met BOOLEAN,
  assessment_gate_met BOOLEAN,
  missing_requirements TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tactic RECORD;
  v_progress RECORD;
  v_video_met BOOLEAN := true;
  v_assessment_met BOOLEAN := true;
  v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get tactic config
  SELECT * INTO v_tactic
  FROM gh_tactic_instructions
  WHERE tactic_id = p_tactic_id;

  -- Get user progress
  SELECT * INTO v_progress
  FROM gh_user_tactic_progress
  WHERE user_id = p_user_id AND tactic_id = p_tactic_id;

  -- Check video gate
  IF v_tactic.completion_gate_enabled AND
     (v_tactic.completion_gate_config->>'require_video')::BOOLEAN = true THEN
    v_video_met := COALESCE(v_progress.video_gate_met, false);
    IF NOT v_video_met THEN
      v_missing := array_append(v_missing, 'video_not_watched');
    END IF;
  END IF;

  -- Check assessment gate
  IF v_tactic.completion_gate_enabled AND
     (v_tactic.completion_gate_config->>'require_assessment')::BOOLEAN = true THEN
    v_assessment_met := COALESCE(v_progress.assessment_gate_met, false);
    IF NOT v_assessment_met THEN
      v_missing := array_append(v_missing, 'assessment_not_passed');
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    (v_video_met AND v_assessment_met) AS can_complete,
    v_video_met AS video_gate_met,
    v_assessment_met AS assessment_gate_met,
    v_missing AS missing_requirements;
END;
$$;

-- 8. ADD COMMENTS
COMMENT ON TABLE public.gh_user_tactic_progress IS
  'Tracks user overall progress on tactics, including completion gate status (video watched, assessment passed).';

COMMENT ON COLUMN public.gh_user_tactic_progress.status IS
  'Overall tactic status: not_started, in_progress, gates_pending, completed, skipped';

COMMENT ON COLUMN public.gh_user_tactic_progress.video_gate_met IS
  'True when video watch percentage meets the configured threshold';

COMMENT ON COLUMN public.gh_user_tactic_progress.assessment_gate_met IS
  'True when assessment score meets the configured passing threshold';

COMMENT ON COLUMN public.gh_user_tactic_progress.all_gates_met IS
  'True when all required completion gates have been satisfied';

COMMENT ON COLUMN public.gh_user_tactic_progress.was_skipped IS
  'True if tactic was skipped (only allowed if config permits)';

-- 9. VERIFICATION QUERY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_tactic_progress' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-004-F: gh_user_tactic_progress table created with completion gate columns';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-F: gh_user_tactic_progress table creation FAILED';
  END IF;
END $$;
