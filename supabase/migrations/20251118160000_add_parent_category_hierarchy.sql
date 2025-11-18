-- Migration: Add parent category hierarchy to tactics
-- Purpose: Enable $100M-level category consolidation (40 → 8 parent categories)
-- Author: COO-level strategic enhancement
-- Date: 2025-11-18

-- Add parent_category column to gh_tactic_instructions
ALTER TABLE public.gh_tactic_instructions
  ADD COLUMN IF NOT EXISTS parent_category TEXT;

-- Create index for efficient parent category filtering
CREATE INDEX IF NOT EXISTS idx_tactic_parent_category
  ON public.gh_tactic_instructions(parent_category);

-- Add comment for documentation
COMMENT ON COLUMN public.gh_tactic_instructions.parent_category IS
  'High-level category grouping for simplified user filtering. Maps 40 granular categories to 8 intuitive parent categories.';

-- Map all existing tactics to their parent categories
-- Based on strategic analysis of 40 granular categories → 8 parent domains

UPDATE public.gh_tactic_instructions
SET parent_category = CASE

  -- 1. MARKETING & LEAD GENERATION (5 subcategories)
  WHEN category IN (
    'Digital Marketing & Web Presence',
    'Marketing Materials Creation',
    'Boots-on-the-Ground Marketing',
    'Referral Source Development',
    'Lead Assessment & Qualification'
  ) THEN 'Marketing & Lead Generation'

  -- 2. LEGAL & COMPLIANCE (5 subcategories)
  WHEN category IN (
    'Legal Research',
    'Legal & Compliance',
    'Legal Structure',
    'Licensing & Compliance',
    'Insurance & Risk Management'
  ) THEN 'Legal & Compliance'

  -- 3. FINANCIAL STRATEGY (4 subcategories)
  WHEN category IN (
    'Financial Planning',
    'Creative Financing & Real Estate',
    'Revenue Optimization',
    'Pricing Strategy'
  ) THEN 'Financial Strategy'

  -- 4. PROPERTY OPERATIONS (8 subcategories)
  WHEN category IN (
    'Property Search',
    'Property Acquisition',
    'Property Purchase Strategy',
    'Rental Arbitrage Strategy',
    'Landlord Outreach & Pitch',
    'Property Setup',
    'Utilities & Services Setup',
    'Furniture & Supplies'
  ) THEN 'Property Operations'

  -- 5. MARKET & BUSINESS PLANNING (3 subcategories)
  WHEN category IN (
    'Market Research',
    'Business Planning',
    'Business Formation & Setup'
  ) THEN 'Market & Business Planning'

  -- 6. STAFFING & RESIDENT CARE (4 subcategories)
  WHEN category IN (
    'House Manager/Staff',
    'Onboarding Documents & Process',
    'Medical Clearance & Health',
    'Safety & Compliance'
  ) THEN 'Staffing & Resident Care'

  -- 7. OPERATIONS MANAGEMENT (6 subcategories)
  WHEN category IN (
    'Daily Operations',
    'Weekly Operations',
    'Monthly Operations',
    'Quarterly Operations',
    'Annual Operations',
    'Systems & Automation'
  ) THEN 'Operations Management'

  -- 8. GROWTH & SCALING (3 subcategories)
  WHEN category IN (
    'Scaling & Growth',
    'Expansion & Diversification',
    'Non-Medical Home Care Agency'
  ) THEN 'Growth & Scaling'

  -- Fallback: Keep original category if no match (shouldn't happen)
  ELSE category
END
WHERE parent_category IS NULL;

-- Verify mapping results (for debugging)
DO $$
DECLARE
  unmapped_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM public.gh_tactic_instructions
  WHERE parent_category IS NULL OR parent_category = category;

  SELECT COUNT(*) INTO total_count
  FROM public.gh_tactic_instructions;

  IF unmapped_count > 0 THEN
    RAISE NOTICE 'Warning: % tactics could not be mapped to parent categories (out of % total)', unmapped_count, total_count;
  ELSE
    RAISE NOTICE 'Success: All % tactics mapped to parent categories', total_count;
  END IF;
END $$;

-- Create materialized view for parent category statistics (optional performance optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.parent_category_stats AS
SELECT
  parent_category,
  COUNT(*) as tactic_count,
  COUNT(DISTINCT category) as subcategory_count,
  ARRAY_AGG(DISTINCT category ORDER BY category) as subcategories,
  ARRAY_AGG(DISTINCT week_assignment ORDER BY week_assignment) as weeks_covered
FROM public.gh_tactic_instructions
WHERE parent_category IS NOT NULL
GROUP BY parent_category
ORDER BY parent_category;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_category_stats_parent
  ON public.parent_category_stats(parent_category);

-- Add refresh function (call after bulk tactic updates)
CREATE OR REPLACE FUNCTION refresh_parent_category_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.parent_category_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON MATERIALIZED VIEW public.parent_category_stats IS
  'Pre-computed parent category statistics for fast UI rendering. Refresh after bulk tactic updates.';

-- Grant appropriate permissions
GRANT SELECT ON public.parent_category_stats TO authenticated;
GRANT SELECT ON public.parent_category_stats TO anon;
