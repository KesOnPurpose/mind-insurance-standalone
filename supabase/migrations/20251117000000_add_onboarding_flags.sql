-- Add onboarding tracking fields to user_onboarding table
-- Purpose: Track first-time user experience, welcome screens, and milestone completion

ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'new_user',
ADD COLUMN IF NOT EXISTS milestones_completed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS roadmap_first_visit TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_tactic_started TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS welcome_shown_at TIMESTAMP WITH TIME ZONE;

-- Create index for onboarding_step queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_step
ON public.user_onboarding(onboarding_step);

-- Create index for has_seen_welcome
CREATE INDEX IF NOT EXISTS idx_user_onboarding_welcome
ON public.user_onboarding(has_seen_welcome)
WHERE has_seen_welcome = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.user_onboarding.has_seen_welcome IS
'Flag to track if user has seen the initial welcome modal';

COMMENT ON COLUMN public.user_onboarding.onboarding_step IS
'Current onboarding step: new_user, auth_complete, assessment_complete, welcome_shown, tour_completed, first_tactic_started, onboarding_complete';

COMMENT ON COLUMN public.user_onboarding.milestones_completed IS
'Array of milestone objects: [{"name": "first_tactic", "completed_at": "2025-11-17T12:00:00Z"}, ...]';

COMMENT ON COLUMN public.user_onboarding.roadmap_first_visit IS
'Timestamp when user first visited the roadmap page';

COMMENT ON COLUMN public.user_onboarding.first_tactic_started IS
'Timestamp when user started their first tactic';

COMMENT ON COLUMN public.user_onboarding.welcome_shown_at IS
'Timestamp when welcome modal was first shown to user';
