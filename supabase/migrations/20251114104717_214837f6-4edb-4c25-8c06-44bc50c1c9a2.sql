-- Populate metadata for first 50 tactics (Week 1)

-- Vision & Goal Setting tactics (low capital, beginner, high priority)
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id IN ('T026', 'T027', 'T028', 'T029', 'T030', 'T031', 'T032', 'T033');

-- Market Research tactics
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id IN ('T001');

-- Property Acquisition Strategy (varies by strategy)
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id = 'T002';

-- Financial Planning
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id = 'T003';

-- Legal & Compliance (low capital but critical)
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id IN ('T012', 'T024');

-- Business Formation (medium capital for insurance)
UPDATE gh_tactic_instructions
SET 
  capital_required = 'medium',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id = 'T019';

-- Licensing & Compliance
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id = 'T023';

-- Education tactics (varies by cost)
UPDATE gh_tactic_instructions
SET 
  capital_required = CASE 
    WHEN tactic_id = 'T381' THEN 'high' -- $997 course
    ELSE 'low'
  END,
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = CASE 
    WHEN tactic_id IN ('T381', 'T382', 'T383') THEN 1 -- Core education
    ELSE 2 -- Supplemental learning
  END
WHERE tactic_id IN ('T381', 'T382', 'T383', 'T384', 'T385', 'T386', 'T387', 'T388', 'T389', 'T390');

-- Mindset & Personal Development (all low capital, high priority for Week 1)
UPDATE gh_tactic_instructions
SET 
  capital_required = 'low',
  target_populations = ARRAY['all'],
  experience_level = 'beginner',
  priority_tier = 1
WHERE tactic_id IN ('T391', 'T392', 'T393', 'T394', 'T395', 'T396', 'T397', 'T398', 'T399', 'T400', 'T401', 'T402', 'T403', 'T404', 'T405', 'T406', 'T407', 'T408', 'T409', 'T410');