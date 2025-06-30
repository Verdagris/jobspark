"use client";

import { useState, useEffect } from "react";
import { Zap, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { formatCredits } from "@/lib/credits";

interface CreditBalanceProps {
  className?: string;
  showPurchaseButton?: boolean;
}

export const CreditBalance = ({ className = "", showPurchaseButton = true }: CreditBalanceProps) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/credits/balance');
        const data = await response.json();
        setBalance(data.balance);
      } catch (error) {
        console.error('Error fetching credit balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [user]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-slate-300 border-t-green-500 rounded-full animate-spin" />
        <span className="text-sm text-slate-600">Loading...</span>
      </div>
    );
  }

  const isLowBalance = balance !== null && balance < 30;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isLowBalance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
      }`}>
        <Zap className={`w-4 h-4 ${isLowBalance ? 'text-red-600' : 'text-green-600'}`} />
        <span className={`font-medium text-sm ${isLowBalance ? 'text-red-700' : 'text-green-700'}`}>
          {balance !== null ? formatCredits(balance) : '0'} credits
        </span>
      </div>
      
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
    </div>
  );
};