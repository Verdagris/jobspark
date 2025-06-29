/*
  # Create user progress tracking table

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `total_sessions` (integer)
      - `sessions_this_week` (integer)
      - `sessions_this_month` (integer)
      - `current_streak` (integer)
      - `longest_streak` (integer)
      - `last_session_date` (date)
      - `average_score` (numeric)
      - `best_score` (integer)
      - `total_practice_minutes` (integer)
      - `improvement_areas` (text array)
      - `strengths` (text array)
      - `session_types_practiced` (jsonb)
      - `weekly_goal` (integer)
      - `achievements` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_progress table
    - Add policy for authenticated users to manage their own progress
*/

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_sessions integer DEFAULT 0,
  sessions_this_week integer DEFAULT 0,
  sessions_this_month integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_session_date date,
  average_score numeric(5,2) DEFAULT 0,
  best_score integer DEFAULT 0,
  total_practice_minutes integer DEFAULT 0,
  improvement_areas text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  session_types_practiced jsonb DEFAULT '{}',
  weekly_goal integer DEFAULT 3,
  achievements text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_session ON user_progress(last_session_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(current_streak);

-- Function to automatically create user progress when user signs up
CREATE OR REPLACE FUNCTION create_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user progress for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_progress();

-- Function to update weekly/monthly counters
CREATE OR REPLACE FUNCTION update_session_counters()
RETURNS void AS $$
BEGIN
  -- Reset weekly counters (run this weekly)
  UPDATE user_progress 
  SET sessions_this_week = 0
  WHERE EXTRACT(DOW FROM now()) = 1; -- Monday

  -- Reset monthly counters (run this monthly)
  UPDATE user_progress 
  SET sessions_this_month = 0
  WHERE EXTRACT(DAY FROM now()) = 1; -- First day of month
END;
$$ LANGUAGE plpgsql;