/*
  # Fix saved_jobs table schema

  This migration ensures the saved_jobs table has the correct schema
  that matches what the application expects.

  1. Changes
    - Drop existing saved_jobs table if it exists with wrong schema
    - Create saved_jobs table with correct schema including applied_at column
    - Add all necessary indexes and triggers
    - Ensure RLS policies are in place

  2. Security
    - Enable RLS on saved_jobs table
    - Add policy for authenticated users to manage their own saved jobs
*/

-- Drop the existing table if it exists (this is safe since it's a new feature)
DROP TABLE IF EXISTS saved_jobs CASCADE;

-- Create the saved_jobs table with the correct schema
CREATE TABLE saved_jobs (
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

-- Enable RLS
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own saved jobs"
  ON saved_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_applied ON saved_jobs(user_id, is_applied);
CREATE INDEX idx_saved_jobs_practice ON saved_jobs(user_id, practice_count);
CREATE INDEX idx_saved_jobs_created_at ON saved_jobs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_saved_jobs_updated_at
  BEFORE UPDATE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_jobs_updated_at();

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

-- Create trigger to update practice count (only if interview_sessions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_sessions') THEN
    DROP TRIGGER IF EXISTS update_practice_count ON interview_sessions;
    CREATE TRIGGER update_practice_count
      AFTER INSERT ON interview_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_job_practice_count();
  END IF;
END $$;