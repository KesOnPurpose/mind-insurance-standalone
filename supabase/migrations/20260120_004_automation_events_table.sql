-- ============================================================================
-- FEAT-GH-004-D: Create gh_automation_events table
-- ============================================================================
-- Purpose: Log automation triggers for stuck detection, nudges, and system events
-- Enables tracking of when users get stuck, when nudges are sent, and outcomes
-- ============================================================================

-- 1. CREATE AUTOMATION EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.gh_automation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'stuck_detected',           -- User detected as stuck (no progress for X days)
    'nudge_sent',               -- SMS/email nudge sent to user
    'nudge_delivered',          -- Nudge confirmed delivered
    'nudge_opened',             -- Email opened / SMS read
    'nudge_clicked',            -- Link in nudge clicked
    'nudge_responded',          -- User resumed activity after nudge
    'completion_gate_failed',   -- User failed assessment/video threshold
    'completion_gate_passed',   -- User passed completion gate
    'coach_intervention',       -- Coach manually intervened
    'escalation_triggered',     -- Issue escalated to coach
    'user_reengaged',           -- User came back after being stuck
    'protocol_advanced',        -- User advanced to next protocol day
    'protocol_completed',       -- User completed entire protocol
    'system_check'              -- Automated system health check
  )),

  -- Target reference
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id TEXT,  -- References gh_tactic_instructions.tactic_id if applicable

  -- Event details
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- For stuck_detected: { days_inactive, last_activity_at, stuck_on_tactic }
  -- For nudge_sent: { channel, template_id, message_preview, sent_to }
  -- For completion_gate_*: { gate_type, score, threshold, attempt_number }
  -- For coach_intervention: { coach_id, intervention_type, notes }

  -- Related references
  related_event_id UUID REFERENCES gh_automation_events(id),  -- For linking nudge_sent to nudge_responded
  related_assessment_attempt_id UUID,  -- For assessment-related events
  related_video_progress_id UUID,      -- For video-related events

  -- Outcome tracking
  outcome TEXT CHECK (outcome IN (
    'pending',      -- Awaiting result
    'success',      -- Desired outcome achieved
    'partial',      -- Partially successful
    'failed',       -- Did not achieve desired outcome
    'no_response',  -- No user response
    'expired'       -- Time window for response passed
  )),
  outcome_at TIMESTAMP WITH TIME ZONE,
  outcome_data JSONB DEFAULT '{}'::jsonb,

  -- Source tracking
  triggered_by TEXT NOT NULL DEFAULT 'system' CHECK (triggered_by IN (
    'system',       -- Automated detection
    'n8n_workflow', -- N8n automation
    'coach',        -- Manual coach action
    'admin',        -- Admin action
    'user'          -- User-initiated (rare)
  )),
  triggered_by_user_id UUID REFERENCES auth.users(id),  -- If coach/admin triggered

  -- Timing
  processed_at TIMESTAMP WITH TIME ZONE,  -- When the event was processed
  expires_at TIMESTAMP WITH TIME ZONE,    -- When event becomes stale

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- Event created, not yet processed
    'processing',  -- Currently being handled
    'completed',   -- Fully processed
    'failed',      -- Processing failed
    'cancelled'    -- Cancelled before completion
  )),
  error_message TEXT,  -- If processing failed

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES
-- User-based queries
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_user
  ON public.gh_automation_events(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_automation_events_user_type
  ON public.gh_automation_events(user_id, event_type);

-- Event type queries
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_type
  ON public.gh_automation_events(event_type);

-- Pending events for processing
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_pending
  ON public.gh_automation_events(status, created_at)
  WHERE status = 'pending';

-- Stuck detection queries
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_stuck
  ON public.gh_automation_events(user_id, event_type, created_at DESC)
  WHERE event_type = 'stuck_detected';

-- Nudge tracking
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_nudges
  ON public.gh_automation_events(user_id, event_type, outcome)
  WHERE event_type IN ('nudge_sent', 'nudge_responded');

-- Related event lookups
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_related
  ON public.gh_automation_events(related_event_id)
  WHERE related_event_id IS NOT NULL;

-- Time-based queries for analytics
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_created
  ON public.gh_automation_events(created_at DESC);

-- Tactic-based queries
CREATE INDEX IF NOT EXISTS idx_gh_automation_events_tactic
  ON public.gh_automation_events(tactic_id)
  WHERE tactic_id IS NOT NULL;

-- 3. ENABLE RLS
ALTER TABLE public.gh_automation_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Users can view their own automation events
CREATE POLICY "Users can view own automation events"
  ON public.gh_automation_events FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all automation events
CREATE POLICY "Admins can view all automation events"
  ON public.gh_automation_events FOR SELECT
  USING ((SELECT public.is_admin()));

-- System/service can insert events (via service role)
CREATE POLICY "Service role can insert automation events"
  ON public.gh_automation_events FOR INSERT
  WITH CHECK (TRUE);  -- Service role bypasses RLS anyway

-- Admins/coaches can insert events
CREATE POLICY "Admins can insert automation events"
  ON public.gh_automation_events FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));

