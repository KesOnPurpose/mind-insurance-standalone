-- Remove any duplicate records from user_onboarding (keep most recent)
DELETE FROM public.user_onboarding a
USING public.user_onboarding b
WHERE a.id < b.id 
AND a.user_id = b.user_id;

-- Add unique constraint to allow upsert operations
ALTER TABLE public.user_onboarding
ADD CONSTRAINT user_onboarding_user_id_key UNIQUE (user_id);