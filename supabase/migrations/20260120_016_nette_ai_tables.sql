-- ============================================================================
-- FEAT-GH-009-G: Create Nette AI Tables (THE $100M FEATURE!)
-- ============================================================================
-- Purpose: Database foundation for Nette AI Learning Companion
-- Context-aware AI that knows user position, struggles, and proactively helps
-- ============================================================================

-- ============================================================================
-- PART 1: Nette AI Conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_nette_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context (where this conversation started)
  lesson_id UUID REFERENCES public.gh_program_lessons(id) ON DELETE SET NULL,
  tactic_id UUID REFERENCES public.gh_lesson_tactics(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES public.gh_program_phases(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.gh_programs(id) ON DELETE SET NULL,

  -- Conversation metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,

  -- Context snapshot (what user was doing when conversation started)
  context JSONB DEFAULT '{}'::JSONB,  -- {video_timestamp, tactic_context, etc.}

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'escalated')),

  -- Was this proactively initiated?
  was_proactive BOOLEAN DEFAULT false,
  proactive_trigger_type TEXT,  -- 'rewind_pattern', 'tactic_stagnation', etc.

  -- If escalated to coach
  escalated_at TIMESTAMPTZ,
  escalation_id UUID,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_gh_nette_conversations_user_id
  ON public.gh_nette_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_nette_conversations_lesson_id
  ON public.gh_nette_conversations(lesson_id)
  WHERE lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gh_nette_conversations_status
  ON public.gh_nette_conversations(status, user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_gh_nette_conversations_last_message
  ON public.gh_nette_conversations(last_message_at DESC);

-- RLS for conversations
ALTER TABLE public.gh_nette_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own Nette conversations"
  ON public.gh_nette_conversations FOR SELECT
  USING (user_id = auth.uid());

-- Admins/coaches can view all conversations
CREATE POLICY "Admins can view all Nette conversations"
  ON public.gh_nette_conversations FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- Users can create their own conversations
CREATE POLICY "Users can create own Nette conversations"
  ON public.gh_nette_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own conversations
CREATE POLICY "Users can update own Nette conversations"
  ON public.gh_nette_conversations FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 2: Nette AI Messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_nette_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent conversation
  conversation_id UUID NOT NULL REFERENCES public.gh_nette_conversations(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- Rich metadata
  metadata JSONB DEFAULT '{}'::JSONB,  -- {video_timestamp, tactic_id, citations, etc.}

  -- Feedback
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  was_helpful BOOLEAN,

  -- Token tracking (for cost management)
  input_tokens INTEGER,
  output_tokens INTEGER,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_gh_nette_messages_conversation_id
  ON public.gh_nette_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_gh_nette_messages_created_at
  ON public.gh_nette_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_gh_nette_messages_role
  ON public.gh_nette_messages(role, conversation_id);

-- RLS for messages
ALTER TABLE public.gh_nette_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view own Nette messages"
  ON public.gh_nette_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gh_nette_conversations c
      WHERE c.id = gh_nette_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- Admins/coaches can view all messages
CREATE POLICY "Admins can view all Nette messages"
  ON public.gh_nette_messages FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- Users can create messages in their conversations
CREATE POLICY "Users can create own Nette messages"
  ON public.gh_nette_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gh_nette_conversations c
      WHERE c.id = gh_nette_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- Users can update feedback on their messages
CREATE POLICY "Users can update Nette message feedback"
  ON public.gh_nette_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.gh_nette_conversations c
      WHERE c.id = gh_nette_messages.conversation_id
      AND c.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 3: User Insights (Breakthrough Capture)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Context
  lesson_id UUID REFERENCES public.gh_program_lessons(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.gh_nette_conversations(id) ON DELETE SET NULL,

  -- Insight content
  insight_text TEXT NOT NULL,
  insight_type TEXT DEFAULT 'breakthrough' CHECK (insight_type IN (
    'breakthrough',  -- Aha moment, understanding clicked
    'question',      -- Important question to revisit
    'connection',    -- Connected concepts together
    'goal',          -- Set a personal goal
    'reflection'     -- General reflection/thought
  )),

  -- AI-generated summary (optional)
  ai_summary TEXT,
  ai_follow_up_suggestion TEXT,

  -- Display settings
  is_pinned BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT true,  -- If false, coach can see

  -- Audit fields
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for insights
CREATE INDEX IF NOT EXISTS idx_gh_user_insights_user_id
  ON public.gh_user_insights(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_user_insights_lesson_id
  ON public.gh_user_insights(lesson_id)
  WHERE lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gh_user_insights_type
  ON public.gh_user_insights(insight_type, user_id);

CREATE INDEX IF NOT EXISTS idx_gh_user_insights_pinned
  ON public.gh_user_insights(user_id, is_pinned)
  WHERE is_pinned = true;

-- RLS for insights
ALTER TABLE public.gh_user_insights ENABLE ROW LEVEL SECURITY;

-- Users can view their own insights
CREATE POLICY "Users can view own insights"
  ON public.gh_user_insights FOR SELECT
  USING (user_id = auth.uid());

-- Coaches can view non-private insights
CREATE POLICY "Coaches can view shared insights"
  ON public.gh_user_insights FOR SELECT
  USING (
    is_private = false
    AND ((SELECT public.is_admin()) OR (SELECT public.is_coach()))
  );

-- Users can create their own insights
CREATE POLICY "Users can create own insights"
  ON public.gh_user_insights FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own insights
CREATE POLICY "Users can update own insights"
  ON public.gh_user_insights FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own insights
CREATE POLICY "Users can delete own insights"
  ON public.gh_user_insights FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- PART 4: Support Escalations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_support_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.gh_nette_conversations(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.gh_program_lessons(id) ON DELETE SET NULL,

  -- Escalation details
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- AI-generated context
  ai_summary TEXT,  -- AI summary of the issue
  ai_suggested_response TEXT,  -- AI draft response for coach

  -- Full context snapshot
  context_snapshot JSONB DEFAULT '{}'::JSONB,  -- {progress, history, patterns}

  -- Coach handling
  assigned_coach_id UUID REFERENCES auth.users(id),
  coach_notes TEXT,
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Indexes for escalations
CREATE INDEX IF NOT EXISTS idx_gh_escalations_user_id
  ON public.gh_support_escalations(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_escalations_status
  ON public.gh_support_escalations(status)
  WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_gh_escalations_priority
  ON public.gh_support_escalations(priority, status)
  WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_gh_escalations_coach
  ON public.gh_support_escalations(assigned_coach_id)
  WHERE assigned_coach_id IS NOT NULL;

-- RLS for escalations
ALTER TABLE public.gh_support_escalations ENABLE ROW LEVEL SECURITY;

-- Users can view their own escalations
CREATE POLICY "Users can view own escalations"
  ON public.gh_support_escalations FOR SELECT
  USING (user_id = auth.uid());

-- Admins/coaches can view all escalations
CREATE POLICY "Admins can view all escalations"
  ON public.gh_support_escalations FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- System can create escalations
CREATE POLICY "System can create escalations"
  ON public.gh_support_escalations FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (SELECT public.is_admin()));

-- Coaches can update escalations
CREATE POLICY "Coaches can update escalations"
  ON public.gh_support_escalations FOR UPDATE
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- ============================================================================
-- PART 5: Proactive Trigger Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_nette_proactive_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trigger details
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'rewind_pattern',      -- User keeps rewinding same video segment
    'tactic_stagnation',   -- Stuck on same tactic for days
    'lesson_return',       -- Returning to same lesson multiple times
    'stuck_detected',      -- Stuck detection system flagged
    'assessment_struggle', -- Failing assessment repeatedly
    'engagement_drop',     -- Activity dropped significantly
    'breakthrough_near'    -- Close to completing phase/program
  )),

  -- Context
  lesson_id UUID REFERENCES public.gh_program_lessons(id) ON DELETE SET NULL,
  tactic_id UUID REFERENCES public.gh_lesson_tactics(id) ON DELETE SET NULL,

  -- Trigger data
  trigger_data JSONB DEFAULT '{}'::JSONB,  -- {segment_start, days_stuck, etc.}

  -- Action taken
  action_taken TEXT,  -- What Nette did
  conversation_id UUID REFERENCES public.gh_nette_conversations(id),

  -- Was it helpful?
  user_engaged BOOLEAN,
  user_feedback TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for proactive triggers
CREATE INDEX IF NOT EXISTS idx_gh_nette_triggers_user_id
  ON public.gh_nette_proactive_triggers(user_id);

CREATE INDEX IF NOT EXISTS idx_gh_nette_triggers_type
  ON public.gh_nette_proactive_triggers(trigger_type, user_id);

CREATE INDEX IF NOT EXISTS idx_gh_nette_triggers_created
  ON public.gh_nette_proactive_triggers(created_at DESC);

-- RLS for proactive triggers
ALTER TABLE public.gh_nette_proactive_triggers ENABLE ROW LEVEL SECURITY;

-- Users can view their own triggers
CREATE POLICY "Users can view own proactive triggers"
  ON public.gh_nette_proactive_triggers FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all triggers
CREATE POLICY "Admins can view all proactive triggers"
  ON public.gh_nette_proactive_triggers FOR SELECT
  USING ((SELECT public.is_admin()) OR (SELECT public.is_coach()));

-- System can create triggers
CREATE POLICY "System can create proactive triggers"
  ON public.gh_nette_proactive_triggers FOR INSERT
  WITH CHECK (true);  -- System-level inserts

-- ============================================================================
-- PART 6: Usage Tracking (Cost Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gh_nette_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationship
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage tracking (per day)
  date DATE DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,

  -- Limits
  daily_limit_reached BOOLEAN DEFAULT false,
  limit_reached_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Indexes for usage
CREATE INDEX IF NOT EXISTS idx_gh_nette_usage_user_date
  ON public.gh_nette_usage(user_id, date);

CREATE INDEX IF NOT EXISTS idx_gh_nette_usage_date
  ON public.gh_nette_usage(date);

-- RLS for usage
ALTER TABLE public.gh_nette_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own Nette usage"
  ON public.gh_nette_usage FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all usage
CREATE POLICY "Admins can view all Nette usage"
  ON public.gh_nette_usage FOR SELECT
  USING ((SELECT public.is_admin()));

-- System can update usage
CREATE POLICY "System can manage Nette usage"
  ON public.gh_nette_usage FOR ALL
  USING (true);

-- ============================================================================
-- PART 7: Update Triggers
-- ============================================================================

-- Update conversation on new message
CREATE OR REPLACE FUNCTION update_nette_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.gh_nette_conversations
  SET
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_nette_conversation_on_message
  ON public.gh_nette_messages;

CREATE TRIGGER trigger_update_nette_conversation_on_message
  AFTER INSERT ON public.gh_nette_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_nette_conversation_on_message();

-- ============================================================================
-- PART 8: Comments
-- ============================================================================

COMMENT ON TABLE public.gh_nette_conversations IS
  'Nette AI conversation threads. Each thread has context about where user was when chat started.';

COMMENT ON TABLE public.gh_nette_messages IS
  'Individual messages in Nette AI conversations with feedback tracking.';

COMMENT ON TABLE public.gh_user_insights IS
  'User insights and breakthroughs captured from Nette AI conversations (Learning Journal).';

COMMENT ON TABLE public.gh_support_escalations IS
  'Escalations from Nette AI to human coaches with full context snapshot.';

COMMENT ON TABLE public.gh_nette_proactive_triggers IS
  'Events that triggered proactive Nette AI assistance (rewind patterns, stagnation, etc.).';

COMMENT ON TABLE public.gh_nette_usage IS
  'Daily usage tracking for Nette AI (token counts, costs) for rate limiting and cost management.';

-- ============================================================================
-- PART 9: Verification
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_nette_conversations' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_nette_messages' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_user_insights' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_support_escalations' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_nette_proactive_triggers' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gh_nette_usage' AND table_schema = 'public')
  THEN
    RAISE NOTICE '✓ FEAT-GH-009-G: Nette AI tables created successfully (THE $100M FEATURE!)';
    RAISE NOTICE '  → gh_nette_conversations: Conversation threads with context';
    RAISE NOTICE '  → gh_nette_messages: Messages with feedback tracking';
    RAISE NOTICE '  → gh_user_insights: Breakthrough capture (Learning Journal)';
    RAISE NOTICE '  → gh_support_escalations: Coach escalation with AI summary';
    RAISE NOTICE '  → gh_nette_proactive_triggers: Proactive intervention events';
    RAISE NOTICE '  → gh_nette_usage: Cost management & rate limiting';
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-009-G: One or more Nette AI tables FAILED to create';
  END IF;
END $$;
