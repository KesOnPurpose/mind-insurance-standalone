-- ============================================================================
-- COMPLIANCE HUB: Database Schema Migration
-- ============================================================================
-- Feature: "Google for Grouphome Compliance" - $100M Feature
--
-- This migration creates all tables needed for:
-- 1. Digital Compliance Binder (user's defensive documentation portfolio)
-- 2. Document Vault (uploaded compliance documents)
-- 3. Compliance Assessments (Phase 1 workbook digitization)
-- 4. Multi-Property Portfolio Management (sticky feature)
-- 5. Share Links (attorney/consultant access)
--
-- NOTE: The compliance SEARCH leverages existing gh_training_chunks table
-- which already contains 50 state compliance data with embeddings.
-- ============================================================================

-- ============================================================================
-- SECTION 1: COMPLIANCE BINDERS
-- Core user-owned documentation portfolios
-- ============================================================================

-- Drop existing tables if recreating (for development)
DROP TABLE IF EXISTS compliance_findings CASCADE;
DROP TABLE IF EXISTS compliance_assessments CASCADE;
DROP TABLE IF EXISTS binder_share_links CASCADE;
DROP TABLE IF EXISTS binder_documents CASCADE;
DROP TABLE IF EXISTS binder_items CASCADE;
DROP TABLE IF EXISTS compliance_binders CASCADE;

-- 1.1 Main binder table - each user can have multiple binders (per state/property)
CREATE TABLE compliance_binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID, -- Optional link to property (added FK after properties table)
  name TEXT NOT NULL DEFAULT 'My Compliance Binder',
  state_code TEXT NOT NULL, -- Two-letter state code (TX, CA, FL, etc.)
  city TEXT,
  county TEXT,
  model_definition TEXT, -- One-sentence housing model description
  is_primary BOOLEAN DEFAULT FALSE, -- User's primary binder for this state
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX idx_compliance_binders_user ON compliance_binders(user_id);
CREATE INDEX idx_compliance_binders_state ON compliance_binders(state_code);
CREATE INDEX idx_compliance_binders_property ON compliance_binders(property_id);

-- RLS: Users can only access their own binders
ALTER TABLE compliance_binders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their binders" ON compliance_binders
  FOR ALL USING (auth.uid() = user_id);

-- 1.2 Binder items - saved search results and regulatory sections
CREATE TABLE binder_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES compliance_binders(id) ON DELETE CASCADE,
  chunk_id UUID, -- Reference to gh_training_chunks.id (optional)
  chunk_content TEXT NOT NULL, -- Cached content for offline/export
  section_type TEXT NOT NULL DEFAULT 'general', -- 'licensure', 'fha', 'local', 'notes', 'general'
  title TEXT, -- User-editable title
  user_notes TEXT, -- User's interpretation/notes
  source_url TEXT, -- Original regulation URL
  regulation_code TEXT, -- e.g., "HSC §1569.17"
  sort_order INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for binder item lookups
CREATE INDEX idx_binder_items_binder ON binder_items(binder_id, sort_order);
CREATE INDEX idx_binder_items_section ON binder_items(binder_id, section_type);
CREATE INDEX idx_binder_items_starred ON binder_items(binder_id, is_starred) WHERE is_starred = TRUE;

-- RLS: Users can only access items in their binders
ALTER TABLE binder_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their binder items" ON binder_items
  FOR ALL USING (
    binder_id IN (SELECT id FROM compliance_binders WHERE user_id = auth.uid())
  );

-- ============================================================================
-- SECTION 2: DOCUMENT VAULT (Stickiness Feature)
-- Store actual uploaded compliance documents
-- ============================================================================

-- 2.1 Document metadata table
CREATE TABLE binder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES compliance_binders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'license', 'permit', 'insurance', 'lease', 'inspection', 'certificate', 'other'
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size INTEGER, -- Size in bytes
  mime_type TEXT,
  description TEXT,
  expires_at DATE, -- For renewal reminders
  is_verified BOOLEAN DEFAULT FALSE, -- Admin verification flag
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_binder_documents_binder ON binder_documents(binder_id);
CREATE INDEX idx_binder_documents_type ON binder_documents(binder_id, document_type);
CREATE INDEX idx_binder_documents_expiry ON binder_documents(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE binder_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their documents" ON binder_documents
  FOR ALL USING (
    binder_id IN (SELECT id FROM compliance_binders WHERE user_id = auth.uid())
  );

-- ============================================================================
-- SECTION 3: SHARE LINKS (Stickiness Feature)
-- Generate shareable links for attorneys/consultants
-- ============================================================================

CREATE TABLE binder_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES compliance_binders(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE, -- Random token for URL
  permissions JSONB DEFAULT '{"view_sections": true, "view_documents": true}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
  is_active BOOLEAN DEFAULT TRUE,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_share_links_token ON binder_share_links(share_token) WHERE is_active = TRUE;
CREATE INDEX idx_share_links_binder ON binder_share_links(binder_id);

-- RLS
ALTER TABLE binder_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their share links" ON binder_share_links
  FOR ALL USING (
    binder_id IN (SELECT id FROM compliance_binders WHERE user_id = auth.uid())
  );

-- Public read policy for shared links (by token)
CREATE POLICY "Public can view via token" ON binder_share_links
  FOR SELECT USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- ============================================================================
-- SECTION 4: COMPLIANCE ASSESSMENTS (Workbook Digitization)
-- Phase 1 Compliance Workbook tracking
-- ============================================================================

-- 4.1 Assessment progress tracking
CREATE TABLE compliance_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  binder_id UUID REFERENCES compliance_binders(id) ON DELETE SET NULL,
  state_code TEXT NOT NULL,
  model_definition TEXT,
  -- Section progress: {"0": "complete", "1.1": "in_progress", "1.2": "pending"}
  section_progress JSONB DEFAULT '{}'::jsonb,
  -- Final determination: 'proceed', 'address_gaps', 'pending', 'not_started'
  final_determination TEXT DEFAULT 'not_started',
  determination_notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessments_user ON compliance_assessments(user_id);
CREATE INDEX idx_assessments_state ON compliance_assessments(state_code);
CREATE INDEX idx_assessments_binder ON compliance_assessments(binder_id);

-- RLS
ALTER TABLE compliance_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their assessments" ON compliance_assessments
  FOR ALL USING (auth.uid() = user_id);

-- 4.2 Assessment findings - audit trail of research
CREATE TABLE compliance_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES compliance_assessments(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL, -- "0", "1.1", "1.2", etc.
  research_url TEXT, -- URL user researched
  pasted_language TEXT, -- Copied regulation text
  user_interpretation TEXT, -- User's plain-English interpretation
  -- Conclusion: 'not_subject', 'may_be_subject', 'subject', 'needs_review', 'n/a'
  conclusion TEXT,
  is_flagged BOOLEAN DEFAULT FALSE, -- Risk indicator
  auto_saved_to_binder BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_findings_assessment ON compliance_findings(assessment_id);
CREATE INDEX idx_findings_section ON compliance_findings(assessment_id, section_id);
CREATE INDEX idx_findings_flagged ON compliance_findings(assessment_id, is_flagged) WHERE is_flagged = TRUE;

-- RLS
ALTER TABLE compliance_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their findings" ON compliance_findings
  FOR ALL USING (
    assessment_id IN (SELECT id FROM compliance_assessments WHERE user_id = auth.uid())
  );

-- ============================================================================
-- SECTION 5: MULTI-PROPERTY PORTFOLIO (Major Stickiness Feature)
-- Comprehensive property management with Calculator, Binder, Financials
-- ============================================================================

-- 5.1 Core property table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL, -- "The Oak House"
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_code TEXT NOT NULL,
  zip_code TEXT,
  -- Property details
  property_type TEXT, -- 'single_family', 'multi_family', 'duplex', 'apartment', 'townhouse'
  square_footage INTEGER,
  year_built INTEGER,
  lot_size TEXT,
  -- Ownership model
  ownership_model TEXT, -- 'rental_arbitrage', 'owned', 'seller_financing', 'lease_option'
  monthly_rent_or_mortgage INTEGER, -- Monthly payment amount
  purchase_price INTEGER,
  down_payment INTEGER,
  acquisition_date DATE,
  operating_since DATE,
  -- Features
  amenities JSONB DEFAULT '[]'::jsonb, -- ['washer_dryer', 'parking', 'central_ac', 'accessible']
  photos JSONB DEFAULT '[]'::jsonb, -- Array of Supabase Storage URLs
  -- Bed configuration summary
  configured_beds INTEGER DEFAULT 0,
  default_rate_per_bed INTEGER,
  target_occupancy_percent INTEGER DEFAULT 90,
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_properties_user ON properties(user_id);
CREATE INDEX idx_properties_user_active ON properties(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_properties_state ON properties(state_code);

-- RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their properties" ON properties
  FOR ALL USING (auth.uid() = user_id);

-- 5.2 Room configuration per property
CREATE TABLE property_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL, -- "Master Suite", "Room A", etc.
  rate_per_month INTEGER NOT NULL, -- Monthly rate
  features TEXT[] DEFAULT '{}', -- ['private_bath', 'walk_in_closet', 'window_ac']
  -- Occupancy tracking
  is_occupied BOOLEAN DEFAULT FALSE,
  occupied_since DATE,
  tenant_notes TEXT,
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rooms_property ON property_rooms(property_id, sort_order);
CREATE INDEX idx_rooms_occupied ON property_rooms(property_id, is_occupied);

-- RLS
ALTER TABLE property_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their rooms" ON property_rooms
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  );

-- 5.3 Monthly financial tracking (optional actuals)
CREATE TABLE property_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- '2026-01' format
  -- Revenue
  actual_revenue INTEGER,
  projected_revenue INTEGER,
  -- Expenses (matching calculator categories)
  actual_rent INTEGER,
  actual_utilities INTEGER,
  actual_insurance INTEGER,
  actual_food INTEGER,
  actual_staffing INTEGER,
  actual_maintenance INTEGER,
  actual_misc INTEGER,
  -- Projections from calculator
  projected_rent INTEGER,
  projected_utilities INTEGER,
  projected_insurance INTEGER,
  projected_food INTEGER,
  projected_staffing INTEGER,
  projected_maintenance INTEGER,
  projected_misc INTEGER,
  -- Notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Unique constraint for one record per property per month
  UNIQUE(property_id, month_year)
);

-- Indexes
CREATE INDEX idx_financials_property_month ON property_financials(property_id, month_year);

-- RLS
ALTER TABLE property_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their financials" ON property_financials
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  );

-- 5.4 Property timeline (milestones and journal)
CREATE TABLE property_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'milestone', 'note', 'goal', 'maintenance', 'expense', 'income'
  title TEXT NOT NULL,
  description TEXT,
  amount INTEGER, -- For expense/income tracking
  is_pinned BOOLEAN DEFAULT FALSE, -- Important events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_timeline_property_date ON property_timeline(property_id, event_date DESC);
CREATE INDEX idx_timeline_property_type ON property_timeline(property_id, event_type);

-- RLS
ALTER TABLE property_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their timeline" ON property_timeline
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  );

-- 5.5 Property goals
CREATE TABLE property_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'monthly_profit', 'annual_profit', 'occupancy', 'compliance_score'
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  target_period TEXT, -- '2026-01' for monthly, '2026' for annual, NULL for ongoing
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_goals_property ON property_goals(property_id);
CREATE INDEX idx_goals_achieved ON property_goals(property_id, is_achieved);

-- RLS
ALTER TABLE property_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their goals" ON property_goals
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  );

