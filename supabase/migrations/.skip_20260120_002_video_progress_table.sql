-- ============================================================================
-- FEAT-GH-004-B: Create gh_lesson_video_progress table
-- ============================================================================
-- Purpose: Track video watch progress for lesson completion gates
-- Stores watch percentage, timestamps, and completion status per user/tactic
-- ============================================================================

-- 1. CREATE VIDEO PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.gh_lesson_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id TEXT NOT NULL,  -- References gh_tactic_instructions.tactic_id

  -- Video identification
  video_url TEXT,                    -- Full URL to the video
  video_provider TEXT CHECK (video_provider IN ('vimeo', 'youtube', 'wistia', 'custom')),

  -- Progress tracking
  watch_percentage DECIMAL(5,2) DEFAULT 0 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  watch_time_seconds INTEGER DEFAULT 0 CHECK (watch_time_seconds >= 0),
  video_duration_seconds INTEGER CHECK (video_duration_seconds > 0),

  -- Milestone tracking
  reached_25_percent BOOLEAN DEFAULT FALSE,
  reached_50_percent BOOLEAN DEFAULT FALSE,
  reached_75_percent BOOLEAN DEFAULT FALSE,
  reached_90_percent BOOLEAN DEFAULT FALSE,
  completed_100_percent BOOLEAN DEFAULT FALSE,

  -- Completion gate
  meets_completion_threshold BOOLEAN DEFAULT FALSE,  -- True when watch_percentage >= config threshold (default 90%)

  -- Session tracking
  last_position_seconds INTEGER DEFAULT 0,  -- Resume position
  total_sessions INTEGER DEFAULT 0,         -- Number of watch sessions

  -- Timestamps
  first_watched_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one progress record per user per tactic
  CONSTRAINT gh_lesson_video_progress_unique UNIQUE(user_id, tactic_id)
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_gh_lesson_video_progress_user
  ON public.gh_lesson_video_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_video_progress_tactic
  ON public.gh_lesson_video_progress(tactic_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_video_progress_user_tactic
  ON public.gh_lesson_video_progress(user_id, tactic_id);

CREATE INDEX IF NOT EXISTS idx_gh_lesson_video_progress_incomplete
  ON public.gh_lesson_video_progress(user_id, tactic_id)
  WHERE meets_completion_threshold = false;

CREATE INDEX IF NOT EXISTS idx_gh_lesson_video_progress_completed
  ON public.gh_lesson_video_progress(completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- 3. ENABLE RLS
ALTER TABLE public.gh_lesson_video_progress ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Users can view their own video progress
CREATE POLICY "Users can view own video progress"
  ON public.gh_lesson_video_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own video progress
CREATE POLICY "Users can insert own video progress"
  ON public.gh_lesson_video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own video progress
CREATE POLICY "Users can update own video progress"
  ON public.gh_lesson_video_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all video progress (for analytics)
CREATE POLICY "Admins can view all video progress"
  ON public.gh_lesson_video_progress FOR SELECT
  USING ((SELECT public.is_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_lesson_video_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set first_watched_at if not set
  IF OLD.first_watched_at IS NULL AND NEW.watch_time_seconds > 0 THEN
    NEW.first_watched_at = NOW();
  END IF;

  -- Update last_watched_at
  IF NEW.watch_time_seconds > OLD.watch_time_seconds THEN
    NEW.last_watched_at = NOW();
    NEW.total_sessions = OLD.total_sessions + 1;
  END IF;

  -- Update milestone flags based on percentage
  NEW.reached_25_percent = NEW.watch_percentage >= 25;
  NEW.reached_50_percent = NEW.watch_percentage >= 50;
  NEW.reached_75_percent = NEW.watch_percentage >= 75;
  NEW.reached_90_percent = NEW.watch_percentage >= 90;
  NEW.completed_100_percent = NEW.watch_percentage >= 100;

  -- Set completion timestamp if just completed
  IF NEW.meets_completion_threshold = true AND OLD.meets_completion_threshold = false THEN
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_lesson_video_progress
  ON public.gh_lesson_video_progress;

CREATE TRIGGER trigger_update_gh_lesson_video_progress
  BEFORE UPDATE ON public.gh_lesson_video_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_lesson_video_progress_updated_at();

-- 6. ADD COMMENTS
COMMENT ON TABLE public.gh_lesson_video_progress IS
  'Tracks video watch progress for lesson completion gates. Each user has one record per tactic.';

COMMENT ON COLUMN public.gh_lesson_video_progress.watch_percentage IS
  'Current watch percentage (0-100). Updated as user watches video.';

COMMENT ON COLUMN public.gh_lesson_video_progress.meets_completion_threshold IS
  'True when watch_percentage meets the configured threshold (default 90%). Used for completion gate validation.';

COMMENT ON COLUMN public.gh_lesson_video_progress.last_position_seconds IS
  'Last playback position for resume functionality.';

-- 7. VERIFICATION QUERY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_lesson_video_progress' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-004-B: gh_lesson_video_progress table created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-B: gh_lesson_video_progress table creation FAILED';
  END IF;
END $$;
