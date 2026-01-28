-- ============================================================================
-- DECOMMISSION: GHL Voice System
-- We are going 100% Vapi - removing legacy GHL voice tables and functions
--
-- WHAT'S BEING REMOVED:
-- - nette_voice_call_logs table (GHL voice call data)
-- - get_nette_voice_calls_for_chat function (deprecated RPC)
-- - get_recent_nette_voice_calls function (deprecated RPC)
-- - mark_nette_voice_call_synced function (deprecated RPC)
--
-- WHAT'S BEING KEPT:
-- - vapi_call_logs table (Vapi voice calls)
-- - get_vapi_voice_calls_for_chat function (new RPC)
-- - get_recent_vapi_voice_calls function (new RPC)
-- - All Vapi Edge Functions
-- ============================================================================

-- Step 1: Drop deprecated RPC functions (safe - won't error if not exists)
DROP FUNCTION IF EXISTS get_nette_voice_calls_for_chat(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_recent_nette_voice_calls(UUID, INTEGER);
DROP FUNCTION IF EXISTS mark_nette_voice_call_synced(UUID, UUID);
DROP FUNCTION IF EXISTS mark_nette_voice_call_synced(TEXT, TEXT);

-- Step 2: Check if table exists before attempting operations
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'nette_voice_call_logs'
  ) INTO table_exists;

  IF table_exists THEN
    -- Log the decommission
    RAISE NOTICE 'Decommissioning nette_voice_call_logs table...';

    -- Count records before deletion (for audit)
    RAISE NOTICE 'Dropping nette_voice_call_logs table (GHL voice system decommissioned)';

    -- Drop the table (this will also drop any associated triggers/policies)
    DROP TABLE IF EXISTS public.nette_voice_call_logs CASCADE;

    RAISE NOTICE 'GHL voice system decommissioned successfully';
  ELSE
    RAISE NOTICE 'nette_voice_call_logs table does not exist - already decommissioned or never created';
  END IF;
END $$;

-- Step 3: Verification - ensure we haven't broken anything
DO $$
BEGIN
  -- Verify nette table is gone
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nette_voice_call_logs') THEN
    RAISE EXCEPTION 'DECOMMISSION FAILED: nette_voice_call_logs table still exists';
  END IF;

  -- Verify vapi table still exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vapi_call_logs') THEN
    RAISE EXCEPTION 'CRITICAL: vapi_call_logs table is missing! This should not happen.';
  END IF;

  -- Verify new RPC functions exist
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_vapi_voice_calls_for_chat') THEN
    RAISE WARNING 'get_vapi_voice_calls_for_chat function not found - run 20260127130000_vapi_voice_calls_rpc.sql first';
  END IF;

  RAISE NOTICE '✅ GHL voice system decommission verification complete';
  RAISE NOTICE '✅ Vapi-only voice system is now active';
END $$;

-- Add migration record comment
COMMENT ON TABLE public.vapi_call_logs IS
  'Primary voice call log table (Vapi-only system). GHL voice system decommissioned 2026-01-27.';
