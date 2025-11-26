-- Test the handle_new_user() trigger function directly
-- This will show the EXACT error that's causing the 500 error

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_user RECORD;
BEGIN
  -- Simulate what happens when Supabase Auth creates a user
  -- This mimics the NEW record that the trigger receives

  RAISE NOTICE '=== TESTING TRIGGER FUNCTION DIRECTLY ===';
  RAISE NOTICE 'Test User ID: %', test_user_id;

  -- Create a simulated auth.users record (what the trigger receives as NEW)
  SELECT
    test_user_id as id,
    'test-trigger@example.com' as email,
    NOW() as created_at,
    NOW() as updated_at,
    NOW() as email_confirmed_at,
    '{"full_name": "Test User", "avatar_url": "https://example.com/avatar.jpg"}'::jsonb as raw_user_meta_data,
    '{"provider": "email"}'::jsonb as raw_app_meta_data
  INTO test_user;

  RAISE NOTICE 'Simulated auth.users record created';

  -- Now attempt the INSERT that the trigger performs
  BEGIN
    INSERT INTO public.user_profiles (
      -- Core columns
      id,
      email,
      created_at,
      updated_at,

      -- Mind Insurance required columns
      challenge_start_date,
      current_day,
      total_points,
      championship_level,
      onboarding_completed,
      timezone,

      -- Grouphome OAuth columns
      full_name,
      avatar_url,
      provider,
      email_verified_at,
      metadata
    )
    VALUES (
      test_user.id,
      test_user.email,
      NOW(),
      NOW(),

      -- Mind Insurance defaults
      NOW(),
      1,
      0,
      'bronze',
      false,
      'America/New_York',

      -- Grouphome OAuth data
      COALESCE(test_user.raw_user_meta_data->>'full_name', test_user.raw_user_meta_data->>'name'),
      test_user.raw_user_meta_data->>'avatar_url',
      COALESCE(test_user.raw_app_meta_data->>'provider', 'email'),
      CASE WHEN test_user.email_confirmed_at IS NOT NULL THEN test_user.email_confirmed_at ELSE NULL END,
      COALESCE(test_user.raw_user_meta_data, '{}'::jsonb)
    );

    RAISE NOTICE '✅ SUCCESS: Trigger INSERT worked!';
    RAISE NOTICE 'The trigger is working correctly. The error must be elsewhere.';

    -- Clean up test data
    DELETE FROM public.user_profiles WHERE id = test_user_id;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ FAILED: Trigger INSERT failed with error:';
      RAISE NOTICE 'Error Code: %', SQLSTATE;
      RAISE NOTICE 'Error Message: %', SQLERRM;
      RAISE NOTICE 'Error Detail: %', PG_EXCEPTION_DETAIL;
      RAISE NOTICE 'Error Hint: %', PG_EXCEPTION_HINT;
      RAISE NOTICE '';
      RAISE NOTICE 'This is the ACTUAL error causing the 500 error!';
  END;

END $$;

-- Also check which columns are NOT NULL without defaults
SELECT
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY column_name;
