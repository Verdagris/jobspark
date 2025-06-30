// In /lib/credits.ts

import type { SupabaseClient } from "@supabase/supabase-js";

// --- INTERFACES ---
export interface UserCredits {
  id: string;
  user_id: string;
  credits_balance: number;
  total_credits_purchased: number;
  total_credits_used: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: "purchase" | "usage" | "bonus" | "refund";
  credits_amount: number;
  description: string;
  reference_id: string | null;
  created_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  credits_amount: number;
  amount_paid: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  created_at: string;
  completed_at: string | null;
}

// --- CONSTANTS ---
export const CREDIT_COSTS = {
  INTERVIEW_SESSION: 30,
  CV_GENERATION: 15,
} as const;

export const CREDIT_PACKAGES = [
  {
    id: "package_150",
    credits: 150,
    price: 1500,
    popular: false,
    description: "Perfect for occasional practice",
  },
  {
    id: "package_500",
    credits: 500,
    price: 5000,
    popular: true,
    description: "Great value for regular users",
  },
  {
    id: "package_1000",
    credits: 1000,
    price: 10000,
    popular: false,
    description: "Best value for power users",
  },
] as const;

// --- DATABASE FUNCTIONS ---

export async function getUserCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<UserCredits | null> {
  try {
    const { data, error } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching user credits:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserCredits:", error);
    return null;
  }
}

export async function createCreditPurchase(
  supabase: SupabaseClient,
  userId: string,
  creditsAmount: number,
  amountPaid: number
): Promise<CreditPurchase | null> {
  try {
    const { data, error } = await supabase
      .from("credit_purchases")
      .insert({
        user_id: userId,
        credits_amount: creditsAmount,
        amount_paid: amountPaid,
        status: "pending",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating credit purchase:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in createCreditPurchase:", error);
    return null;
  }
}

export async function checkUserCredits(
  supabase: SupabaseClient,
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_credits")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      console.error("Error checking user credits:", error);
      return false;
    }

    const balance = data.credits_balance || 0;
    return balance >= requiredCredits;
  } catch (error) {
    console.error("Error in checkUserCredits:", error);
    return false;
  }
}

export async function getCreditTransactions(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  try {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching credit transactions:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getCreditTransactions:", error);
    return [];
  }
}

export async function updateCreditPurchase(
  supabase: SupabaseClient,
  purchaseId: string,
  updates: Partial<CreditPurchase>
): Promise<CreditPurchase | null> {
  try {
    const { data, error } = await supabase
      .from("credit_purchases")
      .update(updates)
      .eq("id", purchaseId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating credit purchase:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in updateCreditPurchase:", error);
    return null;
  }
}

export async function getCreditPurchase(
  supabase: SupabaseClient,
  purchaseId: string
): Promise<CreditPurchase | null> {
  try {
    const { data, error } = await supabase
      .from("credit_purchases")
      .select("*")
      .eq("id", purchaseId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching credit purchase:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getCreditPurchase:", error);
    return null;
  }
}

export async function completeCreditPurchase(
  supabase: SupabaseClient,
  userId: string,
  creditsAmount: number,
  purchaseId: string
): Promise<boolean> {
  try {
    const { error: rpcError } = await supabase.rpc("add_purchased_credits", {
      p_user_id: userId,
      p_credits_amount: creditsAmount,
      p_purchase_id: purchaseId,
    });
    
    if (rpcError) {
      console.error("Error in RPC add_purchased_credits:", rpcError);
      await updateCreditPurchase(supabase, purchaseId, { status: "failed" });
      return false;
    }
    
    const updatedPurchase = await updateCreditPurchase(supabase, purchaseId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    
    return !!updatedPurchase;
  } catch (error) {
    console.error("Error in completeCreditPurchase:", error);
    return false;
  }
}

export async function getUserCreditBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_credits")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();
    
    if (error || !data) {
      console.error("Error fetching credit balance:", error);
      return 0;
    }
    
    return data.credits_balance || 0;
  } catch (error) {
    console.error("Error in getUserCreditBalance:", error);
    return 0;
  }
}

// --- FORMATTING HELPERS WITH NULL SAFETY ---
export function formatCredits(credits: number | null | undefined): string {
  // Handle all null/undefined cases gracefully
  if (credits === null || credits === undefined || typeof credits !== "number" || isNaN(credits)) {
    return "0";
  }
  
  // Ensure we have a valid number and format it
  const validCredits = Math.max(0, Math.floor(credits));
  return validCredits.toLocaleString();
}

export function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || typeof cents !== "number" || isNaN(cents)) {
    return "R0.00";
  }
  
  const validCents = Math.max(0, cents);
  return `R${(validCents / 100).toFixed(2)}`;
}

export function getCreditsPerRand(credits: number | null | undefined, cents: number | null | undefined): number {
  if (
    credits === null || credits === undefined || typeof credits !== "number" || isNaN(credits) ||
    cents === null || cents === undefined || typeof cents !== "number" || isNaN(cents) || cents === 0
  ) {
    return 0;
  }
  
  const validCredits = Math.max(0, credits);
  const validCents = Math.max(1, cents); // Prevent division by zero
  
  return validCredits / (validCents / 100);
}

// --- CREDIT VALIDATION HELPERS ---
export function hasEnoughCredits(balance: number | null | undefined, required: number): boolean {
  const validBalance = balance || 0;
  const validRequired = Math.max(0, required);
  return validBalance >= validRequired;
}

export function getInterviewsAvailable(balance: number | null | undefined): number {
  const validBalance = balance || 0;
  return Math.floor(validBalance / CREDIT_COSTS.INTERVIEW_SESSION);
}

export function getCVsAvailable(balance: number | null | undefined): number {
  const validBalance = balance || 0;
  return Math.floor(validBalance / CREDIT_COSTS.CV_GENERATION);
}

export function isLowBalance(balance: number | null | undefined): boolean {
  const validBalance = balance || 0;
  return validBalance < CREDIT_COSTS.INTERVIEW_SESSION;
}