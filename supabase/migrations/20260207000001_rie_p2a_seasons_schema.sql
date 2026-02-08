-- =============================================================================
-- RIE Session S2: Phase 2A Seasons Schema Enhancement
-- Adds missing columns to relationship_season_catalog and relationship_user_seasons,
-- creates relationship_season_signals, and adds partner-scoped RLS policies.
--
-- SAFE: Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS for idempotency.
-- =============================================================================

-- -----------------------------------------------
-- 1. Enhance relationship_season_catalog
--    Add: season_number, life_stage, is_hero
-- -----------------------------------------------

-- season_number: unique sequential identifier (1-90)
ALTER TABLE relationship_season_catalog
  ADD COLUMN IF NOT EXISTS season_number INTEGER;

-- life_stage: filters seasons by user's current life phase
ALTER TABLE relationship_season_catalog
  ADD COLUMN IF NOT EXISTS life_stage TEXT NOT NULL DEFAULT 'any';

-- is_hero: flagship season per category (shown prominently)
ALTER TABLE relationship_season_catalog
  ADD COLUMN IF NOT EXISTS is_hero BOOLEAN NOT NULL DEFAULT FALSE;

-- Add CHECK constraint on life_stage (wrapped in DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_season_catalog_life_stage'
  ) THEN
    ALTER TABLE relationship_season_catalog
      ADD CONSTRAINT chk_season_catalog_life_stage
      CHECK (life_stage IN (
        'early_marriage', 'young_family', 'established_family',
        'midlife', 'empty_nest', 'retirement', 'any'
      ));
  END IF;
END $$;

-- Add UNIQUE constraint on season_number (allowing NULLs during backfill)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_season_catalog_season_number'
  ) THEN
    ALTER TABLE relationship_season_catalog
      ADD CONSTRAINT uq_season_catalog_season_number UNIQUE (season_number);
  END IF;
END $$;

-- Index on life_stage for pre-filter queries
CREATE INDEX IF NOT EXISTS idx_season_catalog_life_stage
  ON relationship_season_catalog(life_stage);

-- Index on (category, life_stage) for combined filtering
CREATE INDEX IF NOT EXISTS idx_season_catalog_category_life_stage
  ON relationship_season_catalog(category, life_stage);


-- -----------------------------------------------
-- 2. Enhance relationship_user_seasons
--    Add: partnership_id, status, healing_progress, is_private
-- -----------------------------------------------

-- partnership_id: links season to a specific partnership (nullable)
ALTER TABLE relationship_user_seasons
  ADD COLUMN IF NOT EXISTS partnership_id UUID REFERENCES relationship_partnerships(id) ON DELETE SET NULL;

-- status: current, past_healed, past_unhealed
ALTER TABLE relationship_user_seasons
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'current';

-- healing_progress: 0-100 scale for past seasons
ALTER TABLE relationship_user_seasons
  ADD COLUMN IF NOT EXISTS healing_progress INTEGER NOT NULL DEFAULT 50;

-- is_private: hide from partner view
ALTER TABLE relationship_user_seasons
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

-- Add CHECK constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_seasons_status'
  ) THEN
    ALTER TABLE relationship_user_seasons
      ADD CONSTRAINT chk_user_seasons_status
      CHECK (status IN ('current', 'past_healed', 'past_unhealed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_seasons_healing_progress'
  ) THEN
    ALTER TABLE relationship_user_seasons
      ADD CONSTRAINT chk_user_seasons_healing_progress
      CHECK (healing_progress >= 0 AND healing_progress <= 100);
  END IF;
END $$;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_seasons_user_status
  ON relationship_user_seasons(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_seasons_partnership
  ON relationship_user_seasons(partnership_id)
  WHERE partnership_id IS NOT NULL;

-- Partner access RLS policy: partners can see shared (non-private) seasons
-- First check if policy exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_user_seasons'
    AND policyname = 'Partners can read shared seasons'
  ) THEN
    CREATE POLICY "Partners can read shared seasons"
      ON relationship_user_seasons FOR SELECT
      TO authenticated
      USING (
        is_private = FALSE
        AND partnership_id IN (
          SELECT id FROM relationship_partnerships
          WHERE (user_id = auth.uid() OR partner_id = auth.uid())
          AND status = 'active'
        )
      );
  END IF;
END $$;

-- Delete policy for own rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_user_seasons'
    AND policyname = 'Users can delete own seasons'
  ) THEN
    CREATE POLICY "Users can delete own seasons"
      ON relationship_user_seasons FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- -----------------------------------------------
-- 3. Create relationship_season_signals (new table)
-- -----------------------------------------------

