/*
  # Create saved jobs table

  1. New Tables
    - `saved_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `company` (text)
      - `location` (text)
      - `salary_min` (integer)
      - `salary_max` (integer)
      - `description` (text)
      - `requirements` (text[])
      - `benefits` (text[])
      - `job_type` (text)
      - `url` (text)
      - `logo` (text)
      - `is_applied` (boolean)
      - `applied_at` (timestamp)
      - `practice_count` (integer)
      - `last_practiced_at` (timestamp)
      - `source` (text) - 'platform' or 'manual'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on saved_jobs table
    - Add policy for authenticated users to manage their own saved jobs
*/

CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  salary_min integer,
  salary_max integer,
  description text,
  requirements text[],
  benefits text[],
  job_type text DEFAULT 'Full-time',
  url text,
  logo text,
  is_applied boolean DEFAULT false,
  applied_at timestamptz,
  practice_count integer DEFAULT 0,
  last_practiced_at timestamptz,
  source text DEFAULT 'platform' CHECK (source IN ('platform', 'manual')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved jobs"
  ON saved_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_applied ON saved_jobs(user_id, is_applied);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_practice ON saved_jobs(user_id, practice_count);

-- Function to update practice count when interview session is created
CREATE OR REPLACE FUNCTION update_job_practice_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the session data contains a saved job ID
  IF NEW.session_data ? 'saved_job_id' THEN
    UPDATE saved_jobs 
    SET 
      practice_count = practice_count + 1,
      last_practiced_at = now(),
      updated_at = now()
    WHERE 
      id = (NEW.session_data->>'saved_job_id')::uuid 
      AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update practice count
DROP TRIGGER IF EXISTS update_practice_count ON interview_sessions;
CREATE TRIGGER update_practice_count
  AFTER INSERT ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_job_practice_count();