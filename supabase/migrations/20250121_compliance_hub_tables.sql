-- ============================================================================
-- COMPLIANCE HUB DATABASE MIGRATION
-- ============================================================================
-- Creates tables for: Binders, Items, Documents, Share Links, Assessments,
-- Findings, and Saved Comparisons
-- ============================================================================

-- ============================================================================
-- 1. COMPLIANCE BINDERS (Main container for user's compliance research)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID DEFAULT NULL,
  name TEXT NOT NULL,
  state_code TEXT NOT NULL CHECK (state_code ~ '^[A-Z]{2}$'),
  city TEXT DEFAULT NULL,
  county TEXT DEFAULT NULL,
  model_definition TEXT DEFAULT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_compliance_binders_user_id ON public.compliance_binders(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_binders_state_code ON public.compliance_binders(state_code);

-- Ensure only one primary binder per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_binders_primary
  ON public.compliance_binders(user_id) WHERE is_primary = true;

-- ============================================================================
-- 2. BINDER ITEMS (Saved compliance research items)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.binder_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES public.compliance_binders(id) ON DELETE CASCADE,
  chunk_id UUID DEFAULT NULL,  -- References gh_training_chunks if from search
  chunk_content TEXT NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'model_definition', 'licensure', 'housing_categories', 'local',
    'fha', 'operational', 'notes', 'general'
  )),
  title TEXT DEFAULT NULL,
  user_notes TEXT DEFAULT NULL,
  source_url TEXT DEFAULT NULL,
  regulation_code TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_binder_items_binder_id ON public.binder_items(binder_id);
CREATE INDEX IF NOT EXISTS idx_binder_items_section_type ON public.binder_items(section_type);
CREATE INDEX IF NOT EXISTS idx_binder_items_sort_order ON public.binder_items(binder_id, sort_order);

-- ============================================================================
-- 3. BINDER DOCUMENTS (Uploaded files - licenses, permits, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.binder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES public.compliance_binders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'license', 'permit', 'insurance', 'lease', 'inspection',
    'certificate', 'zoning', 'fire_safety', 'background_check', 'other'
  )),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT NULL,
  mime_type TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_verified BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast document lookups
CREATE INDEX IF NOT EXISTS idx_binder_documents_binder_id ON public.binder_documents(binder_id);
CREATE INDEX IF NOT EXISTS idx_binder_documents_type ON public.binder_documents(document_type);

-- ============================================================================
-- 4. BINDER SHARE LINKS (For sharing binder with inspectors/officials)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.binder_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  binder_id UUID NOT NULL REFERENCES public.compliance_binders(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  permissions JSONB DEFAULT '{"view_sections": true, "view_documents": true}'::jsonb,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_binder_share_links_token ON public.binder_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_binder_share_links_binder_id ON public.binder_share_links(binder_id);

-- ============================================================================
-- 5. COMPLIANCE ASSESSMENTS (Workbook assessment records)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  binder_id UUID DEFAULT NULL REFERENCES public.compliance_binders(id) ON DELETE SET NULL,
  state_code TEXT NOT NULL CHECK (state_code ~ '^[A-Z]{2}$'),
  model_definition TEXT DEFAULT NULL,
  section_progress JSONB DEFAULT '{}'::jsonb,
  final_determination TEXT DEFAULT 'not_started' CHECK (final_determination IN (
    'not_started', 'pending', 'proceed', 'address_gaps'
  )),
  determination_notes TEXT DEFAULT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user + state lookup (common query)
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_user_id ON public.compliance_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_user_state
  ON public.compliance_assessments(user_id, state_code);

-- ============================================================================
-- 6. COMPLIANCE FINDINGS (Individual section findings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.compliance_assessments(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  research_url TEXT DEFAULT NULL,
  pasted_language TEXT DEFAULT NULL,
  user_interpretation TEXT DEFAULT NULL,
  conclusion TEXT DEFAULT NULL CHECK (conclusion IS NULL OR conclusion IN (
    'not_subject', 'may_be_subject', 'subject', 'needs_review', 'n_a'
  )),
  is_flagged BOOLEAN DEFAULT false,
  auto_saved_to_binder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for assessment + section lookup
CREATE INDEX IF NOT EXISTS idx_compliance_findings_assessment_id ON public.compliance_findings(assessment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_compliance_findings_assessment_section
  ON public.compliance_findings(assessment_id, section_id);

-- ============================================================================
-- 7. SAVED COMPARISONS (User's saved state comparisons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state_codes TEXT[] NOT NULL,
  sections_compared TEXT[] DEFAULT NULL,
  comparison_data JSONB DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_saved_comparisons_user_id ON public.saved_comparisons(user_id);

-- ============================================================================
-- 8. UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'compliance_binders', 'binder_items', 'binder_documents',
    'compliance_assessments', 'compliance_findings', 'saved_comparisons'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON public.%s
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.compliance_binders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binder_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

-- Compliance Binders: Users can only access their own binders
CREATE POLICY "Users can view own binders" ON public.compliance_binders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own binders" ON public.compliance_binders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own binders" ON public.compliance_binders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own binders" ON public.compliance_binders
  FOR DELETE USING (auth.uid() = user_id);

-- Binder Items: Access through binder ownership
CREATE POLICY "Users can view items in own binders" ON public.binder_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items in own binders" ON public.binder_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own binders" ON public.binder_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items in own binders" ON public.binder_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

-- Binder Documents: Access through binder ownership
CREATE POLICY "Users can view docs in own binders" ON public.binder_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create docs in own binders" ON public.binder_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update docs in own binders" ON public.binder_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete docs in own binders" ON public.binder_documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

-- Share Links: Access through binder ownership + public read via token
CREATE POLICY "Users can manage share links for own binders" ON public.binder_share_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.compliance_binders
      WHERE id = binder_id AND user_id = auth.uid()
    )
  );

-- Compliance Assessments: Users can only access their own
CREATE POLICY "Users can view own assessments" ON public.compliance_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" ON public.compliance_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON public.compliance_assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments" ON public.compliance_assessments
  FOR DELETE USING (auth.uid() = user_id);

-- Compliance Findings: Access through assessment ownership
CREATE POLICY "Users can view findings in own assessments" ON public.compliance_findings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.compliance_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create findings in own assessments" ON public.compliance_findings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compliance_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update findings in own assessments" ON public.compliance_findings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.compliance_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete findings in own assessments" ON public.compliance_findings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.compliance_assessments
      WHERE id = assessment_id AND user_id = auth.uid()
    )
  );

-- Saved Comparisons: Users can only access their own
CREATE POLICY "Users can view own comparisons" ON public.saved_comparisons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own comparisons" ON public.saved_comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comparisons" ON public.saved_comparisons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparisons" ON public.saved_comparisons
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. GRANTS (Allow authenticated users to access tables)
-- ============================================================================

GRANT ALL ON public.compliance_binders TO authenticated;
GRANT ALL ON public.binder_items TO authenticated;
GRANT ALL ON public.binder_documents TO authenticated;
GRANT ALL ON public.binder_share_links TO authenticated;
GRANT ALL ON public.compliance_assessments TO authenticated;
GRANT ALL ON public.compliance_findings TO authenticated;
GRANT ALL ON public.saved_comparisons TO authenticated;

-- ============================================================================
-- DONE!
-- ============================================================================
-- To run this migration:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire SQL and click "Run"
-- OR use Supabase CLI: supabase db push
-- ============================================================================
