-- ============================================================================
-- ASSESSMENT INVITATIONS TABLE
-- ============================================================================
-- Tracks assessment invitations from admins, coaches, and MIO
-- Part of the Assessment System Enhancement for Mind Insurance
-- ============================================================================

-- Create assessment_invitations table
CREATE TABLE IF NOT EXISTS public.assessment_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assessment details
  assessment_type TEXT NOT NULL, -- 'identity_collision', 'avatar_deep', 'inner_wiring_discovery'

  -- Who/what created the invitation
  invited_by TEXT NOT NULL CHECK (invited_by IN ('admin', 'coach', 'mio_chat', 'mio_feedback', 'system')),
  invited_by_user_id UUID REFERENCES auth.users(id), -- Admin/coach who invited (null if MIO/system)

  -- Context
  reason TEXT, -- Why this assessment was suggested (shown to user)
  conversation_id UUID, -- If from MIO chat, link to conversation for context continuity

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed', 'declined')),

  -- Additional metadata (trigger info, confidence scores, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.assessment_invitations IS 'Tracks assessment invitations for Mind Insurance users. Assessments are invitation-only unless mandatory (like Identity Collision gate).';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_user_id ON public.assessment_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_status ON public.assessment_invitations(status);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_user_status ON public.assessment_invitations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assessment_invitations_type ON public.assessment_invitations(assessment_type);

-- Enable RLS
ALTER TABLE public.assessment_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own invitations
CREATE POLICY "Users can view own invitations" ON public.assessment_invitations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own invitations (to mark started/completed/declined)
CREATE POLICY "Users can update own invitations" ON public.assessment_invitations
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything (using admin_users table check)
CREATE POLICY "Admins full access" ON public.assessment_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'owner', 'admin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_assessment_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_invitations_updated_at
  BEFORE UPDATE ON public.assessment_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_invitations_updated_at();
