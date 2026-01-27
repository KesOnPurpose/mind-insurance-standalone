-- Add RLS policies for vapi_call_logs table
-- Allow users to insert their own call logs

-- Policy: Users can insert their own call logs
CREATE POLICY "Users can insert own call logs"
ON vapi_call_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own call logs
CREATE POLICY "Users can view own call logs"
ON vapi_call_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own call logs
CREATE POLICY "Users can update own call logs"
ON vapi_call_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role full access (for webhooks)
CREATE POLICY "Service role has full access to call logs"
ON vapi_call_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
