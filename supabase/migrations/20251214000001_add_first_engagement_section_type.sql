-- ============================================================================
-- ADD 'first_engagement' TO mio_insights_messages section_type
-- ============================================================================
-- Migration: 20251214000001_add_first_engagement_section_type.sql
-- Purpose: Extends existing section_type CHECK constraint to include first engagement responses
--
-- This captures the user's first authentic insight during Mind Insurance onboarding,
-- when MIO asks pattern-specific questions like:
-- - "What was the last thing you said 'yes' to, that a part of you was screaming 'no'?"
-- - "Who taught you that your needs come last?"
-- - "What's something you've been avoiding because you can't do it 'right'?"
-- ============================================================================

-- Drop existing constraint (if exists)
ALTER TABLE public.mio_insights_messages
DROP CONSTRAINT IF EXISTS mio_insights_messages_section_type_check;

-- Add new constraint with 'first_engagement'
ALTER TABLE public.mio_insights_messages
ADD CONSTRAINT mio_insights_messages_section_type_check
CHECK (section_type IN ('PRO', 'TE', 'CT', 'reengagement', 'protocol', 'breakthrough', 'first_engagement', NULL));

-- Add index for first_engagement queries (used by FirstSessionGuard)
CREATE INDEX IF NOT EXISTS idx_mio_insights_first_engagement
  ON public.mio_insights_messages(user_id, section_type)
  WHERE section_type = 'first_engagement';

-- Update column comment to document the new section type
COMMENT ON COLUMN public.mio_insights_messages.section_type IS
  'Section type: PRO/TE/CT (daily PROTECT practices), reengagement (re-engagement campaigns), protocol (protocol-related), breakthrough (breakthrough moments), first_engagement (onboarding first insight)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify with:
--
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'mio_insights_messages_section_type_check';
--
-- Expected: Should include 'first_engagement' in the check clause
-- ============================================================================
