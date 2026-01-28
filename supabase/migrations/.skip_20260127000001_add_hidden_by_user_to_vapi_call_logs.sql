-- ============================================================================
-- Migration: Add hidden_by_user column to vapi_call_logs
-- Purpose: Allow users to hide/delete calls from their view without losing data
-- Date: 2026-01-27
-- ============================================================================

-- Add the hidden_by_user column with default false
ALTER TABLE IF EXISTS public.vapi_call_logs
ADD COLUMN IF NOT EXISTS hidden_by_user BOOLEAN DEFAULT false;

-- Create an index on hidden_by_user and user_id for efficient filtering
-- This helps queries that filter by user and visibility
CREATE INDEX IF NOT EXISTS idx_vapi_call_logs_user_hidden
ON public.vapi_call_logs (user_id, hidden_by_user)
WHERE hidden_by_user = false;

-- Add a comment explaining the column's purpose
COMMENT ON COLUMN public.vapi_call_logs.hidden_by_user IS 'When true, the call is hidden from the user''s view but retained in the database for admin/analytics purposes';
