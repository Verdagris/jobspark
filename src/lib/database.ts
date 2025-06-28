import { supabase } from './supabase';

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
  section_type: 'summary' | 'experience' | 'education' | 'skills';
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
  saved_job_id: string | null;
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
  job_type: string;
  description: string | null;
  requirements: string[];
  benefits: string[];
  application_url: string | null;
  source: 'manual' | 'search' | 'imported';
  status: 'saved' | 'applied' | 'interviewing' | 'rejected' | 'offered';
  notes: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

// Consistent career score calculation function
export function calculateCareerScore(profile: any, experiences: any[], skills: any[], cvs: any[], sessions: any[]): number {
  let score = 0;
  
  // Profile completeness (25%)
  let profileScore = 0;
  if (profile?.full_name) profileScore += 12.5;
  if (profile?.email) profileScore += 12.5;
  if (profile?.phone) profileScore += 12.5;
  if (profile?.location) profileScore += 12.5;
  if (profile?.professional_summary) profileScore += 25;
  if (experiences.length > 0) profileScore += 12.5;
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
  if (sessions.length > 0) {
    const avgScore = sessions.reduce((sum: number, s: any) => sum + s.overall_score, 0) / sessions.length;
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

// User Profile Functions
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
      console.error('Database error in getUserProfile:', error);
      throw error;
    }

    return data; // Will be null if no rows found, which is what we want
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return null for any error to allow onboarding to proceed
    return null;
  }
}

