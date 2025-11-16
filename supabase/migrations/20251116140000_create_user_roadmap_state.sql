-- Create user_roadmap_state table
-- Persists user's personalized roadmap preferences and filtering state

CREATE TABLE IF NOT EXISTS public.user_roadmap_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Strategy Configuration
  ownership_model TEXT NOT NULL CHECK (ownership_model IN ('rental_arbitrage', 'ownership', 'creative_financing', 'house_hack', 'hybrid')),
  target_populations TEXT[] NOT NULL DEFAULT '{}',
  target_state TEXT NOT NULL DEFAULT 'OTHER',

  -- Budget Constraints
  budget_min_usd INTEGER NOT NULL DEFAULT 0,
  budget_max_usd INTEGER NOT NULL DEFAULT 50000,

  -- Timeline Customization
  timeline_weeks INTEGER NOT NULL DEFAULT 12 CHECK (timeline_weeks >= 4 AND timeline_weeks <= 52),

  -- Personalization Preferences
  prioritized_categories TEXT[] DEFAULT '{}',
  excluded_tactic_ids TEXT[] DEFAULT '{}',
  skipped_tactic_ids TEXT[] DEFAULT '{}',

  -- Critical Path Tracking
  critical_tactics_remaining INTEGER DEFAULT 0,
  blocked_tactics_count INTEGER DEFAULT 0,

  -- Recalculation Metadata
  last_recalculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recalculation_count INTEGER DEFAULT 0,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one roadmap state per user
  CONSTRAINT unique_user_roadmap_state UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_roadmap_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own roadmap state"
  ON public.user_roadmap_state
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmap state"
  ON public.user_roadmap_state
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmap state"
  ON public.user_roadmap_state
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roadmap_state_user_id ON public.user_roadmap_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_state_ownership_model ON public.user_roadmap_state(ownership_model);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_state_last_recalculated ON public.user_roadmap_state(last_recalculated_at);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_user_roadmap_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_roadmap_state_updated_at
  BEFORE UPDATE ON public.user_roadmap_state
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roadmap_state_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.user_roadmap_state IS 'Persists user personalized roadmap preferences and filtering state for enhanced personalization';
COMMENT ON COLUMN public.user_roadmap_state.ownership_model IS 'Selected business model: rental_arbitrage, ownership, creative_financing, house_hack, or hybrid';
COMMENT ON COLUMN public.user_roadmap_state.excluded_tactic_ids IS 'Tactics user has chosen to permanently exclude from their roadmap';
COMMENT ON COLUMN public.user_roadmap_state.skipped_tactic_ids IS 'Tactics user has temporarily skipped (can be un-skipped)';
COMMENT ON COLUMN public.user_roadmap_state.prioritized_categories IS 'Categories to boost in sorting priority';
COMMENT ON COLUMN public.user_roadmap_state.last_recalculated_at IS 'Timestamp when roadmap was last recalculated with updated filters';
