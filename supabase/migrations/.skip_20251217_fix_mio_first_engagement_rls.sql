-- ============================================================================
-- FIX: MIO First Engagement Message Insertion
-- ============================================================================
-- Issue: Client cannot insert MIO messages due to RLS policy:
--   "Users can insert their own replies" only allows role = 'user'
--
-- Solution: Create SECURITY DEFINER function to insert first engagement message
-- This validates input and allows MIO role insertion for this specific case.
-- ============================================================================

-- Drop existing function if it exists (for idempotency)
DROP FUNCTION IF EXISTS public.inject_mio_first_engagement_message(UUID, UUID, TEXT, TEXT);

-- Create function to inject MIO's first engagement message
CREATE OR REPLACE FUNCTION public.inject_mio_first_engagement_message(
  p_thread_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_pattern_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_existing_id UUID;
BEGIN
  -- Security check: Only allow for the authenticated user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'User can only create first engagement message for themselves';
  END IF;

  -- Check if MIO first engagement message already exists (prevent duplicates)
  SELECT id INTO v_existing_id
  FROM public.mio_insights_messages
  WHERE user_id = p_user_id
    AND section_type = 'first_engagement'
    AND role = 'mio'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Already exists, return existing ID (idempotent)
    RETURN v_existing_id;
  END IF;

  -- Validate thread belongs to user
  IF NOT EXISTS (
    SELECT 1 FROM public.mio_insights_thread
    WHERE id = p_thread_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Invalid thread ID for user';
  END IF;

  -- Insert the MIO first engagement message
  INSERT INTO public.mio_insights_messages (
    thread_id,
    user_id,
    role,
    content,
    section_type,
    section_energy,
    reward_tier,
    patterns_detected
  )
  VALUES (
    p_thread_id,
    p_user_id,
    'mio',  -- MIO role (not user)
    p_content,
    'first_engagement',
    'commander',  -- First session uses commander energy
    'standard',
    CASE
      WHEN p_pattern_name IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('pattern_name', p_pattern_name, 'confidence', 1.0))
      ELSE '[]'::jsonb
    END
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.inject_mio_first_engagement_message TO authenticated;

-- Also update section_type CHECK constraint to include 'first_engagement'
-- First check if the constraint needs updating
DO $$
BEGIN
  -- Drop and recreate CHECK constraint to include first_engagement
  ALTER TABLE public.mio_insights_messages
    DROP CONSTRAINT IF EXISTS mio_insights_messages_section_type_check;

  ALTER TABLE public.mio_insights_messages
    ADD CONSTRAINT mio_insights_messages_section_type_check
    CHECK (section_type IN ('PRO', 'TE', 'CT', 'reengagement', 'protocol', 'breakthrough', 'first_engagement', NULL));

  RAISE NOTICE 'Updated section_type CHECK constraint to include first_engagement';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not update CHECK constraint (may already be correct): %', SQLERRM;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'MIO First Engagement RLS Fix applied successfully!';
  RAISE NOTICE 'Function: inject_mio_first_engagement_message(thread_id, user_id, content, pattern_name)';
END;
$$;
