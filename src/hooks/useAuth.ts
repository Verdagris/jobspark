// /hooks/useAuth.ts (Corrected and Optimized)

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, getRedirectUrl } from "@/lib/supabase";
import type { User, AuthError } from "@/lib/supabase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        setUser((session?.user as User) || null);
        setInitialized(true);
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setUser((session?.user as User) || null);
      setLoading(false);

      // Only handle redirects if we're initialized and not already loading
      if (initialized && event === "SIGNED_IN" && session) {
        // Small delay to prevent immediate redirects during hydration
        setTimeout(() => {
          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/dashboard"
          ) {
            window.location.href = "/dashboard";
          }
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  // --- START: MEMOIZED FUNCTIONS ---
  // By wrapping these functions in `useCallback`, we ensure they have a stable
  // reference and are not recreated on every render. This is an important optimization.

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: getRedirectUrl(),
          },
        });

        if (error) throw error;
        return { data, error: null };
      } catch (error: any) {
        console.error("Sign up error:", error);
        return { data: null, error: { message: error.message } as AuthError };
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Sign in error:", error);
      return { data: null, error: { message: error.message } as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error("Sign out error:", error);
      return { error: { message: error.message } as AuthError };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error("Google sign in error:", error);
      return { data: null, error: { message: error.message } as AuthError };
    }
  }, []);
  // --- END: MEMOIZED FUNCTIONS ---

  // --- START: MEMOIZED RETURN VALUE ---
  // This is the critical fix. `useMemo` creates a stable object reference for the
  // return value of the hook. This object will only be recreated if `user` or `loading`
  // state changes. This prevents the infinite re-render loop in components that
  // depend on the `user` object from this hook.
  return useMemo(
    () => ({
      user,
      loading,
      signUp,
      signIn,
      signOut,
      signInWithGoogle,
    }),
    [user, loading, signUp, signIn, signOut, signInWithGoogle]
  );
  // --- END: MEMOIZED RETURN VALUE ---
};
