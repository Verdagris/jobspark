"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  formatCredits,
  CREDIT_COSTS,
  hasEnoughCredits,
  getInterviewsAvailable,
  isLowBalance,
} from "@/lib/credits";

interface CreditBalanceProps {
  className?: string;
  showPurchaseButton?: boolean;
}

export const CreditBalance = ({
  className = "",
  showPurchaseButton = true,
}: CreditBalanceProps) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!user) {
      setBalance(0);
      return;
    }

    try {
      setError(null);
      const { supabase } = await import("@/lib/supabase");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setBalance(0);
        return;
      }

      const response = await fetch("/api/credits/balance", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Safely handle the balance with null checking
        setBalance(data.balance || 0);
      } else {
        console.error("Failed to fetch credit balance");
        setBalance(0);
      }
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      setError("Failed to load credits");
      setBalance(0);
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

  // Use safe credit functions that handle null values
  const currentBalance = balance || 0;
  const lowBalance = isLowBalance(currentBalance);
  const canAffordInterview = hasEnoughCredits(
    currentBalance,
    CREDIT_COSTS.INTERVIEW_SESSION
  );
  const interviewsAvailable = getInterviewsAvailable(currentBalance);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          lowBalance
            ? "bg-red-50 border border-red-200"
            : "bg-green-50 border border-green-200"
        }`}
      >
        <Zap
          className={`w-4 h-4 ${
            lowBalance ? "text-red-600" : "text-green-600"
          }`}
        />
        <span
          className={`font-medium text-sm ${
            lowBalance ? "text-red-700" : "text-green-700"
          }`}
        >
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
        <RefreshCw
          className={`w-4 h-4 text-slate-600 ${
            refreshing ? "animate-spin" : ""
          }`}
        />
      </button>

      {showPurchaseButton && (
        <Link href="/credits">
          <button
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              lowBalance
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>{lowBalance ? "Buy Credits" : "Add Credits"}</span>
          </button>
        </Link>
      )}

      {/* {interviewsAvailable > 0 && ( */}
      <span className="text-xs text-slate-500">
        Note: Credit system removed for demo
        {/* {interviewsAvailable} interview{interviewsAvailable !== 1 ? "s" : ""}{" "}
          available */}
      </span>
      {/* )} */}

      {error && (
        <span className="text-xs text-red-500" title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
};
