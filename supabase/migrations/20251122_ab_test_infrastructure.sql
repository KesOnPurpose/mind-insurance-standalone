-- =====================================================
-- A/B Testing Infrastructure for Week 6
-- Database Schema & RLS Policies
-- Created: 2025-11-22
-- Purpose: Support clinical vs simplified protocol testing
-- =====================================================

-- =====================================================
-- TABLE 1: ab_test_assignments
-- Tracks user cohort assignments (A/B) and stratification
-- =====================================================
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('clinical', 'simplified')),
  cohort TEXT NOT NULL CHECK (cohort IN ('A', 'B')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stratification_avatar TEXT CHECK (stratification_avatar IN ('warrior', 'sage', 'builder', 'connector')),
  stratification_device TEXT CHECK (stratification_device IN ('mobile', 'desktop')),
  stratification_education TEXT CHECK (stratification_education IN ('high_school', 'college', 'grad')),
  UNIQUE(user_id)
);

COMMENT ON TABLE ab_test_assignments IS 'Stores user cohort assignments for A/B testing with stratification metadata';
COMMENT ON COLUMN ab_test_assignments.variant IS 'Protocol variant shown to user: clinical or simplified';
COMMENT ON COLUMN ab_test_assignments.cohort IS 'Test cohort assignment: A or B (for balanced distribution)';
COMMENT ON COLUMN ab_test_assignments.stratification_avatar IS 'User temperament for balanced cohort assignment';
COMMENT ON COLUMN ab_test_assignments.stratification_device IS 'Device type for responsive testing analysis';
COMMENT ON COLUMN ab_test_assignments.stratification_education IS 'Education level for comprehension correlation analysis';

