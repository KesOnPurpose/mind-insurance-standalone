-- Add Enhanced Personalization Fields to user_onboarding
-- These fields enable 100% personalized roadmaps based on RAG database enrichment

ALTER TABLE public.user_onboarding
  -- Strategy Selection (for enriched filtering)
  ADD COLUMN IF NOT EXISTS ownership_model TEXT CHECK (ownership_model IN ('rental_arbitrage', 'ownership', 'creative_financing', 'house_hack', 'hybrid')),

  -- Exact Budget Tracking (USD precision vs categorical)
  ADD COLUMN IF NOT EXISTS budget_min_usd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_max_usd INTEGER DEFAULT 50000,

  -- Prioritized Populations (ordered list for weighted filtering)
  ADD COLUMN IF NOT EXISTS prioritized_populations TEXT[];

-- Create indexes for enhanced filtering queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_ownership_model ON public.user_onboarding(ownership_model);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_budget_range ON public.user_onboarding(budget_min_usd, budget_max_usd);

-- Add comment for documentation
COMMENT ON COLUMN public.user_onboarding.ownership_model IS 'User-selected business model strategy from assessment Step 2';
COMMENT ON COLUMN public.user_onboarding.budget_min_usd IS 'Exact minimum startup budget in USD (calculated from capital_available)';
COMMENT ON COLUMN public.user_onboarding.budget_max_usd IS 'Exact maximum startup budget in USD (calculated from capital_available)';
COMMENT ON COLUMN public.user_onboarding.prioritized_populations IS 'Ordered list of target populations by user priority';
