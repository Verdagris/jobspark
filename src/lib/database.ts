import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  professional_summary: string | null;
  profile_image_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserExperience {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
}

export interface UserEducation {
  id: string;
  user_id: string;
  degree: string;
  institution: string;
  location: string | null;
  graduation_year: string;
  description: string | null;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  name: string;
  level: string;
  created_at: string;
}

export interface GeneratedCV {
  id: string;
  user_id: string;
  title: string;
  content: string;
  job_description: string | null;
  version: number;
  is_active: boolean;
  cv_name: string | null;
  saved_job_id: string | null;
  created_at: string;
}

export interface CVSection {
  id: string;
  user_id: string;
  cv_id: string;
  section_type: "summary" | "experience" | "education" | "skills";
  section_data: any;
  ai_generated: boolean;
  created_at: string;
}

export interface CVVersion {
  id: string;
  cv_id: string;
  section_type: string;
  version_number: number;
  previous_data: any;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  role: string;
  experience_years: number;
  context: string | null;
  overall_score: number;
  duration_minutes: number;
  questions_count: number;
  session_data: any; // JSON data with questions and responses
  insights: any; // JSON data with analysis
  session_type: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  total_sessions: number;
  total_practice_time: number;
  average_score: number;
  best_score: number;
  sessions_this_week: number;
  sessions_this_month: number;
  improvement_areas: string[];
  strengths: string[];
  last_session_date: string | null;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
  job_type: string;
  url: string | null;
  logo: string | null;
  is_applied: boolean;
  applied_at: string | null;
  practice_count: number;
  last_practiced_at: string | null;
  source: "platform" | "manual";
  created_at: string;
  updated_at: string;
}

// User Profile Functions
export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
      console.error("Database error in getUserProfile:", error);
      throw error;
    }

    return data; // Will be null if no rows found, which is what we want
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Return null for any error to allow onboarding to proceed
    return null;
  }
}

