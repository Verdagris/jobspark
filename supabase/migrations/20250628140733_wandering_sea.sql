/*
  # Create user progress tracking table

  1. New Tables
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `total_sessions` (integer)
      - `total_practice_time` (integer)
      - `average_score` (numeric)
      - `best_score` (integer)
      - `sessions_this_week` (integer)
      - `sessions_this_month` (integer)
      - `improvement_areas` (text array)
      - `strengths` (text array)
      - `last_session_date` (timestamp)
      - `streak_days` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_progress table
    - Add policy for authenticated users to manage their own progress

  3. Updates
    - Add `session_type` column to interview_sessions table
*/

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sessions integer DEFAULT 0,
  total_practice_time integer DEFAULT 0,
  average_score numeric(5,2) DEFAULT 0,
  best_score integer DEFAULT 0,
  sessions_this_week integer DEFAULT 0,
  sessions_this_month integer DEFAULT 0,
  improvement_areas text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  last_session_date timestamptz,
  streak_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add session_type column to interview_sessions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'session_type'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN session_type text DEFAULT 'mock-interview';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_last_session ON user_progress(last_session_date);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(streak_days);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_type ON interview_sessions(session_type);

-- Function to update user progress after interview session
CREATE OR REPLACE FUNCTION update_user_progress_after_session()
RETURNS TRIGGER AS $$
DECLARE
  user_sessions_count integer;
  user_avg_score numeric;
  user_best_score integer;
  user_total_time integer;
  sessions_this_week integer;
  sessions_this_month integer;
  current_streak integer;
BEGIN
  -- Calculate aggregated data for the user
  SELECT 
    COUNT(*),
    ROUND(AVG(overall_score), 2),
    MAX(overall_score),
    SUM(duration_minutes)
  INTO 
    user_sessions_count,
    user_avg_score,
    user_best_score,
    user_total_time
  FROM interview_sessions 
  WHERE user_id = NEW.user_id;

  -- Calculate sessions this week
  SELECT COUNT(*)
  INTO sessions_this_week
  FROM interview_sessions 
  WHERE user_id = NEW.user_id 
    AND created_at >= date_trunc('week', now());

  -- Calculate sessions this month
  SELECT COUNT(*)
  INTO sessions_this_month
  FROM interview_sessions 
  WHERE user_id = NEW.user_id 
    AND created_at >= date_trunc('month', now());

  -- Calculate current streak (simplified)
  SELECT COALESCE(
    (SELECT COUNT(DISTINCT date_trunc('day', created_at))
     FROM interview_sessions 
     WHERE user_id = NEW.user_id 
       AND created_at >= now() - interval '30 days'
     ORDER BY date_trunc('day', created_at) DESC
     LIMIT 7), 0)
  INTO current_streak;

  -- Insert or update user progress
  INSERT INTO user_progress (
    user_id,
    total_sessions,
    total_practice_time,
    average_score,
    best_score,
    sessions_this_week,
    sessions_this_month,
    last_session_date,
    streak_days,
    updated_at
  ) VALUES (
    NEW.user_id,
    user_sessions_count,
    user_total_time,
    user_avg_score,
    user_best_score,
    sessions_this_week,
    sessions_this_month,
    NEW.created_at,
    current_streak,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = user_sessions_count,
    total_practice_time = user_total_time,
    average_score = user_avg_score,
    best_score = user_best_score,
    sessions_this_week = sessions_this_week,
    sessions_this_month = sessions_this_month,
    last_session_date = NEW.created_at,
    streak_days = current_streak,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update progress after each session
DROP TRIGGER IF EXISTS update_progress_after_session ON interview_sessions;
CREATE TRIGGER update_progress_after_session
  AFTER INSERT ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_progress_after_session();