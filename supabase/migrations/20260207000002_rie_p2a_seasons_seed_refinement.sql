-- =============================================================================
-- RIE Session S2: Seed Data Refinement
-- Fine-tunes life_stage assignments per individual season for accuracy.
-- The category-level backfill in 20260207000001 was a good start; this
-- migration adds per-season overrides based on actual season content.
--
-- Also sets additional is_hero flags for categories where display_order=1
-- might not be the best representative season.
-- =============================================================================

-- -----------------------------------------------
-- Per-season life_stage refinements
-- -----------------------------------------------

-- New Parents: Most are young_family, but some span early_marriage
UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE category = 'new_parents' AND season_name = 'Expecting First Child';

UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE category = 'new_parents' AND season_name = 'Fertility Challenges';

UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE category = 'new_parents' AND season_name = 'Adoption Journey';

-- Career Transition: Some are stage-specific
UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE category = 'career_transition' AND season_name = 'Starting a Business';

UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE category = 'career_transition' AND season_name = 'Retirement Planning Disagreement';

UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE category = 'career_transition' AND season_name = 'One Partner Not Working';

-- Health Crisis: Most are 'any' but some map to specific stages
UPDATE relationship_season_catalog SET life_stage = 'young_family'
WHERE category = 'health_crisis' AND season_name = 'Pregnancy Complications';

UPDATE relationship_season_catalog SET life_stage = 'young_family'
WHERE category = 'health_crisis' AND season_name = 'Infertility Treatment';

UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE category = 'health_crisis' AND season_name = 'Aging Parent Health Crisis';

-- Financial Stress: Some are stage-specific
UPDATE relationship_season_catalog SET life_stage = 'young_family'
WHERE category = 'financial_stress' AND season_name = 'Childcare Costs';

UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE category = 'financial_stress' AND season_name = 'Home Purchase';

-- Relocation: Some map to specific stages
UPDATE relationship_season_catalog SET life_stage = 'early_marriage'
WHERE category = 'relocation' AND season_name = 'Moving In Together';

UPDATE relationship_season_catalog SET life_stage = 'retirement'
WHERE category = 'relocation' AND season_name = 'Downsizing';

-- Grief & Loss: Mostly 'any' but a few are stage-specific
UPDATE relationship_season_catalog SET life_stage = 'young_family'
WHERE category = 'grief_loss' AND season_name = 'Miscarriage or Pregnancy Loss';

UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE category = 'grief_loss' AND season_name = 'Death of a Parent';

-- Empty Nest: Mostly correct from category-level, but refine
UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE category = 'empty_nest' AND season_name = 'Caring for Aging Parents';

UPDATE relationship_season_catalog SET life_stage = 'midlife'
WHERE category = 'empty_nest' AND season_name = 'Identity After Parenting';

-- Retirement: All correct from category-level backfill

-- Blended Family: Mostly 'any' since it can happen at any age
-- Keep as 'any' (default from backfill is already correct)

-- Spiritual Growth: All 'any' (correct, spans all stages)


-- -----------------------------------------------
-- Additional is_hero overrides
-- (Most impactful/representative season per category)
-- -----------------------------------------------

-- New Parents: "Newborn Phase" is more universally relatable than "Expecting First Child"
UPDATE relationship_season_catalog SET is_hero = TRUE
WHERE category = 'new_parents' AND season_name = 'Newborn Phase (0-3 months)';

-- Health Crisis: "Mental Health Episode" is a more universal hero season
UPDATE relationship_season_catalog SET is_hero = TRUE
WHERE category = 'health_crisis' AND season_name = 'Mental Health Episode';

-- Grief & Loss: "Death of a Parent" is the most universal grief season
UPDATE relationship_season_catalog SET is_hero = TRUE
WHERE category = 'grief_loss' AND season_name = 'Death of a Parent';

-- Empty Nest: "Rediscovering the Marriage" is the most hopeful hero
UPDATE relationship_season_catalog SET is_hero = TRUE
WHERE category = 'empty_nest' AND season_name = 'Rediscovering the Marriage';


-- -----------------------------------------------
-- Verify: count seasons by life_stage (should show distribution)
-- -----------------------------------------------
-- SELECT life_stage, COUNT(*) FROM relationship_season_catalog GROUP BY life_stage ORDER BY life_stage;
-- Expected: early_marriage ~6, young_family ~12, midlife ~6, empty_nest ~7, retirement ~9, any ~50


-- -----------------------------------------------
-- Done. Per-season life_stage refinements and hero overrides applied.
-- -----------------------------------------------
