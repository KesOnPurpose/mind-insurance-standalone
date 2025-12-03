-- ============================================================================
-- GROUPHOME (GH) - ADD INVITED_AT COLUMN
-- ============================================================================
-- Purpose: Track when invites were sent to approved users
-- ============================================================================

-- Add invited_at column to track when invites are sent
ALTER TABLE public.gh_approved_users
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN public.gh_approved_users.invited_at IS 'Timestamp when invite email was sent';

-- Create index for querying users who haven't been invited
CREATE INDEX IF NOT EXISTS idx_gh_approved_users_invited_at
ON public.gh_approved_users(invited_at)
WHERE invited_at IS NULL;
