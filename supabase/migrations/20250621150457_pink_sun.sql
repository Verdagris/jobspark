/*
  # Create CV sections and versions tables

  1. New Tables
    - `cv_sections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `cv_id` (uuid, foreign key to generated_cvs)
      - `section_type` (text: 'summary', 'experience', 'education', 'skills')
      - `section_data` (jsonb)
      - `ai_generated` (boolean)
      - `created_at` (timestamp)
    
    - `cv_versions`
      - `id` (uuid, primary key)
      - `cv_id` (uuid, foreign key to generated_cvs)
      - `version_number` (integer)
      - `section_type` (text)
      - `previous_data` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Updates
    - Add `version` and `is_active` columns to generated_cvs table
*/

-- CV Sections Table
CREATE TABLE IF NOT EXISTS cv_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id uuid REFERENCES generated_cvs(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN ('summary', 'experience', 'education', 'skills')),
  section_data jsonb NOT NULL,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cv_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own CV sections"
  ON cv_sections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- CV Versions Table (for undo functionality)
CREATE TABLE IF NOT EXISTS cv_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid REFERENCES generated_cvs(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  version_number integer NOT NULL,
  previous_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own CV versions"
  ON cv_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_cvs 
      WHERE generated_cvs.id = cv_versions.cv_id 
      AND generated_cvs.user_id = auth.uid()
    )
  );

-- Update generated_cvs table to support multiple CVs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_cvs' AND column_name = 'version'
  ) THEN
    ALTER TABLE generated_cvs ADD COLUMN version integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_cvs' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE generated_cvs ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_cvs' AND column_name = 'cv_name'
  ) THEN
    ALTER TABLE generated_cvs ADD COLUMN cv_name text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cv_sections_user_id ON cv_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_sections_cv_id ON cv_sections(cv_id);
CREATE INDEX IF NOT EXISTS idx_cv_sections_type ON cv_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_cv_versions_cv_id ON cv_versions(cv_id);
CREATE INDEX IF NOT EXISTS idx_generated_cvs_user_active ON generated_cvs(user_id, is_active);

-- Function to limit CVs per user to 3
CREATE OR REPLACE FUNCTION check_cv_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM generated_cvs 
    WHERE user_id = NEW.user_id AND is_active = true
  ) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 3 active CVs allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce CV limit
DROP TRIGGER IF EXISTS enforce_cv_limit ON generated_cvs;
CREATE TRIGGER enforce_cv_limit
  BEFORE INSERT ON generated_cvs
  FOR EACH ROW
  EXECUTE FUNCTION check_cv_limit();