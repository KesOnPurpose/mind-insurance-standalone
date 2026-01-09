-- Support Ticket Logs Table for Troubleshooting Audit Trail
-- Created: 2025-12-08
-- Purpose: Log all support diagnostics and fixes for accountability and pattern learning

CREATE TABLE IF NOT EXISTS public.support_ticket_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ticket Info
  ticket_type TEXT NOT NULL, -- 'login', 'access', 'assessment', 'practice', 'workflow', 'frontend'
  user_email TEXT,
  user_id UUID,

  -- Diagnostic Details
  issue_description TEXT NOT NULL,
  systems_checked JSONB DEFAULT '[]',  -- ['auth.users', 'gh_approved_users', 'user_onboarding']
  findings JSONB DEFAULT '{}',          -- {auth: 'exists', approved: 'missing', onboarding: 'n/a'}
  root_cause TEXT,

  -- Resolution
  fix_applied TEXT,
  fix_command TEXT,                     -- Actual command executed
  resolved BOOLEAN DEFAULT FALSE,
  resolution_time_seconds INTEGER,

  -- Meta
  agent_skill TEXT,                     -- Which skill handled it
  slash_command TEXT,                   -- Which command was used
  notes TEXT
);

-- Add comments for documentation
COMMENT ON TABLE public.support_ticket_logs IS 'Audit trail for all troubleshooting diagnostics and fixes';
COMMENT ON COLUMN public.support_ticket_logs.ticket_type IS 'Category: login, access, assessment, practice, workflow, frontend';
COMMENT ON COLUMN public.support_ticket_logs.systems_checked IS 'Array of systems queried during diagnostic';
COMMENT ON COLUMN public.support_ticket_logs.findings IS 'JSON object with results from each system check';
COMMENT ON COLUMN public.support_ticket_logs.agent_skill IS 'Which Claude skill handled this: ticket-resolver, backend-diagnostician, etc.';

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_support_ticket_logs_created_at ON public.support_ticket_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_logs_ticket_type ON public.support_ticket_logs(ticket_type);
CREATE INDEX IF NOT EXISTS idx_support_ticket_logs_user_email ON public.support_ticket_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_support_ticket_logs_resolved ON public.support_ticket_logs(resolved);

-- RLS: Service role has full access (for Claude troubleshooting agents)
ALTER TABLE public.support_ticket_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_full_access" ON public.support_ticket_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own tickets (if user_id matches)
CREATE POLICY "users_view_own_tickets" ON public.support_ticket_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
