"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page after a short delay
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [router]);

  // Show loading with South African colors while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="flex items-center space-x-3 mb-6">
        <Sparkles className="w-12 h-12 text-sa-green" />
        <h1 className="text-4xl font-bold text-slate-900">JobSpark</h1>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-sa-green/30 border-t-sa-green rounded-full animate-spin mb-4"></div>
        <span className="text-slate-600 font-medium">Loading your career journey...</span>
        <div className="mt-4 flex space-x-2">
          <div className="w-3 h-3 bg-sa-green rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-sa-gold rounded-full animate-pulse animation-delay-1000"></div>
          <div className="w-3 h-3 bg-sa-green rounded-full animate-pulse animation-delay-2000"></div>
        </div>
      </div>
      <div className="absolute bottom-8 text-center">
        <p className="text-slate-500 text-sm">Proudly South African 🇿🇦</p>
      </div>
    </div>
  );
}