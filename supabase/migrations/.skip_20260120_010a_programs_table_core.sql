-- ============================================================================
-- FEAT-GH-009-A PART 1: Create gh_programs table (CORE)
-- ============================================================================
-- Purpose: Top-level course container for the Phase-Based Course Platform
-- NOTE: Run this FIRST, then 011, 012, 013, 014, then 010b for enrollment policy
-- ============================================================================

-- 1. CREATE PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.gh_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Program identification
  title TEXT NOT NULL,
  slug TEXT UNIQUE,  -- URL-friendly identifier (auto-generated if not provided)
  description TEXT,
  short_description TEXT,  -- For cards/previews (max 200 chars)

  -- Thumbnail/branding
  thumbnail_url TEXT,
  banner_url TEXT,

  -- Instructor information
  instructor_name TEXT,
  instructor_avatar_url TEXT,
  instructor_bio TEXT,

  -- Status management
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT false,  -- Show in public catalog?

  -- Pricing/access
  access_type TEXT DEFAULT 'paid' CHECK (access_type IN ('free', 'paid', 'subscription')),
  price_cents INTEGER,  -- Price in cents (if paid)
  currency TEXT DEFAULT 'USD',

  -- Completion settings
  certificate_enabled BOOLEAN DEFAULT false,
  certificate_template_id UUID,  -- Future: link to certificate template

  -- Drip default model (can be overridden at phase/lesson level)
  default_drip_model TEXT DEFAULT 'progress' CHECK (default_drip_model IN (
    'immediate',  -- All content available immediately
    'calendar',   -- Unlock on specific dates
    'relative',   -- Unlock X days after enrollment
    'progress'    -- Unlock when previous phase complete
  )),

  -- Metadata
  estimated_duration_minutes INTEGER,  -- Total estimated time
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],  -- For categorization/search

  -- Settings (extensible JSON)
  settings JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,  -- When first published
  archived_at TIMESTAMPTZ     -- When archived
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_gh_programs_status
  ON public.gh_programs(status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_gh_programs_slug
  ON public.gh_programs(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gh_programs_is_public
  ON public.gh_programs(is_public, status)
  WHERE is_public = true AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_gh_programs_created_at
  ON public.gh_programs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gh_programs_tags
  ON public.gh_programs USING GIN(tags);

-- 3. ENABLE RLS
ALTER TABLE public.gh_programs ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES (WITHOUT enrollment dependency)

-- Anyone can view published public programs
CREATE POLICY "Anyone can view published public programs"
  ON public.gh_programs FOR SELECT
  USING (status = 'published' AND is_public = true);

-- NOTE: "Enrolled users can view their programs" policy will be added in 010b
-- after gh_user_program_enrollments table exists

-- Admins can view all programs
CREATE POLICY "Admins can view all programs"
  ON public.gh_programs FOR SELECT
  USING ((SELECT public.is_admin()));

-- Coaches can view all programs
CREATE POLICY "Coaches can view all programs"
  ON public.gh_programs FOR SELECT
  USING ((SELECT public.is_coach()));

-- Admins can create programs
CREATE POLICY "Admins can insert programs"
  ON public.gh_programs FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- Coaches can create programs
CREATE POLICY "Coaches can insert programs"
  ON public.gh_programs FOR INSERT
  WITH CHECK ((SELECT public.is_coach()));

-- Admins can update programs
CREATE POLICY "Admins can update programs"
  ON public.gh_programs FOR UPDATE
  USING ((SELECT public.is_admin()));

-- Coaches can update programs
CREATE POLICY "Coaches can update programs"
  ON public.gh_programs FOR UPDATE
  USING ((SELECT public.is_coach()));

-- Only super admins can delete programs
CREATE POLICY "Super admins can delete programs"
  ON public.gh_programs FOR DELETE
  USING ((SELECT public.is_super_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set published_at on first publish
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;

  -- Auto-set archived_at on archive
  IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
    NEW.archived_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_programs_updated_at
  ON public.gh_programs;

CREATE TRIGGER trigger_update_gh_programs_updated_at
  BEFORE UPDATE ON public.gh_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_programs_updated_at();

-- 6. AUTO-GENERATE SLUG TRIGGER
CREATE OR REPLACE FUNCTION generate_program_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if slug not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Convert title to slug: lowercase, replace spaces with dashes, remove special chars
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    -- Handle empty slug
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'program';
    END IF;

    final_slug := base_slug;

    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.gh_programs WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_program_slug
  ON public.gh_programs;

CREATE TRIGGER trigger_generate_program_slug
  BEFORE INSERT ON public.gh_programs
  FOR EACH ROW
  EXECUTE FUNCTION generate_program_slug();

-- 7. ADD COMMENTS
COMMENT ON TABLE public.gh_programs IS
  'Top-level course container for the Phase-Based Course Platform. Programs are Netflix-style courses that learners enroll in.';

COMMENT ON COLUMN public.gh_programs.slug IS
  'URL-friendly identifier for the program, auto-generated from title if not provided';

COMMENT ON COLUMN public.gh_programs.status IS
  'draft = only visible to admins, published = visible to enrolled users, archived = hidden from all';

COMMENT ON COLUMN public.gh_programs.is_public IS
  'If true, program appears in public catalog. If false, only enrolled users can see it.';

COMMENT ON COLUMN public.gh_programs.default_drip_model IS
  'Default unlock strategy for phases: immediate, calendar (specific dates), relative (days from enrollment), progress (complete previous first)';

COMMENT ON COLUMN public.gh_programs.settings IS
  'Extensible JSON settings for program-specific configurations';

-- 8. VERIFICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_programs' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-009-A PART 1: gh_programs table created successfully';
    RAISE NOTICE '  → NOTE: Run migrations 011-014, then 010b for enrollment policy';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-A PART 1: gh_programs table creation FAILED';
  END IF;
END $$;
