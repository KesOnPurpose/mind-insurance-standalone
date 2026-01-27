-- Add RLS policy for claiming orphaned call logs
-- This allows authenticated users to update call logs with null user_id
-- to claim them (set user_id to their own auth.uid())

-- Policy: Users can claim call logs with null user_id
-- This handles the race condition where webhook creates record before frontend
CREATE POLICY "Users can claim orphaned call logs"
ON vapi_call_logs
FOR UPDATE
TO authenticated
USING (user_id IS NULL)
WITH CHECK (auth.uid() = user_id);

-- Also update SELECT policy to allow users to see their own calls
-- (Keep existing policy but add comment for clarity)
-- The existing "Users can view own call logs" policy handles this
