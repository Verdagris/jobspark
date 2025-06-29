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
      - `job_type` (text)
      - `description` (text)
      - `requirements` (text[])
      - `benefits` (text[])
      - `application_url` (text)
      - `source` (text) - 'manual', 'search', 'imported'
      - `status` (text) - 'saved', 'applied', 'interviewing', 'rejected', 'offered'
      - `notes` (text)
      - `deadline` (date)
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
  job_type text DEFAULT 'Full-time',
  description text,
  requirements text[] DEFAULT '{}',
  benefits text[] DEFAULT '{}',
  application_url text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'search', 'imported')),
  status text DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'rejected', 'offered')),
  notes text,
  deadline date,
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
CREATE INDEX IF NOT EXISTS idx_saved_jobs_status ON saved_jobs(status);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created_at ON saved_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_deadline ON saved_jobs(deadline);

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