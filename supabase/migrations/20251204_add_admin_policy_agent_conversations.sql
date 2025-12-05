-- ============================================================================
-- ADD ADMIN POLICY TO AGENT_CONVERSATIONS
-- ============================================================================
-- Purpose: Allow admins to view all agent_conversations for analytics dashboard
-- This enables the Top Users Leaderboard and other cross-user analytics
-- ============================================================================

-- Add admin select policy (without dropping existing policies)
DO $$
BEGIN
  -- Check if the policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'agent_conversations'
    AND policyname = 'Admins can view all conversations'
  ) THEN
    CREATE POLICY "Admins can view all conversations" ON public.agent_conversations
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- Also add admin policies for user_onboarding (needed for ConversionFunnel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_onboarding'
    AND policyname = 'Admins can view all onboarding data'
  ) THEN
    CREATE POLICY "Admins can view all onboarding data" ON public.user_onboarding
      FOR SELECT USING (public.is_admin());
  END IF;
END $$;

-- Verify policies exist
COMMENT ON TABLE public.agent_conversations IS 'Agent conversation logs with RLS for user privacy and admin analytics access';
