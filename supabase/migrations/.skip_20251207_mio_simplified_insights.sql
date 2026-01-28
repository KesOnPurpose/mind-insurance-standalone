-- Migration: MIO Simplified Insights & Context Reminders
-- Date: 2025-12-07
-- Purpose: Add columns for simplified user-facing insights and raw analysis storage

-- Add simplified insight columns to mio_weekly_protocols
ALTER TABLE mio_weekly_protocols
ADD COLUMN IF NOT EXISTS simplified_insight_summary TEXT,
ADD COLUMN IF NOT EXISTS simplified_why_it_matters TEXT,
ADD COLUMN IF NOT EXISTS simplified_neural_principle TEXT,
ADD COLUMN IF NOT EXISTS simplified_day_tasks JSONB,
ADD COLUMN IF NOT EXISTS raw_analysis JSONB,
ADD COLUMN IF NOT EXISTS conversation_context JSONB,
ADD COLUMN IF NOT EXISTS transformation_impact_score INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN mio_weekly_protocols.simplified_insight_summary IS '50-75 words, user-friendly version of insight_summary with inline term explanations';
COMMENT ON COLUMN mio_weekly_protocols.simplified_why_it_matters IS '50-75 words, accessible neuroscience explanation without jargon';
COMMENT ON COLUMN mio_weekly_protocols.simplified_neural_principle IS 'Single sentence, layman-friendly neural principle';
COMMENT ON COLUMN mio_weekly_protocols.simplified_day_tasks IS 'Same structure as day_tasks but with condensed instructions and context_reminder field';
COMMENT ON COLUMN mio_weekly_protocols.raw_analysis IS 'Full Claude analysis output for future queries (triggered_capabilities, full_insight, pattern_context)';
COMMENT ON COLUMN mio_weekly_protocols.conversation_context IS 'Recent MIO/Nette/ME conversations that influenced this insight';
COMMENT ON COLUMN mio_weekly_protocols.transformation_impact_score IS 'Score 0-100 indicating expected transformation impact based on pattern frequency, pain points, timing';

-- Create index for transformation impact score queries
CREATE INDEX IF NOT EXISTS idx_mio_weekly_protocols_impact_score
ON mio_weekly_protocols (transformation_impact_score DESC NULLS LAST)
WHERE status = 'active';

-- Update the day_tasks structure comment to include new fields
-- Note: day_tasks JSONB now expects each day to include:
-- {
--   "day": 1,
--   "theme": "...",
--   "task_title": "...",
--   "task_instructions": "...",
--   "context_reminder": "Remember: Your pattern manifests as X because Y. Today's task addresses this.",
--   "insight_connection": "Connects to your [pattern name] pattern",
--   "duration_minutes": 5,
--   "success_criteria": ["...", "..."]
-- }
