-- Create table for step-level progress tracking within tactics
-- Enables interactive checklist in tactic detail modal

CREATE TABLE IF NOT EXISTS gh_user_tactic_step_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tactic_id VARCHAR(10) NOT NULL REFERENCES gh_tactic_instructions(tactic_id),
  step_index INTEGER NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- Optional: track time spent on step
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_tactic_step UNIQUE(user_id, tactic_id, step_index)
);

-- Create index for fast queries by user and tactic
CREATE INDEX IF NOT EXISTS idx_step_progress_user_tactic
ON gh_user_tactic_step_progress(user_id, tactic_id);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_step_progress_completed
ON gh_user_tactic_step_progress(tactic_id, completed_at)
WHERE completed_at IS NOT NULL;

COMMENT ON TABLE gh_user_tactic_step_progress IS
  'Tracks completion of individual steps within tactics for granular progress monitoring and interactive checklists';

COMMENT ON COLUMN gh_user_tactic_step_progress.step_index IS
  'Zero-based index matching the position in the tactic.step_by_step array';

COMMENT ON COLUMN gh_user_tactic_step_progress.duration_seconds IS
  'Optional metric for tracking how long users spend on each step for analytics';
