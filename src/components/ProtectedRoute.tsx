"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, redirectTo = '/auth' }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Only set redirect flag after loading is complete and we're sure there's no user
    if (!loading && !user) {
      setShouldRedirect(true);
    } else if (!loading && user) {
      setShouldRedirect(false);
    }
  }, [user, loading]);

  useEffect(() => {
    // Only redirect if we've determined we should and we're not already on the redirect page
    if (shouldRedirect && typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
      router.push(redirectTo);
    }
  }, [shouldRedirect, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user && shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};