-- ============================================================================
-- FEAT-GH-014-v2: Create State Compliance Binders Table
-- ============================================================================
-- Purpose: Store complete state compliance binders (ONE document per state)
-- This replaces the 943 fragmented chunks with 50 complete, readable binders
-- ============================================================================

-- ============================================================================
-- PART 1: Create the state_compliance_binders table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.state_compliance_binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- State identification (UNIQUE - one binder per state)
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,

  -- Binder content
  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- Full markdown binder (~1,000 words)

  -- Metadata
  effective_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  word_count INTEGER,

  -- Section metadata (for TOC navigation)
  section_headers JSONB DEFAULT '[]'::jsonb,

  -- Extended metadata (for future features)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Create indexes for performance
-- ============================================================================

-- Primary lookup by state code
CREATE INDEX IF NOT EXISTS idx_state_compliance_binders_state_code
  ON public.state_compliance_binders(state_code);

-- Lookup by state name for search
CREATE INDEX IF NOT EXISTS idx_state_compliance_binders_state_name
  ON public.state_compliance_binders(state_name);

-- Full-text search on content
CREATE INDEX IF NOT EXISTS idx_state_compliance_binders_content_search
  ON public.state_compliance_binders USING gin(to_tsvector('english', content));

-- ============================================================================
-- PART 3: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.state_compliance_binders ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read compliance binders
CREATE POLICY "All users can read compliance binders"
  ON public.state_compliance_binders FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete (via service role)
-- This is enforced at the application level, not RLS

-- ============================================================================
-- PART 4: Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_state_compliance_binders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS state_compliance_binders_updated_at ON public.state_compliance_binders;

CREATE TRIGGER state_compliance_binders_updated_at
  BEFORE UPDATE ON public.state_compliance_binders
  FOR EACH ROW
  EXECUTE FUNCTION update_state_compliance_binders_updated_at();

-- ============================================================================
-- PART 5: Add table comments
-- ============================================================================

COMMENT ON TABLE public.state_compliance_binders IS
  'Complete state compliance binders - ONE document per state (50 total). '
  'Replaces fragmented chunks with full readable documents for the library.';

COMMENT ON COLUMN public.state_compliance_binders.state_code IS
  'Two-letter state code (e.g., CA, TX, NY). UNIQUE constraint ensures one binder per state.';

COMMENT ON COLUMN public.state_compliance_binders.content IS
  'Full markdown content of the binder (~1,000 words, 4-5 pages). '
  'Contains all sections: regulatory authority, licensed care categories, fair housing, etc.';

COMMENT ON COLUMN public.state_compliance_binders.section_headers IS
  'JSON array of section headers for TOC navigation. '
  'Format: [{"id": "section-1", "title": "Regulatory Authority", "level": 2}, ...]';

COMMENT ON COLUMN public.state_compliance_binders.metadata IS
  'Extended metadata for future features: source PDF path, version history, etc.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- To verify the table was created correctly:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'state_compliance_binders';
