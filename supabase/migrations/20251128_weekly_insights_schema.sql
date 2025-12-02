-- Weekly Insights Schema for Mind Insurance
-- Phase 26: MIO Dynamic Protocols + Coach Manual Protocols

-- =============================================
-- Section 1: MIO Dynamic Protocols (AI-Generated)
-- =============================================

-- Table: mio_weekly_protocols
-- Stores AI-generated 7-day behavioral protocols from assessments/chat
CREATE TABLE IF NOT EXISTS mio_weekly_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Protocol metadata
  protocol_type VARCHAR(50) NOT NULL CHECK (protocol_type IN ('recovery', 'breakthrough', 'success_sabotage', 'guardian_protection', 'identity_shift', 'pattern_interrupt')),
  protocol_theme VARCHAR(255) NOT NULL,
  protocol_summary TEXT,

  -- 7-day content structure (JSONB)
  -- Structure: [{
  --   "day": 1,
  --   "theme": "The Honest Restart",
  --   "morning_task": { "title": "...", "instructions": "...", "duration_minutes": 10 },
  --   "throughout_day": { "title": "...", "instructions": "..." },
  --   "evening_task": { "title": "...", "instructions": "...", "duration_minutes": 15 },
  --   "success_criteria": ["...", "..."]
  -- }]
  day_tasks JSONB NOT NULL,
  success_criteria JSONB,

  -- Source tracking
  source VARCHAR(50) NOT NULL CHECK (source IN ('assessment', 'chat_recommendation', 'manual_assignment', 'streak_milestone')),
  source_context JSONB, -- Assessment data, conversation_id, or other context

  -- Timing
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  year INTEGER NOT NULL CHECK (year BETWEEN 2024 AND 2100),
  assigned_week_start DATE,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one active protocol per user per week
  UNIQUE(user_id, week_number, year)
);

-- Table: mio_user_protocol_progress
-- Tracks daily completions for MIO protocols
CREATE TABLE IF NOT EXISTS mio_user_protocol_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES mio_weekly_protocols(id) ON DELETE CASCADE,

  -- Progress tracking
  current_day INTEGER DEFAULT 1 CHECK (current_day BETWEEN 1 AND 7),
  daily_completions JSONB DEFAULT '{}', -- {"1": {"completed": true, "completed_at": "...", "response_data": {...}}}

  -- Status
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- User notes/reflections
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one progress record per user per protocol
  UNIQUE(user_id, protocol_id)
);

-- =============================================
-- Section 2: Coach Manual Protocols
-- =============================================

-- Table: coach_protocols
-- Stores coach-uploaded content with daily tasks
CREATE TABLE IF NOT EXISTS coach_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  coach_id UUID REFERENCES user_profiles(id) NOT NULL,

  -- Scheduling
  schedule_type VARCHAR(20) DEFAULT 'weekly_cycle' CHECK (schedule_type IN ('weekly_cycle', 'evergreen', 'date_specific')),
  cycle_week_number INTEGER CHECK (cycle_week_number IS NULL OR cycle_week_number BETWEEN 1 AND 52), -- For weekly_cycle
  start_date DATE, -- For date_specific

  -- Visibility
  visibility VARCHAR(20) DEFAULT 'all_users' CHECK (visibility IN ('all_users', 'tier_based', 'individual')),
  target_tiers TEXT[] DEFAULT '{}',
  target_users UUID[] DEFAULT '{}',

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  published_at TIMESTAMPTZ,

  -- Visual customization
  theme_color VARCHAR(7), -- Hex color like #fac832

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: coach_protocol_tasks
-- Individual daily tasks within a coach protocol
CREATE TABLE IF NOT EXISTS coach_protocol_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES coach_protocols(id) ON DELETE CASCADE NOT NULL,

  -- Task scheduling
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  task_order INTEGER DEFAULT 1,

  -- Task content
  title VARCHAR(255) NOT NULL,
  instructions TEXT NOT NULL,

  -- Task metadata
  task_type VARCHAR(50) DEFAULT 'action' CHECK (task_type IN ('action', 'reflection', 'reading', 'video', 'worksheet', 'voice_recording')),
  estimated_duration INTEGER, -- Minutes

  -- Linked resources
  resource_url TEXT,
  document_id BIGINT REFERENCES gh_documents(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one task per day per order per protocol
  UNIQUE(protocol_id, day_number, task_order)
);

