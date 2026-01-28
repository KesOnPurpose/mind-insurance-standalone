-- =============================================
-- External Mental Pillar Assessment Migration
-- Adds support for public/guest assessments that can be linked to users
-- =============================================

-- 1. Make user_id nullable for guest assessments
ALTER TABLE mental_pillar_assessments
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add columns for guest/external assessment support
ALTER TABLE mental_pillar_assessments
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_session_id TEXT,
  ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS linked_by TEXT;

-- 3. Update source constraint to include 'external_assessment'
ALTER TABLE mental_pillar_assessments
  DROP CONSTRAINT IF EXISTS mental_pillar_assessments_source_check;

ALTER TABLE mental_pillar_assessments
  ADD CONSTRAINT mental_pillar_assessments_source_check
  CHECK (source IN ('user_initiated', 'coach_assigned', 'system_day28', 'mio_suggested', 'external_assessment'));

-- 4. Ensure either user_id OR guest_email exists
ALTER TABLE mental_pillar_assessments
  DROP CONSTRAINT IF EXISTS mpa_user_or_guest;

ALTER TABLE mental_pillar_assessments
  ADD CONSTRAINT mpa_user_or_guest
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

-- 5. Index for email matching
CREATE INDEX IF NOT EXISTS idx_mpa_guest_email ON mental_pillar_assessments(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mpa_is_external ON mental_pillar_assessments(is_external) WHERE is_external = TRUE;

-- =============================================
-- RPC Function: Save External Mental Pillar Assessment
-- =============================================
CREATE OR REPLACE FUNCTION save_external_mental_pillar_assessment(
  p_guest_session_id TEXT,
  p_guest_email TEXT,
  p_guest_name TEXT,
  p_pillar_scores JSONB,
  p_responses JSONB,
  p_started_at TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
  v_assessment_id UUID;
  v_matched_user_id UUID;
  v_existing_pre_id UUID;
  v_time_seconds INTEGER;
  v_overwrote_existing BOOLEAN := FALSE;
BEGIN
  -- Calculate completion time
  v_time_seconds := EXTRACT(EPOCH FROM (NOW() - p_started_at))::INTEGER;

  -- Check if email matches existing user (case-insensitive)
  SELECT id INTO v_matched_user_id
  FROM user_profiles
  WHERE LOWER(email) = LOWER(p_guest_email)
  LIMIT 1;

  -- If user exists, check for existing PRE baseline to overwrite
  IF v_matched_user_id IS NOT NULL THEN
    SELECT id INTO v_existing_pre_id
    FROM mental_pillar_assessments
    WHERE user_id = v_matched_user_id
      AND assessment_phase = 'pre'
      AND completed_at IS NOT NULL
    ORDER BY created_at ASC
    LIMIT 1;

    -- Delete existing PRE baseline (overwrite strategy)
    IF v_existing_pre_id IS NOT NULL THEN
      DELETE FROM mental_pillar_assessments WHERE id = v_existing_pre_id;
      v_overwrote_existing := TRUE;
    END IF;
  END IF;

  -- Insert new assessment
  INSERT INTO mental_pillar_assessments (
    user_id,
    guest_email,
    guest_name,
    guest_session_id,
    is_external,
    assessment_phase,
    attempt_number,
    source,
    source_context,
    pillar_scores,
    responses,
    started_at,
    completed_at,
    time_to_complete_seconds,
    linked_at,
    linked_by
  ) VALUES (
    v_matched_user_id,
    p_guest_email,
    p_guest_name,
    p_guest_session_id,
    TRUE,
    'pre',
    1,
    'external_assessment',
    jsonb_build_object('source_url', 'grouphome4newbies.com/mental-assessment'),
    p_pillar_scores,
    p_responses,
    p_started_at,
    NOW(),
    v_time_seconds,
    CASE WHEN v_matched_user_id IS NOT NULL THEN NOW() ELSE NULL END,
    CASE WHEN v_matched_user_id IS NOT NULL THEN 'email_match' ELSE NULL END
  )
  RETURNING id INTO v_assessment_id;

  RETURN jsonb_build_object(
    'assessment_id', v_assessment_id,
    'user_matched', v_matched_user_id IS NOT NULL,
    'user_id', v_matched_user_id,
    'overwrote_existing', v_overwrote_existing,
    'time_to_complete_seconds', v_time_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC Function: Link External Assessments on Auth
-- Called when a new user signs up to link any prior guest assessments
-- =============================================
CREATE OR REPLACE FUNCTION link_external_assessments_on_auth(
  p_user_id UUID,
  p_user_email TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_linked_count INTEGER := 0;
  v_existing_pre_id UUID;
  v_new_external_id UUID;
BEGIN
  -- Check if user already has a PRE baseline (non-external)
  SELECT id INTO v_existing_pre_id
  FROM mental_pillar_assessments
  WHERE user_id = p_user_id
    AND assessment_phase = 'pre'
    AND completed_at IS NOT NULL
    AND (is_external IS NULL OR is_external = FALSE)
  ORDER BY created_at ASC
  LIMIT 1;

  -- Find the most recent unlinked external assessment with matching email
  SELECT id INTO v_new_external_id
  FROM mental_pillar_assessments
  WHERE user_id IS NULL
    AND LOWER(guest_email) = LOWER(p_user_email)
    AND is_external = TRUE
    AND linked_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If found, link it
  IF v_new_external_id IS NOT NULL THEN
    -- If user had existing PRE and we're linking external, delete the old one
    IF v_existing_pre_id IS NOT NULL THEN
      DELETE FROM mental_pillar_assessments WHERE id = v_existing_pre_id;
    END IF;

    -- Link the external assessment to the user
    UPDATE mental_pillar_assessments
    SET
      user_id = p_user_id,
      linked_at = NOW(),
      linked_by = 'signup'
    WHERE id = v_new_external_id;

    v_linked_count := 1;
  END IF;

  -- Link any other external assessments (non-PRE or older ones) without overwriting
  UPDATE mental_pillar_assessments
  SET
    user_id = p_user_id,
    linked_at = NOW(),
    linked_by = 'signup'
  WHERE
    user_id IS NULL
    AND LOWER(guest_email) = LOWER(p_user_email)
    AND is_external = TRUE
    AND linked_at IS NULL
    AND id != COALESCE(v_new_external_id, '00000000-0000-0000-0000-000000000000'::UUID);

  GET DIAGNOSTICS v_linked_count = v_linked_count + ROW_COUNT;

  RETURN jsonb_build_object(
    'linked_count', v_linked_count,
    'primary_assessment_id', v_new_external_id,
    'overwrote_existing_pre', v_existing_pre_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RPC Function: Update External Assessment MIO Feedback
-- =============================================
CREATE OR REPLACE FUNCTION update_external_assessment_mio_feedback(
  p_assessment_id UUID,
  p_mio_feedback JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE mental_pillar_assessments
  SET
    mio_feedback = p_mio_feedback,
    updated_at = NOW()
  WHERE id = p_assessment_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS Policies for External Assessments
-- =============================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Allow external assessment insert" ON mental_pillar_assessments;
DROP POLICY IF EXISTS "Allow external assessment read by session" ON mental_pillar_assessments;

-- Allow anonymous insert for external assessments (via RPC function with SECURITY DEFINER)
-- The RPC functions use SECURITY DEFINER so they bypass RLS

-- Ensure authenticated users can still read their linked external assessments
-- (existing policies should cover this, but let's make sure)
CREATE POLICY IF NOT EXISTS "Users can read own assessments including external"
  ON mental_pillar_assessments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION save_external_mental_pillar_assessment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION link_external_assessments_on_auth TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_external_assessment_mio_feedback TO anon, authenticated, service_role;