CREATE TABLE IF NOT EXISTS relationship_season_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES relationship_season_catalog(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  signal_data JSONB NOT NULL DEFAULT '{}',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed BOOLEAN NOT NULL DEFAULT FALSE
);

-- CHECK constraints for signals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_signal_type'
  ) THEN
    ALTER TABLE relationship_season_signals
      ADD CONSTRAINT chk_signal_type
      CHECK (signal_type IN ('temporal', 'life_stage', 'kpi_pattern', 'emotional', 'explicit'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_signal_confidence'
  ) THEN
    ALTER TABLE relationship_season_signals
      ADD CONSTRAINT chk_signal_confidence
      CHECK (confidence_score >= 0 AND confidence_score <= 1);
  END IF;
END $$;

-- Indexes for signals
CREATE INDEX IF NOT EXISTS idx_season_signals_user_dismissed
  ON relationship_season_signals(user_id, dismissed);

CREATE INDEX IF NOT EXISTS idx_season_signals_season
  ON relationship_season_signals(season_id);

-- RLS: Signals are strictly private to the user
ALTER TABLE relationship_season_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_season_signals'
    AND policyname = 'Users can read own signals'
  ) THEN
    CREATE POLICY "Users can read own signals"
      ON relationship_season_signals FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_season_signals'
    AND policyname = 'Users can insert own signals'
  ) THEN
    CREATE POLICY "Users can insert own signals"
      ON relationship_season_signals FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_season_signals'
    AND policyname = 'Users can update own signals'
  ) THEN
    CREATE POLICY "Users can update own signals"
      ON relationship_season_signals FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_season_signals'
    AND policyname = 'Users can delete own signals'
  ) THEN
    CREATE POLICY "Users can delete own signals"
      ON relationship_season_signals FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role full access for signals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'relationship_season_signals'
    AND policyname = 'Service role full access to signals'
  ) THEN
    CREATE POLICY "Service role full access to signals"
      ON relationship_season_signals FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- -----------------------------------------------
-- 4. Backfill season_number for existing 90 seeds
--    Assigns 1-90 based on category order + display_order
-- -----------------------------------------------

-- Category ordering: new_parents=1-9, career_transition=10-18, health_crisis=19-27,
-- financial_stress=28-36, relocation=37-45, grief_loss=46-54, spiritual_growth=55-63,
-- empty_nest=64-72, retirement=73-81, blended_family=82-90

WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE category
          WHEN 'new_parents' THEN 1
          WHEN 'career_transition' THEN 2
          WHEN 'health_crisis' THEN 3
          WHEN 'financial_stress' THEN 4
          WHEN 'relocation' THEN 5
          WHEN 'grief_loss' THEN 6
          WHEN 'spiritual_growth' THEN 7
          WHEN 'empty_nest' THEN 8
          WHEN 'retirement' THEN 9
          WHEN 'blended_family' THEN 10
        END,
        display_order
    ) AS season_num
  FROM relationship_season_catalog
  WHERE season_number IS NULL
)
UPDATE relationship_season_catalog c
SET season_number = n.season_num
FROM numbered n
WHERE c.id = n.id;


-- -----------------------------------------------
-- 5. Backfill life_stage based on category mapping
-- -----------------------------------------------

UPDATE relationship_season_catalog SET life_stage = 'young_family'
WHERE category = 'new_parents' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'career_transition' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'health_crisis' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'financial_stress' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'relocation' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'grief_loss' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'spiritual_growth' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'empty_nest'
WHERE category = 'empty_nest' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'retirement'
WHERE category = 'retirement' AND life_stage = 'any';

UPDATE relationship_season_catalog SET life_stage = 'any'
WHERE category = 'blended_family' AND life_stage = 'any';

-- Specific life_stage overrides for seasons that span multiple stages
-- Early marriage seasons
UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE season_name IN ('Expecting First Child', 'Moving In Together')
  AND life_stage != 'early_marriage';

-- Midlife seasons
UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE season_name IN (
  'Retirement Planning Disagreement',
  'Caring for Aging Parents',
  'Identity After Parenting'
) AND life_stage NOT IN ('midlife', 'empty_nest');


-- -----------------------------------------------
-- 6. Set is_hero flags (1 per category, display_order=1)
-- -----------------------------------------------

UPDATE relationship_season_catalog
SET is_hero = TRUE
WHERE display_order = 1
  AND is_hero = FALSE;


-- -----------------------------------------------
-- Done. Summary of changes:
--   relationship_season_catalog: +season_number, +life_stage, +is_hero
--   relationship_user_seasons: +partnership_id, +status, +healing_progress, +is_private
--   relationship_season_signals: NEW TABLE (detection signals with confidence)
--   RLS: Partner access policy on user_seasons, full user isolation on signals
-- -----------------------------------------------
