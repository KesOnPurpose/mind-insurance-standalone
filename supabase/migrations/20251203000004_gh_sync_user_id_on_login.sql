-- ============================================================================
-- GROUPHOME (GH) - SYNC USER_ID ON LOGIN/SIGNUP
-- ============================================================================
-- Purpose: Update gh_approved_users.user_id when user signs in or signs up
-- Fixes: Status badges showing "Invited" for logged-in users
-- Issue: Auto-linking wasn't syncing for existing users who got approved later
-- Solution: Enhance existing handle_new_user() trigger to also sync gh_approved_users
-- ============================================================================

-- Enhanced trigger function that syncs BOTH user_profiles AND gh_approved_users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert/Update user_profiles (existing functionality)
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    provider,
    phone_number,
    preferred_auth_method,
    email_verified_at,
    created_at,
    updated_at,
    last_login_at,
    login_count,
    metadata,
    challenge_start_date,
    current_day,
    total_points,
    championship_level,
    onboarding_completed,
    timezone,
    push_token,
    notification_preferences,
    deleted_at,
    avatar_type,
    temperament,
    collision_patterns,
    assessment_completed_at,
    expo_push_token,
    target_city,
    target_state,
    property_acquisition_type,
    license_status,
    property_beds,
    target_demographics,
    timeline_days,
    startup_capital,
    credit_score_range,
    include_credit_repair,
    real_estate_experience,
    ninety_day_vision,
    onboarding_day_1_complete,
    onboarding_day_2_complete,
    onboarding_day_3_complete,
    onboarding_status,
    onboarding_completed_at,
    current_journey_week,
    current_journey_day,
    current_tactic_id,
    week_1_completed_at,
    week_2_completed_at,
    week_3_completed_at,
    week_4_completed_at,
    week_5_completed_at,
    week_6_completed_at,
    week_7_completed_at,
    week_8_completed_at,
    week_9_completed_at,
    week_10_completed_at,
    week_11_completed_at,
    week_12_completed_at,
    daily_streak_count,
    longest_streak,
    last_tactic_completed_at,
    estimated_completion_date,
    tier_level,
    tier_start_date,
    tier_expires_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NEW.raw_user_meta_data->>'phone',
    'password',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    NOW(),
    NOW(),
    NOW(),
    1,
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    NOW(),
    1,
    0,
    'bronze',
    false,
    'America/New_York',
    NULL,
    '{"achievements": true, "time_windows": true, "daily_reminders": true, "partner_messages": true}'::jsonb,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    NULL,
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    false,
    false,
    false,
    'incomplete',
    NULL,
    1,
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    0,
    NULL,
    NULL,
    'free',
    NULL,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    provider = COALESCE(EXCLUDED.provider, user_profiles.provider),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, user_profiles.email_verified_at),
    metadata = COALESCE(EXCLUDED.metadata, user_profiles.metadata),
    last_login_at = NOW(),
    login_count = user_profiles.login_count + 1,
    updated_at = NOW();

  -- 2. NEW: Sync gh_approved_users table if email matches (fixes status badges)
  UPDATE public.gh_approved_users
  SET
    user_id = NEW.id,
    last_access_at = NOW(),
    updated_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email)
  AND user_id IS NULL;  -- Only update if not already linked

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
'Complete backward-compatible trigger supporting ALL columns in user_profiles.
Handles both Mind Insurance app and Grouphome app requirements.
NOW ALSO syncs gh_approved_users.user_id for status badge accuracy.';
