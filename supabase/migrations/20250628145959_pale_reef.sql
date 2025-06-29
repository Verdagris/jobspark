/*
  # Fix duplicate policies

  This migration checks for and drops any duplicate policies before recreating them.
  This resolves the "policy already exists" error when applying migrations.
*/

-- Drop the duplicate policy if it exists
DO $$
BEGIN
  -- Check if the policy exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_progress'
    AND policyname = 'Users can manage own progress'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;
  END IF;
END $$;

-- Recreate the policy
CREATE POLICY "Users can manage own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add saved_job_id column to generated_cvs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_cvs' AND column_name = 'saved_job_id'
  ) THEN
    ALTER TABLE generated_cvs ADD COLUMN saved_job_id uuid REFERENCES saved_jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add practice_count column to saved_jobs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_jobs' AND column_name = 'practice_count'
  ) THEN
    ALTER TABLE saved_jobs ADD COLUMN practice_count integer DEFAULT 0;
  END IF;
END $$;

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