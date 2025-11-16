-- Add Business Profile Fields to user_onboarding
-- These fields capture user decisions as they complete tactics, building a living business profile

ALTER TABLE public.user_onboarding
  -- Core Business Identity
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT CHECK (entity_type IN ('llc', 's-corp', 'c-corp', 'sole-proprietorship', 'partnership', 'not-formed')),
  ADD COLUMN IF NOT EXISTS target_state TEXT,
  ADD COLUMN IF NOT EXISTS target_state_reason TEXT,

  -- Property & Operations
  ADD COLUMN IF NOT EXISTS bed_count INTEGER CHECK (bed_count >= 1 AND bed_count <= 20),
  ADD COLUMN IF NOT EXISTS property_status TEXT CHECK (property_status IN ('not-started', 'researching', 'searching', 'offer-pending', 'under-contract', 'owned', 'leasing')),
  ADD COLUMN IF NOT EXISTS property_address TEXT,
  ADD COLUMN IF NOT EXISTS property_type TEXT CHECK (property_type IN ('single-family', 'duplex', 'multi-family', 'commercial', 'not-selected')),

  -- Licensing & Compliance
  ADD COLUMN IF NOT EXISTS license_status TEXT CHECK (license_status IN ('not-started', 'researching', 'documents-gathering', 'application-submitted', 'inspection-scheduled', 'approved', 'operational')),
  ADD COLUMN IF NOT EXISTS license_type TEXT,
  ADD COLUMN IF NOT EXISTS estimated_license_date DATE,

  -- Financial Planning
  ADD COLUMN IF NOT EXISTS funding_source TEXT CHECK (funding_source IN ('personal-savings', 'bank-loan', 'sba-loan', 'fha-loan', 'investor', 'partner', 'seller-financing', 'combination', 'not-decided')),
  ADD COLUMN IF NOT EXISTS startup_capital_actual DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS monthly_revenue_target DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS monthly_expense_estimate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS break_even_timeline TEXT CHECK (break_even_timeline IN ('3-months', '6-months', '9-months', '12-months', 'over-12-months', 'not-calculated')),

  -- Business Model
  ADD COLUMN IF NOT EXISTS service_model TEXT CHECK (service_model IN ('owner-operator', 'absentee-owner', 'manager-operated', 'hybrid', 'not-decided')),
  ADD COLUMN IF NOT EXISTS marketing_strategy TEXT,
  ADD COLUMN IF NOT EXISTS referral_sources TEXT[],

  -- Milestones Tracking
  ADD COLUMN IF NOT EXISTS first_resident_date DATE,
  ADD COLUMN IF NOT EXISTS full_occupancy_date DATE,
  ADD COLUMN IF NOT EXISTS business_launch_date DATE,

  -- Profile Completeness
  ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100),
  ADD COLUMN IF NOT EXISTS last_tactic_completed TEXT,
  ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for profile completeness queries
CREATE INDEX IF NOT EXISTS idx_user_onboarding_profile_completeness ON public.user_onboarding(profile_completeness);

-- Update trigger to also update last_profile_update
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_profile_update = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
