-- Run this in Supabase SQL Editor to see the actual error

-- First, let's test the trigger directly to see what error we get
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test@example.com';
BEGIN
  -- Simulate what happens when a user signs up
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    instance_id,
    aud,
    role
  ) VALUES (
    test_user_id,
    test_email,
    crypt('test_password', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Test User"}'::jsonb,
    NOW(),
    NOW(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
  );

  RAISE NOTICE 'Test user created successfully: %', test_user_id;

  -- Clean up test data
  DELETE FROM auth.users WHERE id = test_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE NOTICE 'DETAIL: %', SQLSTATE;
END $$;