export async function createUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([profile])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Experience Functions
export async function getUserExperiences(userId: string): Promise<UserExperience[]> {
  const { data, error } = await supabase
    .from('user_experiences')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserExperience(experience: Omit<UserExperience, 'id' | 'created_at'>): Promise<UserExperience> {
  const { data, error } = await supabase
    .from('user_experiences')
    .insert([experience])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserExperience(id: string, updates: Partial<UserExperience>): Promise<UserExperience> {
  const { data, error } = await supabase
    .from('user_experiences')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserExperience(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_experiences')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Education Functions
export async function getUserEducation(userId: string): Promise<UserEducation[]> {
  const { data, error } = await supabase
    .from('user_education')
    .select('*')
    .eq('user_id', userId)
    .order('graduation_year', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserEducation(education: Omit<UserEducation, 'id' | 'created_at'>): Promise<UserEducation> {
  const { data, error } = await supabase
    .from('user_education')
    .insert([education])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserEducation(id: string, updates: Partial<UserEducation>): Promise<UserEducation> {
  const { data, error } = await supabase
    .from('user_education')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserEducation(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_education')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Skills Functions
export async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserSkill(skill: Omit<UserSkill, 'id' | 'created_at'>): Promise<UserSkill> {
  const { data, error } = await supabase
    .from('user_skills')
    .insert([skill])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserSkill(id: string, updates: Partial<UserSkill>): Promise<UserSkill> {
  const { data, error } = await supabase
    .from('user_skills')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserSkill(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Generated CVs Functions
export async function getUserCVs(userId: string): Promise<GeneratedCV[]> {
  const { data, error } = await supabase
    .from('generated_cvs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGeneratedCV(cv: Omit<GeneratedCV, 'id' | 'created_at' | 'version' | 'is_active'>): Promise<GeneratedCV> {
  const { data, error } = await supabase
    .from('generated_cvs')
    .insert([{ ...cv, version: 1, is_active: true }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGeneratedCV(id: string, updates: Partial<GeneratedCV>): Promise<GeneratedCV> {
  const { data, error } = await supabase
    .from('generated_cvs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGeneratedCV(id: string): Promise<void> {
  const { error } = await supabase
    .from('generated_cvs')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// CV Sections Functions
export async function getCVSections(cvId: string): Promise<CVSection[]> {
  const { data, error } = await supabase
    .from('cv_sections')
    .select('*')
    .eq('cv_id', cvId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCVSection(section: Omit<CVSection, 'id' | 'created_at'>): Promise<CVSection> {
  const { data, error } = await supabase
    .from('cv_sections')
    .insert([section])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCVSection(id: string, updates: Partial<CVSection>): Promise<CVSection> {
  const { data, error } = await supabase
    .from('cv_sections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCVSection(id: string): Promise<void> {
  const { error } = await supabase
    .from('cv_sections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// CV Versions Functions (for undo functionality)
export async function createCVVersion(version: Omit<CVVersion, 'id' | 'created_at'>): Promise<CVVersion> {
  const { data, error } = await supabase
    .from('cv_versions')
    .insert([version])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCVVersions(cvId: string, sectionType: string): Promise<CVVersion[]> {
  const { data, error } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('cv_id', cvId)
    .eq('section_type', sectionType)
    .order('version_number', { ascending: false })
    .limit(5); // Keep last 5 versions

  if (error) throw error;
  return data || [];
}

export async function getLatestCVVersion(cvId: string, sectionType: string): Promise<CVVersion | null> {
  const { data, error } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('cv_id', cvId)
    .eq('section_type', sectionType)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Interview Sessions Functions
export async function getUserInterviewSessions(userId: string): Promise<InterviewSession[]> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createInterviewSession(session: Omit<InterviewSession, 'id' | 'created_at'>): Promise<InterviewSession> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert([session])
    .select()
    .single();

  if (error) throw error;
  
  // Update user progress after creating session
  await updateUserProgress(session.user_id, session);
  
  return data;
}

export async function getInterviewSessionById(id: string): Promise<InterviewSession | null> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getInterviewInsights(userId: string, limit: number = 5): Promise<any[]> {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('role, overall_score, insights, created_at, session_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// User Progress Functions
export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUserProgress(progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>): Promise<UserProgress> {
  const { data, error } = await supabase
    .from('user_progress')
    .insert([progress])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProgress(userId: string, newSession: Partial<InterviewSession>): Promise<void> {
  try {
    // Get current progress
    let progress = await getUserProgress(userId);
    
    // Get all sessions for calculations
    const sessions = await getUserInterviewSessions(userId);
    
    // Calculate new progress metrics
    const totalSessions = sessions.length;
    const totalPracticeTime = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const averageScore = sessions.length > 0 ? 
      Math.round(sessions.reduce((sum, s) => sum + s.overall_score, 0) / sessions.length) : 0;
    const bestScore = sessions.length > 0 ? 
      Math.max(...sessions.map(s => s.overall_score)) : 0;
    
    // Calculate sessions this week and month
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const sessionsThisWeek = sessions.filter(s => new Date(s.created_at) > weekAgo).length;
    const sessionsThisMonth = sessions.filter(s => new Date(s.created_at) > monthAgo).length;
    
    // Calculate improvement areas and strengths from recent sessions
    const recentSessions = sessions.slice(0, 5);
    const improvementAreas = extractImprovementAreas(recentSessions);
    const strengths = extractStrengths(recentSessions);
    
    // Calculate streak
    const streak = calculateStreak(sessions);
    
    const progressData = {
      user_id: userId,
      total_sessions: totalSessions,
      total_practice_time: totalPracticeTime,
      average_score: averageScore,
      best_score: bestScore,
      sessions_this_week: sessionsThisWeek,
      sessions_this_month: sessionsThisMonth,
      improvement_areas: improvementAreas,
      strengths: strengths,
      last_session_date: sessions.length > 0 ? sessions[0].created_at : null,
      streak_days: streak,
      updated_at: new Date().toISOString()
    };
    
    if (progress) {
      // Update existing progress
      const { error } = await supabase
        .from('user_progress')
        .update(progressData)
        .eq('user_id', userId);
      
      if (error) throw error;
    } else {
      // Create new progress record
      await createUserProgress(progressData);
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    // Don't throw error to prevent session creation from failing
  }
}

// Helper functions for progress calculation
function extractImprovementAreas(sessions: InterviewSession[]): string[] {
  const areas: { [key: string]: number } = {};
  
  sessions.forEach(session => {
    if (session.insights?.areasForImprovement) {
      session.insights.areasForImprovement.forEach((area: string) => {
        const key = area.toLowerCase();
        areas[key] = (areas[key] || 0) + 1;
      });
    }
  });
  
  // Return top 3 most common improvement areas
  return Object.entries(areas)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([area]) => area);
}

function extractStrengths(sessions: InterviewSession[]): string[] {
  const strengths: { [key: string]: number } = {};
  
  sessions.forEach(session => {
    if (session.insights?.strengths) {
      session.insights.strengths.forEach((strength: string) => {
        const key = strength.toLowerCase();
        strengths[key] = (strengths[key] || 0) + 1;
      });
    }
  });
  
  // Return top 3 most common strengths
  return Object.entries(strengths)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([strength]) => strength);
}

function calculateStreak(sessions: InterviewSession[]): number {
  if (sessions.length === 0) return 0;
  
  const sessionDates = sessions
    .map(s => new Date(s.created_at).toDateString())
    .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  // Check if user practiced today or yesterday
  if (sessionDates[0] === today || sessionDates[0] === yesterday) {
    streak = 1;
    
    // Count consecutive days
    for (let i = 1; i < sessionDates.length; i++) {
      const currentDate = new Date(sessionDates[i-1]);
      const nextDate = new Date(sessionDates[i]);
      const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
  }
  
  return streak;
}

// Get user's practice history for encouragement
export async function getUserPracticeHistory(userId: string): Promise<{
  progress: UserProgress | null;
  recentSessions: InterviewSession[];
  lastSession: InterviewSession | null;
  improvementFromLastSession: number | null;
}> {
  const [progress, sessions] = await Promise.all([
    getUserProgress(userId),
    getUserInterviewSessions(userId)
  ]);
  
  const recentSessions = sessions.slice(0, 5);
  const lastSession = sessions.length > 0 ? sessions[0] : null;
  
  // Calculate improvement from last session
  let improvementFromLastSession = null;
  if (sessions.length >= 2) {
    const currentScore = sessions[0].overall_score;
    const previousScore = sessions[1].overall_score;
    improvementFromLastSession = currentScore - previousScore;
  }
  
  return {
    progress,
    recentSessions,
    lastSession,
    improvementFromLastSession
  };
}

// Get personalized encouragement message
export async function getEncouragementMessage(userId: string, sessionType?: string): Promise<string> {
  const history = await getUserPracticeHistory(userId);
  const { progress, lastSession, improvementFromLastSession } = history;
  
  if (!progress || progress.total_sessions === 0) {
    return "Welcome to your interview practice journey! I'm excited to help you build confidence and improve your interview skills. Let's start strong! 🚀";
  }
  
  // Generate contextual encouragement based on history
  const messages = [];
  
  // Weekly activity encouragement
  if (progress.sessions_this_week >= 3) {
    messages.push(`Amazing! You've practiced ${progress.sessions_this_week} times this week - you're really committed to improving! 🔥`);
  } else if (progress.sessions_this_week === 1) {
    messages.push("You've practiced once this week. Why not try another session to keep the momentum going?");
  } else if (progress.sessions_this_week === 0) {
    messages.push("Let's get back into practice mode! A quick session today will help maintain your interview skills.");
  }
  
  // Improvement tracking
  if (lastSession && improvementFromLastSession !== null) {
    if (improvementFromLastSession > 5) {
      messages.push(`Last time you scored ${lastSession.overall_score}% - that's a fantastic ${improvementFromLastSession} point improvement! 📈`);
    } else if (improvementFromLastSession > 0) {
      messages.push(`Great progress! You improved by ${improvementFromLastSession} points in your last session.`);
    }
  }
  
  // Focus areas from last session
  if (lastSession?.insights?.areasForImprovement?.length > 0) {
    const mainArea = lastSession.insights.areasForImprovement[0];
    messages.push(`Last time, your main focus area was ${mainArea.toLowerCase()}. Let's work on that today - you've got this! 💪`);
  }
  
  // Streak encouragement
  if (progress.streak_days > 1) {
    messages.push(`You're on a ${progress.streak_days}-day practice streak! Keep it going! 🔥`);
  }
  
  // Session type specific encouragement
  if (sessionType && lastSession?.session_type === sessionType) {
    messages.push(`You practiced ${sessionType.replace('-', ' ')} before. Let's see how much you've improved!`);
  }
  
  // Default encouraging message
  if (messages.length === 0) {
    messages.push("Ready for another great practice session? Let's continue building your interview confidence!");
  }
  
  return messages.join(' ');
}

// Get post-session encouragement
export async function getPostSessionEncouragement(
  userId: string, 
  currentScore: number, 
  sessionType: string
): Promise<string> {
  const history = await getUserPracticeHistory(userId);
  const { progress, lastSession, improvementFromLastSession } = history;
  
  const messages = [];
  
  // Score-based encouragement
  if (currentScore >= 85) {
    messages.push("Outstanding performance! You're interview-ready! 🌟");
  } else if (currentScore >= 75) {
    messages.push("Great job! You're showing strong interview skills.");
  } else if (currentScore >= 65) {
    messages.push("Good work! You're making solid progress.");
  } else {
    messages.push("Nice effort! Every practice session makes you stronger.");
  }
  
  // Improvement comparison
  if (improvementFromLastSession !== null && improvementFromLastSession > 0) {
    messages.push(`That's a ${improvementFromLastSession} point improvement from last time - excellent progress! 📈`);
  } else if (improvementFromLastSession !== null && improvementFromLastSession < -5) {
    messages.push("Don't worry about the score dip - consistency in practice is what matters most. You're building valuable skills!");
  }
  
  // Session count milestone
  if (progress) {
    if (progress.total_sessions === 5) {
      messages.push("🎉 Congratulations! You've completed 5 practice sessions - you're building real expertise!");
    } else if (progress.total_sessions === 10) {
      messages.push("🎉 Amazing milestone! 10 practice sessions completed - you're becoming an interview pro!");
    } else if (progress.total_sessions % 10 === 0) {
      messages.push(`🎉 Incredible! ${progress.total_sessions} practice sessions completed - your dedication is inspiring!`);
    }
  }
  
  return messages.join(' ');
}

// Get next session recommendations
export async function getSessionRecommendations(userId: string): Promise<{
  recommended: string[];
  reasons: string[];
}> {
  const history = await getUserPracticeHistory(userId);
  const { progress, recentSessions } = history;
  
  const recommendations = [];
  const reasons = [];
  
  if (!progress || progress.total_sessions === 0) {
    return {
      recommended: ['introduction', 'experience'],
      reasons: ['Start with introduction practice to build confidence', 'Practice talking about your experience']
    };
  }
  
  // Analyze recent session types
  const recentTypes = recentSessions.map(s => s.session_type);
  const typeCounts = recentTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  // Recommend based on improvement areas
  if (progress.improvement_areas.includes('communication')) {
    recommendations.push('introduction');
    reasons.push('Work on communication skills with introduction practice');
  }
  
  if (progress.improvement_areas.includes('experience') || progress.improvement_areas.includes('examples')) {
    recommendations.push('experience');
    reasons.push('Practice articulating your experience better');
  }
  
  if (progress.improvement_areas.includes('weaknesses') || progress.improvement_areas.includes('strengths')) {
    recommendations.push('strengths-weaknesses');
    reasons.push('Focus on self-assessment and growth mindset');
  }
  
  // Recommend less practiced areas
  const allTypes = ['introduction', 'experience', 'strengths-weaknesses', 'salary', 'job-specific', 'mock-interview'];
  const leastPracticed = allTypes.filter(type => !typeCounts[type] || typeCounts[type] < 2);
  
  if (leastPracticed.length > 0) {
    recommendations.push(...leastPracticed.slice(0, 2));
    reasons.push(...leastPracticed.slice(0, 2).map(type => `Try ${type.replace('-', ' ')} practice for well-rounded skills`));
  }
  
  // If user is advanced, recommend mock interviews
  if (progress.average_score >= 75 && !recentTypes.includes('mock-interview')) {
    recommendations.push('mock-interview');
    reasons.push('You\'re ready for a full mock interview challenge!');
  }
  
  return {
    recommended: recommendations.slice(0, 3),
    reasons: reasons.slice(0, 3)
  };
}

// Saved Jobs Functions
export async function getUserSavedJobs(userId: string): Promise<SavedJob[]> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSavedJob(job: Omit<SavedJob, 'id' | 'created_at' | 'updated_at'>): Promise<SavedJob> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .insert([job])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSavedJob(id: string, updates: Partial<SavedJob>): Promise<SavedJob> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSavedJob(id: string): Promise<void> {
  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSavedJobById(id: string): Promise<SavedJob | null> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}