-- =====================================================
-- TABLE 2: ab_test_comprehension
-- Tracks comprehension quiz performance by variant
-- =====================================================
CREATE TABLE IF NOT EXISTS ab_test_comprehension (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES mio_knowledge_chunks(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('clinical', 'simplified')),
  quiz_score INTEGER NOT NULL CHECK (quiz_score >= 0 AND quiz_score <= 5),
  time_to_complete_seconds INTEGER NOT NULL CHECK (time_to_complete_seconds >= 0),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ab_test_comprehension IS 'Stores comprehension quiz results for each protocol variant';
COMMENT ON COLUMN ab_test_comprehension.quiz_score IS '5-question quiz score (0-5), measures understanding';
COMMENT ON COLUMN ab_test_comprehension.time_to_complete_seconds IS 'Time taken to complete quiz, indicates cognitive load';

-- =====================================================
-- TABLE 3: ab_test_practice_completion
-- Tracks practice engagement events by variant
-- =====================================================
CREATE TABLE IF NOT EXISTS ab_test_practice_completion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES mio_knowledge_chunks(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('clinical', 'simplified')),
  event_type TEXT NOT NULL CHECK (event_type IN ('viewed', 'started', 'completed', 'abandoned')),
  dwell_time_seconds INTEGER CHECK (dwell_time_seconds >= 0),
  tooltip_interactions INTEGER DEFAULT 0 CHECK (tooltip_interactions >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ab_test_practice_completion IS 'Tracks user engagement events with practice protocols';
COMMENT ON COLUMN ab_test_practice_completion.event_type IS 'Engagement funnel: viewed → started → completed/abandoned';
COMMENT ON COLUMN ab_test_practice_completion.dwell_time_seconds IS 'Time spent on protocol page, measures engagement depth';
COMMENT ON COLUMN ab_test_practice_completion.tooltip_interactions IS 'Count of glossary tooltip clicks, measures terminology difficulty';

-- =====================================================
-- TABLE 4: ab_test_satisfaction
-- Tracks user satisfaction ratings by variant
-- =====================================================
CREATE TABLE IF NOT EXISTS ab_test_satisfaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_id UUID NOT NULL REFERENCES mio_knowledge_chunks(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('clinical', 'simplified')),
  ease_of_understanding INTEGER NOT NULL CHECK (ease_of_understanding >= 1 AND ease_of_understanding <= 5),
  confidence_in_application INTEGER NOT NULL CHECK (confidence_in_application >= 1 AND confidence_in_application <= 5),
  helpfulness INTEGER NOT NULL CHECK (helpfulness >= 1 AND helpfulness <= 5),
  likelihood_to_use INTEGER NOT NULL CHECK (likelihood_to_use >= 1 AND likelihood_to_use <= 5),
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  comments TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ab_test_satisfaction IS 'Stores user satisfaction ratings across 5 dimensions';
COMMENT ON COLUMN ab_test_satisfaction.ease_of_understanding IS '1-5 Likert scale: How easy was this protocol to understand?';
COMMENT ON COLUMN ab_test_satisfaction.confidence_in_application IS '1-5 Likert scale: How confident are you in applying this?';
COMMENT ON COLUMN ab_test_satisfaction.helpfulness IS '1-5 Likert scale: How helpful was this protocol?';
COMMENT ON COLUMN ab_test_satisfaction.likelihood_to_use IS '1-5 Likert scale: How likely are you to use this protocol?';
COMMENT ON COLUMN ab_test_satisfaction.overall_satisfaction IS '1-5 Likert scale: Overall satisfaction with protocol';

-- =====================================================
-- INDEXES: Performance Optimization
-- =====================================================

-- ab_test_assignments indexes
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON ab_test_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_variant ON ab_test_assignments(variant);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_cohort ON ab_test_assignments(cohort);

-- ab_test_comprehension indexes
CREATE INDEX IF NOT EXISTS idx_ab_comprehension_user ON ab_test_comprehension(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_comprehension_protocol ON ab_test_comprehension(protocol_id);
CREATE INDEX IF NOT EXISTS idx_ab_comprehension_variant ON ab_test_comprehension(variant);
CREATE INDEX IF NOT EXISTS idx_ab_comprehension_submitted ON ab_test_comprehension(submitted_at);

-- ab_test_practice_completion indexes
CREATE INDEX IF NOT EXISTS idx_ab_completion_user ON ab_test_practice_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_completion_protocol ON ab_test_practice_completion(protocol_id);
CREATE INDEX IF NOT EXISTS idx_ab_completion_event ON ab_test_practice_completion(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_completion_variant ON ab_test_practice_completion(variant);

-- ab_test_satisfaction indexes
CREATE INDEX IF NOT EXISTS idx_ab_satisfaction_user ON ab_test_satisfaction(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_satisfaction_protocol ON ab_test_satisfaction(protocol_id);
CREATE INDEX IF NOT EXISTS idx_ab_satisfaction_variant ON ab_test_satisfaction(variant);

-- =====================================================
-- RLS POLICIES: Row Level Security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_comprehension ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_practice_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_satisfaction ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ab_test_assignments RLS Policies
-- =====================================================
CREATE POLICY "Users can read their own assignment"
  ON ab_test_assignments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignment"
  ON ab_test_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all assignments"
  ON ab_test_assignments
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- ab_test_comprehension RLS Policies
-- =====================================================
CREATE POLICY "Users can read their own comprehension data"
  ON ab_test_comprehension
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comprehension data"
  ON ab_test_comprehension
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all comprehension data"
  ON ab_test_comprehension
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- ab_test_practice_completion RLS Policies
-- =====================================================
CREATE POLICY "Users can read their own practice data"
  ON ab_test_practice_completion
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice data"
  ON ab_test_practice_completion
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all practice data"
  ON ab_test_practice_completion
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- ab_test_satisfaction RLS Policies
-- =====================================================
CREATE POLICY "Users can read their own satisfaction data"
  ON ab_test_satisfaction
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own satisfaction data"
  ON ab_test_satisfaction
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can read all satisfaction data"
  ON ab_test_satisfaction
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables created: 4
-- Indexes created: 13
-- RLS policies created: 12 (3 per table x 4 tables)
-- Total objects: 29
-- =====================================================
