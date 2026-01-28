-- ============================================================================
-- FEAT-GH-004-H: Seed default configuration values
-- ============================================================================
-- Purpose: Insert Lynette's current settings as configurable defaults
-- These values can be adjusted via admin without code changes
-- ============================================================================

-- 1. VIDEO TRACKING CONFIGURATION
-- ============================================================================

-- Default video completion threshold (90%)
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'video_completion_threshold',
  '{"percentage": 90, "description": "Percentage of video that must be watched to mark complete"}'::jsonb,
  'video_tracking',
  'Default percentage of video content that must be watched for completion gate',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- Video player settings
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'video_player_settings',
  '{
    "allow_seek": true,
    "allow_speed_change": true,
    "max_speed": 2.0,
    "min_speed": 0.5,
    "track_precise_progress": true,
    "save_position_interval_seconds": 10
  }'::jsonb,
  'video_tracking',
  'Video player behavior settings',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 2. ASSESSMENT CONFIGURATION
-- ============================================================================

-- Default assessment passing score (70%)
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'assessment_passing_score',
  '{"percentage": 70, "description": "Minimum score required to pass assessments"}'::jsonb,
  'assessment',
  'Default passing score for assessments',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- Assessment attempt settings
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'assessment_attempts',
  '{
    "max_attempts": null,
    "cooldown_minutes": 0,
    "show_correct_answers_after_pass": true,
    "show_correct_answers_after_fail": false,
    "show_explanations": true,
    "randomize_questions": false,
    "randomize_options": false
  }'::jsonb,
  'assessment',
  'Assessment attempt rules and display settings',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 3. STUCK DETECTION CONFIGURATION
-- ============================================================================

-- Days of inactivity before marking as stuck
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'stuck_detection_days',
  '{
    "warning_threshold": 3,
    "stuck_threshold": 5,
    "critical_threshold": 7,
    "description": "Days without progress before triggering warnings/nudges"
  }'::jsonb,
  'stuck_detection',
  'Inactivity thresholds for stuck detection',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- Stuck detection rules
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'stuck_detection_rules',
  '{
    "check_video_progress": true,
    "check_assessment_attempts": true,
    "check_tactic_opens": true,
    "exclude_weekends": false,
    "exclude_holidays": false,
    "check_interval_hours": 24,
    "enable_auto_nudge": true
  }'::jsonb,
  'stuck_detection',
  'Rules for detecting when users are stuck',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 4. COMPLETION GATES CONFIGURATION
-- ============================================================================

-- Global completion gate defaults
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'completion_gate_defaults',
  '{
    "require_video": true,
    "require_assessment": true,
    "video_threshold": 90,
    "assessment_threshold": 70,
    "allow_skip_with_note": false,
    "require_coach_approval_to_skip": true,
    "max_assessment_attempts": null
  }'::jsonb,
  'completion_gates',
  'Default completion gate requirements for new tactics',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- Completion gate messaging
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'completion_gate_messages',
  '{
    "video_incomplete": "Please watch at least {threshold}% of the video to proceed.",
    "assessment_failed": "You need to score at least {threshold}% on the assessment. Try again!",
    "all_gates_passed": "Great job! You''ve completed all requirements for this lesson.",
    "skip_warning": "Skipping this content may affect your learning. Are you sure?",
    "coach_override_note": "Your coach has allowed you to proceed. Make sure to review this material later."
  }'::jsonb,
  'completion_gates',
  'User-facing messages for completion gate states',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 5. NOTIFICATIONS CONFIGURATION
-- ============================================================================

