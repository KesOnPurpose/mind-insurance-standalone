-- ============================================================================
-- ADD INNER WIRING COLUMN TO USER_PROFILES
-- ============================================================================
-- Stores Inner Wiring Discovery assessment results
-- Wiring Types: connector, warrior, sage, builder
-- ============================================================================

-- Add inner_wiring column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS inner_wiring JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.inner_wiring IS 'Inner Wiring Discovery assessment results: {primary, secondary, scores, confidence, assessed_at}';

-- Create index for querying by wiring type
CREATE INDEX IF NOT EXISTS idx_user_profiles_inner_wiring ON public.user_profiles USING gin (inner_wiring);
