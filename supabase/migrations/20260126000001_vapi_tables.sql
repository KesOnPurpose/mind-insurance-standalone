-- ============================================================================
-- VAPI VOICE AI TABLES
-- Migration for Phase 1: Vapi Integration
-- Replaces GHL Voice AI session-based system with direct context injection
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: vapi_call_logs
-- Tracks all Vapi voice calls with full context and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vapi_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vapi_call_id TEXT UNIQUE NOT NULL,
  assistant_id TEXT NOT NULL,
  assistant_variant TEXT CHECK (assistant_variant IN ('claude', 'gpt4', 'unknown')) DEFAULT 'unknown',

  -- Call metadata
  direction TEXT CHECK (direction IN ('inbound', 'outbound', 'web')) DEFAULT 'inbound',
  phone_number TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Call status
  status TEXT CHECK (status IN ('queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')) DEFAULT 'queued',
  end_reason TEXT,

  -- Content (transcripts and summaries)
  transcript TEXT,
  summary TEXT,
  topics TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),

  -- User context at time of call (snapshot for debugging)
  context_snapshot JSONB DEFAULT '{}'::jsonb,

  -- Tool usage during call
  tools_called JSONB DEFAULT '[]'::jsonb,

  -- A/B test metrics
  latency_p50_ms INTEGER,
  latency_p95_ms INTEGER,
  tokens_used INTEGER,
  cost_cents INTEGER,

  -- User feedback (optional)
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,

  -- Breakthrough/insight flags (from MIO analysis)
  breakthrough_detected BOOLEAN DEFAULT false,
  dropout_risk_at_call INTEGER CHECK (dropout_risk_at_call >= 0 AND dropout_risk_at_call <= 100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vapi_call_logs_user_id ON public.vapi_call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vapi_call_logs_vapi_call_id ON public.vapi_call_logs(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_vapi_call_logs_created_at ON public.vapi_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vapi_call_logs_assistant_variant ON public.vapi_call_logs(assistant_variant);
CREATE INDEX IF NOT EXISTS idx_vapi_call_logs_status ON public.vapi_call_logs(status);

-- ============================================================================
-- TABLE: vapi_proactive_queue
-- Queue for proactive outbound calls (dropout intervention, celebrations, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vapi_proactive_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trigger information
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'dropout_risk',      -- User at high dropout risk
    'milestone',         -- User hit a milestone (7 days, 30 days, etc.)
    'checkin',           -- Regular check-in call
    'reengagement',      -- User hasn't been active
    'celebration',       -- Breakthrough detected
    'week3_danger',      -- Week 3 danger zone intervention
    'custom'             -- Manual/custom trigger
  )),
  trigger_reason TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,

  -- Scheduling
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1 = highest
  scheduled_for TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Waiting to be processed
    'scheduled',         -- Call scheduled with Vapi
    'in_progress',       -- Call currently happening
    'completed',         -- Call completed successfully
    'failed',            -- Call failed
    'cancelled',         -- Manually cancelled
    'expired',           -- Past expiration time
    'user_declined'      -- User declined/blocked
  )),

  -- Result tracking
  vapi_call_id TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_vapi_proactive_queue_user_id ON public.vapi_proactive_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_vapi_proactive_queue_status ON public.vapi_proactive_queue(status);
CREATE INDEX IF NOT EXISTS idx_vapi_proactive_queue_scheduled ON public.vapi_proactive_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_vapi_proactive_queue_priority ON public.vapi_proactive_queue(priority, scheduled_for) WHERE status = 'pending';

-- ============================================================================
-- TABLE: vapi_assistant_config
-- Store assistant configurations and A/B test settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vapi_assistant_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_name TEXT NOT NULL UNIQUE,
  vapi_assistant_id TEXT NOT NULL,
  llm_provider TEXT NOT NULL CHECK (llm_provider IN ('anthropic', 'openai', 'custom')),
  llm_model TEXT NOT NULL,

  -- A/B test configuration
  is_active BOOLEAN DEFAULT true,
  traffic_weight INTEGER DEFAULT 50 CHECK (traffic_weight >= 0 AND traffic_weight <= 100),

  -- Performance metrics (aggregated)
  total_calls INTEGER DEFAULT 0,
  avg_duration_seconds NUMERIC(10,2),
  avg_latency_ms NUMERIC(10,2),
  avg_user_rating NUMERIC(3,2),
  completion_rate NUMERIC(5,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.vapi_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_proactive_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vapi_assistant_config ENABLE ROW LEVEL SECURITY;

-- vapi_call_logs: Users can read their own calls
CREATE POLICY "Users can view their own call logs"
  ON public.vapi_call_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- vapi_call_logs: Service role can do everything (for webhooks)
CREATE POLICY "Service role full access to call logs"
  ON public.vapi_call_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- vapi_proactive_queue: Users can view their own queue items
CREATE POLICY "Users can view their own queue items"
  ON public.vapi_proactive_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- vapi_proactive_queue: Service role can do everything
CREATE POLICY "Service role full access to proactive queue"
  ON public.vapi_proactive_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- vapi_assistant_config: Read-only for authenticated users
CREATE POLICY "Authenticated users can view assistant config"
  ON public.vapi_assistant_config
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- vapi_assistant_config: Service role can manage
CREATE POLICY "Service role full access to assistant config"
  ON public.vapi_assistant_config
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_vapi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_vapi_call_logs_updated_at
  BEFORE UPDATE ON public.vapi_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vapi_updated_at();

CREATE TRIGGER update_vapi_proactive_queue_updated_at
  BEFORE UPDATE ON public.vapi_proactive_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vapi_updated_at();

CREATE TRIGGER update_vapi_assistant_config_updated_at
  BEFORE UPDATE ON public.vapi_assistant_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vapi_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.vapi_call_logs IS 'Tracks all Vapi voice calls with full context, transcripts, and A/B test metrics';
COMMENT ON TABLE public.vapi_proactive_queue IS 'Queue for proactive outbound calls triggered by MIO dropout detection, milestones, etc.';
COMMENT ON TABLE public.vapi_assistant_config IS 'Configuration and A/B test settings for Vapi assistants (Claude vs GPT-4)';

COMMENT ON COLUMN public.vapi_call_logs.assistant_variant IS 'Which LLM variant handled this call (claude/gpt4) for A/B test analysis';
COMMENT ON COLUMN public.vapi_call_logs.context_snapshot IS 'Full user context injected at call start - preserved for debugging';
COMMENT ON COLUMN public.vapi_call_logs.tools_called IS 'Array of tool calls made during conversation [{name, params, result}]';
COMMENT ON COLUMN public.vapi_proactive_queue.trigger_type IS 'What triggered this proactive call - dropout_risk, milestone, week3_danger, etc.';
COMMENT ON COLUMN public.vapi_proactive_queue.priority IS 'Call priority 1-10 (1=highest). High dropout risk = 1, celebrations = 5';
