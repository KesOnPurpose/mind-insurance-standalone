-- ============================================================================
-- FEAT-GH-004-A: Create gh_curriculum_config table
-- ============================================================================
-- Purpose: Template-scalable configuration settings for course/curriculum
-- This allows Lynette (or future coaches) to customize thresholds without code changes
-- ============================================================================

-- 1. CREATE CURRICULUM CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.gh_curriculum_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Config identification
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,

  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'video_tracking',      -- Video watch completion thresholds
    'assessment',          -- Assessment pass thresholds
    'stuck_detection',     -- Inactivity thresholds for nudges
    'completion_gates',    -- Requirements for marking tactics complete
    'notifications',       -- SMS/email timing and content
    'coaching'             -- Coach-specific settings
  )),

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_gh_curriculum_config_key
  ON public.gh_curriculum_config(config_key);

CREATE INDEX IF NOT EXISTS idx_gh_curriculum_config_category
  ON public.gh_curriculum_config(category)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_gh_curriculum_config_active
  ON public.gh_curriculum_config(is_active, category);

-- 3. ENABLE RLS
ALTER TABLE public.gh_curriculum_config ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Admins can view all config
CREATE POLICY "Admins can view curriculum config"
  ON public.gh_curriculum_config FOR SELECT
  USING ((SELECT public.is_admin()));

-- Super admins can manage config
CREATE POLICY "Super admins can insert curriculum config"
  ON public.gh_curriculum_config FOR INSERT
  WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Super admins can update curriculum config"
  ON public.gh_curriculum_config FOR UPDATE
  USING ((SELECT public.is_super_admin()));

CREATE POLICY "Super admins can delete curriculum config"
  ON public.gh_curriculum_config FOR DELETE
  USING ((SELECT public.is_super_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_curriculum_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_curriculum_config_updated_at
  ON public.gh_curriculum_config;

CREATE TRIGGER trigger_update_gh_curriculum_config_updated_at
  BEFORE UPDATE ON public.gh_curriculum_config
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_curriculum_config_updated_at();

-- 6. ADD COMMENTS
COMMENT ON TABLE public.gh_curriculum_config IS
  'Template-scalable configuration for course curriculum settings. Allows coaches to customize thresholds without code changes.';

COMMENT ON COLUMN public.gh_curriculum_config.config_key IS
  'Unique key for this config setting (e.g., video_completion_threshold, stuck_days_before_nudge)';

COMMENT ON COLUMN public.gh_curriculum_config.config_value IS
  'JSON value containing the configuration (supports complex nested settings)';

COMMENT ON COLUMN public.gh_curriculum_config.category IS
  'Category grouping for related configurations';

-- 7. VERIFICATION QUERY (for testing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_curriculum_config' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-004-A: gh_curriculum_config table created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-A: gh_curriculum_config table creation FAILED';
  END IF;
END $$;
