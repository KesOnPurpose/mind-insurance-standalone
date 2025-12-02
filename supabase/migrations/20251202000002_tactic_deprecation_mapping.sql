-- Create table to track deprecated tactics and their replacements
-- Enables auto-migration of user progress from old T-tactics to new M-tactics

CREATE TABLE IF NOT EXISTS gh_tactic_deprecation_map (
  deprecated_tactic_id VARCHAR(10) PRIMARY KEY REFERENCES gh_tactic_instructions(tactic_id),
  replacement_tactic_id VARCHAR(10) NOT NULL REFERENCES gh_tactic_instructions(tactic_id),
  deprecation_reason TEXT,
  migration_strategy VARCHAR(50) DEFAULT 'auto_migrate',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_migration_strategy CHECK (
    migration_strategy IN ('auto_migrate', 'manual_review', 'show_both')
  )
);

-- Create index for fast lookup of replacements
CREATE INDEX IF NOT EXISTS idx_deprecation_replacement
ON gh_tactic_deprecation_map(replacement_tactic_id);

-- Example deprecation mappings (will be populated after analysis in Phase 2)
-- These are placeholders - actual mappings will be determined after comparing
-- course content with existing T-tactics

-- INSERT INTO gh_tactic_deprecation_map (deprecated_tactic_id, replacement_tactic_id, deprecation_reason) VALUES
-- ('T001', 'M001', 'Updated with Nette mentorship content - more detailed compliance guidance'),
-- ('T005', 'M005', 'Enhanced LLC formation steps with state-specific considerations'),
-- ('T012', 'M012', 'Updated profit calculation formula with SSI validation');

COMMENT ON TABLE gh_tactic_deprecation_map IS
  'Maps deprecated tactics to their updated replacements for progress migration and user notifications';