-- Nudge message templates
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'nudge_templates',
  '{
    "day_3_warning": {
      "sms": "Hey {first_name}! It''s been 3 days since we''ve seen you. Ready to jump back in? Your next lesson is waiting: {lesson_url}",
      "email_subject": "We miss you, {first_name}!",
      "email_body": "It looks like you haven''t made progress in a few days. No judgment - life happens! But your journey is waiting. Click here to pick up where you left off."
    },
    "day_5_stuck": {
      "sms": "{first_name}, you''re stuck on {tactic_name}. Totally normal! Need help? Reply to this message.",
      "email_subject": "Need a hand, {first_name}?",
      "email_body": "We noticed you might be stuck on {tactic_name}. This is a common place where people need extra support. Reply to this email and we''ll help you through it."
    },
    "day_7_critical": {
      "sms": "Hey {first_name} - Lynette here. It''s been a week. What''s going on? I want to help. Call me: {coach_phone}",
      "email_subject": "Personal message from Lynette",
      "email_body": "I noticed it''s been a week since you''ve logged in. I wanted to reach out personally because I know this content can be challenging. What''s blocking you? Let''s talk."
    },
    "completion_celebration": {
      "sms": "🎉 {first_name}, you crushed it! {tactic_name} complete. Keep this momentum going!",
      "email_subject": "Congratulations on completing {tactic_name}!",
      "email_body": "You did it! Another lesson down. You''re building something amazing. Keep going!"
    }
  }'::jsonb,
  'notifications',
  'Message templates for automated nudges and notifications',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- Notification timing rules
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'notification_timing',
  '{
    "send_sms_hours": [9, 17],
    "send_email_hours": [8, 20],
    "timezone": "America/New_York",
    "avoid_weekends_for_nudges": false,
    "max_nudges_per_week": 3,
    "cooldown_after_engagement_hours": 24
  }'::jsonb,
  'notifications',
  'Timing rules for sending notifications',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 6. COACHING CONFIGURATION
-- ============================================================================

-- Coach escalation thresholds
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'coach_escalation_rules',
  '{
    "auto_escalate_after_days": 7,
    "escalate_on_failed_attempts": 3,
    "escalate_on_low_engagement": true,
    "escalate_on_negative_feedback": true,
    "notify_coach_on_escalation": true,
    "notify_coach_on_completion": false
  }'::jsonb,
  'coaching',
  'Rules for when to escalate issues to coaches',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- Coach dashboard settings
INSERT INTO public.gh_curriculum_config (
  config_key,
  config_value,
  category,
  description,
  is_active
) VALUES (
  'coach_dashboard_settings',
  '{
    "show_risk_scores": true,
    "show_engagement_trends": true,
    "show_completion_predictions": true,
    "highlight_stuck_students": true,
    "default_sort": "risk_score_desc",
    "students_per_page": 20
  }'::jsonb,
  'coaching',
  'Coach dashboard display preferences',
  true
) ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 7. HELPER FUNCTION: Get config value
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_curriculum_config(
  p_config_key TEXT,
  p_default_value JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT config_value INTO v_value
  FROM gh_curriculum_config
  WHERE config_key = p_config_key
  AND is_active = true;

  RETURN COALESCE(v_value, p_default_value);
END;
$$;

COMMENT ON FUNCTION get_curriculum_config(TEXT, JSONB) IS
  'Get a configuration value by key, with optional default if not found';

-- 8. HELPER FUNCTION: Get video completion threshold
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_video_completion_threshold()
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT (config_value->>'percentage')::DECIMAL(5,2)
    FROM gh_curriculum_config
    WHERE config_key = 'video_completion_threshold'
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION get_video_completion_threshold() IS
  'Get the current video completion threshold percentage (default 90%)';

-- 9. HELPER FUNCTION: Get assessment passing score
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_assessment_passing_score()
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT (config_value->>'percentage')::DECIMAL(5,2)
    FROM gh_curriculum_config
    WHERE config_key = 'assessment_passing_score'
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION get_assessment_passing_score() IS
  'Get the current assessment passing score percentage (default 70%)';

-- 10. VERIFICATION QUERY
-- ============================================================================
DO $$
DECLARE
  v_config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_config_count
  FROM gh_curriculum_config
  WHERE is_active = true;

  IF v_config_count >= 10 THEN
    RAISE NOTICE '✓ FEAT-GH-004-H: Default configuration seeded (% active configs)', v_config_count;
  ELSE
    RAISE EXCEPTION '✗ FEAT-GH-004-H: Configuration seeding incomplete (only % configs)', v_config_count;
  END IF;
END $$;
