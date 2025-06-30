"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { formatCredits, CREDIT_COSTS } from "@/lib/credits";

interface CreditBalanceProps {
  className?: string;
  showPurchaseButton?: boolean;
}

export const CreditBalance = ({ className = "", showPurchaseButton = true }: CreditBalanceProps) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    }
  };

  useEffect(() => {
    const loadBalance = async () => {
      await fetchBalance();
      setLoading(false);
    };

    loadBalance();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-slate-300 border-t-green-500 rounded-full animate-spin" />
        <span className="text-sm text-slate-600">Loading...</span>
      </div>
    );
  }

  const currentBalance = balance || 0;
  const isLowBalance = currentBalance < CREDIT_COSTS.INTERVIEW_SESSION;
  const canAffordInterview = currentBalance >= CREDIT_COSTS.INTERVIEW_SESSION;
  const interviewsAvailable = Math.floor(currentBalance / CREDIT_COSTS.INTERVIEW_SESSION);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isLowBalance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
      }`}>
        <Zap className={`w-4 h-4 ${isLowBalance ? 'text-red-600' : 'text-green-600'}`} />
        <span className={`font-medium text-sm ${isLowBalance ? 'text-red-700' : 'text-green-700'}`}>
          {formatCredits(currentBalance)} credits
        </span>
        {!canAffordInterview && (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        )}
      </div>
      
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        title="Refresh balance"
      >
        <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
      </button>
      
      {showPurchaseButton && (
        <Link href="/credits">
          <button className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isLowBalance 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}>
            <Plus className="w-3 h-3" />
            <span>{isLowBalance ? 'Buy Credits' : 'Add Credits'}</span>
          </button>
        </Link>
      )}
      
      {interviewsAvailable > 0 && (
        <span className="text-xs text-slate-500">
          {interviewsAvailable} interview{interviewsAvailable !== 1 ? 's' : ''} available
        </span>
      </div>
    );
  }
};