-- DIAGNOSTIC QUERY: Run this in Supabase SQL Editor to see exact schema
-- This will show us what columns exist and what the trigger function looks like

-- 1. Show all columns in user_profiles table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Show the current trigger function definition
SELECT
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Show all triggers on auth.users table
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth';