export async function createUserProfile(
  profile: Partial<UserProfile>
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .insert([profile])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Experience Functions
export async function getUserExperiences(
  userId: string
): Promise<UserExperience[]> {
  const { data, error } = await supabase
    .from("user_experiences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserExperience(
  experience: Omit<UserExperience, "id" | "created_at">
): Promise<UserExperience> {
  const { data, error } = await supabase
    .from("user_experiences")
    .insert([experience])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserExperience(
  id: string,
  updates: Partial<UserExperience>
): Promise<UserExperience> {
  const { data, error } = await supabase
    .from("user_experiences")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserExperience(id: string): Promise<void> {
  const { error } = await supabase
    .from("user_experiences")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Education Functions
export async function getUserEducation(
  userId: string
): Promise<UserEducation[]> {
  const { data, error } = await supabase
    .from("user_education")
    .select("*")
    .eq("user_id", userId)
    .order("graduation_year", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserEducation(
  education: Omit<UserEducation, "id" | "created_at">
): Promise<UserEducation> {
  const { data, error } = await supabase
    .from("user_education")
    .insert([education])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserEducation(
  id: string,
  updates: Partial<UserEducation>
): Promise<UserEducation> {
  const { data, error } = await supabase
    .from("user_education")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserEducation(id: string): Promise<void> {
  const { error } = await supabase.from("user_education").delete().eq("id", id);

  if (error) throw error;
}

// Skills Functions
export async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserSkill(
  skill: Omit<UserSkill, "id" | "created_at">
): Promise<UserSkill> {
  const { data, error } = await supabase
    .from("user_skills")
    .insert([skill])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserSkill(
  id: string,
  updates: Partial<UserSkill>
): Promise<UserSkill> {
  const { data, error } = await supabase
    .from("user_skills")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserSkill(id: string): Promise<void> {
  const { error } = await supabase.from("user_skills").delete().eq("id", id);

  if (error) throw error;
}

// Generated CVs Functions
export async function getUserCVs(userId: string): Promise<GeneratedCV[]> {
  const { data, error } = await supabase
    .from("generated_cvs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user CVs:", error);
    throw error;
  }
  return data || [];
}

export async function createGeneratedCV(
  cv: Omit<GeneratedCV, "id" | "created_at" | "version" | "is_active">
): Promise<GeneratedCV> {
  const { data, error } = await supabase
    .from("generated_cvs")
    .insert([{ ...cv, version: 1, is_active: true }])
    .select()
    .single();

  if (error) {
    console.error("Error creating generated CV:", error);
    throw error;
  }
  return data;
}

export async function updateCVContent(
  cvId: string,
  newContent: string
): Promise<GeneratedCV> {
  const { data, error } = await supabase
    .from("generated_cvs")
    .update({
      content: newContent,
      // It's good practice to also update a timestamp
      // Assuming your table has an `updated_at` column handled by a trigger,
      // but explicitly setting it is safer.
    })
    .eq("id", cvId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating CV content for id ${cvId}:`, error);
    throw error;
  }
  return data;
}

export async function updateGeneratedCV(
  id: string,
  updates: Partial<GeneratedCV>
): Promise<GeneratedCV> {
  const { data, error } = await supabase
    .from("generated_cvs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating generated CV for id ${id}:`, error);
    throw error;
  }
  return data;
}

export async function deleteGeneratedCV(id: string): Promise<void> {
  const { error } = await supabase
    .from("generated_cvs")
    .update({ is_active: false }) // Soft delete
    .eq("id", id);

  if (error) {
    console.error(`Error deleting (soft) CV for id ${id}:`, error);
    throw error;
  }
}

// CV Sections Functions
export async function getCVSections(cvId: string): Promise<CVSection[]> {
  const { data, error } = await supabase
    .from("cv_sections")
    .select("*")
    .eq("cv_id", cvId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCVSection(
  section: Omit<CVSection, "id" | "created_at">
): Promise<CVSection> {
  const { data, error } = await supabase
    .from("cv_sections")
    .insert([section])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCVSection(
  id: string,
  updates: Partial<CVSection>
): Promise<CVSection> {
  const { data, error } = await supabase
    .from("cv_sections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCVSection(id: string): Promise<void> {
  const { error } = await supabase.from("cv_sections").delete().eq("id", id);

  if (error) throw error;
}

// CV Versions Functions (for undo functionality)
export async function createCVVersion(
  version: Omit<CVVersion, "id" | "created_at">
): Promise<CVVersion> {
  const { data, error } = await supabase
    .from("cv_versions")
    .insert([version])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCVVersions(
  cvId: string,
  sectionType: string
): Promise<CVVersion[]> {
  const { data, error } = await supabase
    .from("cv_versions")
    .select("*")
    .eq("cv_id", cvId)
    .eq("section_type", sectionType)
    .order("version_number", { ascending: false })
    .limit(5); // Keep last 5 versions

  if (error) throw error;
  return data || [];
}

export async function getLatestCVVersion(
  cvId: string,
  sectionType: string
): Promise<CVVersion | null> {
  const { data, error } = await supabase
    .from("cv_versions")
    .select("*")
    .eq("cv_id", cvId)
    .eq("section_type", sectionType)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Interview Sessions Functions
export async function getUserInterviewSessions(
  userId: string
): Promise<InterviewSession[]> {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createInterviewSession(
  session: Omit<InterviewSession, "id" | "created_at">
): Promise<InterviewSession> {
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert([session])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInterviewSessionById(
  id: string
): Promise<InterviewSession | null> {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getInterviewInsights(
  userId: string,
  limit: number = 5
): Promise<any[]> {
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("role, overall_score, insights, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// User Progress Functions
export async function getUserProgress(
  userId: string
): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user progress:", error);
      // If table doesn't exist, return default progress
      return {
        id: "",
        user_id: userId,
        total_sessions: 0,
        total_practice_time: 0,
        average_score: 0,
        best_score: 0,
        sessions_this_week: 0,
        sessions_this_month: 0,
        improvement_areas: [],
        strengths: [],
        last_session_date: null,
        streak_days: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  } catch (error) {
    console.error("Error in getUserProgress:", error);
    return null;
  }
}

export async function updateUserProgress(
  userId: string,
  updates: Partial<UserProgress>
): Promise<UserProgress> {
  const { data, error } = await supabase
    .from("user_progress")
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Saved Jobs Functions
export async function getUserSavedJobs(userId: string): Promise<SavedJob[]> {
  try {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved jobs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getUserSavedJobs:", error);
    return [];
  }
}

export async function createSavedJob(
  job: Omit<
    SavedJob,
    "id" | "created_at" | "updated_at" | "practice_count" | "last_practiced_at"
  >
): Promise<SavedJob> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .insert([{ ...job, practice_count: 0 }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSavedJob(
  id: string,
  updates: Partial<SavedJob>
): Promise<SavedJob> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSavedJob(id: string): Promise<void> {
  const { error } = await supabase.from("saved_jobs").delete().eq("id", id);

  if (error) throw error;
}

export async function getSavedJobById(id: string): Promise<SavedJob | null> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function markJobAsApplied(id: string): Promise<SavedJob> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .update({
      is_applied: true,
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getJobsNeedingPractice(
  userId: string
): Promise<SavedJob[]> {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_applied", false)
    .lt("practice_count", 3) // Jobs with less than 3 practice sessions
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Career Score Calculation (consistent across dashboard and career score page)
export function calculateCareerScore(
  profile: any,
  experiences: any[],
  skills: any[],
  cvs: any[],
  interviewSessions: any[],
  education: any[] = []
): number {
  let score = 0;

  // Profile completeness (25%)
  let profileScore = 0;
  if (profile?.full_name) profileScore += 12.5;
  if (profile?.email) profileScore += 12.5;
  if (profile?.phone) profileScore += 12.5;
  if (profile?.location) profileScore += 12.5;
  if (experiences.length > 0) profileScore += 12.5;
  if (experiences.length >= 2) profileScore += 12.5;
  if (education.length > 0) profileScore += 12.5;
  if (skills.length >= 3) profileScore += 12.5;

  score += Math.min(100, profileScore) * 0.25;

  // CV quality (25%)
  let cvScore = 40;
  if (cvs.length > 0) cvScore += 30;
  if (experiences.length >= 2) cvScore += 20;
  if (skills.length >= 5) cvScore += 10;
  score += Math.min(100, cvScore) * 0.25;

  // Interview readiness (25%)
  let interviewScore = 30;
  if (interviewSessions.length > 0) {
    const avgScore =
      interviewSessions.reduce(
        (sum: number, s: any) => sum + s.overall_score,
        0
      ) / interviewSessions.length;
    interviewScore = avgScore;
  }
  score += interviewScore * 0.25;

  // Market alignment (25%)
  let marketScore = 60;
  if (skills.length >= 5) marketScore += 20;
  if (experiences.length >= 2) marketScore += 20;
  score += Math.min(100, marketScore) * 0.25;

  return Math.round(score);
}

// Encouragement and Recommendations Functions
export async function getEncouragementMessage(
  userId: string,
  sessionType?: string
): Promise<string> {
  try {
    const progress = await getUserProgress(userId);
    const sessions = await getUserInterviewSessions(userId);

    if (!progress || sessions.length === 0) {
      return "Welcome to your interview practice journey! Every expert was once a beginner. Let's start building your confidence one question at a time.";
    }

    if (progress.streak_days > 0) {
      return `Amazing! You're on a ${progress.streak_days}-day practice streak. Consistency is the key to mastering interviews. Keep up the fantastic work!`;
    }

    if (progress.best_score >= 85) {
      return "You're performing exceptionally well! Your confidence and skills are really showing. You're ready to tackle any interview challenge.";
    }

    if (progress.sessions_this_week >= 3) {
      return "Fantastic dedication this week! You've completed your practice goal. This level of commitment will definitely pay off in real interviews.";
    }

    return "Every practice session makes you stronger and more confident. You're building valuable skills that will serve you throughout your career.";
  } catch (error) {
    console.error("Error getting encouragement message:", error);
    return "You're doing great! Keep practicing and building your interview confidence.";
  }
}

export async function getPostSessionEncouragement(
  userId: string,
  score: number,
  sessionType: string
): Promise<string> {
  try {
    if (score >= 90) {
      return "Outstanding performance! You're demonstrating excellent interview skills. You should feel very confident about your abilities.";
    }

    if (score >= 80) {
      return "Great job! You're showing strong interview skills. With a little more practice, you'll be unstoppable.";
    }

    if (score >= 70) {
      return "Good work! You're making solid progress. Each practice session is building your confidence and improving your responses.";
    }

    if (score >= 60) {
      return "You're on the right track! Remember, every professional started somewhere. Keep practicing and you'll see improvement.";
    }

    return "Don't be discouraged! Interview skills take time to develop. The fact that you're practicing shows you're committed to improvement.";
  } catch (error) {
    console.error("Error getting post-session encouragement:", error);
    return "Great job completing the practice session! Every attempt makes you better.";
  }
}

export async function getSessionRecommendations(userId: string): Promise<any> {
  try {
    const [progress, sessions] = await Promise.all([
      getUserProgress(userId),
      getUserInterviewSessions(userId),
    ]);

    const recommendations = {
      recommended: [] as string[],
      reasons: [] as string[],
    };

    if (!progress || sessions.length === 0) {
      recommendations.recommended = ["introduction", "experience"];
      recommendations.reasons = [
        "Start with introduction practice to build confidence",
        "Practice talking about your experience",
      ];
      return recommendations;
    }

    // Analyze session types practiced
    const sessionTypes = sessions.map(
      (s) => s.session_type || "mock-interview"
    );
    const typeCount = sessionTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recommend based on what hasn't been practiced much
    if ((typeCount["behavioral"] || 0) < 2) {
      recommendations.recommended.push("experience");
      recommendations.reasons.push(
        "Practice behavioral questions using the STAR method"
      );
    }

    if ((typeCount["strengths-weaknesses"] || 0) < 1) {
      recommendations.recommended.push("strengths-weaknesses");
      recommendations.reasons.push(
        "Work on self-assessment and growth mindset questions"
      );
    }

    if ((typeCount["salary"] || 0) < 1) {
      recommendations.recommended.push("salary");
      recommendations.reasons.push(
        "Practice salary negotiation and compensation discussions"
      );
    }

    // If recent scores are low, recommend fundamentals
    const recentSessions = sessions.slice(0, 3);
    const avgRecentScore =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + s.overall_score, 0) /
          recentSessions.length
        : 0;

    if (avgRecentScore < 70) {
      recommendations.recommended.unshift("introduction");
      recommendations.reasons.unshift(
        "Build confidence with introduction practice"
      );
    }

    return recommendations;
  } catch (error) {
    console.error("Error getting session recommendations:", error);
    return {
      recommended: ["introduction", "experience"],
      reasons: [
        "Start with introduction practice",
        "Practice talking about your experience",
      ],
    };
  }
}
