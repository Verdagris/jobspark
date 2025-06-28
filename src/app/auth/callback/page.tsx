"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Small delay to ensure the auth state has been processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth?error=callback_error');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard');
        } else {
          // No session, redirect to auth page
          router.replace('/auth');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.replace('/auth?error=unexpected_error');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
        <span className="text-slate-600 font-medium">Completing sign in...</span>
      </div>
    </div>
  );
}