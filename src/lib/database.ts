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
  created_at: string;
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
    .select('role, overall_score, insights, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}