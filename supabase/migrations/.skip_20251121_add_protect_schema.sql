-- Mind Insurance PROTECT Schema Migration
-- Adds support for 7 PROTECT practices with time windows and point system
-- Based on original MIC APP FROM LUCAS database structure

-- ============================================================================
-- 1. ADD JSONB COLUMNS TO daily_practices TABLE
-- ============================================================================

-- Add data JSONB column to store practice-specific fields
ALTER TABLE daily_practices
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;

-- Add index for JSONB queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_daily_practices_data ON daily_practices USING GIN(data);

-- Add comment explaining data structure
COMMENT ON COLUMN daily_practices.data IS 'Practice-specific data in JSONB format. Structure varies by practice_type:
P (Pattern Check): caught_pattern, collision_type, situation_description, reframe_description
R (Reinforce Identity): identity_statement, recording_id, recording_duration
O (Outcome Visualization): outcome_description, background_audio, meditation_completed
T (Trigger Reset): trigger_description, intensity_level, old_response, reset_method, new_response
E (Energy Audit): energy_level, energy_drains[], energy_boosters[], eliminate_commitment, add_commitment, optimize_commitment
C (Celebrate Wins): championship_win, micro_victory, future_self_evidence, championship_gratitude, victory_celebration
T2 (Tomorrow Setup): tomorrow_goal, morning_routine, trigger_prevention, success_visualization, mindset_declaration';

-- ============================================================================
-- 2. CREATE voice_recordings TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES daily_practices(id) ON DELETE SET NULL,
  recording_url TEXT NOT NULL,
  recording_duration INTEGER NOT NULL CHECK (recording_duration >= 0),
  transcription_text TEXT,
  recording_type TEXT NOT NULL CHECK (recording_type IN ('identity', 'celebration', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure user_id is valid
  CONSTRAINT valid_user_id CHECK (user_id IS NOT NULL)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user_id ON voice_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_practice_id ON voice_recordings(practice_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_created_at ON voice_recordings(created_at DESC);

-- Enable RLS
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_recordings
CREATE POLICY "Users can view own recordings"
  ON voice_recordings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings"
  ON voice_recordings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings"
  ON voice_recordings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
  ON voice_recordings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE voice_recordings IS 'Stores voice recordings for Reinforce Identity (R) practice and celebration recordings. Recordings are uploaded to Supabase Storage and transcriptions are generated via N8n webhook.';

-- ============================================================================
-- 3. CREATE practice_streaks TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_practice_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure current_streak never exceeds longest_streak
  CONSTRAINT valid_streaks CHECK (longest_streak >= current_streak)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_practice_streaks_user_id ON practice_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_streaks_last_practice_date ON practice_streaks(last_practice_date DESC);

-- Enable RLS
ALTER TABLE practice_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_streaks
CREATE POLICY "Users can view own streaks"
  ON practice_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON practice_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON practice_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE practice_streaks IS 'Tracks consecutive daily practice completion streaks for gamification and accountability. Automatically updated when daily_practices records are inserted.';

-- ============================================================================
-- 4. CREATE FUNCTION TO AUTO-UPDATE STREAKS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_practice_streaks()
RETURNS TRIGGER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Only update if practice is completed
  IF NEW.completed = true THEN
    -- Get existing streak data
    SELECT last_practice_date, current_streak, longest_streak
    INTO v_last_date, v_current_streak, v_longest_streak
    FROM practice_streaks
    WHERE user_id = NEW.user_id;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
      INSERT INTO practice_streaks (user_id, current_streak, longest_streak, last_practice_date)
      VALUES (NEW.user_id, 1, 1, NEW.practice_date::DATE);
    ELSE
      -- Check if this is a consecutive day
      IF v_last_date = NEW.practice_date::DATE - INTERVAL '1 day' THEN
        -- Increment streak
        v_current_streak := v_current_streak + 1;
        v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
      ELSIF v_last_date = NEW.practice_date::DATE THEN
        -- Same day, no change to streak
        v_current_streak := v_current_streak;
      ELSE
        -- Streak broken, reset to 1
        v_current_streak := 1;
      END IF;

      -- Update streak record
      UPDATE practice_streaks
      SET current_streak = v_current_streak,
          longest_streak = v_longest_streak,
          last_practice_date = NEW.practice_date::DATE,
          updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update streaks
DROP TRIGGER IF EXISTS trigger_update_practice_streaks ON daily_practices;
CREATE TRIGGER trigger_update_practice_streaks
  AFTER INSERT ON daily_practices
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_streaks();

COMMENT ON FUNCTION update_practice_streaks() IS 'Automatically updates practice_streaks table when a new daily_practice is completed. Handles streak incrementation, streak breaking, and longest streak tracking.';

-- ============================================================================
-- 5. VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Test that all tables exist
DO $$
BEGIN
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_practices'));
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voice_recordings'));
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practice_streaks'));
  RAISE NOTICE 'All tables exist ✓';
END $$;

-- Test that columns were added
DO $$
BEGIN
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_practices' AND column_name = 'data'));
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_practices' AND column_name = 'completed'));
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_practices' AND column_name = 'is_late'));
  RAISE NOTICE 'daily_practices columns added ✓';
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Mind Insurance PROTECT Schema Migration Complete!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - voice_recordings (for R practice audio)';
  RAISE NOTICE '  - practice_streaks (for gamification)';
  RAISE NOTICE 'Columns added to daily_practices:';
  RAISE NOTICE '  - data (JSONB for practice-specific fields)';
  RAISE NOTICE '  - completed (BOOLEAN for completion tracking)';
  RAISE NOTICE '  - is_late (BOOLEAN for time window penalties)';
  RAISE NOTICE 'Triggers created:';
  RAISE NOTICE '  - Auto-update streaks on practice completion';
  RAISE NOTICE '==================================================';
END $$;
