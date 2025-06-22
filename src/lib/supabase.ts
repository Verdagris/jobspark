import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Configure site URL for production
const siteUrl = process.env.NODE_ENV === 'production' 
  ? 'https://jobspark.co.za' 
  : 'http://localhost:3000';

// Update auth configuration for production
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Handle successful sign in
      console.log('User signed in successfully');
    }
  });
}

export type AuthError = {
  message: string
}

export type User = {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
}

// Helper function to get the correct redirect URL
export const getRedirectUrl = (path: string = '/auth/callback') => {
  return `${siteUrl}${path}`;
};