-- Table: user_coach_protocol_progress
-- Tracks user completion of coach protocol tasks
CREATE TABLE IF NOT EXISTS user_coach_protocol_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  protocol_id UUID REFERENCES coach_protocols(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES coach_protocol_tasks(id) ON DELETE CASCADE NOT NULL,

  -- Completion status
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one progress record per user per task
  UNIQUE(user_id, task_id)
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- MIO protocols indexes
CREATE INDEX IF NOT EXISTS idx_mio_weekly_protocols_user_id ON mio_weekly_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_mio_weekly_protocols_status ON mio_weekly_protocols(status);
CREATE INDEX IF NOT EXISTS idx_mio_weekly_protocols_user_week ON mio_weekly_protocols(user_id, week_number, year);

-- MIO progress indexes
CREATE INDEX IF NOT EXISTS idx_mio_user_protocol_progress_user_id ON mio_user_protocol_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mio_user_protocol_progress_protocol_id ON mio_user_protocol_progress(protocol_id);
CREATE INDEX IF NOT EXISTS idx_mio_user_protocol_progress_status ON mio_user_protocol_progress(status);

-- Coach protocols indexes
CREATE INDEX IF NOT EXISTS idx_coach_protocols_coach_id ON coach_protocols(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_protocols_status ON coach_protocols(status);
CREATE INDEX IF NOT EXISTS idx_coach_protocols_visibility ON coach_protocols(visibility);
CREATE INDEX IF NOT EXISTS idx_coach_protocols_schedule ON coach_protocols(schedule_type, cycle_week_number);

-- Coach tasks indexes
CREATE INDEX IF NOT EXISTS idx_coach_protocol_tasks_protocol_id ON coach_protocol_tasks(protocol_id);
CREATE INDEX IF NOT EXISTS idx_coach_protocol_tasks_day ON coach_protocol_tasks(protocol_id, day_number);

-- User coach progress indexes
CREATE INDEX IF NOT EXISTS idx_user_coach_protocol_progress_user_id ON user_coach_protocol_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coach_protocol_progress_protocol_id ON user_coach_protocol_progress(protocol_id);
CREATE INDEX IF NOT EXISTS idx_user_coach_protocol_progress_task_id ON user_coach_protocol_progress(task_id);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE mio_weekly_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE mio_user_protocol_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_protocol_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coach_protocol_progress ENABLE ROW LEVEL SECURITY;

-- MIO Weekly Protocols: Users can only see their own protocols
CREATE POLICY "Users can view their own MIO protocols"
  ON mio_weekly_protocols FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MIO protocols"
  ON mio_weekly_protocols FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MIO protocols"
  ON mio_weekly_protocols FOR UPDATE
  USING (auth.uid() = user_id);

-- MIO Progress: Users can only see their own progress
CREATE POLICY "Users can view their own MIO progress"
  ON mio_user_protocol_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MIO progress"
  ON mio_user_protocol_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MIO progress"
  ON mio_user_protocol_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Coach Protocols: All users can view published protocols
CREATE POLICY "Users can view published coach protocols"
  ON coach_protocols FOR SELECT
  USING (status = 'published' OR auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own protocols"
  ON coach_protocols FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own protocols"
  ON coach_protocols FOR UPDATE
  USING (auth.uid() = coach_id);

-- Coach Tasks: All users can view tasks of published protocols
CREATE POLICY "Users can view tasks of published protocols"
  ON coach_protocol_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_protocols cp
      WHERE cp.id = protocol_id
      AND (cp.status = 'published' OR cp.coach_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can manage their protocol tasks"
  ON coach_protocol_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_protocols cp
      WHERE cp.id = protocol_id
      AND cp.coach_id = auth.uid()
    )
  );

-- User Coach Progress: Users can only see their own progress
CREATE POLICY "Users can view their own coach progress"
  ON user_coach_protocol_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coach progress"
  ON user_coach_protocol_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coach progress"
  ON user_coach_protocol_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Updated_at Trigger Function
-- =============================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_weekly_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to tables with updated_at
CREATE TRIGGER update_mio_weekly_protocols_updated_at
  BEFORE UPDATE ON mio_weekly_protocols
  FOR EACH ROW EXECUTE FUNCTION update_weekly_insights_updated_at();

CREATE TRIGGER update_mio_user_protocol_progress_updated_at
  BEFORE UPDATE ON mio_user_protocol_progress
  FOR EACH ROW EXECUTE FUNCTION update_weekly_insights_updated_at();

CREATE TRIGGER update_coach_protocols_updated_at
  BEFORE UPDATE ON coach_protocols
  FOR EACH ROW EXECUTE FUNCTION update_weekly_insights_updated_at();

-- =============================================
-- Sample Data for Testing (Optional)
-- =============================================

-- Uncomment below to insert sample MIO protocol for testing
/*
INSERT INTO mio_weekly_protocols (
  user_id,
  protocol_type,
  protocol_theme,
  protocol_summary,
  day_tasks,
  success_criteria,
  source,
  week_number,
  year,
  assigned_week_start,
  status,
  started_at
) VALUES (
  (SELECT id FROM user_profiles LIMIT 1), -- First user
  'recovery',
  'Week 1: The Honest Restart',
  'This week is about radical honesty with yourself. We will identify where you have been lying to yourself about your patterns.',
  '[
    {
      "day": 1,
      "theme": "Acknowledge the Pattern",
      "morning_task": {"title": "Pattern Inventory", "instructions": "List 3 patterns you have been avoiding. Be honest.", "duration_minutes": 15},
      "throughout_day": {"title": "Notice the Triggers", "instructions": "When you feel the pattern urge, note what triggered it."},
      "evening_task": {"title": "Reflection", "instructions": "Write about one moment today when you almost fell into the pattern.", "duration_minutes": 10},
      "success_criteria": ["Completed pattern inventory", "Noted at least 2 triggers", "Wrote evening reflection"]
    },
    {
      "day": 2,
      "theme": "Name Your Enemy",
      "morning_task": {"title": "Enemy Naming", "instructions": "Give your pattern a name. Make it specific.", "duration_minutes": 10},
      "throughout_day": {"title": "Call It Out", "instructions": "When the pattern shows up, say its name out loud (or in your head)."},
      "evening_task": {"title": "Battle Report", "instructions": "How many times did you catch the enemy today?", "duration_minutes": 5},
      "success_criteria": ["Named the pattern", "Called it out at least 3 times", "Completed battle report"]
    }
  ]'::jsonb,
  '["Complete all 7 days", "Average pattern catches per day: 3+", "Written reflections each day"]'::jsonb,
  'assessment',
  48,
  2025,
  '2025-11-25',
  'active',
  NOW()
);
*/
