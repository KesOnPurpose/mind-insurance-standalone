-- Add INSERT policy for user_onboarding table
-- This allows users to create their own onboarding/assessment records
CREATE POLICY "Users can insert own onboarding"
ON public.user_onboarding
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);