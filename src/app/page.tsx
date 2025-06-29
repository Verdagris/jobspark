"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page immediately
    router.replace('/auth');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
        <span className="text-slate-600 font-medium">Loading...</span>
      </div>
    </div>
  );
}