-- Admins can update events
CREATE POLICY "Admins can update automation events"
  ON public.gh_automation_events FOR UPDATE
  USING ((SELECT public.is_admin()));

-- 5. CREATE UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_gh_automation_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set processed_at when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.processed_at = NOW();
  END IF;

  -- Auto-set outcome_at when outcome is set
  IF NEW.outcome IS NOT NULL AND OLD.outcome IS NULL THEN
    NEW.outcome_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gh_automation_events
  ON public.gh_automation_events;

CREATE TRIGGER trigger_update_gh_automation_events
  BEFORE UPDATE ON public.gh_automation_events
  FOR EACH ROW
  EXECUTE FUNCTION update_gh_automation_events_updated_at();

-- 6. HELPER FUNCTION: Log automation event
CREATE OR REPLACE FUNCTION public.log_automation_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_tactic_id TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_triggered_by TEXT DEFAULT 'system',
  p_triggered_by_user_id UUID DEFAULT NULL,
  p_related_event_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO gh_automation_events (
    event_type,
    user_id,
    tactic_id,
    event_data,
    triggered_by,
    triggered_by_user_id,
    related_event_id,
    expires_at
  ) VALUES (
    p_event_type,
    p_user_id,
    p_tactic_id,
    p_event_data,
    p_triggered_by,
    p_triggered_by_user_id,
    p_related_event_id,
    p_expires_at
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- 7. HELPER FUNCTION: Get recent stuck events for user
CREATE OR REPLACE FUNCTION public.get_user_stuck_history(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  event_id UUID,
  tactic_id TEXT,
  days_inactive INTEGER,
  detected_at TIMESTAMP WITH TIME ZONE,
  outcome TEXT,
  reengaged_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.tactic_id,
    (e.event_data->>'days_inactive')::INTEGER,
    e.created_at,
    e.outcome,
    e.outcome_at
  FROM gh_automation_events e
  WHERE e.user_id = p_user_id
    AND e.event_type = 'stuck_detected'
    AND e.created_at > NOW() - (p_days || ' days')::INTERVAL
  ORDER BY e.created_at DESC;
END;
$$;

-- 8. ADD COMMENTS
COMMENT ON TABLE public.gh_automation_events IS
  'Logs automation triggers for stuck detection, nudges, and system events. Enables tracking user engagement patterns and intervention effectiveness.';

COMMENT ON COLUMN public.gh_automation_events.event_type IS
  'Type of automation event (stuck_detected, nudge_sent, completion_gate_*, etc.)';

COMMENT ON COLUMN public.gh_automation_events.event_data IS
  'JSON payload with event-specific details (days_inactive, channel, score, etc.)';

COMMENT ON COLUMN public.gh_automation_events.outcome IS
  'Result of the event (success, failed, no_response, etc.)';

COMMENT ON COLUMN public.gh_automation_events.related_event_id IS
  'Links related events (e.g., nudge_sent to nudge_responded)';

-- 9. VERIFICATION QUERY
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_automation_events' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ FEAT-GH-004-D: gh_automation_events table created successfully';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-D: gh_automation_events table creation FAILED';
  END IF;
END $$;
