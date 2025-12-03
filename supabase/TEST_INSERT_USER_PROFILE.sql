-- Test if we can INSERT a minimal user_profiles record
-- This simulates what the trigger does

DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Attempt 1: Minimal columns (what current trigger does)
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      created_at,
      updated_at
    )
    VALUES (
      test_user_id,
      'test-minimal@example.com',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'SUCCESS: Minimal INSERT worked!';
    DELETE FROM public.user_profiles WHERE id = test_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'FAILED: Minimal INSERT failed with error: %', SQLERRM;
  END;

  -- Attempt 2: With challenge_start_date
  test_user_id := gen_random_uuid();
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      created_at,
      updated_at,
      challenge_start_date
    )
    VALUES (
      test_user_id,
      'test-with-challenge@example.com',
      NOW(),
      NOW(),
      NOW()
    );

    RAISE NOTICE 'SUCCESS: INSERT with challenge_start_date worked!';
    DELETE FROM public.user_profiles WHERE id = test_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'FAILED: INSERT with challenge_start_date failed: %', SQLERRM;
  END;

  -- Attempt 3: Check if challenge_start_date is NOT NULL
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
      AND column_name = 'challenge_start_date'
      AND is_nullable = 'NO'
  ) THEN
    RAISE NOTICE 'WARNING: challenge_start_date is NOT NULL (requires value)';
  ELSE
    RAISE NOTICE 'INFO: challenge_start_date is nullable (optional)';
  END IF;
END $$;
