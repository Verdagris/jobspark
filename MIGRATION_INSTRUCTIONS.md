# Database Migration Instructions

The application is failing because the required database tables don't exist in your Supabase project. You need to apply the migrations manually.

## Steps to Fix:

1. **Open Supabase Studio**
   - Go to your Supabase project dashboard
   - Navigate to the "SQL Editor" section

2. **Execute the Migrations**
   - Copy the entire contents of each migration file in order:
     - `supabase/migrations/20250621132131_turquoise_violet.sql`
     - `supabase/migrations/20250621143916_blue_sunset.sql`
     - `supabase/migrations/20250621150457_pink_sun.sql`
     - `supabase/migrations/20250621160000_interview_sessions.sql`
     - `supabase/migrations/20250621170000_create_user_progress_table.sql`
     - `supabase/migrations/20250628150000_fix_saved_jobs_schema.sql` (NEW - IMPORTANT!)
   - Paste each one into the SQL Editor and click "Run" to execute

3. **Verify Tables Created**
   - Go to the "Table Editor" section
   - You should now see the following tables:
     - `user_profiles`
     - `user_experiences`
     - `user_education`
     - `user_skills`
     - `generated_cvs`
     - `cv_sections`
     - `cv_versions`
     - `interview_sessions`
     - `user_progress`
     - `saved_jobs` (with correct schema including `applied_at` column)

## Alternative Method (if you have Supabase CLI):

If you have the Supabase CLI installed and configured:

```bash
supabase db push
```

## What These Migrations Create:

- **user_profiles**: Stores user profile information and onboarding status
- **user_experiences**: Stores work experience data
- **user_education**: Stores education history
- **user_skills**: Stores user skills and proficiency levels
- **generated_cvs**: Stores AI-generated CVs
- **cv_sections**: Stores individual CV sections for editing
- **cv_versions**: Stores CV version history for undo functionality
- **interview_sessions**: Stores interview practice session data
- **user_progress**: Stores user progress tracking and encouragement data
- **saved_jobs**: Stores saved job listings with application tracking and practice counts

All tables include proper Row Level Security (RLS) policies to ensure users can only access their own data.

## After Migration:

Once all migrations are applied, refresh your application and the errors should be resolved. The dashboard, onboarding pages, interview practice, job search, and all other features will be able to interact with the database properly.

## Important Notes:

- **Execute migrations in order**: The migrations have dependencies, so run them in the order listed above
- **Check for errors**: If any migration fails, check the error message and ensure previous migrations completed successfully
- **Backup first**: If you have existing data, consider backing up your database before running migrations
- **The new migration**: `20250628150000_fix_saved_jobs_schema.sql` fixes the schema mismatch that was causing the job search errors

## Troubleshooting:

If you're still seeing errors after running the migrations:

1. **Check if all tables exist**: Go to Table Editor and verify all tables are present
2. **Check column names**: Ensure the `saved_jobs` table has the `applied_at` column
3. **Refresh the application**: Clear your browser cache and refresh the page
4. **Check browser console**: Look for any remaining database errors

The most important migration to run is the new `20250628150000_fix_saved_jobs_schema.sql` which specifically fixes the job search functionality.