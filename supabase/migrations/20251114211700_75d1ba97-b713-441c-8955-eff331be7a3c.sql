-- Add helper functions for PROTECT practices

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id_param UUID, points_param INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET total_points = total_points + points_param,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update practice streak
CREATE OR REPLACE FUNCTION update_practice_streak(user_id_param UUID, practice_date_param DATE)
RETURNS VOID AS $$
DECLARE
  yesterday_practices INTEGER;
  current_streak INTEGER;
  longest_streak INTEGER;
BEGIN
  -- Check if user practiced yesterday
  SELECT COUNT(*)
  INTO yesterday_practices
  FROM daily_practices
  WHERE user_id = user_id_param
    AND practice_date = practice_date_param - INTERVAL '1 day'
    AND completed = true;
  
  -- Get current streak from user_profiles
  SELECT COALESCE(current_streak, 0), COALESCE(longest_streak, 0)
  INTO current_streak, longest_streak
  FROM user_profiles
  WHERE id = user_id_param;
  
  -- Update streak
  IF yesterday_practices > 0 THEN
    -- Continue streak
    current_streak := current_streak + 1;
  ELSE
    -- Start new streak
    current_streak := 1;
  END IF;
  
  -- Update longest streak if current is higher
  IF current_streak > longest_streak THEN
    longest_streak := current_streak;
  END IF;
  
  -- Save to user_profiles
  UPDATE user_profiles
  SET current_streak = current_streak,
      longest_streak = longest_streak,
      updated_at = NOW()
  WHERE id = user_id_param;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for faster practice queries
CREATE INDEX IF NOT EXISTS idx_daily_practices_user_date 
ON daily_practices(user_id, practice_date);

CREATE INDEX IF NOT EXISTS idx_daily_practices_user_type_date 
ON daily_practices(user_id, practice_type, practice_date);

-- Add index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);