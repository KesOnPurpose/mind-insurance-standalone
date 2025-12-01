-- Add tactic_source field to track program origin
-- Supports 3-tier organization: mentorship, cashflow_course, general

-- Add the new column with default value
ALTER TABLE gh_tactic_instructions
ADD COLUMN IF NOT EXISTS tactic_source VARCHAR(50) DEFAULT 'general';

-- Add constraint to ensure only valid source values
ALTER TABLE gh_tactic_instructions
ADD CONSTRAINT check_tactic_source CHECK (
  tactic_source IN ('mentorship', 'cashflow_course', 'general')
);

-- Create index for fast filtering by source and week
CREATE INDEX IF NOT EXISTS idx_tactics_source_and_week
ON gh_tactic_instructions(tactic_source, week_assignment);

-- Update existing M-tactics to be marked as mentorship
UPDATE gh_tactic_instructions
SET tactic_source = 'mentorship'
WHERE is_mentorship_tactic = TRUE OR tactic_id LIKE 'M%';

-- Add column comment for documentation
COMMENT ON COLUMN gh_tactic_instructions.tactic_source IS
  'Program origin: mentorship (Nette Week 1-12), cashflow_course (Group Home Cashflow Course), general (standard tactics)';