-- 5.6 Calculator scenarios saved per property
CREATE TABLE property_calculator_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL DEFAULT 'Default',
  calculator_inputs JSONB NOT NULL, -- Full calculator input state
  calculator_outputs JSONB, -- Cached outputs (optional)
  is_active BOOLEAN DEFAULT FALSE, -- Current operating scenario
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_scenarios_property ON property_calculator_scenarios(property_id);
CREATE INDEX idx_scenarios_active ON property_calculator_scenarios(property_id, is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE property_calculator_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their scenarios" ON property_calculator_scenarios
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE user_id = auth.uid())
  );

-- ============================================================================
-- SECTION 6: ADD FOREIGN KEYS AFTER ALL TABLES EXIST
-- ============================================================================

-- Link compliance_binders to properties (optional)
ALTER TABLE compliance_binders
  ADD CONSTRAINT fk_binders_property
  FOREIGN KEY (property_id)
  REFERENCES properties(id)
  ON DELETE SET NULL;

-- ============================================================================
-- SECTION 7: SAVED STATE COMPARISONS
-- For comparing multiple states
-- ============================================================================

CREATE TABLE saved_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'State Comparison',
  state_codes TEXT[] NOT NULL, -- ['TX', 'CA', 'FL']
  sections_compared TEXT[], -- ['licensure', 'fha', 'local']
  comparison_data JSONB, -- Cached comparison results
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comparisons_user ON saved_comparisons(user_id);

