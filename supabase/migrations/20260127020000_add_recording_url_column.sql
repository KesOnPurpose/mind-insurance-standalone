-- Add recording_url column to vapi_call_logs
-- This column stores the Vapi recording URL for playback

ALTER TABLE public.vapi_call_logs
ADD COLUMN IF NOT EXISTS recording_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.vapi_call_logs.recording_url IS 'URL to the Vapi call recording for playback';
