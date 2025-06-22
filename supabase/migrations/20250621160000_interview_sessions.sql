/*
  # Create interview sessions table

  1. New Tables
    - `interview_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role` (text)
      - `experience_years` (integer)
      - `context` (text)
      - `overall_score` (integer)
      - `duration_minutes` (integer)
      - `questions_count` (integer)
      - `session_data` (jsonb)
      - `insights` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on interview_sessions table
    - Add policy for authenticated users to manage their own sessions
*/

CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  experience_years integer NOT NULL,
  context text,
  overall_score integer NOT NULL,
  duration_minutes integer NOT NULL,
  questions_count integer NOT NULL,
  session_data jsonb NOT NULL,
  insights jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interview sessions"
  ON interview_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_role ON interview_sessions(role);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_score ON interview_sessions(overall_score);