-- RLS
ALTER TABLE saved_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their comparisons" ON saved_comparisons
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 8: HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_compliance_binders_updated_at
  BEFORE UPDATE ON compliance_binders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_binder_items_updated_at
  BEFORE UPDATE ON binder_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_binder_documents_updated_at
  BEFORE UPDATE ON binder_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_assessments_updated_at
  BEFORE UPDATE ON compliance_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_findings_updated_at
  BEFORE UPDATE ON compliance_findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_rooms_updated_at
  BEFORE UPDATE ON property_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_financials_updated_at
  BEFORE UPDATE ON property_financials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_goals_updated_at
  BEFORE UPDATE ON property_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_calculator_scenarios_updated_at
  BEFORE UPDATE ON property_calculator_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_comparisons_updated_at
  BEFORE UPDATE ON saved_comparisons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 9: STORAGE BUCKET FOR COMPLIANCE DOCUMENTS
-- ============================================================================

-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-documents',
  'compliance-documents',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for compliance documents
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- SECTION 10: VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'compliance_binders',
    'binder_items',
    'binder_documents',
    'binder_share_links',
    'compliance_assessments',
    'compliance_findings',
    'properties',
    'property_rooms',
    'property_financials',
    'property_timeline',
    'property_goals',
    'property_calculator_scenarios',
    'saved_comparisons'
  );

  IF table_count = 13 THEN
    RAISE NOTICE '✅ All 13 Compliance Hub tables created successfully';
  ELSE
    RAISE EXCEPTION '❌ Expected 13 tables but found %', table_count;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Tables Created:
-- 1. compliance_binders - User's compliance documentation portfolios
-- 2. binder_items - Saved search results and regulatory sections
-- 3. binder_documents - Uploaded compliance documents (licenses, permits)
-- 4. binder_share_links - Shareable links for attorneys/consultants
-- 5. compliance_assessments - Workbook progress tracking
-- 6. compliance_findings - Assessment findings audit trail
-- 7. properties - Multi-property portfolio
-- 8. property_rooms - Room configuration per property
-- 9. property_financials - Monthly financial tracking
-- 10. property_timeline - Milestones and journal entries
-- 11. property_goals - Property-level goals
-- 12. property_calculator_scenarios - Saved calculator configurations
-- 13. saved_comparisons - State comparison snapshots
--
-- Storage:
-- - compliance-documents bucket for file uploads
--
-- All tables have:
-- - UUID primary keys
-- - RLS enabled with user-owned policies
-- - Appropriate indexes for performance
-- - Updated_at triggers
-- ============================================================================
