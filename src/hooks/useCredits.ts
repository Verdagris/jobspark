"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserCredits, getUserCreditBalance, checkUserCredits, CREDIT_COSTS } from '@/lib/credits';

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      const [creditsData, balanceData] = await Promise.all([
        getUserCredits(user.id),
        getUserCreditBalance(user.id)
      ]);
      
      setCredits(creditsData);
      setBalance(balanceData);
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  useEffect(() => {
    const loadCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      await refreshCredits();
      setLoading(false);
    };

    loadCredits();
  }, [user]);

  const canAffordInterview = async (): Promise<boolean> => {
    if (!user) return false;
    return await checkUserCredits(user.id, CREDIT_COSTS.INTERVIEW_SESSION);
  };

  const canAffordCV = async (): Promise<boolean> => {
    if (!user) return false;
    return await checkUserCredits(user.id, CREDIT_COSTS.CV_GENERATION);
  };

  const hasEnoughCredits = (requiredCredits: number): boolean => {
    return balance >= requiredCredits;
  };

  const getInterviewsAvailable = (): number => {
    return Math.floor(balance / CREDIT_COSTS.INTERVIEW_SESSION);
  };

  const getCVsAvailable = (): number => {
    return Math.floor(balance / CREDIT_COSTS.CV_GENERATION);
  };

  return {
    credits,
    balance,
    loading,
    refreshCredits,
    canAffordInterview,
    canAffordCV,
    hasEnoughCredits,
    getInterviewsAvailable,
    getCVsAvailable,
    CREDIT_COSTS
  };
};