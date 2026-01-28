-- ============================================
-- Nette Onboarding Tour: Database Schema Update
-- FEAT-GH-TOUR: Guided onboarding with income replacement roadmap
-- ============================================

-- Add tour-related columns to user_onboarding table
ALTER TABLE public.user_onboarding
ADD COLUMN IF NOT EXISTS income_replacement_target INTEGER,
ADD COLUMN IF NOT EXISTS properties_needed INTEGER,
ADD COLUMN IF NOT EXISTS income_roadmap_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gh_tour_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gh_tour_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nette_proactive_message_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nette_proactive_message_consent TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_onboarding.income_replacement_target IS 'User target monthly income to replace (from assessment)';
COMMENT ON COLUMN public.user_onboarding.properties_needed IS 'Calculated number of properties needed to reach income target';
COMMENT ON COLUMN public.user_onboarding.income_roadmap_shown IS 'Whether the income replacement roadmap has been displayed';
COMMENT ON COLUMN public.user_onboarding.gh_tour_completed IS 'Whether user has completed the grouphome dashboard tour';
COMMENT ON COLUMN public.user_onboarding.gh_tour_completed_at IS 'Timestamp when tour was completed';
COMMENT ON COLUMN public.user_onboarding.nette_proactive_message_shown IS 'Whether Nette proactive message was shown after tour';
COMMENT ON COLUMN public.user_onboarding.nette_proactive_message_consent IS 'User consent response: yes_show_roadmap, maybe_later, no_thanks';

-- Create index for efficient tour status queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_tour_status
ON public.user_onboarding(gh_tour_completed, nette_proactive_message_shown)
WHERE gh_tour_completed = FALSE OR nette_proactive_message_shown = FALSE;
