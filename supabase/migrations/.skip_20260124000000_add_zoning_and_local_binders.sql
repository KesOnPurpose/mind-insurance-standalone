-- ============================================================================
-- MIGRATION: Add Zoning Content and Local Compliance Binders
-- ============================================================================
-- Purpose: Integrate 9 manually-created compliance documents:
--   - 6 State-level zoning documents (CA, FL, GA, NC, TX, SC)
--   - 3 Local-level binders (Pittsburgh PA, Queens NY, Linden NJ)
--
-- Strategy:
--   1. Add zoning columns to existing state_compliance_binders table
--   2. Create new local_compliance_binders table for cities and counties
-- ============================================================================

-- ============================================================================
-- 1. ADD ZONING COLUMNS TO state_compliance_binders
-- ============================================================================
-- These columns will store Section 3 deep-dive content focused on
-- zoning/occupancy frameworks (subsections 3A-3F)

ALTER TABLE public.state_compliance_binders
  ADD COLUMN IF NOT EXISTS zoning_content TEXT,
  ADD COLUMN IF NOT EXISTS zoning_section_headers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS zoning_word_count INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.state_compliance_binders.zoning_content IS 'Section 3 deep-dive: Zoning & Occupancy Framework content (3A-3F subsections)';
COMMENT ON COLUMN public.state_compliance_binders.zoning_section_headers IS 'Section headers for TOC navigation within zoning content';
COMMENT ON COLUMN public.state_compliance_binders.zoning_word_count IS 'Word count for zoning content';

-- ============================================================================
-- 2. CREATE location_type ENUM
-- ============================================================================
-- Supports both cities and counties in local_compliance_binders

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type') THEN
    CREATE TYPE location_type AS ENUM ('city', 'county');
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE local_compliance_binders TABLE
-- ============================================================================
-- System-level table (no user_id) for pre-populated local content
-- Covers BOTH cities (Pittsburgh, Linden) AND counties (Queens County)

CREATE TABLE IF NOT EXISTS public.local_compliance_binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location identification
  location_name TEXT NOT NULL,           -- "Pittsburgh" or "Queens County"
  location_type location_type NOT NULL,  -- 'city' or 'county'
  state_code TEXT NOT NULL,              -- "PA", "NY", "NJ"

  -- Binder content
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Metadata
  word_count INTEGER,
  section_headers JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique per location/state combination
  UNIQUE(location_name, state_code)
);

-- Add comments for documentation
COMMENT ON TABLE public.local_compliance_binders IS 'System-level compliance binders for cities and counties';
COMMENT ON COLUMN public.local_compliance_binders.location_name IS 'Name of city or county (e.g., Pittsburgh, Queens County)';
COMMENT ON COLUMN public.local_compliance_binders.location_type IS 'Whether this is a city or county binder';
COMMENT ON COLUMN public.local_compliance_binders.state_code IS 'Two-letter state code (e.g., PA, NY, NJ)';
COMMENT ON COLUMN public.local_compliance_binders.section_headers IS 'Section headers for TOC navigation (Sections 1-4)';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- System-level content: All authenticated users can read

ALTER TABLE public.local_compliance_binders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "All authenticated users can read local binders" ON public.local_compliance_binders;

-- All authenticated users can read (system-level content)
CREATE POLICY "All authenticated users can read local binders"
  ON public.local_compliance_binders
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 5. CREATE INDEXES FOR EFFICIENT QUERIES
-- ============================================================================

-- Index on state_code for filtering local binders by state
CREATE INDEX IF NOT EXISTS idx_local_binders_state
  ON public.local_compliance_binders(state_code);

-- Index on location_name for direct lookups
CREATE INDEX IF NOT EXISTS idx_local_binders_location
  ON public.local_compliance_binders(location_name);

-- Index on location_type for filtering by city vs county
CREATE INDEX IF NOT EXISTS idx_local_binders_type
  ON public.local_compliance_binders(location_type);

-- Composite index for common query pattern: state + type
CREATE INDEX IF NOT EXISTS idx_local_binders_state_type
  ON public.local_compliance_binders(state_code, location_type);

-- ============================================================================
-- 6. CREATE UPDATE TRIGGER FOR updated_at
-- ============================================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_local_compliance_binders_updated_at
  ON public.local_compliance_binders;

-- Create trigger
CREATE TRIGGER update_local_compliance_binders_updated_at
  BEFORE UPDATE ON public.local_compliance_binders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================
--
-- Check zoning columns exist:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'state_compliance_binders'
-- AND column_name LIKE 'zoning%';
--
-- Check local_compliance_binders table:
-- SELECT * FROM information_schema.tables
-- WHERE table_name = 'local_compliance_binders';
--
-- Check RLS policies:
-- SELECT * FROM pg_policies
-- WHERE tablename = 'local_compliance_binders';
--
-- Check indexes:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'local_compliance_binders';
-- ============================================================================
