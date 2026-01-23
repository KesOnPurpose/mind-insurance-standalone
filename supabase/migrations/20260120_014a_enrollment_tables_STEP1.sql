-- ============================================================================
-- FEAT-GH-009-E STEP 1: Create gh_user_program_enrollments table ONLY
-- ============================================================================
-- Purpose: Isolated table creation (no RLS policies yet)
-- Run this FIRST, then check if table exists before running STEP 2
-- ============================================================================

-- Drop table if it exists in a broken state (cleanup)
DROP TABLE IF EXISTS public.gh_user_program_enrollments CASCADE;

-- 1. CREATE THE TABLE
CREATE TABLE public.gh_user_program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.gh_programs(id) ON DELETE CASCADE,

  -- Enrollment details
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrollment_source TEXT DEFAULT 'manual' CHECK (enrollment_source IN (
    'manual', 'purchase', 'import', 'promo', 'gift', 'scholarship'
  )),

  -- Purchase tracking
  purchase_id TEXT,
  purchase_amount_cents INTEGER,
  purchase_currency TEXT DEFAULT 'USD',
  coupon_code TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'paused', 'cancelled', 'expired'
  )),

  -- Progress summary
  progress_percent INTEGER DEFAULT 0,
  completed_phases INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  total_watch_time_seconds INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Certificate
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,

  -- Settings
  settings JSONB DEFAULT '{}'::JSONB,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_program UNIQUE (user_id, program_id)
);

-- 2. CREATE INDEXES
CREATE INDEX idx_gh_enrollments_user_id ON public.gh_user_program_enrollments(user_id);
CREATE INDEX idx_gh_enrollments_program_id ON public.gh_user_program_enrollments(program_id);
CREATE INDEX idx_gh_enrollments_status ON public.gh_user_program_enrollments(status) WHERE status = 'active';
CREATE INDEX idx_gh_enrollments_purchase_id ON public.gh_user_program_enrollments(purchase_id) WHERE purchase_id IS NOT NULL;
CREATE INDEX idx_gh_enrollments_last_activity ON public.gh_user_program_enrollments(last_activity_at DESC);

-- 3. VERIFICATION
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'gh_user_program_enrollments'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✓ STEP 1 SUCCESS: gh_user_program_enrollments table created!';
    RAISE NOTICE '  → Now run STEP 2 to add RLS policies';
  ELSE
    RAISE EXCEPTION '✗ STEP 1 FAILED: gh_user_program_enrollments table NOT created';
  END IF;
END $$;
